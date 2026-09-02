# Production checklist

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
npm run preview          # then actually look at the site on :8788
```

All four must pass. `npm test` is **72 assertions** across four suites. The last
step is not optional: three of the worst defects found in this project were
invisible to the tests and obvious in a browser within a minute.

| Gate | Expected |
| --- | --- |
| `npm run build` | Exit 0, 10 routes prerendered, sitemap written |
| `npm test` | 72 passing, 0 failing |
| `npm audit --audit-level=high` | `found 0 vulnerabilities` |
| `npm run preview` → `http://localhost:8788` | Loads, no console errors, no redirect loop |

---

## Automated on deploy

`.github/workflows/deploy.yml` runs on push to `main` and will fail the deploy
if any of these break. Nothing here needs doing by hand.

- Install with `--ignore-scripts`; actions pinned to commit SHAs
- Build, then the full test suite
- Deploy via `wrangler deploy` using a scoped API token (not a global key)
- Post-deploy smoke test: eight security headers present, no `unsafe-inline`,
  twelve routes returning 200, an unknown path returning 404, and `/api/health`
  ready. Run against the `workers.dev` address, because Bot Fight Mode
  challenges the runner on the custom domain — same Worker, same assets, and no
  injected script. The production hostname is probed too; a challenge there is a
  notice rather than a failure

`.github/workflows/ci.yml` additionally runs `npm audit`, generates an SBOM, and
fails on any source map, unexpected dotfile, or secret name in `dist/client`.

It also runs **"Check the repository for committed secrets"**, which stands in
for GitHub's secret scanning and push protection (unavailable on a private repo
without Advanced Security). It adds no third-party action — it greps the files
git actually tracks for environment files, credential-shaped assignments, and
private-key headers. A line can opt out with a trailing `allowlist secret`
comment; the two Turnstile test fixtures use it, so a real key pasted into a
test still fails the build. Both directions were verified against planted
secrets.

---

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
   [SECURITY_AUDIT.md](SECURITY_AUDIT.md).

5. **External scans**, once, against production. A score is an input to
   judgement, not proof of anything: Mozilla Observatory · Lighthouse
   (performance, accessibility, best practices) · OWASP ZAP passive scan.

6. **GitHub repository settings.** Partly done:
   - **Branch protection on `main`** — **done.** Force pushes and deletions are
     blocked, and the rule applies to admins too (otherwise it is theatre on a
     solo repo). Direct pushes to `main` still work, so the normal workflow is
     unchanged. To force-push deliberately, turn "Do not allow bypassing the
     above settings" off in Settings → Branches, push, then turn it back on.
   - **Secret scanning / push protection** — **not available.** The API returns
     `422 Secret scanning is not available for this repository`: it needs GitHub
     Advanced Security on a private repo. The CI job "Check the repository for
     committed secrets" stands in for it — see below.
   - **`CLOUDFLARE_API_TOKEN`** — still missing. See item 7.

7. **Create the `CLOUDFLARE_API_TOKEN` GitHub secret.** Until this exists the
   Deploy workflow builds, tests, then fails at `wrangler deploy`, so pushing to
   `main` does not deploy. Creating and storing an API token is yours to do —
   it must not pass through anyone else's hands. Exact steps are in
   [Creating the Cloudflare API token](#creating-the-cloudflare-api-token).

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

---

## Creating the Cloudflare API token

Do this yourself. A deploy credential should never pass through a third party,
and it is only ever pasted into Cloudflare's and GitHub's own forms.

**1. Create the token** at
`dash.cloudflare.com` → profile menu → **API Tokens** → **Create Token** →
**Create Custom Token**. Do *not* use "Global API Key" — that one can do
anything to the whole account.

Give it exactly these permissions and nothing more:

| Type | Resource | Access |
| --- | --- | --- |
| Account | Workers Scripts | Edit |
| Account | Workers KV Storage | Edit |
| Account | Account Settings | Read |
| Zone | Workers Routes | Edit |

Scope it under **Account Resources** to `Devpatel1286@gmail.com's Account`, and
under **Zone Resources** to `vroelabs.com` only. Set a TTL if you want one —
the deploy will start failing when it expires, which is a loud, safe failure.

Copy the token when it is shown. Cloudflare will not show it again.

**2. Store it as a GitHub secret.** Either paste it at
`github.com/DevPatel128/Vroe` → **Settings → Secrets and variables → Actions →
New repository secret**, named `CLOUDFLARE_API_TOKEN` — or from your terminal:

```bash
gh secret set CLOUDFLARE_API_TOKEN
```

That prompts for the value and sends it straight to GitHub; it does not appear
in your shell history or in this transcript.

**3. Confirm it landed** (this prints names and dates only, never values):

```bash
gh secret list
```

You should see `CLOUDFLARE_API_TOKEN` alongside `CLOUDFLARE_ACCOUNT_ID`. The
next push to `main` will then deploy.

If the token ever leaks, revoke it in the same Cloudflare API Tokens screen —
that invalidates it immediately — then create a new one and re-run step 2.

---

## If something looks wrong after a deploy

```bash
curl -sI https://vroelabs.com | grep -i "content-security-policy\|strict-transport"
curl -s https://vroelabs.com/api/health
```

`/api/health` returns booleans only — never a secret value. If `ready` is
`false`, a KV binding is missing. Roll back with `wrangler rollback`, or
re-deploy the previous commit; the worker and the assets ship together, so a
rollback restores both.
