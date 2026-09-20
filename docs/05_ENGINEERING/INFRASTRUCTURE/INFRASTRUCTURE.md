# Infrastructure

**Status:** Review · **Last updated:** 2026-09-20 · **Owner:** Vroe Labs · **Version:** 1.0

What runs where, and how it was set up. Cloudflare services are used only when they
solve a real requirement; the cost of each is in [COST.md](../COST/COST.md).

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
| R2 bucket | `vroe-labs-backups`, bound as `BACKUPS`. Private; holds the daily subscriber backups. It must exist before a deploy that binds it |
| Cron trigger | `23 3 * * *` (03:23 UTC daily): the subscriber backup |
| Turnstile site key | `0x4AAAAAAEjohAZuCMiZZM6u` (public) |
| Repo | `DevPatel128/Vroe` (private today; being prepared for public release) |

Other workers on this account — `trove`, `janki` — are unrelated. Do not touch
them, and do not create the `trove.vroelabs.com` DNS record from here; it belongs
to the Trove deploy.

Every command below assumes you're in `code/` (`cd code` first) — that's
where `package.json` and `wrangler.jsonc` live.

## What runs where

| Piece | Role |
| --- | --- |
| Worker `vroe-labs` | Every request goes through it (`run_worker_first`): security headers, the canonical-host redirect, the `/api/*` endpoints |
| Static assets | `dist/client`, served through the `ASSETS` binding. Only this directory is published |
| KV `SUBSCRIBERS`, `RATE_LIMIT` | The only stored data ([DATA.md](../DATA/DATA.md)) |
| R2 `BACKUPS` and the cron trigger | The daily backup of `SUBSCRIBERS`, kept 30 days ([BACKUPS.md](../../06_OPERATIONS/BACKUPS.md)) |
| Turnstile | The bot check on the subscribe form |
| DNS, custom domains | `vroelabs.com` and `www`, declared in `wrangler.jsonc` |
| Workers Logs | Error and request logs ([OBSERVABILITY.md](../../06_OPERATIONS/OBSERVABILITY.md)) |

Cloudflare rules followed: minimise public exposure; keep secrets out of source;
cache only where it cannot serve stale or wrong data (hashed assets immutable, HTML
`must-revalidate`, `/api/*` `no-store`); rate limit where abuse or cost warrants it;
keep Worker logic small and measurable; add no Cloudflare product without a
requirement.

## First-time setup

Both KV namespaces and the Turnstile widget already exist. The R2 bucket is new
([ADR-022](../../08_DECISIONS/ENGINEERING/ADR-022-daily-subscriber-backup-to-a-private-r2-bucket.md)). What remains:

**0. The R2 bucket** (once, and before merging the pull request that binds it,
because the deploy fails if the bucket is missing):

```bash
npx wrangler r2 bucket create vroe-labs-backups
```

R2 may need enabling on the account first; Cloudflare says if it also needs a
payment method. The free tier covers this use ([COST.md](../COST/COST.md)). Deploying
with the binding needs no extra token permission: Cloudflare documents Workers
Editor as enough to deploy a Worker with R2 or KV bindings.

**1. The Turnstile secret** (once, and after any rotation):

```bash
npx wrangler secret put TURNSTILE_SECRET_KEY
```

**2. The Cloudflare API token for CI.** OAuth cannot mint tokens, so this is a
dashboard step. The exact permissions, and how to store it, are in
[CLOUDFLARE-API-TOKEN.md](../../06_OPERATIONS/RUNBOOKS/CLOUDFLARE-API-TOKEN.md).
Use a scoped token, never a Global API Key, and rotate it immediately if exposure
is suspected ([INCIDENTS.md](../../06_OPERATIONS/INCIDENTS.md)).

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
