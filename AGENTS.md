# AGENTS.md

<!-- wolf:project:start — wolf-sync never overwrites this block -->
## Project
- **Product:** the public website for Vroe Labs. It says what the studio is, what it is building (Trove and Vero), and where each product honestly stands, and it collects early-access email addresses with explicit consent.
- **Mode:** website. Prerendered static HTML on Cloudflare Workers.
- **Live:** https://vroelabs.com · **Repo:** https://github.com/DevPatel128/Vroe (public)
- **Commands** (run in `code/`, never the repo root): `npm ci` · `npm run build` (fonts, images, Vite, prerender, sitemap) · `npm test` (every suite; all must pass) · `npm run preview` (the real Worker on :8787) · `npm run deploy` (emergency only; CI deploys on merge) · `npm audit --audit-level=high`. All commands and suites: `RUNBOOK.md`.
- **Finish every change with** `npm run build && npm test && npm audit --audit-level=high`, then look at the site in `npm run preview`. Two of the three real bugs found while building it were invisible to the tests and obvious in a browser.
- **Kit rules that do not apply here:** hard rules 3, 4 and 5 (`src/db.ts`, client-writable fields, D1 migrations). This site has no database, no accounts and no D1. Its only stores are two KV namespaces (`SYSTEM.md`).

### The one thing to understand first
React runs at build time only. No React reaches the browser. `code/scripts/prerender.mjs` renders every route to HTML, and the browser gets about 2.3 KB of vanilla JS from `code/src/client/enhance.js`. Components are pure (no hooks, no state), and every package is a `devDependency`.

### Project rules (the five Vroe rules, unchanged in meaning)
1. **Never claim a product is available.** Neither Trove nor Vero has shipped. No external product links, no `offers` in structured data, no present-tense "Trove is a…". The evidence on `/trove` describes the problem only, never that Trove saves time or money. Details: `PRODUCT.md` (honesty rules), `docs/03_RESEARCH/RESEARCH.md`.
2. **Never weaken the CSP.** No `unsafe-inline`, no `unsafe-eval`, no wildcards. In particular, no inline `style` attributes: the CSP blocks them and the browser drops the styling silently. Use a class. Details: `SYSTEM.md`.
3. **All copy lives in `code/src/content/`,** never hard-coded in a component.
4. **No React in the browser.**
5. **No invented structured data.** No ratings, reviews, offers or counts.

### Also binding
- If you change what the subscribe endpoint stores or keeps (including backup retention), update `code/src/content/legal.js` (the privacy policy) in the same change. `RETENTION_DAYS` and `BACKUP_RETENTION_DAYS` must match; a test fails if they drift.
- Never commit anything from `backups/`. It holds subscriber personal data, is gitignored, and a test proves it. Never `git add -f` it.
- Before a consequential change, answer why, impact, how, cost, and whether the cost is justified. Label claims as fact, assumption or unknown. Record non-obvious decisions in `DECISIONS.md`.
- `main` accepts only pull requests that pass the required checks `verify` and `docs-impact`. Document every change in the same pull request; the escape hatch is a line `Docs: none, <reason>` in the description. Fix the document; never loosen the check.
- Code comments that cite an old `docs/0N_…` path point at documents archived on 2026-10-09. Their content now lives in the root kit docs: product, design and content in `PRODUCT.md`; architecture, security, data and infrastructure in `SYSTEM.md`; CI, operations, backups and runbooks in `RUNBOOK.md`; SEO and business in `GROWTH.md`; decisions (`ADR-NNN`) in `DECISIONS.md`. Research stays at `docs/03_RESEARCH/`.
<!-- wolf:project:end -->

## Rule 0
Be blunt. No sugarcoating. Give the real risk, number and odds. Every answer ends with what was not checked and what could fail.

## Start of every task
1. Read this file. Load only the docs the router in `WOLF/README.md` names.
2. Read the hard rules below. Check `MISTAKES.md` for the same area.
3. If unclear, ask. Never invent requirements or facts; write `UNKNOWN`.

## Hard rules (max 15; each one came from a real incident)
1. Never merge or deploy on red or skipped CI. A skipped required job is a failure.
2. Never use `--no-verify`, force-push `main`, or weaken a test to make it pass.
3. User data goes only through `src/db.ts` `forUser()`. Never touch `env.DB` elsewhere. `userId` comes only from the session.
4. `role`, `plan` and `user_id` are never client-writable. Writes use field allowlists.
5. Migrations are applied in order and checked in CI against a fresh DB. Never skip a number.
6. Never return DB errors, stack traces or internals to clients. Return stable error codes.
7. Verify webhook signature and schema, dedupe by event ID, and never trust IDs in the payload.
8. Side effects that can retry (money, orders, email, jobs) use idempotency keys.
9. Escape CSV and Excel exports (cells starting with `= + - @`).
10. No PII, tokens or money values in Sentry or PostHog.
11. Health checks test real dependencies. Never hard-code "Operational".
12. Deploy tokens carry every scope the deploy uses. Check them before a deploy, never during one.
13. Dependency major bumps get their own green CI run before merge.
14. Log a mistake in `MISTAKES.md` and add its enforcing check in the same PR.

## Coding rules
Least code that fully works. Order: skip it if nobody needs it → reuse repo code → use the platform or standard library → use an installed dependency → write one clear line → write the minimum code. No new dependency for a few lines. No wrappers or "for later" code. For bugs, grep every caller and fix the root cause once. Non-trivial logic gets one test. Mark limits with `// shortcut: <limit>, <when to upgrade>`. Split a file before 400 lines (components) or 1000 (any file). No `any` or casts. Never cut validation, security, accessibility or data-loss handling.

## Ship rules
- PR body: `Delivers: <IDs>` (VU at or above the floor in `wolf-stats`), `AI tokens: <n>`, evidence, rollback.
- Update touched docs in the same PR: `PRODUCT.md` status, `SYSTEM.md` for schema or API, `RUNBOOK.md` for ops, `GROWTH.md` for public pages.
- Autonomy limits: `WOLF/GOVERN.md`. When in doubt, stop and ask.

## Docs
`PRODUCT.md` what and why · `SYSTEM.md` how it works · `RUNBOOK.md` operate · `GROWTH.md` reach · `TASK.md` feature card · `DECISIONS.md` · `MISTAKES.md` · `sell/` pitch material · framework: `WOLF/`
