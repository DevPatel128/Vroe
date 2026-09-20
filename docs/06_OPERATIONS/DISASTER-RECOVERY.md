# Disaster recovery

**Status:** Approved · **Last updated:** 2026-09-20 · **Owner:** Vroe Labs · **Version:** 1.0

Getting back from losing something larger than a bad deploy: what can be recovered,
from where, how much would be lost, and what has and has not been rehearsed.

## Objectives

| | |
| --- | --- |
| **Recovery point** for the subscriber list | Up to 24 hours once the backup is scheduled and the Mac is on; **unbounded until it is scheduled** ([BACKUPS.md](BACKUPS.md)). Anyone who signed up since the last run must sign up again |
| **Recovery time** for the site | Rebuild and redeploy from the repository. A **target of one hour**, proposed here for Dev to confirm and not yet measured against a scratch account |
| **Recovery time** for the subscriber list | A **target of one hour** from a working Wrangler login. Not yet measured against production |
| Everything else | Nothing else is stored that cannot be rebuilt from the repository, so nothing else has an objective |

## What was lost, and how it comes back

| What was lost | Recover by | What cannot be recovered |
| --- | --- | --- |
| A bad version is live | [ROLLBACKS.md](ROLLBACKS.md) | Nothing |
| The Cloudflare token or Turnstile secret is exposed | [INCIDENTS.md](INCIDENTS.md); reissue and store again ([RUNBOOKS/CLOUDFLARE-API-TOKEN.md](RUNBOOKS/CLOUDFLARE-API-TOKEN.md)) | Nothing |
| The Worker is deleted | Rebuild and redeploy from the repository: `npm ci`, `npm run build`, `npx wrangler deploy`, then set the Turnstile secret | Nothing in the site itself. KV data is separate |
| The subscriber list is emptied, corrupted or its namespace deleted | [RUNBOOKS/RESTORE-SUBSCRIBERS.md](RUNBOOKS/RESTORE-SUBSCRIBERS.md), from the newest file in `backups/subscribers/`. If the namespace itself is gone, create a new one first (step 2 below) | Anyone who subscribed after the last backup |
| The whole Cloudflare account is lost or locked | The backups are on this computer, not in the account, so they survive. Rebuild from nothing (below), then restore | Nothing beyond the last backup, if the computer is intact |
| The maintainer's computer is lost, stolen or broken | The live list is still in Cloudflare KV; make a fresh backup from a new machine. The repository is on GitHub | **The backup history**: nothing else holds the 30 days, by design ([BACKUPS.md](BACKUPS.md)). A stolen unencrypted disk is also a data breach: [INCIDENTS.md](INCIDENTS.md) |
| **Both** the Cloudflare account and the computer are lost | Nothing | **The subscriber list.** This is the gap that remains |
| The GitHub repository is lost | Push from any local clone | Whatever was never cloned. There is no second remote |
| The domain lapses or is lost | Recover it with the registrar (Cloudflare), then redeploy so the custom domains bind again | Nothing, if recovered in time |

A restored list can contain people who have since asked to be removed. Re-applying
[DELETION-LOG.md](RUNBOOKS/DELETION-LOG.md) is part of every restore.

## A rebuild from nothing

1. Recreate the repository from a clone; `cd code`, `npm ci`, `npm run build`.
2. `npx wrangler kv namespace create` for `RATE_LIMIT` and `SUBSCRIBERS`; update the
   ids in `wrangler.jsonc`.
3. Create the Turnstile widget; put the site key in `wrangler.jsonc` and set the secret
   with `wrangler secret put TURNSTILE_SECRET_KEY`.
4. Create the API token and the two GitHub secrets, set `WORKER_URL`
   ([INFRASTRUCTURE.md](../05_ENGINEERING/INFRASTRUCTURE/INFRASTRUCTURE.md)).
5. Deploy, verify ([RUNBOOKS/DEPLOY.md](RUNBOOKS/DEPLOY.md)), then restore the list from
   a backup ([RUNBOOKS/RESTORE-SUBSCRIBERS.md](RUNBOOKS/RESTORE-SUBSCRIBERS.md)).

## What has been rehearsed

| Drill | Date | Result |
| --- | --- | --- |
| Backup and restore of the subscriber list against Wrangler's **local** simulation: 25 seeded records with expiries and metadata; `npm run backup`; expired records filtered; `wrangler kv bulk put` into a fresh store; keys, expiries, metadata and values compared. It is the last test in `tests/backup.test.mjs`, so it also runs on every CI run | 2026-09-20 | Identical |
| The same with **production** as the source: `npm run backup` against the live namespace, then that file restored into a scratch *local* store and compared with production (keys, expiries, metadata, and the value by hash). Production was only read | 2026-09-20 | Identical. It also found a real bug the local rehearsal could not: production and the simulation answer `wrangler kv bulk get` in different shapes, so the first run wrote an empty backup of a one-record list. Fixed, and a backup can no longer be empty when the list is not |
| A restore *into production* | Not yet run | It only adds keys, so it can be tried against a scratch namespace in the account when one is worth creating |
| A rebuild from nothing against a scratch account | Not yet run | Untested. The steps above are the ones the repository supports |

Rehearsals go in this table with their date. A recovery path that has not been rehearsed
should be described as untested, as it is here.

## Approval

Approved by Dev, 2026-09-20. The recovery time targets are proposals and are the first
thing to confirm or change.
