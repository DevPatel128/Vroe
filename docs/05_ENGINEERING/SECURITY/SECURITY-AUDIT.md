# Security audit

**Status:** Approved · **Last updated:** 2026-09-04 · **Owner:** Vroe Labs · **Version:** 1.0

**Date:** 1 September 2026 · **Version:** 1.0.0 (initial launch)
**Auditor:** internal review. Not an independent third-party assessment.

Two rounds are recorded here. Round 1 was the build review. Round 2 was a
pre-production audit covering functionality, accessibility, performance and
security together — its findings are in
[Round 2 findings](#round-2-findings-pre-production-audit).

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

Full table in [docs/04-security.md](SECURITY.md). In summary:

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

`npm test` — **72 assertions, all passing** (1 September 2026, after round 2).

| Suite | Count | Covers |
| --- | --- | --- |
| `tests/sites-worker.test.mjs` | 5 | Asset serving, 404 contract, no API fallback to the shell, cache policy |
| `tests/security.test.mjs` | 29 | Headers on every response type, CSP has no unsafe directive, no HSTS preload, no obsolete headers, www→apex, no open redirect from a spoofed Host, hashed subscriber keys, dedupe, cross-origin 403, wrong content-type 415, oversized 413, honeypot, invalid email 422, consent required, rate limit 429, Turnstile required, health leaks no secret, config exposes only the public key, KV errors leak no address, no secrets/source maps/dotfiles in the build, external links carry `noopener noreferrer`, no inline handlers, no `javascript:` URLs, no inline `style` attributes, no build metadata published, the local-dev redirect regression, www→apex without CF-Ray |
| `tests/functionality.test.mjs` | 23 | Anchors resolve, no placeholder links, no fake controls, the decorative product mock is aria-hidden and unfocusable, consent is required and never pre-ticked, the Turnstile fallback contract, the submit-button label survives a failed submit, skip link, menu toggle semantics, closed menu leaves the tab order, icon links are named, an 11px floor on real content, **computed** WCAG ratios for both coral CTAs and the focus ring, consent target size, referenced assets exist, 404 is noindex |
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
| 6 | `http://vroelabs.com` returned 200 instead of upgrading — "Always Use HTTPS" was off, and the OAuth session has zone *read* only, so it could not be enabled from here | The redirect now lives in `canonicalRedirect()`, where it is unit-tested and travels with the code. Verified in production. Enabling the zone setting as well is still recommended |

Findings 1, 3 and 4 were invisible to the test suite and only appeared when the
site was actually run. That is worth remembering.

## Round 2 findings: pre-production audit

A second pass covering functionality, responsive behaviour, accessibility,
performance and security together. Every item below was reproduced, fixed and
re-verified in a browser and in the test suite.

### Blocking, fixed

| # | Finding | Why it mattered | Fix |
| --- | --- | --- | --- |
| 9 | **`npm run preview` served nothing but 301 redirects.** `wrangler dev` rewrites the request URL *and* the Host header to the first custom domain in `wrangler.jsonc`, so the worker saw `http://vroelabs.com/…`, took the HTTPS-upgrade branch, and wrangler rewrote the `Location` straight back to localhost. An infinite loop. | The project's own rule is to look at the site before shipping. Nobody could. Every visual, accessibility and functional check was blocked. | The scheme upgrade — and only the scheme upgrade — is now gated on `CF-Ray`, which Cloudflare attaches at the edge and which is absent locally. **Verified against a real edge preview (`wrangler dev --remote`), not assumed.** The canonical-host redirect is deliberately not gated, so www→apex works regardless. ADR-014 |
| 10 | **Turnstile dead end.** If the Turnstile script was blocked by an extension or network filter, the client posted with no token, the server answered `403 Bot check failed. Please retry the verification.`, and there was no widget on screen to retry. Signing up became impossible with no way out. | The site collects an email address. This silently broke the only conversion path, and told the visitor to do something impossible. | The client now distinguishes "a check was expected" from "a check is ready" and, when the check cannot load, says so plainly and offers `vroelabs@gmail.com` as a real route. A `403` with no working widget falls back the same way. |
| 11 | **Submit raced the bot check.** `arm()` ran on `focusin` and the submit handler never awaited it, so typing an address and pressing Enter could submit before the widget mounted — producing finding 10's dead end even when Turnstile was working perfectly. | The most common way to fill a one-field form is type-then-Enter. | The submit handler awaits an idempotent `arm()` promise, so the check is never raced. Double submission is blocked while in flight. |

### Non-blocking, fixed

| # | Finding | Fix |
| --- | --- | --- |
| 12 | **Build metadata was published.** `dist/client/.vite/manifest.json` was served at `/.vite/manifest.json`, handing out the mapping from every source path to its hashed output name. | The prerenderer deletes `.vite` once it has read it. A test now fails on any published dotfile other than `.well-known`, and the CI leak check was widened to match. |
| 13 | **Both coral calls to action failed WCAG AA.** `--white` on `--coral` is **2.83:1**; 13px text needs 4.5:1. This affected `.button-coral` and `.nav-cta` — the latter in the header of every page. | Switched to `--ink` on coral: **5.77:1** (4.82:1 on the hover shade), with the brand coral unchanged. It matches the ink-on-lime pairing the status pill already used. |
| 14 | **The focus ring was invisible on most of the site.** A 3px coral outline is 2.66:1 on paper, 2.83:1 on white, 2.12:1 on lime and **1.70:1 on sky** — under the 3:1 WCAG 1.4.11 asks of a focus indicator. | Two-tone ring: the coral outline kept, an ink halo added outside it. Ink clears 3:1 on every light brand surface; coral clears 5.77:1 on ink. One of the two is always visible. |
| 15 | **Real content rendered at 8px on mobile.** The product status pill ("Taking shape" / "Upcoming") and the hero caption dropped to 8px, and `.eyebrow`, `.note-topline` and the consent smallprint sat at 10px. The status pill is what tells a visitor the products are not available yet. | An 11px floor on all real content, enforced by a test. The `aria-hidden` Trove mock keeps its small sizes — it is decoration meant to read as a scaled-down screenshot and no assistive technology reaches it. |
| 16 | **The consent checkbox was a 16×16 target.** WCAG 2.5.8 asks for 24×24, and this is the one control a visitor must hit to consent. | Raised to 24×24. Every other undersized target was measured and passes the WCAG 2.5.8 *spacing* exception. |
| 17 | **A footer link went nowhere it claimed.** The LinkedIn icon was labelled "Vroe Labs on LinkedIn" but pointed at `https://www.linkedin.com/`, the network's own homepage, as a placeholder. | `SITE.linkedin` is now empty and the footer omits the icon entirely. Setting a real company URL brings it back. A test fails on any bare social-root or `href="#"` placeholder. |

### Checked and found correct — no change needed

- **The decorative Trove product mock** is `aria-hidden="true"` and contains
  **zero** focusable elements, so the fake product UI is never exposed as an
  interactive control. Its overflow past the card edge is a deliberate design
  bleed, clipped by the parent, and causes no page scroll.
- **Write methods never fall through to the app shell.** `POST`/`PUT`/`PATCH`/
  `DELETE` to a missing path return `404` with an empty body; to a real page,
  `405`. A missing `/api/*` route returns JSON `404`, never HTML.
- **No private file is reachable.** `.env`, `.dev.vars`, `wrangler.jsonc`,
  `package.json`, `.git/config`, `node_modules/`, `src/`, `worker/` and
  `.github/` all return 404 — only `dist/client` is published.
- **No secrets in the client bundle, and no source maps.** `sourcemap: false`,
  and a test scans every published byte, including against the live value in
  `.dev.vars` when present.
- **The only third-party origin in the built output is
  `challenges.cloudflare.com`.** No analytics is shipped: `CF_ANALYTICS_TOKEN`
  is empty, so the beacon is not injected at all.
- **JSON-LD is the one `dangerouslySetInnerHTML` and it is correctly escaped** —
  `<` becomes `\u003c`, so a `</script>` in content cannot close the block, and
  U+2028/U+2029 are escaped too. Its content comes from trusted source files.
- **No `localStorage`, `sessionStorage`, cookies, or browser permission
  requests** anywhere in the client code.
- **The closed mobile menu is `display: none`**, so its links are genuinely out
  of the tab order rather than invisible-but-focusable. Escape closes it and
  returns focus to the toggle.
- **Reduced motion is honoured.** Motion is limited to 0.18s opacity and
  transform transitions, all neutralised under `prefers-reduced-motion: reduce`,
  along with smooth scrolling.
- **Workflows are least-privilege.** `permissions: contents: read`, actions
  pinned to commit SHAs, `npm ci --ignore-scripts`, and CI references no secrets
  at all, so fork pull requests are safe to run.

### Bot Fight Mode: enabled by decision, with known costs

Enabled 2 September 2026 and **kept on deliberately**. It is not free, and the
costs below are accepted rather than unknown.

**What works.** Its edge challenging functions: it correctly served a managed
challenge (`403`, `cf-mitigated: challenge`) to a datacentre client.

**What does not.** It injects a 938-byte inline `<script>` into every HTML
response. The CSP is `script-src 'self' …` with no `'unsafe-inline'` and no
nonce, so the browser blocks it. Confirmed in a browser against production:

> Executing inline script violates the following Content Security Policy
> directive 'script-src 'self' …'. The action has been blocked.

Consequences, all verified on the live site:

| Effect | Detail |
| --- | --- |
| Console error for every visitor | one blocked-inline-script violation per page load |
| A report POST per page view | `POST /api/csp-report → 204`, plus a Workers Logs line each time |
| 938 wasted bytes per HTML response | live HTML 25,353 B vs 24,415 B in the build |
| The JS-detection layer never runs | its script is blocked, so only the request-level signals apply |

**Reading `/api/csp-report` now.** Expect roughly one violation per page view
from Cloudflare's injected script. That is the baseline. Anything with a
different directive or blocked URI is worth investigating.

These reports are deliberately **not** filtered server-side. Suppressing them
would mean pattern-matching on inline-script violations, which is precisely
what a real inline-script injection also looks like — the noise is preferable
to a filter that could hide an attack.

**Deploy verification.** Bot Fight Mode challenges datacentre IPs, so a GitHub
runner is handed an interstitial instead of the site. The smoke test therefore
verifies the deployment on its `workers.dev` address, which sits outside the
`vroelabs.com` zone and is not subject to that zone's bot settings — the same
Worker and assets, arriving byte-identical to the build. That check is stricter
than the one it replaced: eight security headers rather than five, all twelve
public routes, a 404 on an unknown path, and `/api/health`. The production
hostname is still probed; a challenge there is reported as a notice and
accepted, and if the challenge ever stops being served the full check against
the production hostname resumes with no code change.

**A correction to the record.** An earlier round of this audit reported
`Strict-Transport-Security` as possibly missing for real visitors in some
regions. That was wrong. The runner was being served challenge pages, which
carried no HSTS before zone-level HSTS was enabled. Production was serving the
header correctly throughout.

### Accepted, not fixed

- **The decorative coral full stop** (`.accent-dot`) after display headings is
  1.70:1 on sky and 2.66:1 on paper. It is a documented brand device, carries no
  information, and the heading text it follows is high contrast in every case.
  Recolouring it would remove the device rather than improve comprehension.
  This is the one contrast deviation that remains, and it is deliberate.
- **The CSP still allows the two Cloudflare Web Analytics origins** even though
  no beacon is currently injected. Left in place so enabling the token later is
  a one-line change rather than a CSP edit; documented in `worker/headers.js`.

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

## Production verification, 1 September 2026

Run against `https://vroelabs.com` after deploy:

| Check | Result |
| --- | --- |
| All eight security headers present on the live homepage | Pass |
| CSP contains no `unsafe-*` | Pass |
| All 9 pages, `robots.txt`, `sitemap.xml`, `security.txt`, favicon | 200 |
| Unknown path | 404, not the app shell |
| `http://vroelabs.com` → `https://vroelabs.com` | 301, one hop |
| `http://www.` and `https://www.` → apex | 301, one hop |
| `/api/health` | `ready:true`, booleans only |
| `/api/config` | public site key only |
| Subscribe without a Turnstile token | 403 |
| Subscribe cross-origin | 403 |
| Subscribe with the honeypot filled | 200, stored nothing |
| Subscribe with malformed JSON | 400 |
| `GET /api/subscribe` | 405 |
| `SUBSCRIBERS` KV write / read / delete | Pass, 0 keys left behind |
| Browser console on the live site | No errors, no CSP violations |
| `enhance.js` loads; Turnstile renders on first interaction | Pass |

### Still to do

- [ ] **One human form submission on production.** The Turnstile challenge needs
      a visible, focused page, which headless automation cannot provide. The
      identical code path was verified end-to-end locally against real KV using
      Cloudflare's always-passes test key: correct hashed key, exactly four
      stored fields, address absent from every log line.
- [ ] Mozilla Observatory
- [ ] Google Lighthouse (security and best-practices)
- [ ] OWASP ZAP passive scan
- [ ] Enable **Always Use HTTPS**, **Minimum TLS 1.2** and **Bot Fight Mode** in
      the Cloudflare dashboard. The worker already handles the HTTPS upgrade;
      these are defence in depth. The OAuth session has zone read access only,
      so they cannot be set from the CLI.

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
