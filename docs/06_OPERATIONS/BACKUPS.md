# Backups

**Status:** Approved · **Last updated:** 2026-09-20 · **Owner:** Vroe Labs · **Version:** 1.0

What is backed up, where, how often, for how long, and how it comes back. The one
dataset that cannot be rebuilt from the repository is the early-access list. It is
copied to the maintainer's own computer, in the repository folder, by one command.
The decision and its reasons are [ADR-022](../08_DECISIONS/ENGINEERING/ADR-022-subscriber-backup-to-the-maintainers-computer.md).

## Where it stands today

Dated facts, to be kept current.

| | Status, 2026-09-20 |
| --- | --- |
| The backup command and its tests | Written and passing. The last test backs up a real (local) KV namespace, restores it into a fresh one, and compares them |
| A backup of production exists | **Yes, one, made 2026-09-20** by running the command against the live namespace. The record count matched the live listing; the count is not recorded here |
| Anything runs it on a schedule | **No.** It runs when someone runs it. See "What makes it happen" |
| Restore rehearsed against production | **Yes, once, 2026-09-20**: that backup was restored into a scratch *local* store, and its keys, expiries, metadata and value (compared by hash) matched production. Production itself was not written to ([DISASTER-RECOVERY.md](DISASTER-RECOVERY.md)) |

## What is backed up

| Thing | Backed up? | Notes |
| --- | --- | --- |
| `SUBSCRIBERS` KV: the early-access list | **Yes, on demand** | Every key, with its value, its expiry and its metadata |
| Source code, docs, workflows | Yes, in Git | GitHub holds the only remote copy known to this repository. Any clone is another |
| `RATE_LIMIT` KV | Not needed | Throwaway counters that expire on their own |
| Secrets (`TURNSTILE_SECRET_KEY`, `CLOUDFLARE_API_TOKEN`) | Not needed | They can be reissued; nothing depends on the old value ([INCIDENTS.md](INCIDENTS.md)) |
| Cloudflare configuration | In the repository | `wrangler.jsonc` declares the Worker, routes and bindings; DNS and zone settings are in the dashboard and listed in [INFRASTRUCTURE.md](../05_ENGINEERING/INFRASTRUCTURE/INFRASTRUCTURE.md) |

## How it works

```bash
cd code
npm run backup          # writes ../backups/subscribers/YYYY-MM-DD.json
npm run backup:check    # exits non-zero if the backup is stale, or an old one was kept
```

`npm run backup` (`code/scripts/backup-subscribers.mjs`) reads the live `SUBSCRIBERS`
namespace through Wrangler, using the maintainer's own `wrangler login`. No
Cloudflare token, secret or CI job is involved, and the Worker is not changed.

- **Where.** `backups/subscribers/` in the repository folder, which is gitignored: a
  test fails if git would ever track a file there. The folder and files are readable
  only by their owner.
- **Format.** A JSON array of `{ key, value, expiration, metadata }`, which is exactly
  what `wrangler kv bulk put` reads. Restoring needs no custom code, and each record
  keeps the expiry it had, so nobody's 730 days restart.
- **Retention.** 30 days: the newest 30 dated files (today and the 29 before it). Each
  run deletes the older ones, and any half-written file a crashed run left behind. Only
  files named like a dated snapshot are ever deleted. The privacy policy states this
  number and a test fails if the two disagree.
- **All or nothing.** The file is written last and renamed into place. If a read fails
  part-way, nothing is written and earlier backups are untouched.
- **Nothing personal is printed.** The command prints a date and counts, never a key or
  an address. A test enforces it.

## What makes it happen

**Nothing yet.** The command does not run itself: the Cloudflare cron that would have
run it in the cloud was set aside when the backup moved to this computer, because a
Worker cannot write to a laptop. A backup someone must remember is not a backup, so
schedule it: a daily task on the Mac (launchd) that runs `npm run backup`, and
`npm run backup:check` somewhere you will see it fail. Installing one changes the Mac's
login items, so it has not been done here. It needs the Mac to be on and online at the
time, and macOS runs a missed launchd job when it wakes.

