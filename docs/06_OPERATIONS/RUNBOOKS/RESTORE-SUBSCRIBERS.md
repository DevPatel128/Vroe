# Restore the subscriber list

**Status:** Approved · **Last updated:** 2026-09-20 · **Owner:** Vroe Labs · **Version:** 1.0

Putting the early-access list back from a backup on this computer. What the backup is,
and what it does not cover, is [BACKUPS.md](../BACKUPS.md). Every command runs in `code/`
(`cd code`) with Wrangler logged in to the Cloudflare account.

**Two things to know before you start.**

1. Restoring *writes* records into the live namespace. It adds and overwrites keys; it
   never removes any. That makes it safe to run when part of the list is missing.
2. A backup can contain people who have since asked to be removed. **Step 3 is not
   optional**: it removes them again. Skip it and the privacy policy is untrue.

## 1. Choose the file

The backups are `../backups/subscribers/YYYY-MM-DD.json`, one a day, thirty kept:

```bash
ls ../backups/subscribers
```

Use the newest unless you are recovering from something that was already wrong on that
day (a bad import, an accidental delete); then pick an older date.

## 2. Drop records that have expired since, then write it back

`kv bulk put` refuses an expiry that is already in the past, and an old file will hold
some. This keeps everything that still has more than two minutes to live:

```bash
node -e 'const fs=require("fs");const now=Math.floor(Date.now()/1000);const all=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));const keep=all.filter(e=>e.expiration===undefined||e.expiration>now+120);fs.writeFileSync(process.argv[2],JSON.stringify(keep),{mode:0o600});console.log(`${keep.length} of ${all.length} records kept; ${all.length-keep.length} had already expired`)' ../backups/subscribers/YYYY-MM-DD.json restore.json
npx wrangler kv bulk put restore.json --binding SUBSCRIBERS --remote
```

Each record comes back with the expiry and metadata it had, so no one's 730 days restart.

## 3. Re-apply the deletion log

Open [DELETION-LOG.md](DELETION-LOG.md). For every row dated **after the file's date**,
delete that hashed key again:

```bash
npx wrangler kv key delete "sub:<hash from the log>" --binding SUBSCRIBERS --remote
```

(Rows before the file's date are already absent from it.) Add a row to the log saying a
restore happened, the file's date and how many were re-deleted.

## 4. Check, then clean up

```bash
npx wrangler kv key list --binding SUBSCRIBERS --remote | grep -c '"name"'
```

The count should be close to the file's record count, less the records dropped in step 2
and the deletions in step 3. Then remove the working copy, which is personal data:

```bash
rm restore.json
```

Never commit it. Nothing else measures a restore, so this count is the check.

## Practising without touching production

Everything above works against Wrangler's local simulation by replacing `--remote` with
`--local --persist-to <a scratch directory>`; use a different directory for the "live"
and the "restored" store and compare their `kv key list` output. The last test in
`code/tests/backup.test.mjs` does exactly that on every run, and it was first run on
2026-09-20 ([DISASTER-RECOVERY.md](../DISASTER-RECOVERY.md)).
