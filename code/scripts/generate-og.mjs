#!/usr/bin/env node
/**
 * Open Graph social cards — 1200x630, one per product plus the studio card.
 *
 * Text is rendered as vector outlines; glyphs.mjs explains why.
 *
 * These are brand assets that change rarely, so the generated JPEGs are
 * committed. This is NOT part of `npm run build`; run `npm run build:og` when
 * the wording or artwork changes.
 */

import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { layout, loadFont } from "./glyphs.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "public", "assets");

const W = 1200;
const H = 630;

const INK = "#081b4a";
const SKY = "#a9cbed";
const PAPER = "#f7f6f2";
const CORAL = "#ff674f";

const fontPath = path.join(root, "node_modules/@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff");
const sansPath = path.join(root, "node_modules/@fontsource/dm-sans/files/dm-sans-latin-700-normal.woff");

const serif = await loadFont(fontPath);
const sans = await loadFont(sansPath);

/** A <g> of glyph paths with the text baseline at (x, y). */
function text(font, str, { x, y, size, tracking = 0, fill = INK, anchor = "start" }) {
  const { els, width } = layout(font, str, size, tracking, fill);
  const dx = anchor === "middle" ? x - width / 2 : x;
  return { el: `<g transform="translate(${dx.toFixed(2)} ${y})">${els}</g>`, width };
}

const CARDS = [
  {
    file: "og-vroe-labs.jpg",
    image: "vroe-hero-still-life",
    eyebrow: "PRODUCT STUDIO",
    lines: ["Useful ideas,", "made real."],
    footer: "vroelabs.com",
    bg: SKY,
  },
  {
    file: "og-trove.jpg",
    image: "vroe-hero-still-life",
    eyebrow: "TROVE — TAKING SHAPE",
    lines: ["Your whole", "money picture."],
    footer: "vroelabs.com/trove",
    bg: SKY,
  },
  {
    file: "og-vero.jpg",
    image: "vero-still-life",
    eyebrow: "VERO — UPCOMING",
    lines: ["Proof for the", "work you do."],
    footer: "vroelabs.com/vero",
    bg: SKY,
  },
];

async function build(card) {
  // Artwork fills the right 42% of the card, softened so the type stays legible.
  const artW = Math.round(W * 0.42);
  const art = await sharp(path.join(root, "assets-src", `${card.image}.png`))
    .resize({ width: artW, height: H, fit: "cover", position: "centre" })
    .toBuffer();

  const els = [];
  els.push(`<rect width="${W}" height="${H}" fill="${card.bg}"/>`);

  // Eyebrow with its brand rule.
  const eyebrowY = 150;
  els.push(`<rect x="80" y="${eyebrowY - 5}" width="34" height="2" fill="${INK}"/>`);
  els.push(text(sans, card.eyebrow, { x: 130, y: eyebrowY, size: 17, tracking: 2.7, fill: "#29406c" }).el);

  // Display lines.
  let y = 268;
  for (const line of card.lines) {
    els.push(text(serif, line, { x: 80, y, size: 92, tracking: -3.2 }).el);
    y += 96;
  }

  // Coral full stop accent, sitting just after the final line.
  const last = layout(serif, card.lines[card.lines.length - 1], 92, -3.2);
  els.push(`<circle cx="${(80 + last.width + 16).toFixed(1)}" cy="${y - 96 - 12}" r="9" fill="${CORAL}"/>`);

  // Footer rule + wordmark + url.
  els.push(`<rect x="80" y="${H - 108}" width="${W - artW - 160}" height="1" fill="rgba(8,27,74,0.28)"/>`);
  els.push(text(serif, "Vroe Labs", { x: 80, y: H - 62, size: 38, tracking: -1.4 }).el);
  els.push(text(sans, card.footer, { x: 80, y: H - 34, size: 15, tracking: 0.4, fill: "#29406c" }).el);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${els.join("")}</svg>`;

  const out = path.join(outDir, card.file);
  await sharp(Buffer.from(svg))
    .composite([{ input: art, left: W - artW, top: 0, blend: "multiply" }])
    .flatten({ background: PAPER })
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile(out);

  return out;
}

await mkdir(outDir, { recursive: true });
for (const card of CARDS) {
  const out = await build(card);
  const { size } = await (await import("node:fs/promises")).stat(out);
  console.log(`  ${card.file.padEnd(20)} ${W}x${H}  ${(size / 1024).toFixed(1)} KB`);
}
console.log("Open Graph cards written to public/assets/");
