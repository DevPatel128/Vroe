# ADR-018 — Infrastructure cost review: Cloudflare free tier only

**Status:** Approved · **Last updated:** 2026-09-19 · **Owner:** Vroe Labs · **Version:** 1.0

**Category:** Engineering · **Recorded:** 2026-09-19

**Status.** Approved — documents the current, already-live state (see
ADR-010, ADR-011, ADR-012).

**Context.** The company engineering framework asks for a recorded cost
estimate, a cheaper-alternative comparison, and a justification for
significant infrastructure choices. ADR-010, ADR-011 and ADR-012 each reasoned
about cost individually; nothing consolidated the total picture.

**Decision.** Run the entire site — Workers, two KV namespaces
(`RATE_LIMIT`, `SUBSCRIBERS`), Web Analytics, Workers Logs — on Cloudflare's
free tier. No paid Cloudflare product, no Supabase, no Sentry, no PostHog.

**Why.** The site is a prerendered marketing page plus three small `/api`
endpoints (ADR-008) and one KV-backed mailing list (ADR-010). None of that
approaches the complexity that would justify a paid tier or an additional
service.

**Cost.** $0/month in Cloudflare charges today. `wrangler.jsonc`'s own
comments record the reasoning at each binding: `run_worker_first` costs one
extra Worker invocation per request — "well inside the free tier" for a
static site; the two KV namespaces are read/write-light (a per-IP throttle
and keyed signups). Cheaper alternatives were already the deciding factor in
ADR-010 (Supabase's two-project cap) and ADR-011 (PostHog's ~50 KB and
consent banner versus Web Analytics' ~5 KB).

**Consequences.** No invoice to review, no billing alert to configure. The
trade-off is Cloudflare's free-tier request and storage ceilings, which this
site is nowhere near.

**Alternatives.** Supabase, PostHog and Sentry were each considered and
rejected on cost/complexity grounds in ADR-010, ADR-011 and ADR-012
respectively; this entry records that the *combined* picture was reviewed
too, not just each piece in isolation.

**Revisit when.** Traffic, subscribe volume, or Worker invocations approach
Cloudflare's published free-tier limits — check the Cloudflare dashboard's
usage panel for the current figures, not this document, since the limits are
Cloudflare's to change.

**Approved by.** — **Date.**
