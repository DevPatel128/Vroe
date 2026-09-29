/**
 * Security tests.
 *
 * These encode the security decisions so a later refactor cannot quietly undo
 * one. Each assertion maps to a requirement in docs/05_ENGINEERING/SECURITY/SECURITY.md — if a test
 * here starts failing, the fix is almost never to relax the test.
 */

import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import worker from "../worker/index.js";
import { CSP } from "../worker/headers.js";
import { baseEnv, edge, fakeKV, get, post } from "./helpers.mjs";

const distClient = new URL("../dist/client/", import.meta.url);

/* ─── Headers ──────────────────────────────────────────────────────────── */

const REQUIRED_HEADERS = {
  "content-security-policy": /default-src 'none'/,
  "strict-transport-security": /max-age=31536000/,
  "x-content-type-options": /^nosniff$/,
  "x-frame-options": /^DENY$/,
  "referrer-policy": /^strict-origin-when-cross-origin$/,
  "permissions-policy": /geolocation=\(\)/,
  "cross-origin-opener-policy": /^same-origin$/,
  "cross-origin-resource-policy": /^same-origin$/,
};

test("every response carries the full security header set", async () => {
  const responses = [
    await worker.fetch(get("/"), baseEnv()),
    await worker.fetch(get("/assets/styles-abc12345.css"), baseEnv()),
    await worker.fetch(get("/does-not-exist"), baseEnv()),
    await worker.fetch(new Request("https://vroelabs.com/api/health"), baseEnv()),
  ];

  for (const response of responses) {
    for (const [header, pattern] of Object.entries(REQUIRED_HEADERS)) {
      const value = response.headers.get(header);
      assert.ok(value, `missing ${header} on a ${response.status} response`);
      assert.match(value, pattern, `unexpected ${header}`);
    }
  }
});

test("the CSP contains no unsafe directive and no wildcard source", () => {
  assert.ok(!CSP.includes("unsafe-inline"), "unsafe-inline must never appear");
  assert.ok(!CSP.includes("unsafe-eval"), "unsafe-eval must never appear");
  assert.ok(!/(^|\s)\*/.test(CSP), "no wildcard sources");
  assert.match(CSP, /default-src 'none'/);
  assert.match(CSP, /frame-ancestors 'none'/);
  assert.match(CSP, /object-src 'none'/);
  assert.match(CSP, /base-uri 'self'/);
  assert.match(CSP, /form-action 'self'/);
  // style-src and font-src must stay self-only: that is what self-hosting the
  // fonts bought, and re-adding a Google origin would silently give it back.
  assert.match(CSP, /style-src 'self'(;|$)/);
  assert.match(CSP, /font-src 'self'(;|$)/);
});

test("obsolete headers are not sent", async () => {
  const response = await worker.fetch(get("/"), baseEnv());
  assert.equal(response.headers.get("x-xss-protection"), null);
  assert.equal(response.headers.get("expect-ct"), null);
});

test("HSTS does not claim preload", async () => {
  // preload is effectively irreversible and trove.vroelabs.com is not yet live.
  const response = await worker.fetch(get("/"), baseEnv());
  assert.ok(!response.headers.get("strict-transport-security").includes("preload"));
});

/* ─── Canonical host / open redirect ───────────────────────────────────── */

test("www redirects to the apex, and only to the configured host", async () => {
  const env = baseEnv({ CANONICAL_HOST: "vroelabs.com" });
  const response = await worker.fetch(
    edge("https://www.vroelabs.com/trove?ref=x"),
    env,
  );
  assert.equal(response.status, 301);
  assert.equal(response.headers.get("location"), "https://vroelabs.com/trove?ref=x");
});

test("a spoofed Host cannot produce an open redirect", async () => {
  const env = baseEnv({ CANONICAL_HOST: "vroelabs.com" });
  const response = await worker.fetch(
    edge("https://evil.example.com/path"),
    env,
  );
  // Redirects to OUR host, never to the attacker's.
  assert.equal(new URL(response.headers.get("location")).hostname, "vroelabs.com");
});

test("plain http is redirected to https", async () => {
  const env = baseEnv({ CANONICAL_HOST: "vroelabs.com" });
  const response = await worker.fetch(
    edge("http://vroelabs.com/trove"),
    env,
  );
  assert.equal(response.status, 301);
  assert.equal(response.headers.get("location"), "https://vroelabs.com/trove");
});

