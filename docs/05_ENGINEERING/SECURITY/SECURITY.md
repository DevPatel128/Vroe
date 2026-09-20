# Security

**Status:** Review · **Last updated:** 2026-09-20 · **Owner:** Vroe Labs · **Version:** 1.0

The honest boundary, stated first:

> The Vroe Labs website is a static marketing site with one narrow write
> endpoint. Its security responsibilities are secure delivery, browser
> hardening, dependency integrity, deployment access control, privacy
> protection, and preventing unsafe future expansion.

It is not "bank-grade" and not "unhackable". This document describes what is
actually implemented, and [SECURITY_AUDIT.md](SECURITY-AUDIT.md) records what
is not.

## Threat model

### Risks that exist today

| Threat | Control |
| --- | --- |
| XSS / HTML injection | No `dangerouslySetInnerHTML` except the JSON-LD block, which is escaped (`<` → `<`, plus U+2028/9). All content comes from trusted source files, never user input. Strict CSP as defence in depth. |
| Clickjacking | `frame-ancestors 'none'` + `X-Frame-Options: DENY` |
| Form spam / automated abuse | Honeypot → per-IP KV rate limit → Turnstile, in that order (cheapest reject first) |
| Open redirect | The canonical host comes from `CANONICAL_HOST` config, never from the request. Tested. |
| Host header attack | Same: the redirect target is never derived from the request's Host |
| MIME confusion | `X-Content-Type-Options: nosniff` on every response |
| Malicious/compromised npm package | `npm ci --ignore-scripts` in CI, exact pinned versions, committed lockfile, `npm audit --audit-level=high`, Dependabot reviewed not auto-merged |
| Leaked secrets | Nothing secret is committed. Secrets go through `wrangler secret put`; `.dev.vars` is gitignored; a test asserts no secret appears in any published byte |
| Source map / dotfile exposure | `sourcemap: false`; a test walks `dist/` and fails on `.map`, `.env`, `.git`, `.dev.vars` |
| Privacy leakage via logs | The subscribe handler and the backup command never write an email address or a key to a log line or to the terminal. Tested. |
| Subscriber data at rest in a backup | The copy is a file on the maintainer's computer in a gitignored folder (a test proves it can never be committed), readable only by its owner, deleted after 30 days. It is protected by the computer, so the disk must be encrypted and the folder kept out of Time Machine and cloud sync; that is the maintainer's setup, not something the repository can enforce ([BACKUPS.md](../../06_OPERATIONS/BACKUPS.md)) |
| Unsafe external links | Every external anchor carries `rel="noopener noreferrer"`. Tested. |
| Cache misconfiguration | Hashed assets immutable; HTML `must-revalidate`; `/api/*` `no-store` |
| Compromised GitHub/Cloudflare credentials | Scoped API token (not a global key), least-privilege Actions permissions, protected `main`, secret scanning |

### Risks that do not apply, because the site is static

No authentication, sessions or cookies → **no CSRF surface**. (The subscribe
endpoint uses a same-origin check rather than a token, because there is no
session to ride.) No database → no SQL injection. No user accounts, no uploads,
no user-generated content, no payments, no server-side templating of untrusted
input, no SSRF surface.

### Risks that must be closed before the site grows

Before adding **authentication**: session management, CSRF tokens, secure cookie
flags, account enumeration defence, password/credential storage review.
Before adding **payments**: PCI scope review, webhook signature verification,
idempotency, no card data touching this origin.
Before adding a **database**: least-privilege credentials, row-level security,
migration review, backup and restore testing.
Before adding **analytics beyond Cloudflare's** or any **CMS**: vendor review,
consent mechanism, privacy policy update *first*, CSP origin review, and
sanitisation of anything rendered from an API.

## HTTP security headers

Set in `worker/headers.js`, applied to **every** response — HTML, assets and
errors alike. They live in the worker rather than a `_headers` file so they are
unit-testable, and `run_worker_first: true` is what guarantees the worker
actually sees every request.

```
Content-Security-Policy      see below
Strict-Transport-Security    max-age=31536000; includeSubDomains
X-Content-Type-Options       nosniff
X-Frame-Options              DENY
Referrer-Policy              strict-origin-when-cross-origin
Permissions-Policy           every feature denied except fullscreen=(self)
Cross-Origin-Opener-Policy   same-origin
Cross-Origin-Resource-Policy same-origin
```

### Deliberately absent

- **`X-XSS-Protection`** — retired; its filter introduced vulnerabilities of its own.
- **`Expect-CT`** — obsolete since Certificate Transparency became mandatory.
- **`Cross-Origin-Embedder-Policy`** — `require-corp` would break the Turnstile
  iframe, and nothing here needs cross-origin isolation.
