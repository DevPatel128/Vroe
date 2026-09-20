/**
 * Documentation that follows the code.
 *
 * "One source of truth" cuts both ways: the code is the truth about what exists,
 * and the documentation is the truth about what it is for. These tests read the
 * code's own inventory (npm scripts, workflows, routes, bindings, endpoints,
 * secrets, cited decisions, retention periods) and fail when something exists
 * that the canonical document does not mention. That is how "whenever something
 * new is added, it gets documented" is enforced without relying on memory.
 *
 * A failure names the fact and the document that should carry it. The fix is to
 * document it there, not to loosen the test. Structure and links are checked by
 * docs.test.mjs; whether a pull request touched the right documents is checked by
 * scripts/docs-impact.mjs.
 */

import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const code = fileURLToPath(new URL("../", import.meta.url));
const repo = path.resolve(code, "..");
const docs = (rel) => path.join(repo, "docs", rel);

const DOC = {
  developerExperience: "05_ENGINEERING/DEVELOPER-EXPERIENCE/DEVELOPER-EXPERIENCE.md",
  cicd: "05_ENGINEERING/CI-CD/CI-CD.md",
  experience: "02_PRODUCT/EXPERIENCE.md",
  data: "05_ENGINEERING/DATA/DATA.md",
  infrastructure: "05_ENGINEERING/INFRASTRUCTURE/INFRASTRUCTURE.md",
  architecture: "05_ENGINEERING/ARCHITECTURE/ARCHITECTURE.md",
  security: "05_ENGINEERING/SECURITY/SECURITY.md",
  observability: "06_OPERATIONS/OBSERVABILITY.md",
  tokenRunbook: "06_OPERATIONS/RUNBOOKS/CLOUDFLARE-API-TOKEN.md",
};

const readDoc = (rel) => readFile(docs(rel), "utf8");
const readCode = (rel) => readFile(path.join(code, rel), "utf8");

async function allOf(...rels) {
  return (await Promise.all(rels.map(readDoc))).join("\n");
}

/** JSON with comments and trailing commas, as wrangler.jsonc is written. */
function parseJsonc(text) {
  let out = "";
  let inString = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const n = text[i + 1];
    if (inString) {
      out += c;
      if (c === "\\") out += text[++i];
      else if (c === '"') inString = false;
      continue;
    }
    if (c === '"') { inString = true; out += c; continue; }
    if (c === "/" && n === "/") { while (i < text.length && text[i] !== "\n") i++; out += "\n"; continue; }
    if (c === "/" && n === "*") { i += 2; while (i < text.length && !(text[i] === "*" && text[i + 1] === "/")) i++; i++; continue; }
    out += c;
  }
  return JSON.parse(out.replace(/,(\s*[}\]])/g, "$1"));
}

/** The whole word, so `dev` does not match `developer` and `test:docs` does not match `test:docs-sync`. */
const token = (name) => new RegExp(`(?<![\\w:-])${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\w:-])`);

function requireMentioned(text, names, describe, where) {
  const missing = names.filter((n) => !text.includes(n) && !token(n).test(text));
  assert.deepEqual(missing, [],
    `${describe} exists in the code but ${where} does not mention: ${missing.join(", ")}. Document it there.`);
}

/* ─── npm scripts and test files ───────────────────────────────────────── */

const pkg = JSON.parse(await readCode("package.json"));
const scripts = pkg.scripts;

test("every npm script is documented", async () => {
  const text = await readDoc(DOC.developerExperience);
  const undocumented = Object.keys(scripts).filter((name) => {
    // Namespaced scripts (test:docs) are listed by name in tables; plain ones by
    // the command a person types.
    if (name.includes(":")) return !token(name).test(text);
    if (name === "test") return !/npm test\b/.test(text) && !/npm run test\b/.test(text);
    return !text.includes(`npm run ${name}`);
  });
  assert.deepEqual(undocumented, [],
    `npm scripts missing from ${DOC.developerExperience}: ${undocumented.join(", ")}`);
});

test("every test file is run by npm test", async () => {
  const files = (await readdir(path.join(code, "tests"))).filter((f) => f.endsWith(".test.mjs"));
  assert.ok(files.length > 0, "no test files found");
  const chain = scripts.test;
  for (const file of files) {
    const owner = Object.entries(scripts).find(([, cmd]) => cmd.includes(file));
    assert.ok(owner, `tests/${file} is not run by any npm script, so it never runs`);
    assert.ok(chain.includes(owner[0]), `tests/${file} runs under "${owner[0]}", which "npm test" does not include`);
  }
});

/* ─── Workflows, routes, bindings, endpoints, secrets ──────────────────── */

test("every GitHub workflow is documented", async () => {
  const dir = path.join(repo, ".github", "workflows");
  const files = (await readdir(dir)).filter((f) => f.endsWith(".yml"));
  requireMentioned(await readDoc(DOC.cicd), files, "A GitHub workflow", DOC.cicd);
});

