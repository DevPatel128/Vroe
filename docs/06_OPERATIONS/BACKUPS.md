# Backups

**Status:** Approved · **Last updated:** 2026-09-20 · **Owner:** Vroe Labs · **Version:** 1.0

What is backed up, where, how often, for how long, and how it comes back. The one
dataset that cannot be rebuilt from the repository is the early-access list, and
it is backed up every day to a private R2 bucket. The decision and its reasons are
[ADR-022](../08_DECISIONS/ENGINEERING/ADR-022-daily-subscriber-backup-to-a-private-r2-bucket.md).

## Where it stands today

Dated facts, to be kept current; the design below is what runs once they are done.

| | Status, 2026-09-20 |
| --- | --- |
| The backup job and its tests | Written and passing (`npm run test:backup`) |
| Restore rehearsed | **Locally, once**: real `wrangler dev` runtime, the scheduled trigger, `wrangler r2 object get`, `wrangler kv bulk put` into a fresh store; keys, expiries, metadata and values identical. Not yet against production ([DISASTER-RECOVERY.md](DISASTER-RECOVERY.md)) |
| The private bucket `vroe-labs-backups` exists | Not yet. It must exist before the pull request that binds it is merged, because the deploy binds it |
| A backup exists in production | Not yet. Run the first one by hand before merging ([PRODUCTION-CHECKLIST.md](RUNBOOKS/PRODUCTION-CHECKLIST.md)); otherwise there is none until 03:23 UTC the day after the deploy |

## What is backed up

| Thing | Backed up? | Notes |
| --- | --- | --- |
| `SUBSCRIBERS` KV: the early-access list | **Yes, daily** | Every key, with its value, its expiry and its metadata |
| Source code, docs, workflows | Yes, in Git | GitHub holds the only remote copy known to this repository. Any clone is another |
| `RATE_LIMIT` KV | Not needed | Throwaway counters that expire on their own |
| Secrets (`TURNSTILE_SECRET_KEY`, `CLOUDFLARE_API_TOKEN`) | Not needed | They can be reissued; nothing depends on the old value ([INCIDENTS.md](INCIDENTS.md)) |
| Cloudflare configuration | In the repository | `wrangler.jsonc` declares the Worker, routes, bindings and the cron trigger; DNS and zone settings are in the dashboard and listed in [INFRASTRUCTURE.md](../05_ENGINEERING/INFRASTRUCTURE/INFRASTRUCTURE.md) |

## How it works

A Cron Trigger fires the Worker's `scheduled` handler every day at `23 3 * * *`
(03:23 UTC). It reads the whole `SUBSCRIBERS` namespace, writes it to the private
R2 bucket `vroe-labs-backups` (binding `BACKUPS`) as `subscribers/YYYY-MM-DD.json`,
moves the pointer `subscribers/latest.json` to it, and deletes dated snapshots that
have left the retention window. The code is `code/worker/backup.js`.

- **Format.** A JSON array of `{ key, value, expiration, metadata }`, which is
  exactly what `wrangler kv bulk put` reads. Restoring therefore needs no custom
  code, and each record keeps the expiry it had, so nobody's 730 days restart.
- **Retention.** 30 days: the newest 30 snapshots (today and the 29 before it).
  Older ones are deleted by the same run, by the date in the file name, and only
  files named like a dated snapshot are ever deleted. The privacy policy states this
  number and a test fails if the two disagree.
- **All or nothing.** The snapshot is built in memory and stored with one write.
  If anything fails first, the previous snapshots are untouched and the run is
  reported as failed. The pointer moves only after its snapshot exists.
- **No addresses in logs.** The job logs a date, a count and a size, never a key or
  an address.
- **Private.** The bucket has no public URL and no custom domain. Nothing in the
  Worker serves it.

## What tells you it broke

`/api/health` carries three booleans: `backups_r2` (the bucket is bound),
`backup_ever` (a backup has been written) and `backup_recent` (the newest is under
36 hours old). They are deliberately **not** part of `ready`, so a stale backup can
never trigger the automatic rollback of a good deploy. The scheduled health check
(`.github/workflows/health.yml`) fails, and GitHub emails, when the bucket is not
bound, or when a backup once existed and is no longer recent, or when R2 cannot be
read. See [OBSERVABILITY.md](OBSERVABILITY.md).

