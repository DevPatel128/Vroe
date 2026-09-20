#!/usr/bin/env node
/**
 * Did this pull request document what it changed?
 *
 * Documentation that is not updated with the change it describes is wrong by the
 * next morning, so a change to the code that the documentation describes has to
 * come with a change to the documentation. This is the rule, written down once as
 * data (RULES below), applied by the `docs-impact` workflow to every pull request,
 * and required by branch protection.
 *
 * A change passes when, for every rule it triggers, any ONE of these holds:
 *   - one of that rule's canonical documents changed in the same pull request;
 *   - a new decision (ADR) was added, since that is documentation too;
 *   - the pull request description carries a line `Docs: none, <reason>` (any of
 *     "," ":" "-" or an em dash after "none"). The reason is required; the escape
 *     hatch exists for changes that really need no documentation, and using it is
 *     visible in the pull request.
 * Dependabot's dependency bumps are exempt.
 *
 * Separately, a document whose text changed must carry a `Last updated` date no
 * earlier than the newest commit that touched it, so the date means something.
 *
 * The evaluation is a pure function so it can be tested (tests/docs-impact.test.mjs)
 * without git. Run it locally with:  BASE_SHA=$(git merge-base origin/main HEAD) node code/scripts/docs-impact.mjs
 */

import { execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Paths under docs/. */
const D = {
  security: "05_ENGINEERING/SECURITY/SECURITY.md",
  data: "05_ENGINEERING/DATA/DATA.md",
  architecture: "05_ENGINEERING/ARCHITECTURE/ARCHITECTURE.md",
  seo: "05_ENGINEERING/ARCHITECTURE/SEO.md",
  reliability: "05_ENGINEERING/RELIABILITY/RELIABILITY.md",
  infrastructure: "05_ENGINEERING/INFRASTRUCTURE/INFRASTRUCTURE.md",
  cicd: "05_ENGINEERING/CI-CD/CI-CD.md",
  performance: "05_ENGINEERING/PERFORMANCE/PERFORMANCE.md",
  devx: "05_ENGINEERING/DEVELOPER-EXPERIENCE/DEVELOPER-EXPERIENCE.md",
  cost: "05_ENGINEERING/COST/COST.md",
  observability: "06_OPERATIONS/OBSERVABILITY.md",
  rollbacks: "06_OPERATIONS/ROLLBACKS.md",
  backups: "06_OPERATIONS/BACKUPS.md",
  product: "02_PRODUCT/PRODUCT.md",
  experience: "02_PRODUCT/EXPERIENCE.md",
  research: "03_RESEARCH/RESEARCH.md",
  sources: "03_RESEARCH/SOURCES.md",
  content: "04_DESIGN/CONTENT.md",
  designSystem: "04_DESIGN/DESIGN-SYSTEM.md",
  accessibility: "04_DESIGN/ACCESSIBILITY.md",
  responsive: "04_DESIGN/RESPONSIVE.md",
};

/**
 * What changing X obliges you to document. `docs` is a menu: ONE of them is
 * enough, so pick the canonical home for what you actually changed.
 * `when(path, facts)` decides whether a changed file triggers the rule.
 */
export const RULES = [
  {
    id: "worker",
    describe: "the Worker (code/worker/)",
    when: (p) => p.startsWith("code/worker/"),
    docs: [D.security, D.data, D.architecture, D.reliability, D.observability],
  },
  {
    id: "cloudflare-config",
    describe: "the Cloudflare configuration (code/wrangler.jsonc)",
    when: (p) => p === "code/wrangler.jsonc",
    docs: [D.infrastructure, D.data, D.cicd],
  },
  {
    id: "workflows",
    describe: "a GitHub workflow",
    when: (p) => p.startsWith(".github/workflows/"),
    docs: [D.cicd, D.observability, D.rollbacks, D.performance],
  },
  {
    id: "privacy-policy",
    describe: "the privacy policy (legal.js)",
    when: (p) => p === "code/src/content/legal.js",
    docs: [D.data, D.security],
  },
  {
    id: "site-content",
    describe: "product, route, copy or site content",
    when: (p) => /^code\/src\/content\/(products|routes|productsHub|copy|notes|site)\.js$/.test(p),
    docs: [D.product, D.experience, D.content],
  },
  {
    id: "evidence",
    describe: "the evidence layer",
    when: (p) => p.startsWith("code/src/content/evidence/"),
    docs: [D.research, D.sources],
  },
  {
    id: "presentation",
    describe: "styles, components, pages or layout",
    when: (p) => /^code\/src\/(styles|components|pages|layout)\//.test(p),
    docs: [D.designSystem, D.accessibility, D.responsive, D.experience, D.content],
  },
  {
    id: "seo",
    describe: "SEO or structured data (code/src/seo/)",
    when: (p) => p.startsWith("code/src/seo/"),
    docs: [D.seo],
  },
  {
    id: "browser-script",
    describe: "the one browser script (code/src/client/)",
    when: (p) => p.startsWith("code/src/client/"),
    docs: [D.architecture, D.experience],
  },
  {
    id: "build-scripts",
    describe: "the build pipeline (code/scripts/)",
    when: (p) => p.startsWith("code/scripts/"),
    docs: [D.architecture, D.devx],
  },
  {
    id: "performance-budgets",
    describe: "performance budgets or the Lighthouse runner",
    when: (p) => p.startsWith("code/perf/") || p === "code/tests/performance.test.mjs",
    docs: [D.performance],
  },
  {
    id: "npm-scripts",
    describe: "the npm scripts in code/package.json",
    when: (p, facts) => p === "code/package.json" && facts.scriptsChanged,
    docs: [D.devx],
  },
  {
    id: "new-test-suite",
    describe: "a new test suite",
    when: (p, facts) => facts.addedTests.includes(p),
    docs: [D.devx],
  },
];

const BYPASS = /^Docs:\s*none\s*[,:—-]\s*(.{8,})$/im;
const HEADER = /^\*\*Status:\*\* \w+ · \*\*Last updated:\*\* (\d{4}-\d{2}-\d{2}) ·/m;
const isDoc = (p) => p.startsWith("docs/") && p.endsWith(".md");
const isDecision = (p) => /^docs\/08_DECISIONS\/(PRODUCT|DESIGN|ENGINEERING|BUSINESS)\/ADR-\d{3}-.*\.md$/.test(p);

/**
 * @param {object} input
 * @param {{path: string, status: string}[]} input.changed  files in the pull request; status is git's A, M, D or R
 * @param {string} [input.body]       the pull request description
 * @param {string} [input.actor]      who opened it
 * @param {{scriptsChanged?: boolean}} [input.facts]
 * @param {{path: string, baseText: string, headText: string, newestAuthorDate: string}[]} [input.docChanges]
 */
export function evaluate({ changed, body = "", actor = "", facts = {}, docChanges = [] }) {
  if (actor === "dependabot[bot]") return { ok: true, exempt: true, triggered: [], problems: [] };

  const f = {
    scriptsChanged: Boolean(facts.scriptsChanged),
    addedTests: changed.filter((c) => c.status === "A" && /^code\/tests\/[^/]+\.test\.mjs$/.test(c.path)).map((c) => c.path),
  };
  const paths = changed.filter((c) => c.status !== "D").map((c) => c.path);
  const docsTouched = new Set(paths.filter(isDoc).map((p) => p.slice("docs/".length)));
  const addedDecision = changed.some((c) => c.status === "A" && isDecision(c.path));
  const bypass = BYPASS.exec(body);

  const triggered = [];
  for (const rule of RULES) {
    const hits = changed.filter((c) => c.status !== "D" && rule.when(c.path, f)).map((c) => c.path);
    if (!hits.length) continue;
    const satisfiedBy = rule.docs.find((d) => docsTouched.has(d)) ?? (addedDecision ? "a new ADR" : null) ?? (bypass ? "Docs: none" : null);
    triggered.push({ rule, hits, satisfiedBy });
  }

  const problems = [];
  for (const t of triggered.filter((x) => !x.satisfiedBy)) {
    problems.push(
      `Changed ${t.rule.describe} (${t.hits.slice(0, 3).join(", ")}${t.hits.length > 3 ? ", …" : ""}) but none of its canonical documents changed. ` +
      `Update one of: ${t.rule.docs.map((d) => `docs/${d}`).join(", ")}. Or add a new ADR. Or, if it truly needs no documentation, put "Docs: none, <reason>" in the pull request description.`,
    );
  }

  // A document whose text changed must not carry a date older than the change.
  const stripHeader = (s) => s.replace(HEADER, "").trim();
  for (const doc of docChanges) {
    if (stripHeader(doc.baseText) === stripHeader(doc.headText)) continue;
    const date = HEADER.exec(doc.headText)?.[1];
    if (!date) continue; // a missing or malformed header is docs.test.mjs's to report
    if (date < doc.newestAuthorDate) {
      problems.push(`${doc.path} changed, but its "Last updated" is ${date}; the newest change to it is dated ${doc.newestAuthorDate}. Bump the date.`);
    }
  }

  return { ok: problems.length === 0, exempt: false, triggered, problems };
}

/* ─── The runner: git in, a verdict out ────────────────────────────────── */

function git(args, cwd) {
  return execFileSync("git", args, { cwd, encoding: "utf8", maxBuffer: 1 << 26 });
}

function gather(root, baseSha) {
  const changed = git(["diff", "--name-status", "--find-renames", `${baseSha}...HEAD`], root)
    .split("\n").filter(Boolean)
    .map((line) => {
      const [status, ...rest] = line.split("\t");
      return { status: status[0], path: rest[rest.length - 1] };
    });

  const show = (rev, file) => {
    try { return git(["show", `${rev}:${file}`], root); } catch { return ""; }
  };

  let scriptsChanged = false;
  if (changed.some((c) => c.path === "code/package.json")) {
    const scripts = (text) => { try { return JSON.stringify(JSON.parse(text).scripts ?? {}); } catch { return ""; } };
    scriptsChanged = scripts(show(baseSha, "code/package.json")) !== scripts(show("HEAD", "code/package.json"));
  }

  const docChanges = changed
    .filter((c) => c.status === "M" && isDoc(c.path))
    .map((c) => ({
      path: c.path,
      baseText: show(baseSha, c.path),
      headText: show("HEAD", c.path),
      // Author date, not committer date: a rebase rewrites the latter and would
      // make every carefully dated document look stale.
      newestAuthorDate: git(["log", "-1", "--format=%as", `${baseSha}..HEAD`, "--", c.path], root).trim(),
    }))
    .filter((d) => d.newestAuthorDate);

  return { changed, facts: { scriptsChanged }, docChanges };
}

function main() {
  const baseSha = process.env.BASE_SHA;
  if (!baseSha) {
    console.error("BASE_SHA is not set. Locally: BASE_SHA=$(git merge-base origin/main HEAD) node code/scripts/docs-impact.mjs");
    process.exit(2);
  }
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
  const input = { ...gather(root, baseSha), body: process.env.PR_BODY ?? "", actor: process.env.ACTOR ?? "" };
  const result = evaluate(input);

  if (result.exempt) {
    console.log("Dependabot pull request: exempt from the docs-impact check.");
    return;
  }
  for (const t of result.triggered) {
    console.log(`${t.satisfiedBy ? "ok  " : "FAIL"}  ${t.rule.describe}${t.satisfiedBy ? `  (documented in ${t.satisfiedBy})` : ""}`);
  }
  if (!result.triggered.length) console.log("Nothing in this pull request is described by a canonical document, so nothing more is needed.");
  for (const p of result.problems) console.log(`::error::${p}`);

  if (process.env.GITHUB_STEP_SUMMARY) {
    const lines = ["### Docs impact", ""];
    if (!result.triggered.length) lines.push("Nothing in this pull request is described by a canonical document.");
    for (const t of result.triggered) lines.push(`- ${t.satisfiedBy ? "ok" : "**needs a doc**"}: ${t.rule.describe}${t.satisfiedBy ? `, documented in \`${t.satisfiedBy}\`` : ""}`);
    if (result.problems.length) lines.push("", ...result.problems.map((p) => `> ${p}`));
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join("\n") + "\n");
  }
  if (!result.ok) process.exit(1);
  console.log("Documentation matches the change.");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
