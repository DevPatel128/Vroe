# RUNBOOK.md

Every command runs in `code/`. Node 22 or newer.

## Commands
| Command | Does |
|---|---|
| `npm run dev` | Vite dev server for styles and components. No Worker; use `preview` for the real thing |
| `npm run build` | `build:fonts`, `build:images`, Vite, `build:prerender`, `build:seo` |
| `npm run preview` | The built site through the real Worker (`wrangler dev`, :8787 or the next free port), local KV |
| `npm test` | Every suite below; all must pass |
| `npm run deploy` | Build, then `wrangler deploy` from your machine. Emergencies only |
| `npm run perf` | Lighthouse budgets against a running preview. Needs Chrome and `cd perf && npm ci` once |
| `npm run backup` | Copy the live list to `../backups/subscribers/YYYY-MM-DD.json`, keep 30 days. Uses your `wrangler login` |
| `npm run backup:check` | Fail if the newest backup is older than yesterday, or an old one was kept |
| `npm run audit:deps` | `npm audit --audit-level=high` |
| `npm run audit:sbom` | CycloneDX SBOM to `sbom.json` |
| `npm run build:fonts`, `build:images`, `build:prerender`, `build:seo` | The build's own steps |
| `npm run build:og`, `build:icons` | Not part of `build`; outputs are committed. Regenerate only when artwork or wording changes |

Test suites: `test:sites` (Worker routing) · `test:security` (headers, CSP, subscribe pipeline, build hygiene, no `style="`) · `test:functionality` · `test:seo` · `test:evidence` (every figure recomputed) · `test:performance` (byte budgets) · `test:docs` (kit docs exist, links resolve, no local paths) · `test:accessibility` · `test:docs-sync` (every script, workflow, route, binding, endpoint, secret and cited decision is documented; retention periods agree) · `test:docs-impact` (the docs-impact rule, without git) · `test:backup` (shape, restore round trip, retention, `backups/` never tracked, nothing personal printed).

Local secrets: `.dev.vars` holds `TURNSTILE_SECRET_KEY` (gitignored). To test the success path locally, swap in Cloudflare's always-passes test secret for a moment, then restore it. Delete `.wrangler/state/` to clear local KV.

## Deploy
Branch → pull request → required checks `verify` (in `ci.yml`: `npm ci --ignore-scripts`, `npm rebuild sharp`, `npm audit`, build, `npm test`, SBOM, build-output leak scan, committed-secret scan) and `docs-impact` (`docs-impact.yml`, `code/scripts/docs-impact.mjs`) → merge (the human approval) → `deploy.yml`: build, test, `wrangler deploy` with a scoped token, smoke test on the workers.dev address (eight security headers, no `unsafe-inline`, twelve routes 200, unknown path 404, `/api/health` ready). Bot Fight Mode challenges runners on the custom domain, so a challenge there is a notice, not a failure. `ci.yml` also runs the `performance` job (Lighthouse); it is not a required check yet.

Run docs-impact locally: `BASE_SHA=$(git merge-base origin/main HEAD) node code/scripts/docs-impact.mjs`. A pull request passes when a mapped root doc changed, a new row was added to `DECISIONS.md`, or the description has `Docs: none, <reason>`. Dependabot is exempt.

Verify by hand: `curl -sI https://vroelabs.com | grep -i "content-security-policy\|strict-transport"`, `curl -s https://vroelabs.com/api/health` (`ready:true`), `https://www.vroelabs.com/` redirects to the apex.

| Deploy symptom | Cause |
|---|---|
| "not of type 'function or ExportedHandler'" | A non-function named export in `worker/index.js` (ADR-007) |
| Security headers missing | `run_worker_first` turned off (ADR-008) |
| `/trove` returns 307 | `html_handling` is not `drop-trailing-slash` |
| "Vite manifest not found" | `vite build` did not run before the prerenderer |
| "Evidence data failed validation" | A figure lacks a source, is older than 2024, or cannot be recomputed |
| Smoke test cannot reach the site | Check `workers_dev` and the account's workers.dev subdomain |

Emergency push to `main`: turn off "Do not allow bypassing the above settings" in Settings → Branches, push, turn it back on.

## Rollback
- App: `npx wrangler deployments list`, then `npx wrangler rollback --message "reason"`. Assets and Worker roll back together; KV and bindings are untouched. `deploy.yml` does this itself when a deploy fails its smoke test, waits for `/api/health`, and still ends red (ADR-020).
- Data: restore the list from a backup (below).
- Flag: none exist.

