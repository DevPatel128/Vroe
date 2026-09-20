# ADR-022 — Subscriber backup to the maintainer's computer

**Status:** Approved · **Last updated:** 2026-09-20 · **Owner:** Vroe Labs · **Version:** 1.0

**Category:** Engineering · **Recorded:** 2026-09-20

**Decision.** The early-access list (`SUBSCRIBERS` KV) is backed up to the maintainer's
own computer, in the repository folder, by one command, and 30 days of files are kept.

- `npm run backup` (`code/scripts/backup-subscribers.mjs`) reads the live namespace through
  Wrangler with the maintainer's own login and writes `backups/subscribers/YYYY-MM-DD.json`.
- The file is in the exact format `wrangler kv bulk put` reads (`{ key, value, expiration,
  metadata }`), so a restore needs no custom code and each record keeps its expiry.
- The same run deletes files older than 30 days. `npm run backup:check` fails if the newest
  backup is not from today or yesterday, or an old one was kept.
- `backups/` is gitignored, a test proves it, and files are readable only by their owner.
- The privacy policy states that backups are kept on a Vroe Labs computer for 30 days.
- Nothing schedules the command yet.

**Context.** The list is the one dataset that cannot be rebuilt from the repository, and it
had no backup: a deleted or corrupted namespace would have lost it. `BACKUPS.md` offered
three options. Dev asked for a backup and first chose a private R2 bucket with 30 days'
retention. A daily Cron Trigger and `worker/backup.js` were built and tested for it. Before
it was merged, Dev directed that the backup be stored on their own computer in the Vroe
folder, and chose to drop R2 rather than keep both. The R2 work is in the branch's history
and was removed.

**Reason.** It needs no Cloudflare account change: no bucket to create, no R2 to enable,
no payment method, no deploy that can fail on a missing resource. Subscriber data is not
put in a second place inside the account it is protecting, so losing the Cloudflare account
does not lose the backups. It costs nothing, and it uses the Wrangler commands already used
for this list.

**Evidence.**

- A test suite (`tests/backup.test.mjs`): a restore round trip, the retention window across
  month, year and leap-day boundaries, atomic writes, that git can never track `backups/`,
  and that nothing personal is printed. Its last test backs up a real (local) KV namespace
  through Wrangler, restores it into a fresh one and compares them; it runs on every CI run.
- The same path was run against Wrangler's local simulation on 2026-09-20 and the lists were
  identical. **Not yet run against production**: the remote flags and Cloudflare's
  open-beta `wrangler kv bulk get` are exercised only by that simulation.
- Finder's preference for iCloud Drive "Desktop & Documents" read as off on 2026-09-20.

**Cost.** $0. The recurring cost is the maintainer's attention, because nothing runs the
command on its own, and disk space (about 0.3 MB per 1,000 subscribers a day, 30 kept).

**Alternatives.**

- **A private R2 bucket and a Cron Trigger** (the first choice). Automatic, and watched by
  the scheduled health check, but it needs the bucket created before merge, R2 enabled,
  possibly a payment method, and it keeps the backups in the same account as the list.
  Built, tested, then set aside at Dev's direction. It remains a sound design if
  automation matters more than independence from the account.
- **Both.** R2 for automation and a local copy for independence. Dev chose local only.
- **A scheduled GitHub workflow.** Automatic and off-account, but it puts subscriber data
  into GitHub Actions storage and secrets, a second processor that needs a privacy review.
- **Do nothing.** Acceptable only if chosen knowingly. It was not.

**Consequences.**

- **Nothing runs the command.** A backup someone must remember is weak. The recovery point
  is the time since it was last run, until it is scheduled (a daily launchd task on the Mac
  is the natural way; it changes the Mac's startup configuration, so it has not been
  installed) and something makes `backup:check` visible.
- **CI cannot see it.** The health check watches the site, not the maintainer's laptop.
- **The copies must stay in one place.** Time Machine or a cloud-synced folder would keep
  files past the 30 days the policy states. The folder must be excluded from both, and the
  disk encrypted. Those are the maintainer's settings, documented in `BACKUPS.md`.
- **The backups depend on one computer.** Losing it loses the backup history, though not
  the live list. Losing it *and* the Cloudflare account loses the list.
- The privacy policy changed, and its effective date moved to 2026-09-20. It promises that
  material changes to how existing addresses are treated will be announced to the list.
  Whether adding a 30-day backup is such a change is Dev's call, not this record's.
- A removal request takes up to 30 days to leave the backups, and a restore must be followed
  by re-applying the deletion log.

**Revisit condition.** A backup is missed because nobody ran the command; the list grows
toward Cloudflare's free KV limits; the computer or its setup changes (a second maintainer,
a new machine, synced folders); or automation becomes worth more than independence from the
account, in which case the R2 design is the starting point.

**Approved by.** Dev — **Date.** 2026-09-20. Dev chose to store the backup on their own
computer in the Vroe folder, chose to drop R2, and chose 30 days' retention. The
privacy-policy wording and the recovery-time targets are proposals flagged for Dev's review.
