# SYSTEM.md

A static marketing site with one narrow write endpoint. Its security job is secure delivery, browser hardening, dependency integrity, deployment access control, privacy, and preventing unsafe expansion. It is not "bank-grade". All paths are inside `code/`.

## Shape
```
build:   npm run build
         ├── build:fonts      scripts/sync-fonts.mjs        @fontsource → public/fonts/
         ├── build:images     scripts/optimize-images.mjs   assets-src/ → AVIF/WebP/JPEG + manifest
         ├── vite build                                     styles + enhance.js → dist/client/assets/
         ├── build:prerender  scripts/prerender.mjs         components → 10 HTML files
         └── build:seo        scripts/generate-sitemap.mjs  sitemap.xml, robots.txt, security.txt

request: browser → Worker vroe-labs (run_worker_first: true)
         ├── canonicalRedirect()   www → apex 301; http → https only when CF-Ray is present (ADR-014)
         ├── /api/subscribe        → honeypot → rate limit → Turnstile → validate → KV SUBSCRIBERS
         ├── /api/health           → booleans only; 503 if assets or a KV binding is missing
         ├── /api/config           → the public Turnstile site key only
         ├── /api/csp-report       → logged (directive, blocked URI, document URI), 204
         └── everything else       → env.ASSETS.fetch() → withSecurity() → withCache()
```
- React renders at build time only (`renderToStaticMarkup`); the browser gets HTML, CSS and `src/client/enhance.js` (about 2.3 KB gzipped). No hooks, no client routing, every route is a real HTML file (ADR-001).
- `prerender` and `generate-sitemap` are thin runners that compile their `.entry.jsx` sibling with esbuild (`packages: "external"`, because `react-dom/server` calls `require("util")`). `esbuild` must stay a direct devDependency (ADR-019).
- `run_worker_first: true` is load-bearing: without it Cloudflare serves assets directly and every security header disappears (ADR-008). `html_handling: "drop-trailing-slash"`, or every canonical URL 307s.
- Security headers live in `worker/headers.js`, because every named export of the Worker entry must be a function (ADR-007).
- `build:og` and `build:icons` are not part of the build; the three OG cards and the touch icon are committed. OG text is per-glyph vector paths (ADR-005).
- `assets-src/` holds the originals and is never published. Only `dist/client/` is.

## Data model (no database, no accounts, no cookies)
| Store | Holds | Lifetime | Writable by client |
|---|---|---|---|
| KV `SUBSCRIBERS` | Key `sub:<sha256(lowercased email)>`; value exactly `{ email, subscribed_at, country, consent }`. No IP, user agent or referrer | 730 days (`RETENTION_DAYS` in `worker/index.js` and `src/content/legal.js`) | Only through `/api/subscribe` |
| KV `RATE_LIMIT` | Per-IP throttle counter keyed on `cf-connecting-ip` | Expires on its own | No |
| `backups/subscribers/YYYY-MM-DD.json` on the maintainer's computer (gitignored) | Daily copy of `SUBSCRIBERS` in `wrangler kv bulk put` format | 30 days (`BACKUP_RETENTION_DAYS` in `scripts/backup-subscribers.mjs` and `legal.js`) | No |

Why KV and not a database: one list of addresses does not need Postgres (ADR-010). Migrating is a change to one function, `storeSubscriber()`. There is no admin endpoint; reading and deleting are CLI procedures in `RUNBOOK.md`. Values are plaintext in KV; anyone with account-level KV read sees the list.

## Env vars and secrets (names only)
| Name | Where | Purpose |
|---|---|---|
| `CANONICAL_HOST` | `wrangler.jsonc` vars | The redirect target; never taken from the request |
| `TURNSTILE_SITE_KEY` | `wrangler.jsonc` vars | Public by design |
| `TURNSTILE_SECRET_KEY` | `wrangler secret put`; `.dev.vars` locally (gitignored) | Secret. Turnstile `siteverify` |
| `CF_ANALYTICS_TOKEN` | `src/content/site.js` | Public. Empty, so no beacon is injected |
| `GOOGLE_SITE_VERIFICATION` | `src/content/site.js` | Empty; DNS TXT is the primary method |
| `CLOUDFLARE_API_TOKEN` | GitHub Actions secret | Secret. Deploy only; four permissions (`RUNBOOK.md`) |
| `CLOUDFLARE_ACCOUNT_ID` | GitHub Actions secret | Deploy |
| `WORKER_URL` | GitHub Actions variable | The public workers.dev address the health check probes |

## Endpoints
| Method path | Auth | Authz rule | Input schema | Limits | Idempotent | Errors |
|---|---|---|---|---|---|---|
| `POST /api/subscribe` | None; same-origin `Origin` check (no session, so no CSRF surface) | Anyone who passes Turnstile | JSON `email` (trimmed, ≤254 chars, pattern), `consent` exactly `true`; honeypot `company` must be empty | 4 KB body; 5 per 10 minutes per IP (fails open on KV outage) | Yes: the hashed key deduplicates | 405 method, 403 cross-origin or bad Turnstile, 415, 413, 400 malformed JSON, 422 bad email or consent, 429; honeypot hit returns 200 and stores nothing |
| `GET /api/health` | None | Public | None | None | Yes | 503 with `ready: false` |
| `GET /api/config` | None | Public | None | None | Yes | None |
| `POST /api/csp-report` | None | Public | CSP report | UNKNOWN | Yes | 204 |

