# The subscriber list

**Status:** Review · **Last updated:** 2026-09-20 · **Owner:** Vroe Labs · **Version:** 1.0

Reading the early-access list and removing someone from it. What is stored, and why
it is designed this way, is in [DATA.md](../../05_ENGINEERING/DATA/DATA.md).

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

The daily backup ([BACKUPS.md](../BACKUPS.md)) still holds that record until the
snapshots that contain it age out, at most 30 days later; the privacy policy says so.
Do not go and edit backups by hand. It matters for one thing: if the list is ever
restored, the deletion log is how the person is removed again
([RESTORE-SUBSCRIBERS.md](RESTORE-SUBSCRIBERS.md), step 4).

Then append a row to [DELETION-LOG.md](DELETION-LOG.md) — date and the hashed
key only, never the address. This is a manual command with no admin endpoint
behind it, so the log is the only record that it happened.
