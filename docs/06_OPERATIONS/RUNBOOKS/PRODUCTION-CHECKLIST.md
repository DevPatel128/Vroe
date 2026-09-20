# Production checklist

**Status:** Review · **Last updated:** 2026-09-20 · **Owner:** Vroe Labs · **Version:** 1.0

Vroe Labs — `https://vroelabs.com`. Last run: **1 September 2026**.

The site is **already live** on its production domain. This checklist is what to
run before each deploy, plus the small number of things that still need a human.

---

## Before every deploy

```bash
npm ci
npm run build
npm test
npm audit --audit-level=high
npm run preview          # then actually look at the site on the port wrangler prints (:8787)
```

All four must pass. `npm test` runs every suite, including the byte budgets in
`tests/performance.test.mjs`. The last step is not optional: three of the worst
defects found in this project were invisible to the tests and obvious in a
browser within a minute.

CI additionally runs the Lighthouse budgets (`npm run perf`, against a running
`npm run preview`; needs Chrome and `cd perf && npm ci` once). You do not have to
run them by hand, but that is where to look if the `performance` job goes red.

| Gate | Expected |
| --- | --- |
| `npm run build` | Exit 0, 10 routes prerendered, sitemap written |
| `npm test` | Every suite passing, 0 failing |
| `npm audit --audit-level=high` | `found 0 vulnerabilities` |
| `npm run preview` → `http://localhost:8787` | Loads, no console errors, no redirect loop |

## What runs automatically

See [CI-CD.md](../../05_ENGINEERING/CI-CD/CI-CD.md), "What the workflows do".

## Verified in this audit

Everything in this section has been checked and is passing. Re-check only if the
relevant area changes.

### Delivery and routing

- [x] DNS resolves to Cloudflare; certificate valid
- [x] `http://vroelabs.com` → `https://vroelabs.com`, one 301 hop
- [x] `www` folds to the apex, one hop, and does not depend on `CF-Ray`
- [x] All 9 pages, `robots.txt`, `sitemap.xml`, `security.txt`, favicon → 200
- [x] Unknown path → 404 with the real 404 page, never the app shell
- [x] `POST`/`PUT`/`PATCH`/`DELETE` to a missing path → 404, empty body
- [x] Missing `/api/*` → JSON 404, never HTML
- [x] `.env`, `.dev.vars`, `wrangler.jsonc`, `package.json`, `.git/`,
      `node_modules/`, `src/`, `worker/`, `.github/` → all 404
- [x] `/.vite/manifest.json` → 404 (build metadata no longer published)
- [x] Hashed assets and fonts `immutable`; HTML `must-revalidate`

### Security

- [x] All eight security headers on HTML, on assets, and on 404s
- [x] CSP has no `unsafe-inline`, no `unsafe-eval`, no wildcard
- [x] No source maps in the build
- [x] No secrets in the client bundle; `.dev.vars` untracked and gitignored
- [x] Only third-party origin shipped is `challenges.cloudflare.com`
- [x] No analytics or tracking shipped (`CF_ANALYTICS_TOKEN` empty)
- [x] No `localStorage`, `sessionStorage`, cookies, or permission prompts
- [x] The one `dangerouslySetInnerHTML` (JSON-LD) escapes `<` and U+2028/9
- [x] `npm audit --audit-level=high` → 0 vulnerabilities

### Functionality

- [x] Header nav, mobile menu open/close, all anchors resolve to real elements
- [x] Every CTA goes where its label says; no placeholder or `href="#"` links
- [x] The decorative Trove mock is `aria-hidden` with zero focusable controls
- [x] Subscribe: 405 / 415 / 413 / 400 / 403 cross-origin / 422 / 429 all correct
- [x] Honeypot returns 200 and stores nothing
- [x] Success state only claims success after the store actually succeeds
- [x] If the bot check cannot load, the form says so and offers a real email route
- [x] Submitting cannot race the bot check; double submission blocked
- [x] No console errors on any page

### Accessibility

- [x] One `h1` per page, correct heading order, landmarks, skip link
- [x] Keyboard reachable throughout; focus visible on every brand surface
- [x] Escape closes the menu and returns focus; closed menu leaves the tab order
- [x] Text contrast meets WCAG AA everywhere except the documented decorative
      coral full stop
- [x] All real content ≥ 11px; consent checkbox 24×24; other small targets pass
      the WCAG 2.5.8 spacing exception
- [x] Images have alt text and explicit dimensions; decorative imagery hidden
- [x] `prefers-reduced-motion` honoured

### Responsive

- [x] No horizontal overflow at 1920, 1440, 1280, 768, 812×375 or 375×812
- [x] Checked on home, product, note, legal, contact and 404 pages

### SEO