test("http on the wrong host fixes both scheme and host in one hop", async () => {
  const env = baseEnv({ CANONICAL_HOST: "vroelabs.com" });
  const response = await worker.fetch(
    edge("http://www.vroelabs.com/vero"),
    env,
  );
  assert.equal(response.status, 301);
  assert.equal(response.headers.get("location"), "https://vroelabs.com/vero");
});

test("workers.dev previews are not redirected away", async () => {
  const env = baseEnv({ CANONICAL_HOST: "vroelabs.com" });
  const response = await worker.fetch(
    edge("https://vroe-labs.example.workers.dev/"),
    env,
  );
  assert.notEqual(response.status, 301);
});

test("a local wrangler dev request is never redirected", async () => {
  // Regression: `wrangler dev` rewrites the request URL and Host to the custom
  // domain in wrangler.jsonc, so the worker saw http://vroelabs.com/ locally and
  // 301'd every request to a Location wrangler rewrote straight back — an
  // infinite loop that made `npm run preview` serve nothing but redirects.
  // Absence of CF-Ray is what marks a request as not-at-the-edge.
  const env = baseEnv({ CANONICAL_HOST: "vroelabs.com" });

  for (const url of ["http://vroelabs.com/", "http://vroelabs.com/trove", "http://localhost:8788/"]) {
    const response = await worker.fetch(
      new Request(url, { headers: { Accept: "text/html" } }),
      env,
    );
    assert.notEqual(response.status, 301, `${url} must not redirect without CF-Ray`);
  }
});

test("www still folds to the apex even without CF-Ray", async () => {
  // Only the scheme upgrade is gated on being at the edge. The canonical-host
  // redirect must not be, or a change in edge behaviour would silently allow the
  // site to be served from two hostnames.
  const env = baseEnv({ CANONICAL_HOST: "vroelabs.com" });
  const response = await worker.fetch(
    new Request("https://www.vroelabs.com/trove", { headers: { Accept: "text/html" } }),
    env,
  );
  assert.equal(response.status, 301);
  assert.equal(response.headers.get("location"), "https://vroelabs.com/trove");
});

test("the edge still upgrades and canonicalises once CF-Ray is present", async () => {
  // The guard above must not become a way to switch the redirect off entirely.
  const env = baseEnv({ CANONICAL_HOST: "vroelabs.com" });
  const response = await worker.fetch(edge("http://www.vroelabs.com/notes/trove"), env);

  assert.equal(response.status, 301);
  assert.equal(response.headers.get("location"), "https://vroelabs.com/notes/trove");
});

/* ─── Subscribe endpoint ───────────────────────────────────────────────── */

const VALID = { email: "reader@example.com", consent: true };

test("stores a valid submission and keeps the address out of the key", async () => {
  const env = baseEnv();
  const response = await worker.fetch(post("/api/subscribe", VALID), env);

  assert.equal(response.status, 200);
  const keys = [...env.SUBSCRIBERS.store.keys()];
  assert.equal(keys.length, 1);
  assert.match(keys[0], /^sub:[0-9a-f]{64}$/, "key must be a SHA-256, not the address");
  assert.ok(!keys[0].includes("reader@example.com"));

  const record = JSON.parse(env.SUBSCRIBERS.store.get(keys[0]));
  assert.equal(record.email, "reader@example.com");
  assert.equal(record.consent, true);
  // Data minimisation: exactly the four fields the privacy policy promises.
  assert.deepEqual(Object.keys(record).sort(), ["consent", "country", "email", "subscribed_at"]);
});

test("the same address twice does not create a second record", async () => {
  const env = baseEnv();
  await worker.fetch(post("/api/subscribe", VALID), env);
  await worker.fetch(post("/api/subscribe", { ...VALID, email: "READER@example.com " }), env);
  assert.equal(env.SUBSCRIBERS.store.size, 1, "hash key should deduplicate");
});

test("rejects a cross-origin submission", async () => {
  const env = baseEnv();
  const response = await worker.fetch(
    post("/api/subscribe", VALID, { Origin: "https://evil.example.com" }),
    env,
  );
  assert.equal(response.status, 403);
  assert.equal(env.SUBSCRIBERS.store.size, 0);
});

test("rejects a non-JSON content type", async () => {
  const env = baseEnv();
  const response = await worker.fetch(
    post("/api/subscribe", VALID, { "Content-Type": "text/plain" }),
    env,
  );
  assert.equal(response.status, 415);
});

test("rejects an oversized body", async () => {
  const env = baseEnv();
  const response = await worker.fetch(
    post("/api/subscribe", VALID, { "Content-Length": String(9999) }),
    env,
  );
  assert.equal(response.status, 413);
});

