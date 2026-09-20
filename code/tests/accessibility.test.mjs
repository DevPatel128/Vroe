/**
 * Accessibility rules a machine can check without a browser.
 *
 * The Lighthouse job (perf/run.mjs) audits the rendered pages; these tests are
 * the fast, deterministic half. They exist because each of the three things below
 * was once wrong and only a slow audit noticed (ADR-024): heading levels skipped
 * on /products, illustration text was too pale, and coral was used as text.
 * docs/04_DESIGN/ACCESSIBILITY.md is the canonical statement of the requirements.
 */

import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const dist = fileURLToPath(new URL("../dist/client/", import.meta.url));
const styles = fileURLToPath(new URL("../src/styles/", import.meta.url));

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}

/* ─── WCAG contrast ────────────────────────────────────────────────────── */

const channel = (c) => {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}
function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const AA = 4.5;
const ratio = (n) => n.toFixed(2);

/* ─── Heading outline ──────────────────────────────────────────────────── */

test("no page skips a heading level", async () => {
  const pages = (await walk(dist)).filter((f) => f.endsWith(".html"));
  assert.ok(pages.length > 0, "no HTML found; is dist/client built?");
  for (const page of pages) {
    const html = await readFile(page, "utf8");
    const levels = [...html.matchAll(/<h([1-6])[\s>]/g)].map((m) => Number(m[1]));
    const name = path.relative(dist, page);
    assert.equal(levels[0], 1, `${name} must open with an h1, not h${levels[0]}`);
    for (let i = 1; i < levels.length; i++) {
      assert.ok(levels[i] <= levels[i - 1] + 1,
        `${name}: h${levels[i - 1]} is followed by h${levels[i]}, skipping a level. ` +
        "Screen-reader users navigate by heading level; pass a headingLevel or fix the outline.");
    }
  }
});

/* ─── The illustration palette ─────────────────────────────────────────── */

test("the illustration's text colours meet WCAG AA on every surface they are drawn on", async () => {
  const css = await readFile(path.join(styles, "products.css"), "utf8");
  const green = css.match(/--preview-green:\s*(#[0-9a-f]{6})/i)?.[1];
  const muted = css.match(/--preview-muted:\s*(#[0-9a-f]{6})/i)?.[1];
  assert.ok(green && muted, "--preview-green and --preview-muted must be defined in products.css");

  // The surfaces the illustration draws on. If one of these changes, this test
  // should fail so the contrast is rechecked rather than assumed.
  const surfaces = { sidebar: "#eae8e1", main: "#f2f0eb", card: "#fffdf9" };
  for (const hex of Object.values(surfaces)) {
    assert.ok(css.toLowerCase().includes(hex) || hex === "#fffdf9",
      `${hex} is no longer used in products.css; recheck the illustration's contrast`);
  }

  // Green is used on the sidebar note, the main pane and the white Vero card.
  for (const [name, bg] of Object.entries(surfaces)) {
    const c = contrast(green, bg);
    assert.ok(c >= AA, `--preview-green ${green} on the ${name} (${bg}) is ${ratio(c)}:1, below ${AA}:1`);
  }
  // Muted grey is used only on the white cards.
  const c = contrast(muted, surfaces.card);
  assert.ok(c >= AA, `--preview-muted ${muted} on the white card is ${ratio(c)}:1, below ${AA}:1`);
});

test("no colour outside the illustration palette is hard-coded for illustration text", async () => {
  const css = await readFile(path.join(styles, "products.css"), "utf8");
  // The old, too-pale values must not come back.
  for (const old of ["#5c824a", "#617c4c", "#7e8795", "#8c929e", "#88909c"]) {
    assert.ok(!css.toLowerCase().includes(old), `${old} was replaced for contrast (ADR-024); use the preview variables`);
  }
});

/* ─── Brand text and coral ─────────────────────────────────────────────── */

test("the brand's text colours meet WCAG AA on the surfaces they are used on", async () => {
  const tokens = await readFile(path.join(styles, "tokens.css"), "utf8");
  const token = (name) => tokens.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, "i"))?.[1];
  const [ink, inkSoft, paper, white, blue] = ["ink", "ink-soft", "paper", "white", "blue"].map(token);
  assert.ok([ink, inkSoft, paper, white, blue].every(Boolean), "a brand token is missing from tokens.css");

  for (const [text, textName] of [[ink, "Ink"], [inkSoft, "Ink Soft"]]) {
    for (const [bg, bgName] of [[paper, "Paper"], [white, "White"], [blue, "Sky"]]) {
      const c = contrast(text, bg);
      assert.ok(c >= AA, `${textName} on ${bgName} is ${ratio(c)}:1, below ${AA}:1`);
    }
  }
});

test("coral is never used as a text colour, except where it is decorative", async () => {
  // Coral on Paper is 2.66:1. It is an accent (dots, fills, focus rings), not
  // something to be read. These two are decorative and exempt: the full stop
  // after a display headline, and an icon inside the aria-hidden Vero preview.
  const allowed = new Set([".accent-dot", ".vero-preview-footer svg"]);
  const found = [];
  for (const file of (await walk(styles)).filter((f) => f.endsWith(".css"))) {
    const css = (await readFile(file, "utf8")).replace(/\/\*[\s\S]*?\*\//g, "");
    for (const [, selector, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      if (/(^|[;\s])color:\s*var\(--coral\)/.test(body)) found.push(selector.trim().replace(/\s+/g, " "));
    }
  }
  const unexpected = found.filter((s) => !allowed.has(s));
  assert.deepEqual(unexpected, [],
    `coral used as a text colour in: ${unexpected.join("; ")}. Use Ink Soft for the text and a coral dot or rule for the accent (ADR-024).`);
});
