# Security audit

**Date:** 1 September 2026 · **Version:** 1.0.0 (initial launch)
**Auditor:** internal review during the build. Not an independent third-party assessment.

## Scope

`https://vroelabs.com`, `https://www.vroelabs.com`, and `/api/*` on those hosts.
Covers this repository's source, build pipeline, Cloudflare Worker, and
deployment configuration. Out of scope: Cloudflare's own infrastructure, GitHub,
and `trove.vroelabs.com` (a separate system).

## Architecture summary

Prerendered static HTML on Cloudflare Workers static assets. React is a
build-time template engine; no framework reaches the browser. One write endpoint
(`POST /api/subscribe`) stores an email address in Workers KV. No database, no
authentication, no sessions, no cookies set by us, no payments, no uploads, no
user-generated content.

## The security boundary, stated honestly

> The Vroe Labs website is a static marketing site with one narrow write
> endpoint. Its security responsibilities are secure delivery, browser
> hardening, dependency integrity, deployment access control, privacy
> protection, and preventing unsafe future expansion.

This site is **not** described as "bank-grade", "fully secure" or "unhackable".
The limitations section below is not boilerplate.

## Threat model

Full table in [docs/04-security.md](docs/04-security.md). In summary:

**Live risks, and what addresses them:** XSS (no untrusted input rendered;
strict CSP as defence in depth) · clickjacking (`frame-ancestors 'none'`) · form
spam (honeypot → rate limit → Turnstile) · open redirect and Host header attacks
(canonical host from config, never from the request) · MIME confusion (`nosniff`)
· supply chain (`--ignore-scripts`, pinned versions, audit, SBOM) · secret
leakage (nothing secret committed; a test scans the build output) · privacy
leakage via logs (no address is ever logged).

**Not applicable while the site is static:** CSRF — there are no cookies or
sessions, so the same-origin check is the appropriate control and no token is
needed. Also: SQL injection, SSRF, IDOR, session fixation, privilege escalation.

**Must be closed before expanding:** see "Deferred risks" below.

## Controls actually implemented

### Headers — verified on every response type

| Header | Value |
| --- | --- |
| `Content-Security-Policy` | `default-src 'none'` + explicit allowances; no `unsafe-inline`, no `unsafe-eval`, no wildcard |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` (no `preload` — deliberate, ADR-004) |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | every feature denied except `fullscreen=(self)` |
| `Cross-Origin-Opener-Policy` | `same-origin` |
| `Cross-Origin-Resource-Policy` | `same-origin` |

Set in `worker/headers.js` and applied by `withSecurity()` to HTML, static assets
and error responses alike. `assets.run_worker_first: true` is what guarantees the
worker sees every request — without it Cloudflare serves assets directly and the
headers are absent from the HTML pages. That was found by inspecting the running
site, not by the tests (ADR-008).

Deliberately **not** sent: `X-XSS-Protection` (retired), `Expect-CT` (obsolete),
`Cross-Origin-Embedder-Policy` (`require-corp` would break the Turnstile iframe).

### Subscribe endpoint

Ordered so cheap rejects run first: method → same-origin → content-type →
content-length (4 KB) → honeypot → per-IP rate limit (5 / 10 min) → Turnstile →
email validation → explicit consent → store.

Turnstile runs **before** field validation, so an unverified client learns
nothing about which fields are wrong. The honeypot returns `200 {ok:true}` so a
bot cannot distinguish being caught from succeeding. The rate limiter **fails
open** — a KV outage allows the request rather than taking the form offline;
Turnstile and the honeypot still apply.

Consent must be exactly `true`; `undefined`, `false`, `"yes"` and `1` are all
rejected. It is never inferred from the act of submitting.

### Data minimisation

Key `sub:<sha256(lowercased email)>` — deduplicates signups and keeps addresses
out of key names, so a KV key listing reveals nothing. Value is exactly four
fields: `email`, `subscribed_at`, `country`, `consent`. No IP address, no user
agent, no referrer. TTL 730 days. Deletion on request.

There is **no admin endpoint**; export is a `wrangler kv` CLI call. Not having an
authenticated surface is simpler and strictly safer than having one.

### Supply chain and deployment

`npm ci --ignore-scripts` in CI · exact pinned versions (`save-exact=true`) ·
committed lockfile · `npm audit --audit-level=high` · CycloneDX SBOM per run ·
Dependabot weekly, reviewed not auto-merged · GitHub Actions pinned to commit
SHAs, not tags · `permissions: contents: read` · CI references no secrets, so
fork PRs are safe · no source maps published · scoped Cloudflare API token.

## Test results

`npm test` — **44 assertions, all passing** (1 September 2026).

| Suite | Count | Covers |
| --- | --- | --- |
| `tests/sites-worker.test.mjs` | 5 | Asset serving, 404 contract, no API fallback to the shell, cache policy |
| `tests/security.test.mjs` | 24 | Headers on every response type, CSP has no unsafe directive, no HSTS preload, no obsolete headers, www→apex, no open redirect from a spoofed Host, hashed subscriber keys, dedupe, cross-origin 403, wrong content-type 415, oversized 413, honeypot, invalid email 422, consent required, rate limit 429, Turnstile required, health leaks no secret, config exposes only the public key, KV errors leak no address, no secrets/source maps/dotfiles in the build, external links carry `noopener noreferrer`, no inline handlers, no `javascript:` URLs, no inline `style` attributes |
| `tests/seo.test.mjs` | 15 | One h1, unique metadata, canonicals, no stray noindex, OG/Twitter completeness, JSON-LD validity and no fabricated properties, real article dates, sitemap correctness, robots, security.txt, no broken internal links, image alt/dimensions, LCP priority, no vague link text |

`npm audit --audit-level=high` — **0 vulnerabilities**.

One advisory was found and fixed during the build: Vite ≤6.4.2 carried two high
severity dev-server issues (GHSA-v6wh-96g9-6wx3, GHSA-fx2h-pf6j-xcff). Both
affect the Windows dev server only, not build output, but 6.4.3 was a patch bump
so there was no reason to carry them.

### Manual verification performed

Against the worker running locally with real bindings: all eight security
headers present on HTML, on a hashed CSS asset and on a 404 · CSP contains no
`unsafe-*` · every canonical URL returns 200 with no redirect · `/api/health`
reports `ready:true` with booleans only · `/api/config` returns only the public
site key · cross-origin POST 403 · wrong content-type 415 · GET on subscribe 405
· malformed JSON 400 · honeypot 200 storing nothing · Turnstile-enabled request
without a token 403 · a full successful submission storing a correctly hashed key
with exactly four fields · the submitted address absent from all worker logs ·
browser console clean with zero CSP violations.

### Findings during the audit, all fixed

| # | Finding | Fix |
| --- | --- | --- |
| 1 | 24 CSP violations from inline `style` attributes — styling was being silently dropped | Moved to CSS classes; a test now fails on any `style="` in the output (ADR-009) |
| 2 | Worker refused to start: a non-function named export | Header constants moved to `worker/headers.js` (ADR-007) |
| 3 | **Security headers absent from every HTML response in practice** — Cloudflare was serving assets without invoking the worker | `assets.run_worker_first: true` (ADR-008) |
| 4 | Every canonical URL 307-redirected | `html_handling: "drop-trailing-slash"` (ADR-008) |
| 5 | Vite dev-server advisories | Upgraded to 6.4.3 |

