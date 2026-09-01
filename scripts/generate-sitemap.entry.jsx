/**
 * Generates robots.txt, sitemap.xml and .well-known/security.txt.
 *
 * All three are derived from the route table in src/content/routes.js, so a new
 * page appears in the sitemap automatically and the sitemap can never list a
 * URL that was not built. tests/seo.test.mjs asserts exactly that.
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { INDEXABLE_ROUTES } from "../src/content/routes.js";
import { SITE, SITE_URL } from "../src/content/site.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "dist", "client");

/** Newest content date on the site, used as the security.txt expiry anchor. */
const today = new Date().toISOString().slice(0, 10);

/* ─── sitemap.xml ──────────────────────────────────────────────────────── */

const urls = INDEXABLE_ROUTES.map((route) => {
  const loc = `${SITE_URL}${route.path === "/" ? "/" : route.path}`;
  return [
    "  <url>",
    `    <loc>${loc}</loc>`,
    `    <lastmod>${today}</lastmod>`,
    `    <changefreq>${route.changefreq}</changefreq>`,
    `    <priority>${route.priority}</priority>`,
    "  </url>",
  ].join("\n");
}).join("\n");

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

/* ─── robots.txt ───────────────────────────────────────────────────────── */

/**
 * Everything is allowed. CSS, JS, fonts and images must stay crawlable or
 * Google cannot render the page the way a visitor sees it.
 *
 * /api/ is disallowed because those paths are endpoints rather than content —
 * this is a crawl-budget courtesy, not a security control. Access control for
 * them lives in worker/index.js.
 */
const robots = `# https://www.robotstxt.org/robotstxt.html
User-agent: *
Allow: /
Disallow: /api/

Sitemap: ${SITE_URL}/sitemap.xml
`;

/* ─── security.txt ─────────────────────────────────────────────────────── */

// RFC 9116 requires an expiry, and recommends under a year.
const expires = new Date();
expires.setUTCFullYear(expires.getUTCFullYear() + 1);

const securityTxt = `# Vroe Labs — security contact
# https://www.rfc-editor.org/rfc/rfc9116

Contact: mailto:${SITE.email}
Expires: ${expires.toISOString().replace(/\.\d{3}Z$/, "Z")}
Preferred-Languages: en
Canonical: ${SITE_URL}/.well-known/security.txt
Policy: ${SITE_URL}/terms

# Scope: ${SITE_URL} and its /api endpoints.
# We aim to acknowledge reports within 72 hours.
# There is no bug bounty programme. Please give us a reasonable window to fix
# an issue before disclosing it publicly.
`;

await mkdir(path.join(out, ".well-known"), { recursive: true });
await writeFile(path.join(out, "sitemap.xml"), sitemap, "utf8");
await writeFile(path.join(out, "robots.txt"), robots, "utf8");
await writeFile(path.join(out, ".well-known", "security.txt"), securityTxt, "utf8");

console.log(`SEO: sitemap.xml (${INDEXABLE_ROUTES.length} URLs), robots.txt, .well-known/security.txt`);
