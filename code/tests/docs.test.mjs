/**
 * The documentation system's rules, enforced.
 *
 * docs/ is organised into ten numbered areas (docs/00_START_HERE/README.md).
 * These tests check the parts of that system a machine can: the structure, the
 * status header every document carries, and that no link points at nothing.
 * Whether a document is the *right* canonical home for a concept is a human
 * judgement, and stays one.
 */

import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repo = fileURLToPath(new URL("../../", import.meta.url));
const docsDir = path.join(repo, "docs");

const AREAS = [
  "00_START_HERE",
  "01_PRINCIPLES",
  "02_PRODUCT",
  "03_RESEARCH",
  "04_DESIGN",
  "05_ENGINEERING",
  "06_OPERATIONS",
  "07_BUSINESS",
  "08_DECISIONS",
  "09_ARCHIVE",
];

// The one area whose front door is an index rather than a README.
const INDEX_FILE = { "08_DECISIONS": "DECISIONS.md" };

const STATUSES = ["Draft", "Review", "Approved", "Superseded", "Archived"];

// Root-level files that also link into docs/.
const ROOT_DOCS = ["README.md", "CONTRIBUTING.md", "SECURITY.md", "CLAUDE.md"];

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

test("docs/ holds exactly the ten areas and nothing else", async () => {
  const top = (await readdir(docsDir)).filter((n) => !n.startsWith("."));
  assert.deepEqual([...top].sort(), [...AREAS].sort(),
    "docs/ may only contain the ten numbered areas; a new concept belongs inside one of them");
});

test("every area has its front door", async () => {
  for (const area of AREAS) {
    const file = INDEX_FILE[area] ?? "README.md";
    assert.ok(await existsExact(path.join(docsDir, area, file)),
      `docs/${area}/${file} is missing (checked case-sensitively)`);
  }
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

test("archived and superseded documents live in the archive, and only they do", async () => {
  for (const file of markdown) {
    const head = (await readFile(file, "utf8")).split("\n").slice(0, 8).join("\n");
    const status = head.match(/\*\*Status:\*\* (\w+)/)?.[1];
    const inArchive = rel(file).startsWith(path.join("docs", "09_ARCHIVE"));
    // ADRs are the exception: a superseded decision may stay beside its category
    // until it is moved, but nothing current may sit in the archive.
    if (inArchive && !path.basename(file).startsWith("README")) {
      assert.ok(["Archived", "Superseded"].includes(status),
        `${rel(file)} is in the archive, so its status must be Archived or Superseded, not ${status}`);
    }
    if (!inArchive && status === "Archived") {
      assert.fail(`${rel(file)} is marked Archived but is not in docs/09_ARCHIVE`);
    }
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

test("every decision file is listed in the decisions index", async () => {
  const index = await readFile(path.join(docsDir, "08_DECISIONS", "DECISIONS.md"), "utf8");
  const adrs = allFiles.filter((f) => /ADR-\d{3}-.*\.md$/.test(path.basename(f)));
  assert.ok(adrs.length > 0, "no decision files found");
  for (const adr of adrs) {
    assert.ok(index.includes(path.basename(adr)), `${rel(adr)} is not listed in DECISIONS.md`);
  }
});

test("no document contains a path from someone's machine", async () => {
  for (const file of markdown) {
    const text = await readFile(file, "utf8");
    const hit = text.match(/\/(Users|home)\/[A-Za-z0-9._-]+\//);
    assert.ok(!hit, `${rel(file)} contains a local path (${hit?.[0]}); this repository is heading public`);
  }
});