test("honeypot returns 200 but stores nothing", async () => {
  const env = baseEnv();
  const response = await worker.fetch(
    post("/api/subscribe", { ...VALID, company: "Acme Inc" }),
    env,
  );
  // 200 so a bot cannot distinguish being caught from succeeding.
  assert.equal(response.status, 200);
  assert.equal(env.SUBSCRIBERS.store.size, 0);
});

test("rejects an invalid address", async () => {
  for (const email of ["not-an-email", "a@b", "", "  "]) {
    const env = baseEnv();
    const response = await worker.fetch(post("/api/subscribe", { email, consent: true }), env);
    assert.equal(response.status, 422, `should reject ${JSON.stringify(email)}`);
    assert.equal(env.SUBSCRIBERS.store.size, 0);
  }
});

test("consent must be given explicitly", async () => {
  for (const consent of [undefined, false, "yes", 1]) {
    const env = baseEnv();
    const response = await worker.fetch(
      post("/api/subscribe", { email: "reader@example.com", consent }),
      env,
    );
    assert.equal(response.status, 422, `consent=${JSON.stringify(consent)} must not count`);
    assert.equal(env.SUBSCRIBERS.store.size, 0);
  }
});

test("rate limits after five attempts from one IP", async () => {
  const env = baseEnv();
  for (let i = 0; i < 5; i += 1) {
    const ok = await worker.fetch(post("/api/subscribe", { ...VALID, email: `r${i}@example.com` }), env);
    assert.equal(ok.status, 200, `attempt ${i + 1} should succeed`);
  }
  const blocked = await worker.fetch(post("/api/subscribe", { ...VALID, email: "r6@example.com" }), env);
  assert.equal(blocked.status, 429);
  assert.ok(blocked.headers.get("retry-after"));
});

test("rejects when Turnstile is configured but the token is missing", async () => {
  const env = baseEnv({ TURNSTILE_SECRET_KEY: "secret" });
  const response = await worker.fetch(post("/api/subscribe", VALID), env);
  assert.equal(response.status, 403);
  assert.equal(env.SUBSCRIBERS.store.size, 0);
});

test("GET on the subscribe endpoint is not allowed", async () => {
  const response = await worker.fetch(new Request("https://vroelabs.com/api/subscribe"), baseEnv());
  assert.equal(response.status, 405);
});

/* ─── Information disclosure ───────────────────────────────────────────── */

test("health reports booleans only, never a secret value", async () => {
  const env = baseEnv({ TURNSTILE_SECRET_KEY: "super-secret-value", TURNSTILE_SITE_KEY: "site" }); // allowlist secret: fixture, not a real key
  const response = await worker.fetch(new Request("https://vroelabs.com/api/health"), env);
  const text = await response.text();

  assert.ok(!text.includes("super-secret-value"), "must never echo a secret");
  for (const value of Object.values(JSON.parse(text).configured)) {
    assert.equal(typeof value, "boolean");
  }
});

test("config exposes only the public Turnstile site key", async () => {
  const env = baseEnv({ TURNSTILE_SECRET_KEY: "super-secret-value", TURNSTILE_SITE_KEY: "0xPUBLIC" }); // allowlist secret: fixture, not a real key
  const response = await worker.fetch(new Request("https://vroelabs.com/api/config"), env);
  const body = await response.json();

  assert.deepEqual(Object.keys(body), ["turnstile_site_key"]);
  assert.equal(body.turnstile_site_key, "0xPUBLIC");
});

test("a KV failure never leaks an address into the response", async () => {
  const env = baseEnv({
    SUBSCRIBERS: { put: async () => { throw new Error("kv down for reader@example.com"); } },
  });
  const response = await worker.fetch(post("/api/subscribe", VALID), env);
  const text = await response.text();

  assert.equal(response.status, 503);
  assert.ok(!text.includes("reader@example.com"));
  assert.ok(!text.includes("kv down"), "internal error text must not reach the client");
});

/* ─── Build output ─────────────────────────────────────────────────────── */

