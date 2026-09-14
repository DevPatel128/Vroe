/**
 * Text as vector outlines, shared by the brand-asset generators
 * (generate-og.mjs, generate-icons.mjs).
 *
 * WHY THE FONT IS RENDERED AS PATHS
 * ---------------------------------
 * librsvg (which sharp uses for SVG) resolves font-family through fontconfig,
 * and Instrument Serif is not a system font. On this machine it silently falls
 * back to a sans-serif; on a CI runner it would fall back to something else
 * again, so the same command would produce different images on different
 * machines. Converting text to outlines with opentype.js removes fontconfig
 * from the picture entirely and makes output byte-stable everywhere.
 *
 * opentype.js's own getPath() throws on this font (an unsupported ccmp GSUB
 * lookup), so glyphs are positioned individually with kerning applied by hand.
 */

import { readFile } from "node:fs/promises";
import opentype from "opentype.js";

/** @param {string} file absolute path to a .woff or .ttf */
export async function loadFont(file) {
  const buf = await readFile(file);
  return opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
}

/**
 * Lay out a string glyph by glyph and return one <path> element per glyph.
 *
 * Each glyph gets its own element rather than one concatenated `d` attribute:
 * librsvg silently truncates a very long path-data string, which clipped the
 * tail off every line of text. Twelve small paths render; one 6 KB path does
 * not. This is also why `layout` returns markup instead of path data.
 *
 * `bounds` is the inked area relative to the origin and baseline, for callers
 * that centre text optically rather than by advance width.
 *
 * @param {opentype.Font} font
 * @param {string} str
 * @param {number} size px
 * @param {number} tracking extra px between glyphs (negative tightens)
 * @param {string} fill
 */
export function layout(font, str, size, tracking = 0, fill = "#081b4a") {
  const scale = size / font.unitsPerEm;
  const glyphs = [...str].map((c) => font.charToGlyph(c));
  const els = [];
  const bounds = { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity };
  let x = 0;
  glyphs.forEach((g, i) => {
    const glyphPath = g.getPath(x, 0, size);
    const d = glyphPath.toPathData(2);
    if (d) {
      els.push(`<path d="${d}" fill="${fill}"/>`);
      const box = glyphPath.getBoundingBox();
      bounds.left = Math.min(bounds.left, box.x1);
      bounds.top = Math.min(bounds.top, box.y1);
      bounds.right = Math.max(bounds.right, box.x2);
      bounds.bottom = Math.max(bounds.bottom, box.y2);
    }
    x += g.advanceWidth * scale + tracking;
    const next = glyphs[i + 1];
    if (next) x += font.getKerningValue(g, next) * scale;
  });
  return { els: els.join(""), width: x, bounds };
}
