# Disaster recovery

**Status:** Draft · **Last updated:** 2026-09-20 · **Owner:** Vroe Labs · **Version:** 1.0

Getting back from losing something larger than a bad deploy. **None of the recovery
paths below has been rehearsed**: there has been no restore drill, and no recovery
time or recovery point objective has been set. They are the steps the repository
supports, in the order they would be tried.

| What was lost | Recover by | What cannot be recovered |
| --- | --- | --- |
| A bad version is live | [ROLLBACKS.md](ROLLBACKS.md) | Nothing |
| The Cloudflare token or Turnstile secret is exposed | [INCIDENTS.md](INCIDENTS.md); reissue and store again ([RUNBOOKS/CLOUDFLARE-API-TOKEN.md](RUNBOOKS/CLOUDFLARE-API-TOKEN.md)) | Nothing |
| The Worker is deleted | Rebuild and redeploy from the repository: `npm ci`, `npm run build`, `npx wrangler deploy`, then set the Turnstile secret | Nothing in the site itself. KV data is separate |
| A KV namespace is deleted | Create a new one, put its id in `wrangler.jsonc`, redeploy | **The subscriber list**, unless it was exported ([BACKUPS.md](BACKUPS.md)) |
| The GitHub repository is lost | Push from any local clone | Whatever was never cloned. There is no second remote |
| The domain lapses or is lost | Recover it with the registrar (Cloudflare), then redeploy so the custom domains bind again | Nothing, if recovered in time |

## A rebuild from nothing

1. Recreate the repository from a clone; `cd code`, `npm ci`, `npm run build`.
2. `npx wrangler kv namespace create` for `RATE_LIMIT` and `SUBSCRIBERS`; update the
   ids in `wrangler.jsonc`.
3. Create the Turnstile widget; put the site key in `wrangler.jsonc` and set the
   secret with `wrangler secret put TURNSTILE_SECRET_KEY`.
4. Create the API token and the two GitHub secrets, set `WORKER_URL`
   ([INFRASTRUCTURE.md](../05_ENGINEERING/INFRASTRUCTURE/INFRASTRUCTURE.md)).
5. Deploy, verify ([RUNBOOKS/DEPLOY.md](RUNBOOKS/DEPLOY.md)), and restore the list if
   an export exists.

Setting recovery objectives, and running this once against a scratch account, is
open work.