Turnstile runs before field validation, so an unverified client learns nothing about which fields are wrong. Missing `/api/*` paths return JSON 404, never HTML.

## Authorization matrix
| Action | anon | user (own) | admin |
|---|---|---|---|
| Read pages, `/api/health`, `/api/config` | yes | n/a (no accounts) | n/a |
| Subscribe | yes, with consent and Turnstile | n/a | n/a |
| Read or delete the list | no | n/a | Maintainer only, by Wrangler CLI with their own login |

## Security headers and CSP (`worker/headers.js`, every response)
HSTS `max-age=31536000; includeSubDomains` (no preload, ADR-004) · `nosniff` · `X-Frame-Options: DENY` · `Referrer-Policy: strict-origin-when-cross-origin` · Permissions-Policy denies all except `fullscreen=(self)` · COOP and CORP `same-origin`.

CSP: `default-src 'none'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self' https://challenges.cloudflare.com https://static.cloudflareinsights.com; style-src 'self'; font-src 'self'; img-src 'self' data:; connect-src 'self' https://cloudflareinsights.com; frame-src https://challenges.cloudflare.com; manifest-src 'self'; worker-src 'self'; report-uri /api/csp-report; upgrade-insecure-requests`. No `unsafe-inline` or `unsafe-eval`, which self-hosted fonts and no inline styles bought (ADR-003, ADR-009). The only inline element is the JSON-LD block, escaped (`<` and U+2028/9). Bot Fight Mode injects an inline script the CSP blocks: about one report per page view is the expected baseline, and reports are deliberately not filtered.

## Threat model (lite)
| Asset | Actor | Attack path | Mitigation | Residual risk |
|---|---|---|---|---|
| Visitors | Attacker | XSS, clickjacking, MIME confusion | Strict CSP, `frame-ancestors 'none'`, nosniff, trusted content only | Low |
| Early-access list | Bot | Form spam | Honeypot, per-IP rate limit, Turnstile | Rate limit is per-IP and fails open; junk addresses |
| Early-access list | Anyone | Entering someone else's address | Explicit consent | Single opt-in; double opt-in deferred |
| Early-access list | Account compromise | KV read | Scoped token, hashed keys | Values are plaintext |
| Backups | Laptop theft | Disk read | Owner-only files, gitignored | FileVault and Time Machine exclusion are the maintainer's setup, not enforced |
| Redirect | Attacker | Host header, open redirect | Target from `CANONICAL_HOST`, tested | Low |
| Build | Supply chain | Malicious npm package | `npm ci --ignore-scripts`, exact pins, lockfile, `npm audit`, Dependabot reviewed | `npm audit` sees known advisories only |
| Secrets | Leak | Commit or bundle | `wrangler secret`, CI secret scan, build-output scan | No independent penetration test yet |

Before adding authentication, payments, a database, or analytics beyond Cloudflare's: review sessions and CSRF; PCI scope and webhooks; least-privilege credentials and backup testing; vendor, consent and privacy policy first.

Deliberately not done: anti-inspection or DevTools blocking (protects nothing, harms accessibility); double opt-in (needs transactional email); analytics (not approved; the two Web Analytics origins stay in the CSP so enabling it is a one-line change); recolouring the decorative coral full stop.

## Infrastructure
Domain `vroelabs.com` (registrar Cloudflare). Worker `vroe-labs`; custom domains `vroelabs.com` and `www.vroelabs.com` in `wrangler.jsonc`. KV `RATE_LIMIT` `dc61b02b65b041b4aa4e3c6ad10fbd4d`, `SUBSCRIBERS` `609b58326df24884aef3fe253af7aad9`. Workers Logs on (`observability.enabled`). `workers_dev` and `preview_urls` on. Zone settings: SSL Full (strict), Always Use HTTPS, minimum TLS 1.2, Bot Fight Mode. Other Workers on the account (`trove`, `janki`) are unrelated; never touch them, and never create `trove.vroelabs.com` from here.

## Limits and cost
| Resource | Free limit | Current use | Headroom |
|---|---|---|---|
| Workers, two KV namespaces, Workers Logs | Cloudflare free tier | UNKNOWN (not measured here) | UNKNOWN; check the dashboard |
| KV daily reads and lists | 100,000 reads, 1,000 lists | Backup reads 100 keys per call | List size not measured |
| GitHub Actions | Unmetered (public repo) | Health check every three hours | n/a |

Cost today: $0 a month on Cloudflare (ADR-018) plus the annual domain fee (amount not recorded). Supabase, PostHog and Sentry are not used (ADR-010, ADR-011, ADR-012). A more expensive option needs a recorded reason in `DECISIONS.md`.

**Performance budgets.** Bytes in `tests/performance.test.mjs` (part of `npm test`): JavaScript 4 KB in two files, CSS 10 KB, 16 KB per HTML page, plus fonts and each image. Lighthouse in `perf/run.mjs` (CI `performance` job; own dependency tree in `perf/`, ADR-021): six pages timed, median of three runs; `KNOWN_ISSUES` is empty. Raising a budget needs a recorded reason.
