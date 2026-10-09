/**
 * The documentation system's rules, enforced.
 *
 * The canonical documents are the WOLF kit docs at the repository root
 * (AGENTS.md, PRODUCT.md, SYSTEM.md, RUNBOOK.md, GROWTH.md, DECISIONS.md,
 * MISTAKES.md; ADR-025). The research record stays under docs/03_RESEARCH/,
 * because the code cites those paths. These tests check what a machine can:
 * the kit docs exist, docs/ holds only the research record, research documents
 * carry their status header, and no link points at nothing.
 */

import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repo = fileURLToPath(new URL("../../", import.meta.url));
const docsDir = path.join(repo, "docs");

const KIT_DOCS = ["AGENTS.md", "CLAUDE.md", "PRODUCT.md", "SYSTEM.md", "RUNBOOK.md", "GROWTH.md", "DECISIONS.md", "MISTAKES.md", "TASK.md"];

const STATUSES = ["Draft", "Review", "Approved", "Superseded", "Archived"];

// Root-level files whose links are checked too.
const ROOT_DOCS = [...KIT_DOCS, "README.md", "CONTRIBUTING.md", "SECURITY.md", "CODE_OF_CONDUCT.md"];

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    // Downloaded source files, gitignored for size. Not documentation.
    if (entry.isDirectory() && entry.name === "raw") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}

/**
 * Whether a path exists with exactly this capitalisation. macOS and Windows
 * resolve `deletion-log.md` to `DELETION-LOG.md`; Linux, where CI and GitHub
 * run, does not, so a link that only works on a laptop is a broken link.
 */
const listing = new Map();
async function entriesOf(dir) {
  if (!listing.has(dir)) listing.set(dir, new Set(await readdir(dir).catch(() => [])));
  return listing.get(dir);
}
async function existsExact(absolute) {
  const parts = path.relative(repo, absolute).split(path.sep);
  if (parts[0] === "..") return false;
  let dir = repo;
  for (const part of parts) {
    if (part === "") continue;
    if (!(await entriesOf(dir)).has(part)) return false;
    dir = path.join(dir, part);
  }
  return true;
}

const allFiles = await walk(docsDir);
const markdown = allFiles.filter((f) => f.endsWith(".md"));
const rel = (f) => path.relative(repo, f);

/** GitHub's heading anchor: lower-case, punctuation dropped, spaces to hyphens. */
function slug(heading) {
  return heading
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, "")
    .trim()
    .replace(/\s+/g, "-");
}

function withoutCode(text) {
  return text.replace(/^(```|~~~)[\s\S]*?^\1/gm, "").replace(/`[^`\n]*`/g, "");
}

function anchorsOf(text) {
  const seen = new Map();
  const anchors = new Set();
  for (const line of withoutCode(text).split("\n")) {
    const m = line.match(/^#{1,6}\s+(.*?)\s*#*\s*$/);
    if (!m) continue;
    const base = slug(m[1].replace(/\[([^\]]*)\]\([^)]*\)/g, "$1"));
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    anchors.add(n === 0 ? base : `${base}-${n}`);
  }
  return anchors;
}

test("every kit document exists at the repository root", async () => {
  for (const file of KIT_DOCS) {
    assert.ok(await existsExact(path.join(repo, file)), `${file} is missing (checked case-sensitively)`);
  }
});

test("docs/ holds only the research record", async () => {
  const top = (await readdir(docsDir)).filter((n) => !n.startsWith("."));
  assert.deepEqual(top, ["03_RESEARCH"],
    "docs/ holds only the research record; everything else has one home in the root kit docs");
});

test("every document carries a valid status header", async () => {
  const pattern = new RegExp(
    `^\\*\\*Status:\\*\\* (${STATUSES.join("|")}) · \\*\\*Last updated:\\*\\* (\\d{4}-\\d{2}-\\d{2}) · \\*\\*Owner:\\*\\* (\\S.*?) · \\*\\*Version:\\*\\* (\\d+(?:\\.\\d+)*)$`,
    "m",
  );
  for (const file of markdown) {
    const head = (await readFile(file, "utf8")).split("\n").slice(0, 8).join("\n");
    assert.ok(pattern.test(head),
      `${rel(file)} needs a header line: **Status:** Draft|Review|Approved|Superseded|Archived · **Last updated:** YYYY-MM-DD · **Owner:** … · **Version:** 1.0`);
  }
});

test("every relative link and anchor resolves", async () => {
  const anchorCache = new Map();
  const anchorsFor = async (file) => {
    if (!anchorCache.has(file)) anchorCache.set(file, anchorsOf(await readFile(file, "utf8")));
    return anchorCache.get(file);
  };

  const sources = [...markdown, ...ROOT_DOCS.map((f) => path.join(repo, f))];
  const broken = [];
  for (const file of sources) {
    const text = withoutCode(await readFile(file, "utf8"));
    for (const [, target] of text.matchAll(/\]\(([^)\s]+)\)/g)) {
      if (/^(https?:|mailto:|tel:)/.test(target)) continue;
      const [pathPart, anchor] = target.split("#");
      const resolved = pathPart === "" ? file : path.resolve(path.dirname(file), decodeURI(pathPart));
      const info = (await existsExact(resolved)) ? await stat(resolved).catch(() => null) : null;
      if (!info) {
        broken.push(`${rel(file)} → ${target} (no such file, checked case-sensitively)`);
        continue;
      }
      if (anchor && info.isFile() && resolved.endsWith(".md")) {
        if (!(await anchorsFor(resolved)).has(anchor)) broken.push(`${rel(file)} → ${target} (no such heading)`);
      }
    }
  }
  assert.deepEqual(broken, [], `broken links:\n  ${broken.join("\n  ")}`);
});

test("decision numbers in DECISIONS.md are unique", async () => {
  const text = await readFile(path.join(repo, "DECISIONS.md"), "utf8");
  const numbers = [...text.matchAll(/^\| \d{4}-\d{2}-\d{2} \| \[(ADR-\d{3})\]/gm)].map((m) => m[1]);
  assert.ok(numbers.length > 0, "no decision rows found");
  assert.deepEqual(numbers.filter((n, i) => numbers.indexOf(n) !== i), [], "a decision number is used twice");
});

test("no document contains a path from someone's machine", async () => {
  for (const file of [...markdown, ...ROOT_DOCS.map((f) => path.join(repo, f))]) {
    const text = await readFile(file, "utf8");
    const hit = text.match(/\/(Users|home)\/[A-Za-z0-9._-]+\//);
    assert.ok(!hit, `${rel(file)} contains a local path (${hit?.[0]}); this repository is public`);
  }
});
