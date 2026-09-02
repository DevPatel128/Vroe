#!/usr/bin/env node
/**
 * Copy the woff2 files this site actually uses out of @fontsource into
 * public/fonts/ under stable, unhashed names.
 *
 * src/styles/fonts.css and the <link rel="preload"> tags in SeoHead.jsx both
 * hard-code these paths, so run this after updating either @fontsource package.
 * A mismatch here is silent — the font just falls back — so the build fails
 * loudly instead if a source file is missing.
 */
import { copyFile, mkdir, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "public", "fonts");

const FILES = [
  "@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff2",
  "@fontsource/dm-sans/files/dm-sans-latin-400-normal.woff2",
  "@fontsource/dm-sans/files/dm-sans-latin-600-normal.woff2",
  "@fontsource/dm-sans/files/dm-sans-latin-700-normal.woff2",
];

await mkdir(out, { recursive: true });
for (const rel of FILES) {
  const from = path.join(root, "node_modules", rel);
  try {
    await access(from);
  } catch {
    throw new Error(`Font source missing: ${rel}. Did @fontsource change its layout?`);
  }
  await copyFile(from, path.join(out, path.basename(rel)));
}
console.log(`Fonts: ${FILES.length} woff2 files synced to public/fonts/`);
