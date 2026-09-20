#!/usr/bin/env node
/**
 * Lighthouse budget runner.
 *
 * Runs Lighthouse (mobile emulation, simulated slow 4G — its default, and the
 * harder case) against a running copy of the site, takes the median of several
 * runs per page, and fails if any page misses a budget below.
 *
 *   npm run preview -- --port 8788   # in one terminal: the real Worker (or set PERF_BASE_URL)
 *   npm run perf             # in another
 *
 * What is enforced:
 *   - the performance score and the four timing thresholds below. The timings
 *     are Google's published Core Web Vitals "good" bands (plus first paint),
 *     not numbers picked to make today's site pass;
 *   - that no accessibility, best-practice or SEO audit fails, except the
 *     documented KNOWN_ISSUES. Asserting audit by audit rather than on a
 *     category score means a new failure is caught even while an old one is
 *     still open, and a flat score threshold cannot hide it.
 *
 * Byte budgets live in tests/performance.test.mjs, where they are deterministic
 * and run on every `npm test`. This file covers what bytes cannot: render
 * timing, layout shift and the audits. See docs/08_DECISIONS/DECISIONS.md, ADR-021.
 *
 * Lighthouse is installed from perf/package.json, not the app's, so the deploy
 * job (the one that holds the Cloudflare token) never installs it.
 */

