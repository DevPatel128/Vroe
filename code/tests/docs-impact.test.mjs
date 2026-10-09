/**
 * The docs-impact rule (scripts/docs-impact.mjs): a change to what the
 * documentation describes must come with a change to the documentation.
 *
 * These test the decision itself, with no git, so the rule can be trusted before
 * it is allowed to block a merge.
 */

import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { RULES, evaluate } from "../scripts/docs-impact.mjs";

const repo = fileURLToPath(new URL("../../", import.meta.url));
const change = (p, status = "M") => ({ path: p, status });

const WORKER = change("code/worker/index.js");
const DATA_DOC = change("SYSTEM.md");

test("a change to the Worker with no documentation fails, and says what to update", () => {
  const r = evaluate({ changed: [WORKER] });
  assert.equal(r.ok, false);
  assert.equal(r.problems.length, 1);
  assert.match(r.problems[0], /the Worker/);
  assert.match(r.problems[0], /SYSTEM\.md/);
  assert.match(r.problems[0], /Docs: none/);
});

test("changing one of the rule's canonical documents satisfies it", () => {
  assert.equal(evaluate({ changed: [WORKER, DATA_DOC] }).ok, true);
});

test("a document from a different rule does not", () => {
  const r = evaluate({ changed: [WORKER, change("GROWTH.md")] });
  assert.equal(r.ok, false);
});

test("a new decision counts as documentation", () => {
  const decisions = change("DECISIONS.md");
  assert.equal(evaluate({ changed: [WORKER, decisions], facts: { decisionAdded: true } }).ok, true);
});

test("an edited old decision does not count; only a new one does", () => {
  const decisions = change("DECISIONS.md");
  assert.equal(evaluate({ changed: [WORKER, decisions], facts: { decisionAdded: false } }).ok, false);
});

test("'Docs: none' needs a reason", () => {
  assert.equal(evaluate({ changed: [WORKER], body: "Docs: none, comment-only cleanup of an existing helper" }).ok, true);
  assert.equal(evaluate({ changed: [WORKER], body: "Docs: none — a refactor that changes no behaviour" }).ok, true);
  assert.equal(evaluate({ changed: [WORKER], body: "Docs: none" }).ok, false, "no reason given");
  assert.equal(evaluate({ changed: [WORKER], body: "Docs: none, x" }).ok, false, "a reason of one letter is not a reason");
  assert.equal(evaluate({ changed: [WORKER], body: "We discussed whether docs: none applies" }).ok, false, "must be its own line");
});

test("Dependabot is exempt", () => {
  const r = evaluate({ changed: [change("code/package.json"), change("code/package-lock.json")], actor: "dependabot[bot]" });
  assert.equal(r.ok, true);
  assert.equal(r.exempt, true);
});

test("changes nothing describes need nothing", () => {
  assert.equal(evaluate({ changed: [change("code/package-lock.json"), change("code/tests/security.test.mjs")] }).ok, true);
  assert.equal(evaluate({ changed: [DATA_DOC] }).ok, true, "a docs-only change is fine");
  assert.equal(evaluate({ changed: [change("code/worker/index.js", "D")] }).triggered.length, 0, "a deleted file does not trigger");
});

test("package.json only triggers when its scripts changed", () => {
  const pkg = change("code/package.json");
  assert.equal(evaluate({ changed: [pkg], facts: { scriptsChanged: false } }).ok, true, "a dependency bump");
  assert.equal(evaluate({ changed: [pkg], facts: { scriptsChanged: true } }).ok, false);
  assert.equal(
    evaluate({ changed: [pkg, change("RUNBOOK.md")], facts: { scriptsChanged: true } }).ok,
    true,
  );
});

test("a new test file needs documenting; editing an existing one does not", () => {
  assert.equal(evaluate({ changed: [change("code/tests/backup.test.mjs", "A")] }).ok, false);
  assert.equal(evaluate({ changed: [change("code/tests/security.test.mjs", "M")] }).ok, true);
});

test("every workflow, every content file and every style is covered by a rule", () => {
  for (const p of [
    ".github/workflows/health.yml", "code/wrangler.jsonc", "code/src/content/legal.js", "code/src/content/products.js",
    "code/src/content/evidence/trove.js", "code/src/styles/products.css", "code/src/components/ProductCard.jsx",
    "code/src/pages/products.jsx", "code/src/seo/JsonLd.jsx", "code/src/client/enhance.js", "code/scripts/prerender.mjs",
    "code/perf/run.mjs", "code/worker/backup.js",
  ]) {
    assert.equal(evaluate({ changed: [change(p)] }).ok, false, `${p} should require documentation`);
  }
});

test("a changed document must carry a 'Last updated' date no earlier than its newest change", () => {
  const header = (d) => `# T\n\n**Status:** Approved · **Last updated:** ${d} · **Owner:** X · **Version:** 1.0\n\nbody`;
  const stale = { path: "docs/x.md", baseText: header("2026-09-01"), headText: header("2026-09-01").replace("body", "new body"), newestAuthorDate: "2026-09-20" };
  const r = evaluate({ changed: [change("docs/x.md")], docChanges: [stale] });
  assert.equal(r.ok, false);
  assert.match(r.problems[0], /Last updated/);

  const bumped = { ...stale, headText: header("2026-09-20").replace("body", "new body") };
  assert.equal(evaluate({ changed: [change("docs/x.md")], docChanges: [bumped] }).ok, true);

  const headerOnly = { ...stale, headText: header("2026-09-05") };
  assert.equal(evaluate({ changed: [change("docs/x.md")], docChanges: [headerOnly] }).ok, true, "only the date changed, so there is nothing to keep in step");
});

test("every document the rule table names exists", () => {
  // Otherwise moving a document would quietly make a rule impossible to satisfy.
  const missing = [];
  for (const rule of RULES) {
    for (const doc of rule.docs) {
      if (!existsSync(path.join(repo, doc))) missing.push(`${rule.id}: ${doc}`);
    }
  }
  assert.deepEqual(missing, [], "docs named in scripts/docs-impact.mjs that no longer exist");
});
