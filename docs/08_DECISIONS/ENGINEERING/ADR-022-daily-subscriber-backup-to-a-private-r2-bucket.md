# ADR-022 — Daily subscriber backup to a private R2 bucket

**Status:** Approved · **Last updated:** 2026-09-20 · **Owner:** Vroe Labs · **Version:** 1.0

**Category:** Engineering · **Recorded:** 2026-09-20

**Decision.** The early-access list (`SUBSCRIBERS` KV) is copied every day to a
private R2 bucket, `vroe-labs-backups`, and 30 days of copies are kept.

- A Cron Trigger (`23 3 * * *`, 03:23 UTC) runs the Worker's `scheduled()` handler,
  which calls `code/worker/backup.js`.
- One file per day, `subscribers/YYYY-MM-DD.json`, in the exact format
  `wrangler kv bulk put` reads (`{ key, value, expiration, metadata }`), so a restore
  needs no custom code and each record keeps its expiry.
- The same run deletes dated snapshots older than 30 days.
- Whether it is working is reported by three booleans on `/api/health`, deliberately
  outside `ready`, and watched by the scheduled health check.
- The privacy policy states the backup and its 30-day retention.

**Context.** The list is the one dataset that cannot be rebuilt from the repository,
and it had no backup: a deleted or corrupted namespace would have lost it. The
documentation system's `BACKUPS.md` had to say so, and offered three options: a
manual export, a scheduled export to GitHub, or nothing. Dev asked for a backup and
chose the R2 bucket and 30 days on 2026-09-20.

**Reason.** It is the lowest-cost option that meets the need. It adds no vendor and
no new place for personal data to live: Cloudflare already holds the list and is the
processor the privacy policy names. It is automatic, so it does not depend on anyone
remembering. Restoring uses Wrangler commands already used for this list.

**Evidence.**

- The whole path was run locally on 2026-09-20 under Wrangler's real runtime: 25
  seeded records with expiries and metadata, the scheduled trigger, the snapshot
  fetched with `wrangler r2 object get`, expired records filtered, `wrangler kv bulk
  put` into a fresh store. The same keys, expiries, metadata and values came back.
  Not yet run against production.
- A unit-test suite (`tests/backup.test.mjs`), including a restore round trip, the
  retention window across month, year and leap-day boundaries, an atomicity check,
  and a check that no address reaches a log.
- Cloudflare's documentation, read on 2026-09-20: a Free plan Worker may make 1,000
  requests to Cloudflare services per invocation and a KV bulk read counts as one;
  KV `list()` returns each key's `expiration` and `metadata`; R2 `delete()` takes up
  to 1,000 keys; deploying a Worker with an R2 binding needs only Workers Editor;
  the R2 free tier is 10 GB-month, 1 million writes and 10 million reads a month,
  with free egress; the Free plan's CPU limit for a cron run is 10 ms.
- Serialising a snapshot cost about 0.3 ms of CPU per 1,000 subscribers in a Node
  measurement. That is an estimate, not a platform measurement.

**Cost.** $0 a month within the free tiers: a snapshot is about 0.3 MB per 1,000
subscribers, 30 are kept, and the job makes a few dozen requests a day. **Unknown:**
whether the account can enable R2 without a payment method; the first
`wrangler r2 bucket create` will say. Complexity: one module of about 200 lines, one
binding, one cron trigger, and a retention constant that lives in three places (the
job, the privacy policy and the documentation), which a test keeps in step.

**Alternatives.**

- **A manual export only** (option 1 in `BACKUPS.md`). Free and simple, but it
  depends on someone remembering, so it is not a backup in practice. Kept as a
  complement, and as the only protection against losing the whole account.
- **A scheduled GitHub workflow** (option 2). Automatic and off-account, but it puts
  subscriber data into GitHub Actions storage and secrets, a second processor that
  needs a privacy review and a policy change first. Not chosen; revisit if account
  loss becomes the concern.
- **A second KV namespace.** No cheaper, no safer, and KV's free tier allows only
  1,000 writes a day.
- **Do nothing** (option 3). Acceptable only if chosen knowingly. It was not.

**Consequences.**

- The deploy binds the bucket, so **the bucket must exist before the pull request is
  merged**, or the deploy fails (production keeps serving the previous version).
- Until the first backup runs there is nothing to be stale, so the health check is
  quiet; the first backup is run by hand before merging.
- `handleHealth` became asynchronous and `/api/health` gained three booleans. `ready`,
  which the deploy's smoke test and automatic rollback depend on, is unchanged.
- A removal request now takes up to 30 days to leave the backups. The privacy policy
  says so, and a restore must be followed by re-applying the deletion log.
- The privacy policy changed, and its effective date moved to 2026-09-20. It promises
  that material changes to how existing addresses are treated will be announced to
  the list. Whether adding a 30-day backup is such a change is Dev's call, not this
  record's.
- Losing the whole Cloudflare account still loses the list and its backups.
- The job stops at 900 requests to Cloudflare services (about 80,000 subscribers)
  and would meet the 10 ms CPU limit somewhere in the low tens of thousands, by
  estimate. Either fails loudly and writes nothing partial.

**Revisit condition.** The list approaches the limits above; the Cloudflare account
is judged a single point of failure worth an off-account automatic copy; the
retention period or the processor changes; or the first production restore drill
shows the recovery-time target is wrong.

**Approved by.** Dev — **Date.** 2026-09-20. Dev chose the R2 bucket and the 30-day
retention and approved the plan. The privacy-policy wording and the recovery-time
targets are proposals flagged for Dev's review in the pull request.
