# Deployment

## Facts

| | |
| --- | --- |
| Domain | `vroelabs.com` (registrar: Cloudflare) |
| Zone ID | look up in the Cloudflare dashboard, or `wrangler whoami` |
| Account ID | look up in the Cloudflare dashboard, or `wrangler whoami` — also stored as the `CLOUDFLARE_ACCOUNT_ID` GitHub secret |
| Worker | `vroe-labs` |
| workers.dev address | the subdomain is an account setting, so CI reads it from `wrangler deploy` output rather than a value recorded here |
| KV: `RATE_LIMIT` | `dc61b02b65b041b4aa4e3c6ad10fbd4d` |
| KV: `SUBSCRIBERS` | `609b58326df24884aef3fe253af7aad9` |
| Turnstile site key | `0x4AAAAAAEjohAZuCMiZZM6u` (public) |
| Repo | `DevPatel128/Vroe` (public) |

Other workers on this account — `trove`, `janki` — are unrelated. Do not touch
them, and do not create the `trove.vroelabs.com` DNS record from here; it belongs
to the Trove deploy.

Every command below assumes you're in `code/` (`cd code` first) — that's
where `package.json` and `wrangler.jsonc` live.

## Deploy

```bash
npm run deploy
```

That runs `npm run build` then `wrangler deploy`. Pushing to `main` does the same
through GitHub Actions, then smoke-tests the deployment on its workers.dev
address (Bot Fight Mode challenges CI on the custom domain; see the workflow).

**Nothing reaches `main` except through a pull request.** `main` requires the
`verify` check (audit, build, every test, the secret scans), and the rule applies
to admins, so a red pull request cannot be merged and a direct push is rejected.
Merging the pull request is the human approval before production; the merge is
what deploys. A second CI job, `performance`, runs the Lighthouse budgets on
every pull request; it is not yet a required check (see
[PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md), item 6).

## Performance budgets

Two layers, because they catch different things.

**Bytes — `tests/performance.test.mjs`, part of `npm test`.** Deterministic, so
it never flakes, and it runs in CI and again before every deploy. Budgets for
gzipped JavaScript (one ~2 KB script; this is what keeps ADR-001 true), CSS, each
HTML page, fonts and each image. Going over is sometimes right: raise the number
in the test and record why as an ADR, so the increase is a decision.

**Timing and audits — `perf/run.mjs`, the CI `performance` job.** Lighthouse,
mobile emulation, median of three runs, on six pages. It fails on a performance
score below 0.95, on FCP, LCP, TBT or CLS past Google's "good" thresholds, and on
any failing accessibility, best-practice or SEO audit that is not listed in
`KNOWN_ISSUES` at the top of the file. Two are listed today (colour contrast in
the product illustrations, and heading order on `/products`). Remove an entry
when it is fixed; the runner tells you when one no longer applies.

Run it yourself:

```bash
cd perf && npm ci && cd ..   # once. Lighthouse has its own dependency tree
npm run build
npm run preview              # in one terminal
npm run perf                 # in another; needs Chrome (set CHROME_PATH if it isn't found)
```

Lighthouse is installed from `perf/`, not from the app's `package.json`, on
purpose: the deploy job holds the Cloudflare token, and its install should never
include a browser-automation tree of a hundred packages. ADR-021.

## Monitoring

`.github/workflows/health.yml` runs every three hours and checks the deployed
Worker: `/api/health` reports ready, `/`, `/trove` and `/vero` return 200, the CSP
header is present, and the custom domain answers. It tries three times, 30 seconds
apart, so one dropped request is not an alert. A failure is a failed Actions run,
and GitHub emails those. There is no other alerting.

Two things to set up, once:

1. **The `WORKER_URL` repository variable** (Settings → Secrets and variables →
   Actions → Variables): the deployed Worker's workers.dev address, which the last
   successful Deploy run prints. It is a variable, not a secret, because it is
   public. If the account's workers.dev subdomain is ever renamed, update it. The
   check fails loudly, saying so, while the variable is missing or wrong.
2. **Your notifications** (github.com → Settings → Notifications → Actions):
   enable "Send notifications for failed workflows only". Scheduled-run failures
   go to whoever last edited the cron line in the workflow file.

Bot Fight Mode challenges GitHub runners on `vroelabs.com`, so the check leans on
the workers.dev address for the real verdict and treats a challenge on the custom
domain as "cannot verify from here", not as an outage.

## First-time setup

Both KV namespaces and the Turnstile widget already exist. What remains:

**1. The Turnstile secret** (once, and after any rotation):

```bash
npx wrangler secret put TURNSTILE_SECRET_KEY
```

**2. The Cloudflare API token for CI.** OAuth cannot mint tokens, so this is a
dashboard step. Go to **My Profile → API Tokens → Create Token → Custom token**:

| Permission | Scope |
| --- | --- |
| Account → Workers Scripts → Edit | your Cloudflare account |
| Account → Workers KV Storage → Edit | same |
| Account → Account Settings → Read | same |
| Zone → Workers Routes → Edit | `vroelabs.com` |

Then store it:

```bash
gh secret set CLOUDFLARE_API_TOKEN --repo DevPatel128/Vroe
gh secret set CLOUDFLARE_ACCOUNT_ID --repo DevPatel128/Vroe
```

Use a scoped token, never a Global API Key. Rotate immediately if exposure is
suspected.

**3. Cloudflare Web Analytics** — create a site for `vroelabs.com` in the
dashboard, then put the beacon token in `CF_ANALYTICS_TOKEN` in
`src/content/site.js`. Empty means no beacon is injected, which is correct until
then.

## DNS

`wrangler.jsonc` declares `vroelabs.com` and `www.vroelabs.com` as custom
domains, so wrangler creates the proxied records on first deploy. The worker
301s `www` to the apex.

Recommended zone settings (dashboard, one-time): SSL/TLS **Full (strict)**,
**Always Use HTTPS** on, **Minimum TLS 1.2**, **Bot Fight Mode** on.

Do **not** enable HSTS at the zone level with preload — the worker already sends
HSTS without preload, deliberately. See ADR-004.

## Local development

```bash
npm run build      # wrangler serves dist/client, so build first
npm run preview    # wrangler dev on :8788, real worker, local KV
```

`.dev.vars` holds `TURNSTILE_SECRET_KEY` for local use and is gitignored.

To exercise the success path locally without a browser widget, temporarily swap
in Cloudflare's always-passes test secret
(`1x0000000000000000000000000000000AA`), then restore. Local KV lives in
`.wrangler/state/`; delete that directory to clear test data.

## Reading the subscriber list

There is no admin endpoint, on purpose — one would need authentication.

```bash
npx wrangler kv key list --binding SUBSCRIBERS --remote
npx wrangler kv key get "sub:<sha256>" --binding SUBSCRIBERS --remote
```

Keys are `sub:<sha256(lowercased email)>`, so a key listing alone reveals no
addresses. To honour a deletion request, hash the address and delete that key:

```bash
node -e 'console.log(require("crypto").createHash("sha256").update(process.argv[1].toLowerCase()).digest("hex"))' someone@example.com
npx wrangler kv key delete "sub:<that hash>" --binding SUBSCRIBERS --remote
```

Then append a row to [deletion-log.md](deletion-log.md) — date and the hashed
key only, never the address. This is a manual command with no admin endpoint
behind it, so the log is the only record that it happened.

## Rollback

```bash
npx wrangler deployments list
npx wrangler rollback --message "reason"
```

Assets and worker roll back together. HTML is `must-revalidate`, so a rollback is
visible immediately; hashed assets are immutable and unaffected.

**The deploy workflow does this itself.** If a deploy succeeds but then fails its
smoke test, the workflow runs `wrangler rollback` to the version uploaded before
it, waits for `/api/health` to report ready, and still ends red, so a bad deploy
is visible even though it was undone. It does nothing when the build or the tests
fail, because nothing was deployed. A rollback changes code only: KV data and
bindings are untouched, and Cloudflare refuses one if a binding the older version
uses has since been deleted. If the automatic rollback fails, the run says so and
you roll back by hand as above. ADR-020.

## Verifying a deploy

```bash
curl -sI https://vroelabs.com | grep -i "content-security-policy\|strict-transport"
curl -s -o /dev/null -w '%{http_code}\n' https://vroelabs.com/trove          # 200
curl -s -o /dev/null -w '%{redirect_url}\n' https://www.vroelabs.com/         # apex
curl -s https://vroelabs.com/api/health                                       # ready:true
curl -s https://vroelabs.com/robots.txt
```

Then submit the form once for real and read the record back out of KV.

## If a deploy fails

| Symptom | Cause |
| --- | --- |
| "not of type 'function or ExportedHandler'" | A non-function named export in `worker/index.js`. ADR-007 |
| Security headers missing in production | `run_worker_first` disabled. ADR-008 |
| `/trove` returns 307 | `html_handling` is not `drop-trailing-slash` |
| Build fails, "Vite manifest not found" | `vite build` did not run before the prerenderer |
| Build fails, "Evidence data failed validation" | A figure lacks a source, is older than 2024, or cannot be recomputed. See [10-evidence.md](10-evidence.md) |
| Smoke test: "still cannot be reached" | The workers.dev address did not resolve. Check `workers_dev` in `wrangler.jsonc` and the account's workers.dev subdomain |
| Custom domain not resolving | First deploy can take a few minutes to provision the certificate |
