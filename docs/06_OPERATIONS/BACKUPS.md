# Backups

**Status:** Draft · **Last updated:** 2026-09-20 · **Owner:** Vroe Labs · **Version:** 1.0

**There are none for the one dataset that matters.** This page exists so that fact
is written down, and so the choice about it is made deliberately.

## What there is to back up

| Thing | Backed up? | Notes |
| --- | --- | --- |
| Source code, docs, workflows | Yes, in Git | GitHub holds the only remote copy known to this repository. Any clone is another |
| `SUBSCRIBERS` KV: the early-access list | **No** | Nothing in this repository exports or copies it. If the namespace were deleted or corrupted the list would be lost. Whether Cloudflare could restore a deleted namespace is not something this repository relies on or has verified |
| `RATE_LIMIT` KV | Not needed | Throwaway counters that expire on their own |
| Secrets (`TURNSTILE_SECRET_KEY`, `CLOUDFLARE_API_TOKEN`) | Not needed | They can be reissued; nothing depends on the old value ([INCIDENTS.md](INCIDENTS.md)) |
| Cloudflare configuration | In the repository | `wrangler.jsonc` declares the Worker, routes and bindings; DNS and zone settings are in the dashboard and listed in [INFRASTRUCTURE.md](../05_ENGINEERING/INFRASTRUCTURE/INFRASTRUCTURE.md) |

## Options, and a decision that is needed

The list is small and rarely changes, so this is a cost and privacy question more
than an engineering one. The options, cheapest first:

1. **A manual export before anything risky** (before a namespace change, or on a
   schedule the maintainer keeps), using the commands in
   [SUBSCRIBER-LIST.md](RUNBOOKS/SUBSCRIBER-LIST.md), stored encrypted off the
   repository. No new infrastructure; depends on someone remembering.
2. **A scheduled workflow that exports the list.** Automatic, but it would put
   subscriber data into GitHub Actions storage and secrets, which needs a privacy
   review and a change to the privacy policy first.
3. **Do nothing.** Acceptable while the list is tiny, if that is chosen knowingly.

Not decided. Recording the decision, and the restore drill that would prove it, is
open work: see [FRAMEWORK-MAP.md](../00_START_HERE/FRAMEWORK-MAP.md).
