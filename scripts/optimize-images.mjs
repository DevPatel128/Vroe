#!/usr/bin/env node
/**
 * Image pipeline.
 *
 * The prototype shipped three source PNGs totalling 5.2 MB, the hero alone
 * being 1.67 MB. They are the single biggest thing standing between this site
 * and a good Largest Contentful Paint.
 *
 * This script reads the originals from assets-src/ (which is NOT published) and
 * writes AVIF + WebP + a JPEG fallback at a few sensible widths into
 * public/assets/. It also emits src/generated/images.json so components can
 * render correct width/height attributes and srcsets without guessing — which
 * is what keeps Cumulative Layout Shift at zero.
 *
 * Idempotent: existing outputs are skipped unless the source is newer.
 */

import { mkdir, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = path.join(root, "assets-src");
const outDir = path.join(root, "public", "assets");
const manifestPath = path.join(root, "src", "generated", "images.json");

/**
 * Widths are chosen from how large each image can actually render, doubled for
 * high-density screens. Generating more than this wastes build time and bytes.
 */
const IMAGES = {
  "vroe-hero-still-life": { widths: [768, 1200, 1586], quality: { avif: 55, webp: 72, jpeg: 78 } },
  "vero-still-life": { widths: [480, 800, 1086], quality: { avif: 55, webp: 72, jpeg: 78 } },
  "belief-still-life": { widths: [300, 450, 600], quality: { avif: 58, webp: 75, jpeg: 80 } },
};

const FORMATS = [
  { ext: "avif", type: "image/avif" },
  { ext: "webp", type: "image/webp" },
  { ext: "jpg", type: "image/jpeg" },
];

async function newer(a, b) {
  try {
    const [sa, sb] = await Promise.all([stat(a), stat(b)]);
    return sa.mtimeMs > sb.mtimeMs;
  } catch {
    return true; // output missing
  }
}

async function main() {
  await mkdir(outDir, { recursive: true });
  await mkdir(path.dirname(manifestPath), { recursive: true });

  const available = (await readdir(srcDir)).filter((f) => f.endsWith(".png"));
  const manifest = {};
  let written = 0;
  let skipped = 0;

  for (const [name, config] of Object.entries(IMAGES)) {
    const source = path.join(srcDir, `${name}.png`);
    if (!available.includes(`${name}.png`)) {
      throw new Error(`Missing source image: assets-src/${name}.png`);
    }

    const meta = await sharp(source).metadata();
    const aspect = meta.height / meta.width;

    const entry = {
      alt: null, // supplied at the call site; alt text is content, not build data
      width: Math.min(meta.width, Math.max(...config.widths)),
      height: Math.round(Math.min(meta.width, Math.max(...config.widths)) * aspect),
      sources: {},
      fallback: null,
    };

    for (const { ext, type } of FORMATS) {
      const srcset = [];

      for (const width of config.widths) {
        if (width > meta.width) continue;
        const file = `${name}-${width}.${ext}`;
        const outPath = path.join(outDir, file);

        if (await newer(source, outPath)) {
          const pipeline = sharp(source).resize({ width, withoutEnlargement: true });
          if (ext === "avif") await pipeline.avif({ quality: config.quality.avif, effort: 6 }).toFile(outPath);
          else if (ext === "webp") await pipeline.webp({ quality: config.quality.webp, effort: 6 }).toFile(outPath);
          else await pipeline.jpeg({ quality: config.quality.jpeg, mozjpeg: true }).toFile(outPath);
          written += 1;
        } else {
          skipped += 1;
        }

        srcset.push(`/assets/${file} ${width}w`);
      }

      entry.sources[ext] = { type, srcset: srcset.join(", ") };
      if (ext === "jpg") {
        const widest = Math.min(meta.width, Math.max(...config.widths));
        entry.fallback = `/assets/${name}-${widest}.jpg`;
      }
    }

    manifest[name] = entry;
  }

  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  // Report the saving, because it is the whole point of this step.
  let originals = 0;
  for (const name of Object.keys(IMAGES)) originals += (await stat(path.join(srcDir, `${name}.png`))).size;
  let optimised = 0;
  for (const f of await readdir(outDir)) {
    if (/\.(avif|webp|jpg)$/.test(f)) optimised += (await stat(path.join(outDir, f))).size;
  }

  const mb = (n) => `${(n / 1024 / 1024).toFixed(2)} MB`;
  console.log(`Images: ${written} written, ${skipped} up to date.`);
  console.log(`  sources ${mb(originals)} -> all variants ${mb(optimised)}`);
  console.log(`  manifest: src/generated/images.json`);
}

main().catch((error) => {
  console.error("Image optimisation failed:", error.message);
  process.exit(1);
});
