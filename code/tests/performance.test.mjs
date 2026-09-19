/**
 * Byte budgets for what actually ships.
 *
 * Sizes are deterministic, so unlike a timing metric they never flake, and they
 * run on every `npm test` — in CI and again before every deploy. The budgets
 * sit a little above today's numbers: they exist to catch a change of kind
 * (a framework or a third-party library sneaking into the bundle, an
 * unoptimised photo, a font added on a whim), not to police a few hundred
 * bytes.
 *
 * Going over is sometimes right. When it is, raise the number here and record
 * why in docs/07-decisions.md, so the increase is a decision rather than drift.
 * Lab timings (LCP, CLS, TBT) and the Lighthouse category scores are checked
 * separately by perf/run.mjs.
 */

import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const dist = fileURLToPath(new URL("../dist/client/", import.meta.url));

const KB = 1024;

const BUDGETS = {
  // One ~2 KB vanilla script. React alone would be 40 KB or more, so this
  // budget is also what keeps ADR-001 true.
  jsGzipTotal: 4 * KB,
  jsFiles: 2,
  cssGzipTotal: 10 * KB,
  htmlGzipPerPage: 16 * KB,
  fontFiles: 6,
  fontBytesTotal: 80 * KB,
  imageBytesEach: 150 * KB,
};

const kb = (n) => `${(n / KB).toFixed(1)} KB`;

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}

const files = (await walk(dist)).map((f) => ({ file: f, rel: path.relative(dist, f) }));
const ofType = (...exts) => files.filter((f) => exts.includes(path.extname(f.file).slice(1)));
const gzipSize = async (f) => gzipSync(await readFile(f.file), { level: 9 }).length;
const size = async (f) => (await readFile(f.file)).length;

async function total(list, measure) {
  let sum = 0;
  for (const f of list) sum += await measure(f);
  return sum;
}

test("browser JavaScript stays within its budget", async () => {
  const js = ofType("js");
  assert.ok(js.length > 0, "no JavaScript found; is dist/client built?");
  assert.ok(js.length <= BUDGETS.jsFiles,
    `${js.length} script files ship (${js.map((f) => f.rel).join(", ")}); the budget is ${BUDGETS.jsFiles}`);
  const gz = await total(js, gzipSize);
  assert.ok(gz <= BUDGETS.jsGzipTotal,
    `JavaScript is ${kb(gz)} gzipped; the budget is ${kb(BUDGETS.jsGzipTotal)}. This site ships no framework (ADR-001).`);
});

test("CSS stays within its budget", async () => {
  const gz = await total(ofType("css"), gzipSize);
  assert.ok(gz > 0, "no CSS found; is dist/client built?");
  assert.ok(gz <= BUDGETS.cssGzipTotal,
    `CSS is ${kb(gz)} gzipped; the budget is ${kb(BUDGETS.cssGzipTotal)}`);
});

test("every HTML page stays within its budget", async () => {
  const pages = ofType("html");
  assert.ok(pages.length > 0, "no HTML found; is dist/client built?");
  for (const page of pages) {
    const gz = await gzipSize(page);
    assert.ok(gz <= BUDGETS.htmlGzipPerPage,
      `${page.rel} is ${kb(gz)} gzipped; the budget is ${kb(BUDGETS.htmlGzipPerPage)}`);
  }
});

test("fonts stay within their budget", async () => {
  const fonts = ofType("woff2", "woff", "ttf", "otf");
  assert.ok(fonts.length > 0, "no fonts found; is dist/client built?");
  assert.ok(fonts.length <= BUDGETS.fontFiles,
    `${fonts.length} font files ship; the budget is ${BUDGETS.fontFiles}`);
  const bytes = await total(fonts, size);
  assert.ok(bytes <= BUDGETS.fontBytesTotal,
    `fonts total ${kb(bytes)}; the budget is ${kb(BUDGETS.fontBytesTotal)}`);
});

test("no single image is over budget", async () => {
  for (const image of ofType("avif", "webp", "jpg", "jpeg", "png")) {
    const bytes = await size(image);
    assert.ok(bytes <= BUDGETS.imageBytesEach,
      `${image.rel} is ${kb(bytes)}; the budget is ${kb(BUDGETS.imageBytesEach)} per image`);
  }
});