import { execFile } from "node:child_process";
import { appendFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const run = promisify(execFile);
const here = path.dirname(fileURLToPath(import.meta.url));
const lighthouse = path.join(here, "node_modules/lighthouse/cli/index.js");
const reports = path.join(here, "reports");

const BASE = (process.env.PERF_BASE_URL ?? "http://localhost:8788").replace(/\/$/, "");
const RUNS = Number(process.env.PERF_RUNS ?? 3);

// Pages that get the full treatment: the home page, the index, the heaviest page
// (the evidence layer), a plain product page, an article and the page with the
// form. Median of RUNS, and timing thresholds enforced.
const TIMED_URLS = ["/", "/products", "/trove", "/vero", "/notes/trove", "/contact"];

// The remaining indexable pages. Their timing follows from the templates already
// measured above, so they get one run and only the audits are enforced. Together
// the two lists are every route in src/content/routes.js except /404, which
// answers with a 404 status and is covered by the test suite instead.
const AUDIT_ONLY_URLS = ["/about", "/notes/vero", "/privacy", "/terms"];

const MIN_PERFORMANCE_SCORE = 0.95;

const MAX_METRICS = {
  "first-contentful-paint": 1800,
  "largest-contentful-paint": 2500,
  "total-blocking-time": 200,
  "cumulative-layout-shift": 0.1,
};

const AUDITED_CATEGORIES = ["accessibility", "best-practices", "seo"];

/**
 * Failures that already exist and are accepted for now, page by page. Empty is the
 * goal and, since 2026-09-20, the fact: the illustration colours, the pending-stage
 * label and the /products heading order were all fixed (ADR-024). Add an entry only
 * to record a problem that is understood and consciously deferred, with the reason
 * and the page, never to get a build through. The runner says when an entry no
 * longer applies so it can be removed.
 *
 * Shape: { "accessibility:audit-id": ["/page", ...] }
 */
const KNOWN_ISSUES = {};

const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
const isKnown = (key, url) => KNOWN_ISSUES[key]?.includes(url) ?? false;

async function waitForSite() {
  const deadline = Date.now() + 90_000;
  for (;;) {
    try {
      const res = await fetch(`${BASE}/api/health`);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    if (Date.now() > deadline) {
      throw new Error(`${BASE} did not answer /api/health within 90 s. Is the preview server running?`);
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
}

// One page takes about ten seconds. A run that has not finished in two minutes is a
// wedged browser session, not a slow page, and it would otherwise hold the whole job
// until CI's own timeout. SIGTERM lets Lighthouse close the Chrome it opened.
const RUN_TIMEOUT_MS = 120_000;

async function lighthouseOnce(url, scratch, attempt = 1) {
  const out = path.join(scratch, "run.json");
  try {
    await run(
      process.execPath,
      [
        lighthouse,
        `${BASE}${url}`,
        "--quiet",
        "--output=json",
        `--output-path=${out}`,
        "--only-categories=performance,accessibility,best-practices,seo",
        "--chrome-flags=--headless=new --no-sandbox",
      ],
      { maxBuffer: 64 * 1024 * 1024, timeout: RUN_TIMEOUT_MS, killSignal: "SIGTERM" },
    );
  } catch (err) {
    const wedged = err.killed || err.signal === "SIGTERM";
    if (wedged && attempt < 2) {
      console.log(`\n  ${url}: no result after ${RUN_TIMEOUT_MS / 1000} s, retrying once`);
      return lighthouseOnce(url, scratch, attempt + 1);
    }
    throw wedged ? new Error(`${url}: Lighthouse produced no result after ${RUN_TIMEOUT_MS / 1000} s, twice`) : err;
  }
  const raw = await readFile(out, "utf8");
  const lhr = JSON.parse(raw);
  if (lhr.runtimeError) throw new Error(`${url}: ${lhr.runtimeError.code} ${lhr.runtimeError.message}`);
  return { raw, lhr };
}

/** Audit keys ("accessibility:color-contrast") that fail in one run. */
function failingAudits(lhr) {
  const failing = new Map();
  for (const category of AUDITED_CATEGORIES) {
    for (const { id } of lhr.categories[category].auditRefs) {
      const audit = lhr.audits[id];
      if (audit.score !== null && audit.score < 1) failing.set(`${category}:${id}`, audit.title);
    }
  }
  return failing;
}

async function measure(url, scratch, timed) {
  const runs = timed ? RUNS : 1;
  const samples = [];
  for (let i = 0; i < runs; i++) samples.push(await lighthouseOnce(url, scratch));

  const performance = median(samples.map((s) => s.lhr.categories.performance.score));
  const scores = { performance };
  for (const category of AUDITED_CATEGORIES) {
    scores[category] = median(samples.map((s) => s.lhr.categories[category].score));
  }
  const metrics = {};
  for (const id of Object.keys(MAX_METRICS)) {
    metrics[id] = median(samples.map((s) => s.lhr.audits[id].numericValue));
  }

  // An audit counts as failing when it fails in most of the runs.
  const votes = new Map();
  const titles = new Map();
  for (const { lhr } of samples) {
    for (const [key, title] of failingAudits(lhr)) {
      votes.set(key, (votes.get(key) ?? 0) + 1);
      titles.set(key, title);
    }
  }
  const failing = [...votes].filter(([, n]) => n > runs / 2).map(([key]) => ({ key, title: titles.get(key) }));

  // Keep the raw report of the median-LCP run, for whoever has to look.
  const byLcp = [...samples].sort(
    (a, b) => a.lhr.audits["largest-contentful-paint"].numericValue - b.lhr.audits["largest-contentful-paint"].numericValue,
  );
  return { url, timed, scores, metrics, failing, raw: byLcp[Math.floor(byLcp.length / 2)].raw };
}

const format = (id, value) => (id === "cumulative-layout-shift" ? value.toFixed(3) : `${Math.round(value)}ms`);

function judge(result) {
  const problems = [];
  if (result.timed) {
    if (result.scores.performance < MIN_PERFORMANCE_SCORE) {
      problems.push(`performance score ${result.scores.performance} is below ${MIN_PERFORMANCE_SCORE}`);
    }
    for (const [id, max] of Object.entries(MAX_METRICS)) {
      if (result.metrics[id] > max) {
        const unit = id === "cumulative-layout-shift" ? "" : "ms";
        problems.push(`${id} is ${format(id, result.metrics[id])}; the budget is ${max}${unit}`);
      }
    }
  }
  for (const { key, title } of result.failing) {
    if (!isKnown(key, result.url)) problems.push(`${key} fails: ${title}`);
  }
  return problems;
}

/** KNOWN_ISSUES entries that no longer apply, so they can be removed. */
function staleExceptions(results) {
  const stale = [];
  for (const [key, urls] of Object.entries(KNOWN_ISSUES)) {
    for (const url of urls) {
      const result = results.find((r) => r.url === url);
      if (result && !result.failing.some((f) => f.key === key)) stale.push(`${key} on ${url}`);
    }
  }
  return stale;
}

function table(results) {
  const head = ["page", "perf", "a11y", "best", "seo", "FCP", "LCP", "TBT", "CLS", "known", ""];
  const rows = results.map((r) => [
    r.url,
    r.timed ? r.scores.performance : "-",
    r.scores.accessibility,
    r.scores["best-practices"],
    r.scores.seo,
    r.timed ? format("first-contentful-paint", r.metrics["first-contentful-paint"]) : "-",
    r.timed ? format("largest-contentful-paint", r.metrics["largest-contentful-paint"]) : "-",
    r.timed ? format("total-blocking-time", r.metrics["total-blocking-time"]) : "-",
    r.timed ? format("cumulative-layout-shift", r.metrics["cumulative-layout-shift"]) : "-",
    r.failing.filter((f) => isKnown(f.key, r.url)).length,
    r.problems.length ? "FAIL" : "ok",
  ]);
  return { head, rows };
}

const plain = ({ head, rows }) => {
  const all = [head, ...rows].map((r) => r.map(String));
  const widths = head.map((_, i) => Math.max(...all.map((r) => r[i].length)));
  return all.map((r) => r.map((c, i) => c.padEnd(widths[i])).join("  ")).join("\n");
};

const markdown = ({ head, rows }) =>
  [head, head.map(() => "---"), ...rows].map((r) => `| ${r.join(" | ")} |`).join("\n");

async function main() {
  await waitForSite();
  await mkdir(reports, { recursive: true });
  const scratch = await mkdtemp(path.join(os.tmpdir(), "vroe-perf-"));

  const results = [];
  try {
    const pages = [...TIMED_URLS.map((url) => [url, true]), ...AUDIT_ONLY_URLS.map((url) => [url, false])];
    for (const [url, timed] of pages) {
      process.stdout.write(`Lighthouse ${url} x${timed ? RUNS : 1} … `);
      const result = await measure(url, scratch, timed);
      result.problems = judge(result);
      results.push(result);
      const name = url === "/" ? "home" : url.slice(1).replace(/\//g, "-");
      await writeFile(path.join(reports, `${name}.json`), result.raw);
      delete result.raw;
      console.log(result.problems.length ? "FAIL" : "ok");
    }
  } finally {
    await rm(scratch, { recursive: true, force: true });
  }

  const t = table(results);
  console.log(`\n${plain(t)}\n`);

  const failed = results.filter((r) => r.problems.length);
  for (const r of failed) {
    for (const p of r.problems) console.log(`::error::${r.url}: ${p}`);
  }
  const stale = staleExceptions(results);
  for (const s of stale) console.log(`::notice::KNOWN_ISSUES entry no longer applies, remove it: ${s}`);

  if (process.env.GITHUB_STEP_SUMMARY) {
    const lines = [
      "### Lighthouse budget",
      "",
      `Mobile emulation. Six pages: median of ${RUNS} runs, all budgets below. Four more: one run, audits only. Budgets: performance score ${MIN_PERFORMANCE_SCORE} or above; FCP 1800 ms, LCP 2500 ms, TBT 200 ms, CLS 0.1; no failing accessibility, best-practice or SEO audit outside the known issues (the "known" column counts those).`,
      "",
      markdown(t),
      "",
    ];
    if (stale.length) lines.push(`Known issues that no longer apply: ${stale.join("; ")}.`, "");
    await appendFile(process.env.GITHUB_STEP_SUMMARY, lines.join("\n"));
  }

  if (failed.length) {
    console.error(`${failed.length} of ${results.length} pages are over budget.`);
    process.exit(1);
  }
  console.log(`All ${results.length} pages are within budget.`);
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
