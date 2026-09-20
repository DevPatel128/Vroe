# ADR-002 — Content in `src/content/`, never in components

**Status:** Approved · **Last updated:** 2026-09-01 · **Owner:** Vroe Labs · **Version:** 1.0

**Category:** Engineering · **Recorded:** 2026-09-01

**Decision.** All user-visible text lives in six content modules.

**Consequences.** Copy is reviewable without reading JSX; the honesty rules can
be enforced in one place; the route table can drive prerendering, the sitemap,
navigation and the link checker from a single definition.

---

*Recorded before the decision template in [DECISIONS.md](../DECISIONS.md). Evidence, cost and approver were not captured at the time and are not back-filled here.*