- **HSTS `preload`** — withheld on purpose. `includeSubDomains` already covers
  subdomains, but preload is effectively irreversible and `trove.vroelabs.com`
  is not live yet. Add it only once every subdomain is confirmed HTTPS-only.

## Content Security Policy

```
default-src 'none';
base-uri 'self';
object-src 'none';
frame-ancestors 'none';
form-action 'self';
script-src 'self' https://challenges.cloudflare.com https://static.cloudflareinsights.com;
style-src 'self';
font-src 'self';
img-src 'self' data:;
connect-src 'self' https://cloudflareinsights.com;
frame-src https://challenges.cloudflare.com;
manifest-src 'self';
worker-src 'self';
report-uri /api/csp-report;
upgrade-insecure-requests
```

`default-src 'none'` then an explicit allowance per type, so a directive nobody
thought about denies rather than inheriting something permissive.

**There is no `'unsafe-inline'` and no `'unsafe-eval'` anywhere.** Two decisions
bought that:

- **Fonts are self-hosted.** The prototype's `@import` from
  `fonts.googleapis.com` would force `'unsafe-inline'` in `style-src` plus two
  Google origins in `style-src`/`font-src`.
- **No inline `style` attributes.** Enforcing `style-src 'self'` immediately
  surfaced 24 violations — the Trove chart bars and a handful of spacing
  one-offs. They became CSS classes (`.bars span:nth-child(n)` and the spacing
  utilities in `base.css`). `npm run test:security` now fails on any `style="`
  in the output so it cannot come back.

The only inline element on the site is the JSON-LD block, which needs no script
permission: `application/ld+json` is data, not executable.

The three third-party origins are all consequences of explicit decisions:
Turnstile (script + iframe) and Cloudflare Web Analytics (beacon + its endpoint).

### Rollout procedure

Ship as `Content-Security-Policy-Report-Only` first, collect violations at
`/api/csp-report` across every route and the full form flow, then switch to
enforcing. The report endpoint logs only the violated directive, the blocked
URI and the document URI — never the full report body.

## The subscribe pipeline

`POST /api/subscribe`, in order — each cheap check runs before the expensive one:

1. **Method** — anything but POST → `405`
2. **Same-origin** — browsers always send `Origin` on a cross-site POST, so a
   mismatch means it did not come from this site → `403`
3. **Content-Type / Content-Length** → `415` / `413` (4 KB cap)
4. **Honeypot** — a filled `company` field returns `200 {ok:true}` so a bot
   cannot tell being caught from succeeding, and stores nothing
5. **Per-IP rate limit** — 5 per 10 minutes, keyed on `cf-connecting-ip` in KV.
   **Fails open:** a KV outage allows the request rather than taking the form
   offline. Turnstile and the honeypot still stand.
6. **Turnstile** — `siteverify`; a missing or bad token → `403`
7. **Email validation** — trimmed, capped at 254 chars, pattern-checked → `422`
8. **Consent** — must be exactly `true`. Absent, `false`, `"yes"` and `1` are all
   rejected. Consent is never inferred from the act of submitting.
9. **Store** in `SUBSCRIBERS` KV

Turnstile deliberately runs *before* field validation, so an unverified client
learns nothing about which fields are wrong.

### What is stored, and administration

What the Worker stores, for how long, and how the list is read and administered is
owned by [DATA.md](../DATA/DATA.md). The pipeline above writes it; the privacy policy
is written against it.

## Meeting the pre-backend checklist

The requirement was that these be in place before a backend collects anything:

server-side validation ✔ · rate limiting ✔ · abuse protection ✔ · honeypot ✔ ·
explicit consent ✔ · privacy notice at the point of collection ✔ · secure
transport ✔ · data minimisation ✔ · documented retention and deletion ✔ ·
no addresses in logs ✔ · strict CORS ✔ · CSRF — not applicable, no cookies or
sessions, stated rather than assumed ✔ · authentication for admin — not
applicable, there is no admin surface ✔

## Secrets

| Value | Public? | Lives in |
| --- | --- | --- |
| `TURNSTILE_SITE_KEY` | Public by design — appears in the page source of every Turnstile site | `wrangler.jsonc` vars |
| `CF_ANALYTICS_TOKEN` | Public; grants no read access to the data | `src/content/site.js` |
| `TURNSTILE_SECRET_KEY` | **Secret** | `wrangler secret put`; `.dev.vars` locally (gitignored) |
| `CLOUDFLARE_API_TOKEN` | **Secret** | GitHub Actions repository secret |

`.env.example` documents names and placeholders only.

## Verifying

```bash
npm run test:security     # covers everything above
npm audit --audit-level=high
curl -I https://vroelabs.com
```

External checks worth running after a deploy: Mozilla Observatory, Google Rich
Results Test, Lighthouse. **A scanner score is not proof the site is secure** —
it is one input.
