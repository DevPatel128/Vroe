# Data

**Status:** Review · **Last updated:** 2026-09-20 · **Owner:** Vroe Labs · **Version:** 1.0

What the site stores, for how long, and why. The site has no database, no accounts
and no cookies of its own; what it stores is a short list of email addresses and
some throwaway rate-limit counters.

## The stores

| Store | Holds | Lifetime |
| --- | --- | --- |
| `SUBSCRIBERS` (Workers KV) | One record per address that subscribed | 730 days from signup, then it expires |
| `RATE_LIMIT` (Workers KV) | A per-IP throttle counter, keyed on `cf-connecting-ip` | Expires on its own |

Why KV and not a database: one list of addresses does not need Postgres
([ADR-010](../../08_DECISIONS/ENGINEERING/ADR-010-cloudflare-kv-not-supabase.md)).
Migrating later is a change to one function, `storeSubscriber()`.

## The subscriber record

Key: `sub:<sha256(lowercased email)>`. Hashing the key deduplicates repeat
signups and keeps addresses out of key names — a KV key listing reveals nothing
about who subscribed.

Value: exactly four fields, matching the privacy policy word for word.

```json
{ "email": "...", "subscribed_at": "ISO-8601", "country": "IN", "consent": true }
```

No IP address, no user agent, no referrer. TTL 730 days, mirroring
`RETENTION_DAYS` in `src/content/legal.js` — **change both together**.

## Administration

There is no admin endpoint. Export is a documented CLI call:

```bash
npx wrangler kv key list --binding SUBSCRIBERS --remote
```

An endpoint that returns the list would need authentication; not having one is
simpler and strictly safer.

Reading the list, and honouring a deletion request, are procedures:
[SUBSCRIBER-LIST.md](../../06_OPERATIONS/RUNBOOKS/SUBSCRIBER-LIST.md). Each deletion
is recorded in [DELETION-LOG.md](../../06_OPERATIONS/RUNBOOKS/DELETION-LOG.md).

## Data minimisation

Collect, store and expose only what the product needs. For each field ask: why do
we need it, who needs access, how long, can we avoid storing it, and what happens
if it leaks. Less sensitive data means less risk, storage, burden and cost. The four
fields are listed word for word in the privacy policy.

## The privacy policy is written against this

`src/content/legal.js` describes exactly what the Worker stores. A mismatch is a
false statement to visitors. Change what the form stores and update `legal.js` in
the same change; `RETENTION_DAYS` exists in both `worker/index.js` and `legal.js`
and must stay in step.

## Backups

There are none. See [BACKUPS.md](../../06_OPERATIONS/BACKUPS.md).

## Before adding a database

Least-privilege credentials, row-level security, migration review, and backup and
restore testing come first. The full list of what must be closed before the site
grows is in [SECURITY.md](../SECURITY/SECURITY.md), "Risks that must be closed
before the site grows".
