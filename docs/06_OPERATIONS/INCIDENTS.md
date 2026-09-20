# Incidents

**Status:** Review · **Last updated:** 2026-09-20 · **Owner:** Vroe Labs · **Version:** 1.0

What to do when something has gone wrong, and the record of what has. For a deploy
that misbehaves, see [RUNBOOKS/DEPLOY.md](RUNBOOKS/DEPLOY.md) and
[ROLLBACKS.md](ROLLBACKS.md).

## If a secret or subscriber data is exposed

The same flow applies to any exposure, not only the Cloudflare API token:
suspect → contain → rotate/revoke → assess → restore → verify → document →
review. Don't leave a known-exposed credential active while you investigate.

**`TURNSTILE_SECRET_KEY` leaks** (e.g. pasted somewhere public, or found in a
log). Generate a new secret pair in the Cloudflare Turnstile dashboard for the
`vroelabs.com` widget, set it with `wrangler secret put TURNSTILE_SECRET_KEY`,
and update `TURNSTILE_SITE_KEY` in `wrangler.jsonc` to match — the site key is
public by design and appears in every page's source, but it must stay paired
with the current secret. The old pair stops working the moment you rotate.

**`SUBSCRIBERS` or `RATE_LIMIT` KV data is exposed** (e.g. a Cloudflare
account-access incident, not a code bug — the worker never returns KV values
to a caller). Confirm what's actually in scope: `SUBSCRIBERS` keys are
SHA-256 hashes of email addresses, never the address itself (ADR-010), and
`RATE_LIMIT` holds only IP-derived throttle keys that expire on their own.
Rotate Cloudflare account credentials first, then assess whether the hashed
keys are reversible for the affected addresses (they generally aren't without
the original list) before deciding whether affected users need notifying.

**In every case:** revoke/rotate before investigating further, then record
what happened as a new ADR in [07-decisions.md](../08_DECISIONS/DECISIONS.md) — what was
exposed, how it was contained, and what changed to prevent it recurring.

## Incident log

Add a row for anything that reached production, or nearly did.

| Date | What happened | Impact | Response | Follow-up |
| --- | --- | --- | --- | --- |
| 2026-09-16 | Dependabot's Vite 6 to 8 pull request (#9) was merged while its `verify` check was failing. `scripts/prerender.mjs` imports esbuild directly and it had only arrived through Vite, so CI and Deploy went red on `main`. Nothing told anyone | None to visitors: the failed build never reached `wrangler deploy`, so the previous deploy kept serving. `main` was red until the fix | `esbuild` declared as a direct dependency | `main` now requires `verify`; a scheduled health check; automatic rollback ([ADR-019](../08_DECISIONS/ENGINEERING/ADR-019-declare-esbuild-as-a-direct-devdependency.md), [ADR-020](../08_DECISIONS/ENGINEERING/ADR-020-production-safeguards-a-required-check-a-health-check.md)) |
