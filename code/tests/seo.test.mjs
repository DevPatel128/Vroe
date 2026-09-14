/**
 * SEO and accessibility tests against the built output.
 *
 * These check the HTML that actually ships, not the components that produced
 * it — a metadata bug that only appears after prerendering would otherwise go
 * unnoticed until Search Console reported it weeks later.
 */

import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

const dist = new URL("../dist/client/", import.meta.url);
const SITE_URL = "https://vroelabs.com";

async function htmlFiles() {
  const out = [];
  const walk = async (dir, prefix = "") => {
    for (const entry of await readdir(new URL(dir, dist), { withFileTypes: true })) {
      const rel = `${prefix}${entry.name}`;
      if (entry.isDirectory()) await walk(`${dir}${entry.name}/`, `${rel}/`);
      else if (rel.endsWith(".html")) out.push(rel);
    }
  };
  await walk("");
  return out;
}

const read = (file) => readFile(new URL(file, dist), "utf8");
const attr = (html, re) => html.match(re)?.[1] ?? null;

/* ─── Per-page metadata ────────────────────────────────────────────────── */

test("every page has exactly one h1", async () => {
  for (const file of await htmlFiles()) {
    const html = await read(file);
    const count = (html.match(/<h1[\s>]/g) ?? []).length;
    assert.equal(count, 1, `${file} has ${count} h1 elements`);
  }
});

test("titles and descriptions are present and unique", async () => {
  const titles = new Map();
  const descriptions = new Map();

  for (const file of await htmlFiles()) {
    const html = await read(file);
    const title = attr(html, /<title>([^<]+)<\/title>/);
    const description = attr(html, /<meta name="description" content="([^"]+)"/);

    assert.ok(title, `${file} has no title`);
    assert.ok(description, `${file} has no meta description`);
    assert.ok(title.length <= 70, `${file} title is ${title.length} chars`);
    assert.ok(description.length >= 50 && description.length <= 175,
      `${file} description is ${description.length} chars`);

    assert.ok(!titles.has(title), `duplicate title: ${file} and ${titles.get(title)}`);
    assert.ok(!descriptions.has(description), `duplicate description: ${file} and ${descriptions.get(description)}`);
    titles.set(title, file);
    descriptions.set(description, file);

    // Vague titles are worse than no title.
    assert.ok(!/^(Home|Welcome|Untitled|Our Products)$/i.test(title), `vague title in ${file}`);
  }
});

test("indexable pages have one canonical on the HTTPS production domain", async () => {
  for (const file of await htmlFiles()) {
    const html = await read(file);
    const canonicals = html.match(/<link rel="canonical"/g) ?? [];

    if (file === "404.html") {
      assert.equal(canonicals.length, 0, "404 must not be canonical");
      assert.match(html, /<meta name="robots" content="noindex/);
      continue;
    }

    assert.equal(canonicals.length, 1, `${file} has ${canonicals.length} canonicals`);
    const href = attr(html, /<link rel="canonical" href="([^"]+)"/);
    assert.ok(href.startsWith(`${SITE_URL}/`), `${file} canonical is not on the production origin: ${href}`);
  }
});

test("no page carries an accidental noindex", async () => {
  for (const file of await htmlFiles()) {
    if (file === "404.html") continue;
    const html = await read(file);
    assert.ok(!/content="[^"]*noindex/.test(html), `${file} is marked noindex`);
  }
});

test("Open Graph and Twitter tags are complete with absolute image URLs", async () => {
  const required = [
    /<meta property="og:title" content="[^"]+"/,
    /<meta property="og:description" content="[^"]+"/,
    /<meta property="og:url" content="https:\/\/[^"]+"/,
    /<meta property="og:type" content="[^"]+"/,
    /<meta name="twitter:card" content="summary_large_image"/,
    /<meta name="twitter:title" content="[^"]+"/,
    /<meta name="twitter:description" content="[^"]+"/,
  ];

  for (const file of await htmlFiles()) {
    const html = await read(file);
    for (const pattern of required) {
      assert.match(html, pattern, `${file} is missing ${pattern}`);
    }
    for (const key of ["og:image", "twitter:image"]) {
      const src = attr(html, new RegExp(`"${key}" content="([^"]+)"`));
      assert.ok(src?.startsWith("https://"), `${file} ${key} must be absolute, got ${src}`);
      // The logo makes a poor social card; these must be the 1200x630 cards.
      assert.match(src, /\/assets\/og-[a-z-]+\.jpg$/, `${file} ${key} should be an OG card`);
    }
  }
});

test("html lang is set on every page", async () => {
  for (const file of await htmlFiles()) {
    assert.match(await read(file), /<html lang="en">/, `${file} missing lang`);
  }
});

/* ─── Structured data ──────────────────────────────────────────────────── */

test("JSON-LD parses and never claims an offer, rating or review", async () => {
  for (const file of await htmlFiles()) {
    const html = await read(file);
    for (const [, raw] of html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)) {
      const decoded = raw.replace(/\\u003c/g, "<");
      let data;
      assert.doesNotThrow(() => { data = JSON.parse(decoded); }, `invalid JSON-LD in ${file}`);

      const text = JSON.stringify(data);
      for (const banned of ["aggregateRating", "ratingValue", "reviewCount", "offers", "Offer", "award"]) {
        assert.ok(!text.includes(banned), `${file} JSON-LD contains "${banned}" — nothing on the site supports it`);
      }
      assert.ok(data["@context"] === "https://schema.org", `${file} JSON-LD missing @context`);
    }
  }
});

