# ADR-006 — Trove is not presented as live

**Status:** Approved · **Last updated:** 2026-09-01 · **Owner:** Vroe Labs · **Version:** 1.0

**Category:** Product · **Recorded:** 2026-09-01

**Context.** The SEO brief was written when Trove was assumed to be live, and
specified a `SoftwareApplication` with a free `Offer` at 0 INR. Trove has not
shipped.

**Decision.** No external Trove link anywhere; status pill reads "Taking shape";
the JSON-LD keeps `SoftwareApplication` but carries **no `offers` block**; the
meta description's present tense is rephrased.

**Rationale.** An offer asserts something is purchasable, or free, right now.
That is a false availability claim, forbidden both by Google's structured-data
policy and by the brand guide's own rule.

**Reversing this** is two fields in `src/content/products.js` plus re-adding
`offers` in `src/seo/JsonLd.jsx` — on the day Trove actually ships.

---

*Recorded before the decision template in [DECISIONS.md](../DECISIONS.md). Evidence, cost and approver were not captured at the time and are not back-filled here.*