test("every route is described", async () => {
  const routes = [...(await readCode("src/content/routes.js")).matchAll(/path:\s*"([^"]+)"/g)].map((m) => m[1]);
  assert.ok(routes.length >= 10, "expected to find the route table");
  requireMentioned(await readDoc(DOC.experience), routes.map((r) => `\`${r}\``), "A route", DOC.experience);
});

test("every binding and cron trigger is documented", async () => {
  const config = parseJsonc(await readCode("wrangler.jsonc"));
  const names = [
    ...(config.kv_namespaces ?? []).map((b) => b.binding),
    ...(config.r2_buckets ?? []).map((b) => b.binding),
    ...(config.r2_buckets ?? []).map((b) => b.bucket_name),
    ...(config.triggers?.crons ?? []),
  ];
  requireMentioned(await allOf(DOC.data, DOC.infrastructure), names, "A Cloudflare binding, bucket or cron trigger",
    `${DOC.data} or ${DOC.infrastructure}`);
});

test("every API endpoint is documented", async () => {
  const source = await readCode("worker/index.js");
  const endpoints = [...new Set([...source.matchAll(/["'`](\/api\/[a-z-]+)["'`]/g)].map((m) => m[1]))];
  assert.ok(endpoints.length >= 3, "expected to find the /api endpoints");
  requireMentioned(await readDoc(DOC.architecture), endpoints, "An API endpoint", DOC.architecture);
});

test("every secret and variable is documented", async () => {
  const config = parseJsonc(await readCode("wrangler.jsonc"));
  const names = new Set(Object.keys(config.vars ?? {}));
  names.add("TURNSTILE_SECRET_KEY"); // set with `wrangler secret put`, so it is not in the config
  const dir = path.join(repo, ".github", "workflows");
  for (const file of await readdir(dir)) {
    const yml = await readFile(path.join(dir, file), "utf8");
    for (const [, n] of yml.matchAll(/\b(?:secrets|vars)\.([A-Z][A-Z0-9_]+)/g)) names.add(n);
  }
  const text = await allOf(DOC.security, DOC.infrastructure, DOC.cicd, DOC.observability, DOC.tokenRunbook, DOC.data);
  requireMentioned(text, [...names], "A secret or variable", "SECURITY, INFRASTRUCTURE, CI-CD, OBSERVABILITY or the token runbook");
});

/* ─── Decisions cited in code exist ────────────────────────────────────── */

test("every decision cited in the code exists in the index", async () => {
  const index = await readDoc("08_DECISIONS/DECISIONS.md");
  const roots = ["src", "worker", "scripts", "tests", "perf"].map((d) => path.join(code, d));
  const files = [];
  async function walk(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true }).catch(() => [])) {
      if (entry.name === "node_modules" || entry.name === "reports") continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(full);
      else if (/\.(m?js|jsx|css|jsonc?)$/.test(entry.name)) files.push(full);
    }
  }
  for (const r of roots) await walk(r);
  files.push(path.join(code, "wrangler.jsonc"));

  const missing = new Set();
  for (const file of files) {
    // These two write example decision numbers as fixtures.
    if (/docs-(sync|impact)\.test\.mjs$/.test(file)) continue;
    for (const [, n] of (await readFile(file, "utf8")).matchAll(/\bADR-(\d{3})\b/g)) {
      if (!index.includes(`[ADR-${n}]`)) missing.add(`ADR-${n} (cited in ${path.relative(code, file)})`);
    }
  }
  assert.deepEqual([...missing], [], "decisions cited in code but absent from docs/08_DECISIONS/DECISIONS.md");
});

/* ─── Values that must agree in two places ─────────────────────────────── */

test("the subscriber retention period agrees between the Worker and the privacy policy", async () => {
  const days = (text, name) => Number(text.match(new RegExp(`(?<![A-Z_])${name}\\s*=\\s*(\\d+)`))?.[1]);
  const worker = days(await readCode("worker/index.js"), "RETENTION_DAYS");
  const policy = days(await readCode("src/content/legal.js"), "RETENTION_DAYS");
  assert.ok(worker > 0 && policy > 0, "RETENTION_DAYS not found in both files");
  assert.equal(policy, worker,
    "src/content/legal.js and worker/index.js disagree about how long subscribers are kept; the privacy policy would be a false statement");
});

test("the backup retention period agrees between the backup job and the privacy policy", async () => {
  const days = (text, name) => Number(text.match(new RegExp(`(?<![A-Z_])${name}\\s*=\\s*(\\d+)`))?.[1]);
  const worker = days(await readCode("worker/backup.js"), "BACKUP_RETENTION_DAYS");
  const policy = days(await readCode("src/content/legal.js"), "BACKUP_RETENTION_DAYS");
  assert.ok(worker > 0 && policy > 0, "BACKUP_RETENTION_DAYS not found in both files");
  assert.equal(policy, worker,
    "src/content/legal.js and worker/backup.js disagree about how long backups are kept; the privacy policy would be a false statement");
});
