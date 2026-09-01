/**
 * Vroe Labs — Cloudflare Worker
 *
 * Serves the prerendered site from the ASSETS binding and exposes three small
 * endpoints:
 *
 *   GET  /api/health     — binding readiness (booleans only, never values)
 *   GET  /api/config     — client-safe config (the public Turnstile site key)
 *   POST /api/subscribe  — early-access signup
 *   POST /api/csp-report — CSP violation reports, logged and discarded
 *
 * Every response, including assets and errors, carries the security headers in
 * SECURITY_HEADERS below. They are applied here rather than in a _headers file
 * so they are unit-testable — see tests/security.test.mjs.
 *
 * Subscribe pipeline, in order (each step is cheap before the expensive one):
 *   1. Same-origin check + honeypot        — rejects naive bots for free
 *   2. Per-IP rate limit via Workers KV
 *   3. Cloudflare Turnstile verification
 *   4. Store in SUBSCRIBERS KV, keyed by a SHA-256 of the address
 *
 * The email address is never written to a log line. See docs/04-security.md.
 */

import { CSP_REPORT_PATH, withSecurity } from "./headers.js";

/**
 * @typedef {object} Env
 * @property {Fetcher} ASSETS Prerendered site from dist/client
 * @property {KVNamespace} RATE_LIMIT Per-IP throttle for /api/subscribe
 * @property {KVNamespace} SUBSCRIBERS Stored signups
 * @property {string} [TURNSTILE_SECRET_KEY] Enables server-side Turnstile verification
 * @property {string} [TURNSTILE_SITE_KEY] Client-safe key, served from /api/config
 * @property {string} [CANONICAL_HOST] Production hostname; other hosts are redirected to it
 */

const SUBSCRIBE_PATH = "/api/subscribe";
const HEALTH_PATH = "/api/health";
const CONFIG_PATH = "/api/config";

const MAX_BODY_BYTES = 4 * 1024;
const MAX_EMAIL_LENGTH = 254;
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_S = 600;
/** Mirrors RETENTION_DAYS in src/content/legal.js. Both must change together. */
const RETENTION_DAYS = 730;

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

export default {
  /**
   * @param {Request} request
   * @param {Env} env
   * @returns {Promise<Response>}
   */
  async fetch(request, env) {
    const url = new URL(request.url);

    // Canonical host. Anything that is not the production hostname is
    // redirected to it, which folds www -> apex and stops the Host header from
    // being reflected anywhere. The target host comes from configuration, never
    // from the request, so this cannot become an open redirect.
    const canonical = canonicalRedirect(request, url, env);
    if (canonical) return canonical;

    switch (url.pathname) {
      case SUBSCRIBE_PATH:
        return withSecurity(await handleSubscribe(request, env, url));
      case HEALTH_PATH:
        return withSecurity(handleHealth(env));
      case CONFIG_PATH:
        return withSecurity(handleConfig(request, env));
      case CSP_REPORT_PATH:
        return withSecurity(await handleCspReport(request));
      default:
        return withSecurity(await serveAsset(request, env, url));
    }
  },
};

/* ─── Asset serving ────────────────────────────────────────────────────── */

/**
 * Serve a static asset, falling back to the prerendered 404 page.
 *
 * Only GET/HEAD requests for documents get the 404 page; anything else keeps
 * its own status, so a POST to a missing path stays a 404 rather than being
 * answered with a page that looks like success.
 *
 * @param {Request} request
 * @param {Env} env
 * @param {URL} url
 * @returns {Promise<Response>}
 */