- [x] Unique title and description per page; canonical on HTTPS apex
- [x] No accidental `noindex`; 404 correctly *is* `noindex, follow`
- [x] OG and Twitter tags complete with absolute image URLs
- [x] Sitemap lists exactly the built pages; robots allows crawling
- [x] JSON-LD valid, with no invented offers, ratings or review counts
- [x] Content is in the HTML, not behind JavaScript

---

## Still requires a human

These cannot be done from the CLI or need a real browser session.

1. ~~**One real form submission on production.**~~ **Done, verified.** One
   record in `SUBSCRIBERS`, stored `2026-09-01T16:07:54Z` under a correctly
   hashed key, expiring `2028-08-31` — the configured 730 days. This confirms
   the whole production path: Turnstile issued and verified a token, the worker
   accepted it, and KV stored the record with the right retention.

2. ~~**Cloudflare dashboard settings.**~~ **Done, verified 1 September 2026.**
   - **Always Use HTTPS** — on. `http://vroelabs.com` now 301s at the edge; the
     redirect no longer carries the worker's headers, which is how you can tell
     Cloudflare answers before the worker runs.
   - **Minimum TLS 1.2** — on. A TLS 1.1 handshake is rejected.
   - **Bot Fight Mode** — reported done; not verifiable from outside without
     probing the bot defences, so it is taken on trust.

3. **Set `SITE.linkedin`** in `src/content/site.js` when the Vroe Labs company
   page exists. It is empty, so the footer renders no LinkedIn icon at all. It
   previously pointed at LinkedIn's homepage, which is worse than absent.

4. **Watch `/api/csp-report`** in Workers Logs — with one caveat. Bot Fight
   Mode injects an inline script that the CSP blocks, so **roughly one violation
   per page view is the expected baseline**. Anything with a different directive
   or blocked URI is worth investigating. See "Bot Fight Mode" in
   [SECURITY_AUDIT.md](../../05_ENGINEERING/SECURITY/SECURITY-AUDIT.md).

5. **External scans**, once, against production. A score is an input to
   judgement, not proof of anything: Mozilla Observatory · Lighthouse
   (performance, accessibility, best practices) · OWASP ZAP passive scan.

6. **GitHub repository settings.** Partly done:
   - **Branch protection on `main`** — **done.** Force pushes and deletions are
     blocked, and the rule applies to admins too (otherwise it is theatre on a
     solo repo). The `verify` CI check is **required**, so nothing reaches
     `main` — and therefore production — except through a pull request that
     passes it. Direct pushes no longer work; merging the pull request is the
     human approval before production. For a genuine emergency, turn "Do not
     allow bypassing the above settings" off in Settings → Branches, push, then
     turn it back on. The `performance` job is deliberately **not** required
     yet: add it under the same rule once it has a track record of not flaking.
     ADR-020.
   - **Secret scanning / push protection** — **not available.** The API returns
     `422 Secret scanning is not available for this repository`: it needs GitHub
     Advanced Security on a private repo. The CI job "Check the repository for
     committed secrets" stands in for it — see below.
   - **`CLOUDFLARE_API_TOKEN`** — set (2 September 2026), and deploys run. See
     item 7.
   - **`WORKER_URL` variable** — set, for the scheduled health check. It is a
     repository *variable*, not a secret: it is only the public `workers.dev`
     address. Update it if the account's workers.dev subdomain is ever renamed.
     See [06-deployment.md](../OBSERVABILITY.md#the-scheduled-health-check).

7. **The `CLOUDFLARE_API_TOKEN` GitHub secret** — **done.** Exact steps, should
   it ever need recreating, are in
   [CLOUDFLARE-API-TOKEN.md](CLOUDFLARE-API-TOKEN.md).

8. **Google Search Console verification.** Neither the DNS TXT record nor the
   meta tag is present. The meta-tag path is already wired and tested: paste the
   code into `GOOGLE_SITE_VERIFICATION` in `src/content/site.js` and it renders
   on every page. The DNS TXT method needs a Cloudflare DNS record, which the
   current session cannot create (zone *read* only).

---

## Deliberately not done

Recorded so nobody re-opens them by accident.

| Not done | Why |
| --- | --- |
| HSTS `preload` | Effectively irreversible, and `trove.vroelabs.com` is not live yet. ADR-004 |
| Double opt-in | Needs transactional email; single opt-in is a known, documented limitation |
| Analytics or tracking | Not approved. `CF_ANALYTICS_TOKEN` is empty and nothing is injected |
| Recolouring the coral accent dot | Decorative punctuation carrying no information; the heading it follows is high contrast. The one accepted contrast deviation |
| Removing the Cloudflare Analytics origins from the CSP | Left so enabling the token later is a one-line change |
| Anti-inspection / DevTools blocking | Does not protect anything, and harms accessibility. Security lives in the worker, the headers, and in not shipping secrets |