## Alerts → first move
| Alert | First move |
|---|---|
| `health.yml` failed (every three hours: `/api/health`, `/`, `/trove`, `/vero`, CSP header, custom domain; three tries) | Check `WORKER_URL`, then Workers Logs, then roll back |
| Deploy red | Read the smoke-test step; the rollback has already run |
| CSP reports beyond the Bot Fight Mode baseline | A different directive or blocked URI: investigate |
| `npm run backup:check` fails | Run `npm run backup` |

The only alert channel is GitHub's failed-workflow email. Turn on "Send notifications for failed workflows only". Not watched: visitors (Web Analytics off) and the backup (CI cannot see it).

## Incidents
`detect → assess → contain → fix → verify → communicate → learn`, then an entry in `MISTAKES.md`. Rotate before investigating.
- **`TURNSTILE_SECRET_KEY` leaks:** new pair in the Turnstile dashboard, `wrangler secret put TURNSTILE_SECRET_KEY`, update `TURNSTILE_SITE_KEY` in `wrangler.jsonc`.
- **`CLOUDFLARE_API_TOKEN` leaks:** revoke it in Cloudflare API Tokens, create a new one, `gh secret set CLOUDFLARE_API_TOKEN`.
- **KV data exposed:** rotate account credentials first. Keys are hashes; values are addresses. Then decide on notifying people.

## The CI token
Create a custom token (never the Global API Key): Account · Workers Scripts · Edit; Account · Workers KV Storage · Edit; Account · Account Settings · Read; Zone · Workers Routes · Edit. Scope it to the account and to `vroelabs.com` only. Store it with `gh secret set CLOUDFLARE_API_TOKEN` and the account id with `gh secret set CLOUDFLARE_ACCOUNT_ID --repo DevPatel128/Vroe`. Check with `gh secret list`.

## Subscribers: read, delete, back up, restore
- Read: `npx wrangler kv key list --binding SUBSCRIBERS --remote`.
- Delete on request: hash the lowercased address with SHA-256, then `npx wrangler kv key delete "sub:<hash>" --binding SUBSCRIBERS --remote`, and add a row to the deletion log below (hash only, never the address). Backups drop it within 30 days.
- Backup: `npm run backup`, then `npm run backup:check`. One production backup exists (2026-09-20). **Nothing schedules it**, so the recovery point is however long since someone ran it. Keep `backups/` out of Time Machine and cloud sync; use FileVault. An off-computer copy must be encrypted first (`openssl enc -aes-256-cbc -pbkdf2 -iter 600000`). Never commit a snapshot.
- Restore: pick `../backups/subscribers/YYYY-MM-DD.json`; drop records whose `expiration` is within two minutes of now; `npx wrangler kv bulk put restore.json --binding SUBSCRIBERS --remote`; re-delete every deletion-log key dated after the file; count with `kv key list`; `rm restore.json`. Practise with `--local --persist-to <dir>`; the last test in `tests/backup.test.mjs` does this on every run.

Deletion log:
| Date | Key deleted (`sub:<sha256>`) | Requested via |
|---|---|---|

## Disaster recovery
| Lost | Recover by | Not recoverable |
|---|---|---|
| Bad version | Rollback | Nothing |
| Worker deleted | `npm ci`, `npm run build`, `npx wrangler deploy`, set the Turnstile secret | Nothing |
| List emptied or namespace deleted | Restore (create a namespace first if needed) | Sign-ups since the last backup |
| Cloudflare account | Rebuild: KV namespaces (update ids), Turnstile widget and secret, token and secrets, `WORKER_URL`, deploy, restore | Nothing beyond the last backup |
| The maintainer's computer | Fresh backup from a new machine | The 30-day backup history |
| Both account and computer | Nothing | **The list** |

Targets (proposed, not measured): one hour for the site, one hour for the list. Rehearsed 2026-09-20: production backup restored into a scratch local store, identical. Not yet run: a restore into production, a rebuild from nothing.

## Search Console (not yet verified)
Add a Domain property for `vroelabs.com`, verify with a DNS TXT record at Cloudflare (keep it), submit `sitemap.xml`, inspect and request indexing for each page. Fallback: `GOOGLE_SITE_VERIFICATION` in `src/content/site.js`.

## Monthly
- [ ] Health-check history and failed runs.
- [ ] `npm run backup:check`; until it is scheduled, run the backup.
- [ ] Free-tier headroom in the Cloudflare dashboard.
- [ ] Review Dependabot pull requests (weekly for the app, monthly for `perf/` and Actions; never auto-merged).
- [ ] When Search Console is verified, log indexing in `GROWTH.md`.
