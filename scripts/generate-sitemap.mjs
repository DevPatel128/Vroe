#!/usr/bin/env node
/** Runner: compiles generate-sitemap.entry.jsx, then executes it. See prerender.mjs. */
import { build } from "esbuild";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const buildDir = path.join(root, ".build");
const outfile = path.join(buildDir, "sitemap.mjs");

await mkdir(buildDir, { recursive: true });
await build({
  entryPoints: [path.join(root, "scripts", "generate-sitemap.entry.jsx")],
  outfile, bundle: true, format: "esm", platform: "node", target: "node20",
  jsx: "automatic", packages: "external", logLevel: "warning", absWorkingDir: root,
});
await import(`${pathToFileURL(outfile).href}?t=${Date.now()}`);
await rm(buildDir, { recursive: true, force: true });
