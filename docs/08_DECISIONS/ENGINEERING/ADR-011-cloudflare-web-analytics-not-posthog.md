# ADR-011 — Cloudflare Web Analytics, not PostHog

**Status:** Approved · **Last updated:** 2026-09-01 · **Owner:** Vroe Labs · **Version:** 1.0

**Category:** Engineering · **Recorded:** 2026-09-01

**Decision.** Cookieless Cloudflare Web Analytics on the marketing site.
PostHog remains the product-analytics layer for Trove and Vero.

**Rationale.** ~5 KB and no cookies, versus ~50 KB and a consent banner. Funnels
and session data matter in a product; page views are what matter here.

---

*Recorded before the decision template in [DECISIONS.md](../DECISIONS.md). Evidence, cost and approver were not captured at the time and are not back-filled here.*
