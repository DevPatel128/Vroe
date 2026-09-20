# Restore the subscriber list

**Status:** Approved · **Last updated:** 2026-09-20 · **Owner:** Vroe Labs · **Version:** 1.0

Putting the early-access list back from a daily backup. What the backup is, and what
it does not cover, is [BACKUPS.md](../BACKUPS.md). Every command runs in `code/`
(`cd code`) with Wrangler logged in to the Cloudflare account.

**Two things to know before you start.**

1. Restoring *writes* records into the live namespace. It adds and overwrites keys;
   it never removes any. That makes it safe to run when part of the list is missing.
2. A backup can contain people who have since asked to be removed. **Step 4 is not
   optional**: it removes them again. Skip it and the privacy policy is untrue.

## 1. Find the snapshot

```bash
npx wrangler r2 object get vroe-labs-backups/subscribers/latest.json --file latest.json --remote
cat latest.json    # {"date":"YYYY-MM-DD","count":N}
```

Use the newest unless you are recovering from something that was already wrong on
that day (a bad import, an accidental delete); then pick an older date. Snapshots
are named by date and thirty are kept. Wrangler cannot list a bucket, so to see which
exist open the Cloudflare dashboard, R2, `vroe-labs-backups`, `subscribers/`, or
just ask for a date in step 2: a date outside the window is reported as not found.

## 2. Download it

```bash
npx wrangler r2 object get vroe-labs-backups/subscribers/YYYY-MM-DD.json --file snapshot.json --remote
```

## 3. Drop records that have expired since, then write it back

`kv bulk put` refuses an expiry that is already in the past, and an old snapshot will
hold some. This keeps everything that still has more than two minutes to live:

```bash
node -e 'const fs=require("fs");const now=Math.floor(Date.now()/1000);const all=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));const keep=all.filter(e=>e.expiration===undefined||e.expiration>now+120);fs.writeFileSync(process.argv[2],JSON.stringify(keep));console.log(`${keep.length} of ${all.length} records kept; ${all.length-keep.length} had already expired`)' snapshot.json restore.json
npx wrangler kv bulk put restore.json --binding SUBSCRIBERS --remote
```

Each record comes back with the expiry and metadata it had, so no one's 730 days
restart.

## 4. Re-apply the deletion log

Open [DELETION-LOG.md](DELETION-LOG.md). For every row dated **after the snapshot's
date**, delete that hashed key again:

```bash
npx wrangler kv key delete "sub:<hash from the log>" --binding SUBSCRIBERS --remote
```

(Rows before the snapshot's date are already absent from it.) Add a row to the log
saying a restore happened, the snapshot date and how many were re-deleted.

## 5. Check, then clean up

```bash
npx wrangler kv key list --binding SUBSCRIBERS --remote | grep -c '"name"'
```

The count should be close to the snapshot's `count`, less the records dropped in step
3 and the deletions in step 4. Then remove the local copies; they are personal data:

```bash
rm snapshot.json restore.json latest.json
```

Never commit them. The health check (`/api/health`) does not measure a restore, so
this count is the check.

## Practising without touching production

Everything above works against Wrangler's local simulation by replacing `--remote`
with `--local --persist-to <a scratch directory>`; use a different directory for the
"live" and the "restored" store and compare their `kv key list` output. That is how
the first rehearsal was run, on 2026-09-20 ([DISASTER-RECOVERY.md](../DISASTER-RECOVERY.md)).
