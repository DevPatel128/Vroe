# Disaster recovery

**Status:** Approved · **Last updated:** 2026-09-20 · **Owner:** Vroe Labs · **Version:** 1.0

Getting back from losing something larger than a bad deploy: what can be recovered,
from where, how much would be lost, and what has and has not been rehearsed.

## Objectives

| | |
| --- | --- |
| **Recovery point** for the subscriber list | Up to 24 hours. The backup runs daily ([BACKUPS.md](BACKUPS.md)); anyone who signed up since the last run must sign up again |
| **Recovery time** for the site | Rebuild and redeploy from the repository. A **target of one hour**, proposed here for Dev to confirm and not yet measured against a scratch account |
| **Recovery time** for the subscriber list | A **target of one hour** from a working Wrangler login. Not yet measured against production |
| Everything else | Nothing else is stored that cannot be rebuilt from the repository, so nothing else has an objective |

## What was lost, and how it comes back

| What was lost | Recover by | What cannot be recovered |
| --- | --- | --- |
| A bad version is live | [ROLLBACKS.md](ROLLBACKS.md) | Nothing |
| The Cloudflare token or Turnstile secret is exposed | [INCIDENTS.md](INCIDENTS.md); reissue and store again ([RUNBOOKS/CLOUDFLARE-API-TOKEN.md](RUNBOOKS/CLOUDFLARE-API-TOKEN.md)) | Nothing |
| The Worker is deleted | Rebuild and redeploy from the repository: `npm ci`, `npm run build`, `npx wrangler deploy`, then set the Turnstile secret | Nothing in the site itself. KV and R2 data are separate |
| The subscriber list is emptied, corrupted or its namespace deleted | [RUNBOOKS/RESTORE-SUBSCRIBERS.md](RUNBOOKS/RESTORE-SUBSCRIBERS.md), from the newest snapshot in the R2 bucket. If the namespace itself is gone, create a new one first (step 2 below) | Anyone who subscribed after the last 03:23 UTC run |
| The R2 bucket is deleted | Create it again (`npx wrangler r2 bucket create vroe-labs-backups`) and run the backup by hand: `npx wrangler dev --remote --test-scheduled`, then request `/__scheduled` (not yet exercised against the real account) | The 30 days of history. Today's list is still in KV, so the next run makes a fresh snapshot |
| The whole Cloudflare account is lost or locked | Only the encrypted manual copy, if one was made ([BACKUPS.md](BACKUPS.md), "A manual copy") | **The subscriber list and its backups**, unless a manual copy exists. This is the gap that remains |
| The GitHub repository is lost | Push from any local clone | Whatever was never cloned. There is no second remote |
| The domain lapses or is lost | Recover it with the registrar (Cloudflare), then redeploy so the custom domains bind again | Nothing, if recovered in time |

A restored list can contain people who have since asked to be removed. Re-applying
[DELETION-LOG.md](RUNBOOKS/DELETION-LOG.md) is part of every restore.

## A rebuild from nothing

1. Recreate the repository from a clone; `cd code`, `npm ci`, `npm run build`.
2. `npx wrangler kv namespace create` for `RATE_LIMIT` and `SUBSCRIBERS`; update the
   ids in `wrangler.jsonc`.
3. `npx wrangler r2 bucket create vroe-labs-backups`. It must exist before a deploy
   that binds it.
4. Create the Turnstile widget; put the site key in `wrangler.jsonc` and set the
   secret with `wrangler secret put TURNSTILE_SECRET_KEY`.
5. Create the API token and the two GitHub secrets, set `WORKER_URL`
   ([INFRASTRUCTURE.md](../05_ENGINEERING/INFRASTRUCTURE/INFRASTRUCTURE.md)).
6. Deploy, verify ([RUNBOOKS/DEPLOY.md](RUNBOOKS/DEPLOY.md)), then restore the list
   from a snapshot or a manual copy ([RUNBOOKS/RESTORE-SUBSCRIBERS.md](RUNBOOKS/RESTORE-SUBSCRIBERS.md)).

## What has been rehearsed

| Drill | Date | Result |
| --- | --- | --- |
| Backup and restore of the subscriber list, **locally**: 25 seeded records with expiries and metadata; the scheduled trigger run under Wrangler's real runtime; the snapshot fetched with `wrangler r2 object get`; expired records filtered; `wrangler kv bulk put` into a fresh store | 2026-09-20 | Identical: the same 25 keys, expiries, metadata and values |
| The same against production | Not yet run | To do once the bucket exists: run the first backup by hand, then restore it into a scratch namespace |
| A rebuild from nothing against a scratch account | Not yet run | Untested. The steps above are the ones the repository supports |

Rehearsals go in this table with their date. A recovery path that has not been
rehearsed should be described as untested, as it is here.

## Approval

Approved by Dev, 2026-09-20. The recovery time targets are proposals and are the
first thing to confirm or change.