Findings 1, 3 and 4 were invisible to the test suite and only appeared when the
site was actually run. That is worth remembering.

## Known limitations

These are real and currently accepted.

1. **No independent penetration test.** This is an internal review. OWASP ZAP,
   Mozilla Observatory and Lighthouse checks are listed below as pending and
   should be run against production.
2. **Rate limiting is per-IP and fails open.** An attacker with many addresses
   can exceed the intended rate; a KV outage disables it entirely. Turnstile is
   the real bot control, and the blast radius is a list of junk email addresses.
3. **Single opt-in.** A subscriber's address is stored on their say-so, so
   someone could enter an address that is not theirs. Double opt-in via a
   confirmation email is the fix and is deferred, not done.
4. **Subscriber addresses are stored in plaintext in KV.** The key is hashed but
   the value is not. Anyone with account-level KV read access sees the list. This
   is proportionate for a mailing list; it would not be for anything sensitive.
5. **No HSTS preload.** Deliberate (ADR-004), but it means a first-ever visit
   over plain HTTP is theoretically interceptable before the redirect.
6. **Turnstile and Cloudflare Web Analytics are third-party origins** in the CSP.
   Both are Cloudflare, both are deliberate, but they are not `'self'`.
7. **CSP report-only phase not yet run in production.** Violations were found and
   fixed locally; the report endpoint exists and should be watched after launch.
8. **`npm audit` covers known advisories only.** It does not detect a malicious
   package that has not been reported.

## Pending external verification

To run against production after launch, and to record here:

- [ ] Mozilla Observatory
- [ ] Google Lighthouse (security and best-practices)
- [ ] Google Rich Results Test
- [ ] OWASP ZAP passive scan
- [ ] `curl -I` header inspection against the live domain
- [ ] One real end-to-end form submission, read back out of KV

**A scanner score is not proof that a site is secure.** These are inputs to
judgement, not conclusions.

## Required before expanding

| Adding | Must first |
| --- | --- |
| Authentication | Session management, CSRF tokens, secure cookie flags, account-enumeration defence, credential storage review, and a fresh threat model |
| Payments | PCI scope review, webhook signature verification, idempotency keys, and no card data touching this origin |
| A database | Least-privilege credentials, row-level security, migration review, tested backup and restore |
| A CMS or any API-sourced content | Sanitise everything before rendering — the "no untrusted input" assumption underpinning the XSS position stops being true |
| Analytics beyond Cloudflare's | Vendor review, consent mechanism, CSP origin review, **and a privacy policy update before shipping, not after** |
| Email sending | SPF, DKIM, DMARC on vroelabs.com; bounce handling; unsubscribe link in every message |

## Reporting

See [SECURITY.md](SECURITY.md). Contact: **vroelabs@gmail.com**.
