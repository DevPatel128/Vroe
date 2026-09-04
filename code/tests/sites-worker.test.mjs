/**
 * Worker behaviour — asset serving, routing and the 404 contract.
 *
 * These carry over from the prototype's hosting tests. The one change is the
 * final test: it used to assert the OpenAI Sites packaging output
 * (dist/.openai/hosting.json), which has no meaning on Cloudflare. It now
 * asserts the Cloudflare build outputs instead.
 */

import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import test from "node:test";
import worker from "../worker/index.js";
import { baseEnv, get, post } from "./helpers.mjs";

test("serves existing static assets without a fallback", async () => {
  const env = baseEnv();
  const response = await worker.fetch(get("/assets/styles-abc12345.css"), env);

  assert.equal(response.status, 200);
  assert.deepEqual(env.ASSETS.calls, ["/assets/styles-abc12345.css"]);
});

test("falls back to the 404 page for an unknown document route", async () => {
  const env = baseEnv();
  const response = await worker.fetch(get("/flow/step-two?source=share"), env);

  assert.equal(response.status, 404, "the fallback must keep a 404 status");
  assert.deepEqual(env.ASSETS.calls, ["/flow/step-two?source=share", "/404.html"]);
  assert.match(await response.text(), /not found/);
});

test("does not turn missing API or write requests into the app shell", async () => {
  for (const request of [
    new Request("https://vroelabs.com/api/missing", { headers: { accept: "application/json" } }),
    post("/flow", {}, { Accept: "text/html" }),
  ]) {
    const env = baseEnv();
    const response = await worker.fetch(request, env);
    assert.equal(response.status, 404);
    assert.ok(!env.ASSETS.calls.includes("/404.html"), "must not serve the HTML shell");
  }
});

test("hashed assets and fonts are cached immutably, HTML is revalidated", async () => {
  const env = baseEnv();

  const css = await worker.fetch(get("/assets/styles-abc12345.css"), env);
  assert.match(css.headers.get("cache-control"), /immutable/);

  const font = await worker.fetch(get("/fonts/dm-sans-latin-400-normal.woff2"), env);
  assert.match(font.headers.get("cache-control"), /immutable/);

  const html = await worker.fetch(get("/index.html"), env);
  assert.match(html.headers.get("cache-control"), /must-revalidate/);
});

test("emits the files Cloudflare needs to serve the site", async () => {
  for (const file of [
    "../dist/client/index.html",
    "../dist/client/404.html",
    "../dist/client/trove/index.html",
    "../dist/client/notes/trove/index.html",
    "../dist/client/robots.txt",
    "../dist/client/sitemap.xml",
    "../dist/client/.well-known/security.txt",
  ]) {
    await access(new URL(file, import.meta.url));
  }
});
