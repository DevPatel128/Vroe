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

## Rollback

```bash
npx wrangler deployments list
npx wrangler rollback --message "reason"
```

Assets and worker roll back together. HTML is `must-revalidate`, so a rollback is
visible immediately; hashed assets are immutable and unaffected.

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
