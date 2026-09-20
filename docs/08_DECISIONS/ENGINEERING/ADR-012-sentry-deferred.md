# ADR-012 — Sentry deferred

**Status:** Approved · **Last updated:** 2026-09-01 · **Owner:** Vroe Labs · **Version:** 1.0

**Category:** Engineering · **Recorded:** 2026-09-01

**Decision.** Workers Logs only (`observability.enabled`).

**Rationale.** A static site plus a 500-line worker has almost no runtime to
instrument, and Sentry would add a dependency and a third-party origin. Trove
itself removed Sentry to fit its bundle. Revisit when `/api` grows.

---

*Recorded before the decision template in [DECISIONS.md](../DECISIONS.md). Evidence, cost and approver were not captured at the time and are not back-filled here.*