async function serveAsset(request, env, url) {
  // /api/* is ours. A miss must never fall through to the HTML shell, or a
  // typo'd endpoint would answer 200 with a page instead of 404 with JSON.
  if (url.pathname.startsWith("/api/")) {
    return json(404, { error: "Not found" });
  }

  const response = await env.ASSETS.fetch(request);

  const wantsHtml = request.headers.get("accept")?.includes("text/html");
  const isRead = request.method === "GET" || request.method === "HEAD";

  if (response.status === 404 && wantsHtml && isRead) {
    const notFound = new URL(url);
    notFound.pathname = "/404.html";
    notFound.search = "";
    const page = await env.ASSETS.fetch(new Request(notFound, { method: "GET" }));
    return new Response(page.body, {
      status: 404,
      headers: withCache(new Headers(page.headers), "/404.html"),
    });
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: withCache(new Headers(response.headers), url.pathname),
  });
}

/**
 * Caching policy.
 *
 * Content-hashed assets and fonts never change under a given name, so they are
 * cached for a year and marked immutable. HTML is revalidated on every view so
 * a deploy is visible immediately rather than after a cache expires.
 *
 * @param {Headers} headers
 * @param {string} pathname
 * @returns {Headers}
 */
function withCache(headers, pathname) {
  const hashed = /\/assets\/.+-[A-Za-z0-9_-]{8,}\.(js|css)$/.test(pathname);
  const font = pathname.startsWith("/fonts/");
  const media = /\.(avif|webp|jpg|jpeg|png|svg)$/.test(pathname);

  if (hashed || font) {
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
  } else if (media) {
    headers.set("Cache-Control", "public, max-age=604800");
  } else {
    headers.set("Cache-Control", "public, max-age=0, must-revalidate");
  }
  return headers;
}

/**
 * Redirect to the canonical origin: https, on CANONICAL_HOST.
 *
 * Covers two cases in one place:
 *   - a plain-HTTP request  -> the https equivalent
 *   - any other hostname    -> CANONICAL_HOST (this folds www into the apex)
 *
 * Doing the HTTPS upgrade here rather than relying solely on Cloudflare's
 * "Always Use HTTPS" zone setting means the behaviour lives with the code, is
 * unit-tested, and survives a zone being reconfigured. HSTS covers repeat
 * visitors; this covers the first one.
 *
 * The target host is read from configuration and never from the request, so
 * this cannot be turned into an open redirect by spoofing the Host header.
 *
 * Returns null when the request is already canonical.
 *
 * @param {Request} request
 * @param {URL} url
 * @param {Env} env
 * @returns {Response | null}
 */
function canonicalRedirect(request, url, env) {
  const isLocal =
    url.hostname === "localhost" ||
    url.hostname === "127.0.0.1" ||
    url.hostname.endsWith(".workers.dev");

  // Previews and local development are left alone so they stay usable over http.
  if (isLocal) return null;

  const canonical = env.CANONICAL_HOST;
  const wrongHost = Boolean(canonical) && url.hostname !== canonical;
  const insecure = url.protocol === "http:";

  if (!wrongHost && !insecure) return null;

  const target = new URL(url);
  target.protocol = "https:";
  target.port = "";
  if (wrongHost) target.hostname = canonical;

  return withSecurity(
    new Response(null, {
      status: 301,
      headers: { Location: target.toString(), "Cache-Control": "no-store" },
    }),
  );
}

/* ─── Helpers ──────────────────────────────────────────────────────────── */

/**
 * @param {number} status
 * @param {Record<string, unknown>} body
 * @param {Record<string, string>} [extra]
 * @returns {Response}
 */
function json(status, body, extra) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...JSON_HEADERS, ...extra },
  });
}

/** @param {string} origin @param {URL} url @returns {boolean} */
function isSameOrigin(origin, url) {
  try {
    return new URL(origin).origin === url.origin;
  } catch {
    return false;
  }
}