test("the published build contains no secrets, source maps or dotfiles", async () => {
  const files = [];
  const walk = async (dir, prefix = "") => {
    for (const entry of await readdir(new URL(dir, distClient), { withFileTypes: true })) {
      const rel = `${prefix}${entry.name}`;
      if (entry.isDirectory()) await walk(`${dir}${entry.name}/`, `${rel}/`);
      else files.push(rel);
    }
  };
  await walk("");

  assert.ok(!files.some((f) => f.endsWith(".map")), "no source maps");
  assert.ok(!files.some((f) => f === ".env" || f.startsWith(".env")), "no .env");
  assert.ok(!files.some((f) => f.startsWith(".git")), "no git metadata");
  assert.ok(!files.some((f) => f.includes("dev.vars")), "no .dev.vars");

  // Build metadata must not ship. The Vite manifest maps every source path to
  // its hashed output name; publishing it hands over the source layout and
  // there is no reason for a visitor to have it. /.well-known is the one
  // dotted path that is meant to be public.
  const dotted = files.filter((f) => f.startsWith(".") && !f.startsWith(".well-known/"));
  assert.deepEqual(dotted, [], `unexpected dotfiles published: ${dotted.join(", ")}`);

  // No secret may appear in any published byte.
  //
  // The real secret is read from .dev.vars at test time rather than written
  // here — hard-coding it would put a fragment of a live credential into the
  // repository, which is the exact thing this test exists to prevent. When
  // .dev.vars is absent (CI), the pattern check below still applies.
  let liveSecret = null;
  try {
    const devVars = await readFile(new URL("../.dev.vars", distClient), "utf8");
    liveSecret = devVars.match(/TURNSTILE_SECRET_KEY\s*=\s*"?([^"\n]+)"?/)?.[1] ?? null;
  } catch {
    // Not present in CI. Fine.
  }

  for (const file of files.filter((f) => /\.(html|js|css|txt|xml|json)$/.test(f))) {
    const body = await readFile(new URL(file, distClient), "utf8");

    // Turnstile SECRET keys start 0x4 and are far longer than a site key; site
    // keys (which are public and DO appear in the page) start 0x4AAAAAAA-style
    // and are ~22 chars. Anything matching the secret shape is a leak.
    assert.ok(
      !/\b0x[A-Za-z0-9_-]{30,}\b/.test(body),
      `something shaped like a Turnstile secret appears in ${file}`,
    );
    assert.ok(!/TURNSTILE_SECRET/.test(body), `secret name referenced in ${file}`);
    assert.ok(!/CLOUDFLARE_API_TOKEN/.test(body), `CI token name referenced in ${file}`);

    if (liveSecret) {
      assert.ok(!body.includes(liveSecret), `the live Turnstile secret leaked into ${file}`);
    }
  }
});

test("every external link is rel=noopener noreferrer", async () => {
  const walk = async (dir, prefix = "") => {
    const out = [];
    for (const entry of await readdir(new URL(dir, distClient), { withFileTypes: true })) {
      const rel = `${prefix}${entry.name}`;
      if (entry.isDirectory()) out.push(...(await walk(`${dir}${entry.name}/`, `${rel}/`)));
      else if (rel.endsWith(".html")) out.push(rel);
    }
    return out;
  };

  for (const file of await walk("")) {
    const html = await readFile(new URL(file, distClient), "utf8");
    for (const [tag] of html.matchAll(/<a\b[^>]*href="https?:\/\/[^"]*"[^>]*>/g)) {
      assert.match(tag, /rel="[^"]*noopener[^"]*"/, `missing noopener in ${file}: ${tag}`);
      assert.match(tag, /rel="[^"]*noreferrer[^"]*"/, `missing noreferrer in ${file}: ${tag}`);
    }
  }
});

test("no inline event handlers or javascript: URLs in the output", async () => {
  const walk = async (dir, prefix = "") => {
    const out = [];
    for (const entry of await readdir(new URL(dir, distClient), { withFileTypes: true })) {
      const rel = `${prefix}${entry.name}`;
      if (entry.isDirectory()) out.push(...(await walk(`${dir}${entry.name}/`, `${rel}/`)));
      else if (rel.endsWith(".html")) out.push(rel);
    }
    return out;
  };

  for (const file of await walk("")) {
    const html = await readFile(new URL(file, distClient), "utf8");
    // Inline handlers would require 'unsafe-inline' in script-src.
    assert.ok(!/\son(click|load|error|mouseover|focus|submit)=/i.test(html), `inline handler in ${file}`);
    assert.ok(!/href="javascript:/i.test(html), `javascript: URL in ${file}`);

    // Inline style attributes are blocked outright by `style-src 'self'`, and
    // the browser silently drops the styling rather than failing loudly. Use a
    // class in src/styles/ instead — never relax the policy for a style="".
    assert.ok(!/\sstyle="/i.test(html), `inline style attribute in ${file} — use a CSS class`);
  }
});
