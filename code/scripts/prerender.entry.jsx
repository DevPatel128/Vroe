/**
 * Prerenderer — turns the React components into static HTML, one file per route.
 *
 * This is the whole architecture in one script. React is a build-time template
 * engine here: renderToStaticMarkup produces final markup with no hydration
 * markers, so the browser receives HTML and never downloads React at all. The
 * Phosphor icons become inline SVG in the output for the same reason.
 *
 * Output layout is what Cloudflare's static assets expect for clean URLs:
 *   /            -> dist/client/index.html
 *   /trove       -> dist/client/trove/index.html
 *   /notes/trove -> dist/client/notes/trove/index.html
 */

import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement as h } from "react";

import { ROUTES } from "../src/content/routes.js";
import { NOTE_BY_ID } from "../src/content/notes.js";
import { Document } from "../src/layout/Document.jsx";
import { HomePage } from "../src/pages/home.jsx";
import { ProductPage } from "../src/pages/product.jsx";
import { ProductsHubPage } from "../src/pages/products.jsx";
import { NotePage } from "../src/pages/note.jsx";
import { AboutPage } from "../src/pages/about.jsx";
import { ContactPage } from "../src/pages/contact.jsx";
import { LegalPage } from "../src/pages/legal.jsx";
import { NotFoundPage } from "../src/pages/not-found.jsx";
import * as ld from "../src/seo/JsonLd.jsx";
import { evidenceProblems } from "../src/content/evidence/index.js";

// A figure without a source, a calculation that does not reproduce, or a story
// item pointing at data that does not exist fails the build rather than shipping.
// See src/content/evidence/derive.js and docs/03_RESEARCH/RESEARCH.md.
const evidenceIssues = evidenceProblems();
if (evidenceIssues.length > 0) {
  throw new Error(`Evidence data failed validation:\n  ${evidenceIssues.join("\n  ")}`);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outRoot = path.join(root, "dist", "client");

/** Resolve the hashed asset names Vite just produced. */
async function readAssets() {
  const manifestPath = path.join(outRoot, ".vite", "manifest.json");
  let manifest;
  try {
    manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  } catch {
    throw new Error("Vite manifest not found. Run `vite build` before prerendering.");
  }

  const css = new Set();
  let js = null;

  for (const [key, entry] of Object.entries(manifest)) {
    if (!entry.isEntry) continue;
    for (const file of entry.css ?? []) css.add(`/${file}`);
    if (key.endsWith(".css")) css.add(`/${entry.file}`);
    if (key.endsWith("enhance.js")) js = `/${entry.file}`;
  }

  if (css.size === 0) throw new Error("No stylesheet in the Vite manifest.");
  if (!js) throw new Error("enhance.js missing from the Vite manifest.");
  return { css: [...css], js };
}

/** Page component + its JSON-LD blocks, for one route. */
function renderRoute(route) {
  const crumb = (label, href) => ({ label, href });
  const home = crumb("Home", "/");

  switch (route.page) {
    case "home":
      return {
        element: h(HomePage),
        jsonLd: [ld.organization(), ld.website(), ld.webPage(route)],
      };

    case "trove":
      return {
        element: h(ProductPage, { id: "trove" }),
        jsonLd: [
          ld.webPage(route),
          ld.troveApplication(),
          ld.breadcrumbs([home, crumb("Trove", "/trove")]),
        ],
      };

    case "vero":
      return {
        element: h(ProductPage, { id: "vero" }),
        jsonLd: [
          ld.webPage(route),
          ld.organization(),
          ld.breadcrumbs([home, crumb("Vero", "/vero")]),
        ],
      };

    case "products":
      return {
        element: h(ProductsHubPage),
        jsonLd: [ld.webPage(route), ld.organization(), ld.breadcrumbs([home, crumb("Products", "/products")])],
      };

    case "note": {
      const note = NOTE_BY_ID[route.noteId];
      return {
        element: h(NotePage, { id: route.noteId }),
        jsonLd: [
          ld.webPage(route),
          ld.article(note, route),
          ld.breadcrumbs([home, crumb("Notes", "/#notes"), crumb(note.title, note.slug)]),
        ],
      };
    }

    case "about":
      return {
        element: h(AboutPage),
        jsonLd: [ld.webPage(route), ld.organization(), ld.breadcrumbs([home, crumb("About", "/about")])],
      };

    case "contact":
      return {
        element: h(ContactPage),
        jsonLd: [ld.webPage(route), ld.organization(), ld.breadcrumbs([home, crumb("Contact", "/contact")])],
      };

    case "privacy":
      return {
        element: h(LegalPage, { kind: "privacy" }),
        jsonLd: [ld.webPage(route), ld.breadcrumbs([home, crumb("Privacy Policy", "/privacy")])],
      };

    case "terms":
      return {
        element: h(LegalPage, { kind: "terms" }),
        jsonLd: [ld.webPage(route), ld.breadcrumbs([home, crumb("Terms of Use", "/terms")])],
      };

    case "notFound":
      return { element: h(NotFoundPage), jsonLd: [] };

    default:
      throw new Error(`No renderer for page type "${route.page}"`);
  }
}

/** Where a route's index.html goes. `/404` is written as 404.html. */
function outputPath(routePath) {
  if (routePath === "/") return path.join(outRoot, "index.html");
  if (routePath === "/404") return path.join(outRoot, "404.html");
  return path.join(outRoot, routePath.replace(/^\//, ""), "index.html");
}

const { css, js } = await readAssets();
let total = 0;

for (const route of ROUTES) {
  const { element, jsonLd } = renderRoute(route);
  const markup = renderToStaticMarkup(
    h(Document, { route, jsonLd, css, js }, element),
  );

  const html = `<!doctype html>\n${markup}\n`;
  const file = outputPath(route.path);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, html, "utf8");

  total += Buffer.byteLength(html);
  const kb = (Buffer.byteLength(html) / 1024).toFixed(1);
  console.log(`  ${route.path.padEnd(16)} -> ${path.relative(root, file).padEnd(38)} ${kb.padStart(6)} KB`);
}

// The Vite manifest is a build-time index of source paths to hashed filenames.
// It has done its job by now, and dist/client is published verbatim — leaving it
// behind would serve /.vite/manifest.json to anyone who asks and hand them the
// source layout for free. Nothing downstream reads it. See tests/security.test.mjs.
await rm(path.join(outRoot, ".vite"), { recursive: true, force: true });

console.log(`Prerendered ${ROUTES.length} routes, ${(total / 1024).toFixed(1)} KB of HTML.`);
