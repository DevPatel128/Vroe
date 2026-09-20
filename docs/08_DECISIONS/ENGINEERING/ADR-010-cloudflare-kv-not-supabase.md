# ADR-010 — Cloudflare KV, not Supabase

**Status:** Approved · **Last updated:** 2026-09-01 · **Owner:** Vroe Labs · **Version:** 1.0

**Category:** Engineering · **Recorded:** 2026-09-01

**Context.** The company tech stack puts Supabase as the data layer, and the
Trove project already uses it.

**Decision.** Store subscribers in Workers KV. No Supabase.

**Rationale.** One list of email addresses does not need a Postgres instance,
and the free Supabase org is already at its two-project cap. Cloudflare is in
the stack diagram too. Migrating later is a change to one function,
`storeSubscriber()`.

---

*Recorded before the decision template in [DECISIONS.md](../DECISIONS.md). Evidence, cost and approver were not captured at the time and are not back-filled here.*
