#!/usr/bin/env node
/**
 * The touch icon — the Vroe Labs wordmark on paper, 180x180.
 *
 * Safari does not use an SVG favicon for its Favourites grid, for "Add to
 * Dock" on macOS, or for the iOS home screen. With no apple-touch-icon it draws
 * a coloured tile with the first letter of the page title instead, which is
 * why a vroelabs.com favourite showed a bare "V". Browsers and link previews
 * that want a raster icon pick this file up too.
 *
 * 180px is Apple's largest touch-icon size; Safari scales it down everywhere
 * else. The PNG is flattened onto paper with no alpha channel because iOS
 * fills transparent pixels with black. Safari rounds the corners itself, so
 * the square is left square.
 *
 * The wordmark is drawn as outlines for the same reason as the social cards
 * (see glyphs.mjs and ADR-005), at the header wordmark's -0.04em tracking.
 *
 * This is a brand asset that changes rarely, so the PNG is committed. This is
 * NOT part of `npm run build`; run `npm run build:icons` when the wordmark
 * changes.
 */

import { stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { layout, loadFont } from "./glyphs.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "public", "apple-touch-icon.png");

const SIZE = 180;
const INK = "#081b4a";
const PAPER = "#f7f6f2";

// Share of the tile the wordmark's inked width fills. Safari's rounded mask
// and the tile's own padding both eat into the edges, so leave a margin.
const FILL = 0.8;

const serif = await loadFont(
  path.join(root, "node_modules/@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff"),
);

// Measure once at a reference size, then scale so the ink spans FILL of the
// tile. Tracking is proportional to size, so the ratio holds exactly.
const WORD = "Vroe Labs";
const TRACKING_EM = -0.04;
const probe = layout(serif, WORD, 100, 100 * TRACKING_EM);
const size = (100 * SIZE * FILL) / (probe.bounds.right - probe.bounds.left);
const mark = layout(serif, WORD, size, size * TRACKING_EM, INK);

// Centre the inked box, not the advance box: side bearings on the V and the
// missing descenders would otherwise pull the wordmark off centre.
const dx = (SIZE - (mark.bounds.right - mark.bounds.left)) / 2 - mark.bounds.left;
const dy = (SIZE - (mark.bounds.bottom - mark.bounds.top)) / 2 - mark.bounds.top;

const svg =
  `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}">` +
  `<rect width="${SIZE}" height="${SIZE}" fill="${PAPER}"/>` +
  `<g transform="translate(${dx.toFixed(2)} ${dy.toFixed(2)})">${mark.els}</g>` +
  `</svg>`;

await sharp(Buffer.from(svg))
  .flatten({ background: PAPER })
  .removeAlpha()
  .png({ compressionLevel: 9 })
  .toFile(out);

const { size: bytes } = await stat(out);
console.log(`  apple-touch-icon.png ${SIZE}x${SIZE}  ${(bytes / 1024).toFixed(1)} KB`);
console.log("Touch icon written to public/");