/** Lowercased SHA-256 hex of a string. Used to key subscribers. */
async function sha256(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/* ─── Endpoints ────────────────────────────────────────────────────────── */

/**
 * Reports whether each binding is configured. Returns booleans only — never a
 * secret value and never a secret's contents.
 *
 * @param {Env} env
 * @returns {Response}
 */
export function handleHealth(env) {
  const configured = {
    assets: typeof env.ASSETS?.fetch === "function",
    rate_limit_kv: typeof env.RATE_LIMIT?.get === "function",
    subscribers_kv: typeof env.SUBSCRIBERS?.put === "function",
    turnstile: Boolean(env.TURNSTILE_SECRET_KEY) && Boolean(env.TURNSTILE_SITE_KEY),
  };

  // Turnstile is hardening, not a dependency: the form works without it because
  // the honeypot and the rate limit still apply.
  const ready = configured.assets && configured.rate_limit_kv && configured.subscribers_kv;
  return json(ready ? 200 : 503, { ready, configured });
}

/**
 * Client-safe configuration. The Turnstile *site* key is public by design —
 * it appears in the page source of every site using Turnstile. Serving it here
 * rather than baking it into the HTML keeps environment-specific values out of
 * the prerendered pages.
 *
 * @param {Request} request
 * @param {Env} env
 * @returns {Response}
 */
export function handleConfig(request, env) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return json(405, { error: "Method not allowed" }, { Allow: "GET, HEAD" });
  }
  return json(
    200,
    { turnstile_site_key: env.TURNSTILE_SITE_KEY ?? null },
    { "Cache-Control": "public, max-age=300" },
  );
}

/**
 * CSP violation sink.
 *
 * Reports are logged (Workers Logs) and discarded. Only the fields needed to
 * act on a violation are kept — no full report body, because a report can echo
 * page URLs and we have no need to retain them.
 *
 * @param {Request} request
 * @returns {Promise<Response>}
 */
export async function handleCspReport(request) {
  if (request.method !== "POST") {
    return json(405, { error: "Method not allowed" }, { Allow: "POST" });
  }
  try {
    const body = await request.json();
    const report = body?.["csp-report"] ?? body ?? {};
    console.warn("CSP violation", {
      directive: String(report["violated-directive"] ?? report.effectiveDirective ?? "unknown").slice(0, 120),
      blocked: String(report["blocked-uri"] ?? report.blockedURL ?? "unknown").slice(0, 200),
      document: String(report["document-uri"] ?? report.documentURL ?? "unknown").slice(0, 200),
    });
  } catch {
    // A malformed report is not worth an error response.
  }
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}

/**
 * Early-access signup.
 *
 * @param {Request} request
 * @param {Env} env
 * @param {URL} url
 * @returns {Promise<Response>}
 */
export async function handleSubscribe(request, env, url) {
  if (request.method !== "POST") {
    return json(405, { error: "Method not allowed" }, { Allow: "POST" });
  }

  // Browsers always send Origin on a cross-site POST, so a mismatch means the
  // submission did not come from this site.
  const origin = request.headers.get("origin");
  if (origin && !isSameOrigin(origin, url)) {
    return json(403, { error: "Cross-origin submissions are not accepted" });
  }

  if (!request.headers.get("content-type")?.includes("application/json")) {
    return json(415, { error: "Expected application/json" });
  }

  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) {
    return json(413, { error: "Request too large" });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json(400, { error: "Malformed request body" });
  }
  if (typeof payload !== "object" || payload === null) {
    return json(400, { error: "Malformed request body" });
  }

  // Honeypot. A real browser never fills this in. Answer 200 so a bot cannot
  // tell the difference between being caught and succeeding.
  if (typeof payload.company === "string" && payload.company.trim() !== "") {
    return json(200, { ok: true, message: "You're on the list. We'll be in touch." });
  }

  const clientIp = request.headers.get("cf-connecting-ip") ?? "unknown";
  if (await isRateLimited(env, clientIp)) {
    return json(429, { error: "Too many attempts. Please try again later." }, { "Retry-After": String(RATE_LIMIT_WINDOW_S) });
  }

  if (env.TURNSTILE_SECRET_KEY) {
    const token = typeof payload.cf_turnstile_response === "string" ? payload.cf_turnstile_response : "";
    if (!(await verifyTurnstile(env.TURNSTILE_SECRET_KEY, token, clientIp))) {
      return json(403, { error: "Bot check failed. Please retry the verification." });
    }
  }

  const email = typeof payload.email === "string" ? payload.email.trim().slice(0, MAX_EMAIL_LENGTH) : "";
  if (!email) return json(422, { error: "Please enter your email address" });
  if (!EMAIL_PATTERN.test(email)) return json(422, { error: "Please enter a valid email address" });

  // Consent must be an affirmative act. Absent or false is a hard failure —
  // never inferred from the fact that the form was submitted.
  if (payload.consent !== true) {
    return json(422, { error: "Please confirm you are happy for us to store your email address" });
  }

  const stored = await storeSubscriber(env, email, request);
  if (!stored) {
    return json(503, { error: "We could not save your details. Please email us directly." });
  }

  return json(200, { ok: true, message: "You're on the list. We'll be in touch." });
}