One blind spot, on purpose: before the first backup ever runs there is nothing to be
stale, so the check stays quiet. That is why the first backup is run by hand before
merging. A cron that never fires after that first run is caught at 36 hours.

## Objectives

| | |
| --- | --- |
| **Recovery point** | Up to 24 hours: whoever subscribed after the last 03:23 UTC run is not in the newest snapshot. They can sign up again |
| **Retention** | 30 days of daily snapshots |
| **Recovery time** | A target, not yet measured against production; see [DISASTER-RECOVERY.md](DISASTER-RECOVERY.md) |

## Restore

[RUNBOOKS/RESTORE-SUBSCRIBERS.md](RUNBOOKS/RESTORE-SUBSCRIBERS.md). The short
version: download a snapshot, drop records that have since expired, `kv bulk put`
it, then **re-apply the deletion log**, or people who asked to be removed come back.

## What this does not protect against

- **Losing the Cloudflare account.** The backups live in the same account as the
  list, so a compromised or closed account takes both. The mitigation is a manual,
  encrypted copy kept somewhere else; see below. Nothing automatic does this,
  because moving subscriber data out of Cloudflare needs its own privacy review
  (option 2 in the decision record).
- **A wiped list you do not notice.** Every day's snapshot reflects that day's live
  list, so if the list is emptied by mistake and nobody notices for 30 days, the
  last good snapshot is deleted on schedule. Retention is kept short on purpose, for
  privacy.
- **Deletion requests, immediately.** Removing someone deletes them from the live
  list straight away and from every backup within 30 days, when the snapshots that
  held them age out. That is the privacy policy's promise, and it means a restore
  can resurrect them, hence the deletion-log step above.

## Limits

The job runs inside the Workers Free plan's limits. These are the ones that matter:

| Limit | Where it bites | Effect |
| --- | --- | --- |
| 1,000 requests to Cloudflare services per run | About 80,000 subscribers: the job stops at 900 to leave headroom, and one request lists 1,000 keys while another reads 100 | The job refuses to run and writes nothing, with an error that says so |
| 10 ms of CPU per cron run | Serialising the snapshot cost about 0.3 ms per 1,000 subscribers in a Node measurement. That is an estimate of the Worker's cost, not a platform measurement, and it suggests trouble somewhere in the low tens of thousands | The run is killed and shows as failed; the health check goes stale after 36 hours |
| KV free tier: 1,000 list requests and 100,000 keys read per day | The same order of size | Reads fail; the run fails loudly |

Nothing here has measured the list against these limits. The count is one command
([RESTORE-SUBSCRIBERS.md](RUNBOOKS/RESTORE-SUBSCRIBERS.md), step 5); compare it to
this table before the list gets large. The remedy when one bites is the Workers
Paid plan ($5 a month at the time of writing), which raises CPU to 30 seconds for a
cron run and the request limit far beyond this, or splitting the job by key range.

## A manual copy that survives losing the account

Do this occasionally, and before anything risky. It needs Wrangler logged in and
`openssl`, both already used here.

```bash
cd code
npx wrangler r2 object get vroe-labs-backups/subscribers/latest.json --file latest.json --remote
# latest.json names the newest snapshot: {"date":"YYYY-MM-DD","count":N}
npx wrangler r2 object get vroe-labs-backups/subscribers/YYYY-MM-DD.json --file snapshot.json --remote
openssl enc -aes-256-cbc -pbkdf2 -iter 600000 -salt -in snapshot.json -out snapshot.json.enc
rm snapshot.json latest.json
```

`openssl` asks for a passphrase; choose one you will not lose, and keep it in a
password manager, not next to the file. Store `snapshot.json.enc` somewhere that is
not Cloudflare and not this repository. To read it back:

```bash
openssl enc -d -aes-256-cbc -pbkdf2 -iter 600000 -in snapshot.json.enc -out snapshot.json
```

Never commit a snapshot, encrypted or not. The address list is personal data, and
the repository is becoming public.

## Approval

Approved by Dev, 2026-09-20. The retention period (30 days) and the choice of an R2
bucket were Dev's decisions, recorded in ADR-022.
