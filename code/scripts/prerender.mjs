#!/usr/bin/env node
/**
 * Runner for the prerenderer.
 *
 * scripts/prerender.entry.jsx imports .jsx components, which Node cannot parse.
 * Rather than registering a custom loader, esbuild (already present as a Vite
 * dependency) bundles the entry into a single plain-JS module in .build/ and
 * this file imports it.
 *
 * Everything in node_modules stays external: react-dom/server is CommonJS and
 * calls require("util") at load time, which throws once esbuild has rewritten
 * it into an ES module. Leaving packages external means only our own source is
 * bundled and Node resolves the dependencies normally.
 */

import { build } from "esbuild";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const buildDir = path.join(root, ".build");
const outfile = path.join(buildDir, "prerender.mjs");

await mkdir(buildDir, { recursive: true });

await build({
  entryPoints: [path.join(root, "scripts", "prerender.entry.jsx")],
  outfile,
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node20",
  jsx: "automatic",
  packages: "external",
  logLevel: "warning",
  // JSON imported with an import attribute; esbuild inlines it.
  loader: { ".json": "json" },
  absWorkingDir: root,
});

// Cache-bust so repeated builds in one process pick up fresh output.
await import(`${pathToFileURL(outfile).href}?t=${Date.now()}`);

await rm(buildDir, { recursive: true, force: true });