test("article JSON-LD carries real dates, not placeholders", async () => {
  for (const file of ["notes/trove/index.html", "notes/vero/index.html"]) {
    const html = await read(file);
    const block = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)]
      .map(([, raw]) => JSON.parse(raw.replace(/\\u003c/g, "<")))
      .find((d) => d["@type"] === "Article");

    assert.ok(block, `${file} has no Article JSON-LD`);
    for (const field of ["datePublished", "dateModified"]) {
      assert.match(block[field], /^\d{4}-\d{2}-\d{2}$/, `${file} ${field} is not a date`);
      assert.ok(new Date(block[field]) <= new Date(), `${file} ${field} is in the future`);
    }
    assert.ok(block.headline && block.description && block.image && block.publisher);
  }
});

/* ─── Sitemap and robots ───────────────────────────────────────────────── */

test("sitemap is valid, absolute, and lists exactly the pages that were built", async () => {
  const xml = await readFile(new URL("sitemap.xml", dist), "utf8");
  assert.match(xml, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  assert.match(xml, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);

  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, l]) => l);
  assert.ok(locs.length > 0);
  assert.equal(new Set(locs).size, locs.length, "sitemap contains duplicates");

  for (const loc of locs) {
    assert.ok(loc.startsWith(`${SITE_URL}/`), `sitemap URL not on production origin: ${loc}`);
    assert.ok(!loc.includes("?"), `sitemap must not contain query strings: ${loc}`);
    assert.ok(!loc.startsWith(`${SITE_URL}/404`), "404 must not be in the sitemap");

    // Every listed URL must correspond to a file that was actually built.
    const rel = loc.replace(`${SITE_URL}/`, "");
    const file = rel === "" ? "index.html" : `${rel}/index.html`;
    await readFile(new URL(file, dist), "utf8");
  }
});

test("robots.txt allows crawling and points at the sitemap", async () => {
  const robots = await readFile(new URL("robots.txt", dist), "utf8");
  assert.match(robots, /User-agent: \*/);
  assert.match(robots, /^Allow: \/$/m);
  assert.match(robots, new RegExp(`Sitemap: ${SITE_URL}/sitemap\\.xml`));

  // Blocking these would stop Google rendering the page as a visitor sees it.
  for (const asset of ["/assets", "/fonts", ".css", ".js", ".svg"]) {
    assert.ok(!robots.includes(`Disallow: ${asset}`), `robots.txt must not block ${asset}`);
  }
});

test("security.txt is present and has a future expiry", async () => {
  const txt = await readFile(new URL(".well-known/security.txt", dist), "utf8");
  assert.match(txt, /^Contact: mailto:\S+@\S+$/m);
  const expires = txt.match(/^Expires: (\S+)$/m)?.[1];
  assert.ok(new Date(expires) > new Date(), "security.txt has expired");
});

/* ─── Internal links and images ────────────────────────────────────────── */

test("no internal link points at a page that was not built", async () => {
  const built = new Set(["/"]);
  for (const file of await htmlFiles()) {
    if (file === "404.html") continue;
    built.add(file === "index.html" ? "/" : `/${file.replace(/\/index\.html$/, "")}`);
  }
  const extras = new Set(["/robots.txt", "/sitemap.xml", "/.well-known/security.txt", "/favicon.svg", "/apple-touch-icon.png"]);

  for (const file of await htmlFiles()) {
    const html = await read(file);
    for (const [, href] of html.matchAll(/href="(\/[^"]*)"/g)) {
      const [pathOnly] = href.split("#");
      if (pathOnly === "") continue;
      if (extras.has(pathOnly)) continue;
      if (pathOnly.startsWith("/assets/") || pathOnly.startsWith("/fonts/")) continue;
      assert.ok(built.has(pathOnly), `${file} links to ${pathOnly}, which was not built`);
    }
  }
});

test("every image has alt text and explicit dimensions", async () => {
  for (const file of await htmlFiles()) {
    const html = await read(file);
    for (const [tag] of html.matchAll(/<img\b[^>]*>/g)) {
      assert.match(tag, /\salt="/, `image without alt in ${file}: ${tag}`);
      assert.match(tag, /\swidth="\d+"/, `image without width in ${file}: ${tag}`);
      assert.match(tag, /\sheight="\d+"/, `image without height in ${file}: ${tag}`);
    }
  }
});

test("the hero image is eager with high priority, others lazy", async () => {
  const home = await read("index.html");
  const hero = home.match(/<img[^>]*class="hero-image"[^>]*>/)?.[0];
  assert.ok(hero, "hero image not found");
  assert.match(hero, /fetchpriority="high"/i, "hero must be prioritised — it is the LCP element");
  assert.ok(!/loading="lazy"/.test(hero), "the LCP image must never be lazy-loaded");

  const belief = home.match(/<img[^>]*class="thinking-object"[^>]*>/)?.[0];
  assert.match(belief, /loading="lazy"/, "below-fold images should be lazy");
});

test("no anchor uses vague link text", async () => {
  for (const file of await htmlFiles()) {
    const html = await read(file);
    for (const [, inner] of html.matchAll(/<a\b[^>]*>(.*?)<\/a>/gs)) {
      const text = inner.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
      assert.ok(
        !["click here", "read more", "learn more", "here", "more"].includes(text),
        `vague link text "${text}" in ${file}`,
      );
    }
  }
});
