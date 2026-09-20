# Cost

**Status:** Review · **Last updated:** 2026-09-20 · **Owner:** Vroe Labs · **Version:** 1.0

Always the lowest-cost solution that still meets the security, reliability,
performance, compliance and user-value requirements. Do not add infrastructure or
complexity without proportional value. The decision record for the current picture
is [ADR-018](../../08_DECISIONS/ENGINEERING/ADR-018-infrastructure-cost-review-cloudflare-free-tier-only.md).

## Today

| Item | Cost |
| --- | --- |
| Cloudflare Workers, two KV namespaces, Workers Logs | Free tier: $0 a month |
| Cloudflare R2, the daily subscriber backup | Free tier: $0 a month, if the account can enable R2 without a paid plan (unverified; see [INFRASTRUCTURE.md](../INFRASTRUCTURE/INFRASTRUCTURE.md)). The free tier is 10 GB-month of storage, 1 million writes and 10 million reads a month, with no charge for egress. The backup is about 0.3 MB per 1,000 subscribers a day, 30 days kept, and a handful of operations a day |
| Cloudflare Web Analytics | Not enabled |
| Supabase, PostHog, Sentry | Not used, on cost and complexity grounds ([ADR-010](../../08_DECISIONS/ENGINEERING/ADR-010-cloudflare-kv-not-supabase.md), [011](../../08_DECISIONS/ENGINEERING/ADR-011-cloudflare-web-analytics-not-posthog.md), [012](../../08_DECISIONS/ENGINEERING/ADR-012-sentry-deferred.md)) |
| Domain registration | An annual cost paid to the registrar, Cloudflare. The amount is not recorded here |
| GitHub Actions minutes | The private-repository allowance, believed to be 2,000 minutes a month; confirm in Settings, Billing. The health check is roughly 240 of them (an estimate); nothing counts once the repository is public |

## Total cost

Compute, database, storage, network, third-party services, **developer time,
maintenance and operational complexity**. A cheap service that needs constant care
is not cheap.

## Choosing something significant

1. Estimate the cost.
2. Identify cheaper alternatives.
3. Compare what each delivers.
4. Choose the lowest-cost option that meets the requirements.
5. If a more expensive one is chosen, record why, in
   [DECISIONS.md](../../08_DECISIONS/DECISIONS.md).

Avoid infrastructure built for scale nobody has yet. Estimate any recurring cost
before adopting a paid feature.
