# ADR-009 — No inline `style` attributes

**Status:** Approved · **Last updated:** 2026-09-01 · **Owner:** Vroe Labs · **Version:** 1.0

**Category:** Design · **Recorded:** 2026-09-01

**Context.** Enforcing `style-src 'self'` produced 24 CSP violations on first
run: the twelve Trove chart bars (`style={{height: '30%'}}`) and a handful of
spacing one-offs in the page templates.

**Decision.** Move all of them into CSS. Bar heights became
`.bars span:nth-child(n)` rules — the values are static illustration data anyway
— and the spacing became named utility classes in `base.css`.

**Rationale.** The alternative was `'unsafe-inline'` in `style-src`, which is a
bad trade for a decorative bar chart. `npm run test:security` now fails on any
`style="` in the output.

---

*Recorded before the decision template in [DECISIONS.md](../DECISIONS.md). Evidence, cost and approver were not captured at the time and are not back-filled here.*
