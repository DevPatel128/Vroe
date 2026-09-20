# ADR-004 — HSTS without `preload`

**Status:** Approved · **Last updated:** 2026-09-01 · **Owner:** Vroe Labs · **Version:** 1.0

**Category:** Engineering · **Recorded:** 2026-09-01

**Decision.** `max-age=31536000; includeSubDomains`, and **no** `preload`.

**Rationale.** `includeSubDomains` already protects subdomains. Preload adds the
domain to a list baked into browser binaries; removal takes months. A subdomain
is planned (`trove.vroelabs.com`) and is not yet live, so committing every future
subdomain to HTTPS-only forever is a promise we cannot yet keep.

**Revisit when** every intended subdomain exists and serves HTTPS.

---

*Recorded before the decision template in [DECISIONS.md](../DECISIONS.md). Evidence, cost and approver were not captured at the time and are not back-filled here.*