Until it is scheduled, the **recovery point is however long since someone last ran it**.
With a daily schedule and the Mac awake it is up to 24 hours.

## Set up once

1. **Run it and check it.** `npm run backup`, then `npm run backup:check`.
2. **Keep the folder out of other backups and syncs.** Every copy of a snapshot is a copy
   of the address list that the 30-day promise does not reach. Exclude `backups/` from
   Time Machine (`tmutil addexclusion "<path to the backups folder>"`) and keep it out of
   any cloud-synced folder. On 2026-09-20 Finder's preference for iCloud Drive "Desktop &
   Documents" read as off on this Mac; check it if the repository ever moves.
3. **Encrypt the disk.** FileVault (System Settings, Privacy and Security) protects the
   files if the laptop is lost or stolen. Not verified from here; it is the maintainer's
   setting.

## Objectives

| | |
| --- | --- |
| **Recovery point** | Up to 24 hours once scheduled and the Mac is on; unbounded until then |
| **Retention** | 30 days of daily files |
| **Recovery time** | A target, not yet measured against production; see [DISASTER-RECOVERY.md](DISASTER-RECOVERY.md) |

## Restore

[RUNBOOKS/RESTORE-SUBSCRIBERS.md](RUNBOOKS/RESTORE-SUBSCRIBERS.md). The short version:
pick a file, drop records that have since expired, `kv bulk put` it, then **re-apply the
deletion log**, or people who asked to be removed come back.

## What this does not protect against

- **Losing or breaking the computer.** The backups exist only there, and the point of
  excluding them from Time Machine is that they are not copied anywhere else. If a
  second copy is wanted, make an encrypted one by hand and store it deliberately
  ("A copy kept elsewhere", below).
- **Nobody running it.** Nothing alerts if the command stops. `npm run backup:check` says
  so, but only when it is run.
- **A wiped list you do not notice.** Every day's file reflects that day's live list, so
  if the list is emptied by mistake and nobody notices for 30 days, the last good file is
  deleted on schedule. Retention is short on purpose, for privacy.
- **Deletion requests, immediately.** Removing someone deletes them from the live list at
  once and from every backup within 30 days, when the files that held them are deleted.
  That is the privacy policy's promise, and it means a restore can resurrect them, hence
  the deletion-log step.

## Limits

`wrangler kv bulk get` is in open beta, and its answer differs between production (`{ key: value }`) and Wrangler's local simulation (`{ key: { value } }`); the script reads both, refuses a shape it does not know, and refuses to write an empty backup of a non-empty list. The first run against production found that difference. The command reads 100 keys per call. Cloudflare's
free KV tier allows 100,000 key reads and 1,000 list requests a day, which a daily
backup of anything near that size would meet before anything else does. Nothing here has
measured the list against those limits: the count is one command
([RESTORE-SUBSCRIBERS.md](RUNBOOKS/RESTORE-SUBSCRIBERS.md), step 4).

## A copy kept elsewhere

The maintainer's computer is one place. To keep an off-computer copy, encrypt a file
before it leaves the machine:

```bash
openssl enc -aes-256-cbc -pbkdf2 -iter 600000 -salt -in backups/subscribers/YYYY-MM-DD.json -out YYYY-MM-DD.json.enc
```

`openssl` asks for a passphrase; keep it in a password manager, not next to the file.
Decrypt with `openssl enc -d -aes-256-cbc -pbkdf2 -iter 600000 -in YYYY-MM-DD.json.enc -out snapshot.json`.
Never commit a snapshot, encrypted or not: the address list is personal data and the
repository is becoming public.

## Approval

Approved by Dev, 2026-09-20. Dev chose to store the backup on the maintainer's own
computer, in the Vroe folder, and to drop the R2 bucket, and chose 30 days' retention.