/**
 * Per-IP throttle.
 *
 * Fails OPEN: if KV is unavailable the request is allowed through rather than
 * rejected, because a storage blip should not take the signup form offline.
 * Turnstile and the honeypot still stand in that case.
 *
 * @param {Env} env
 * @param {string} clientIp
 * @returns {Promise<boolean>}
 */
async function isRateLimited(env, clientIp) {
  if (!env.RATE_LIMIT) return false;
  const key = `subscribe:${clientIp}`;
  try {
    const raw = await env.RATE_LIMIT.get(key);
    const used = Number.parseInt(raw ?? "0", 10);
    const count = Number.isFinite(used) ? used : 0;
    if (count >= RATE_LIMIT_MAX) return true;
    await env.RATE_LIMIT.put(key, String(count + 1), { expirationTtl: RATE_LIMIT_WINDOW_S });
    return false;
  } catch (error) {
    console.error("Rate limit check failed:", error?.message ?? "unknown");
    return false;
  }
}

/**
 * @param {string} secret
 * @param {string} token
 * @param {string} clientIp
 * @returns {Promise<boolean>}
 */
async function verifyTurnstile(secret, token, clientIp) {
  if (!token) return false;

  const form = new URLSearchParams({ secret, response: token });
  if (clientIp !== "unknown") form.set("remoteip", clientIp);

  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
    });
    if (!response.ok) {
      console.error("Turnstile siteverify responded", response.status);
      return false;
    }
    const result = await response.json();
    return result.success === true;
  } catch (error) {
    console.error("Turnstile verification error:", error?.message ?? "unknown");
    return false;
  }
}

/**
 * Store one subscriber.
 *
 * Keyed by a SHA-256 of the lowercased address, which deduplicates repeat
 * signups and keeps addresses out of key names — a KV key listing therefore
 * reveals nothing about who has subscribed.
 *
 * Only four fields are kept, matching the privacy policy exactly: the address,
 * when it was given, the country the request came from, and the consent flag.
 * No IP address, no user agent, no referrer.
 *
 * @param {Env} env
 * @param {string} email
 * @param {Request} request
 * @returns {Promise<boolean>}
 */
async function storeSubscriber(env, email, request) {
  if (!env.SUBSCRIBERS) return false;

  const key = `sub:${await sha256(email.toLowerCase())}`;
  const record = {
    email,
    subscribed_at: new Date().toISOString(),
    country: request.cf?.country ?? null,
    consent: true,
  };

  try {
    await env.SUBSCRIBERS.put(key, JSON.stringify(record), {
      expirationTtl: RETENTION_DAYS * 24 * 60 * 60,
      metadata: { subscribed_at: record.subscribed_at },
    });
    // Deliberately logs no address. A count is all that is useful here, and an
    // address in a log line would outlive the deletion request that removes it
    // from KV.
    console.log("New subscriber stored");
    return true;
  } catch (error) {
    console.error("Subscriber store failed:", error?.message ?? "unknown");
    return false;
  }
}
