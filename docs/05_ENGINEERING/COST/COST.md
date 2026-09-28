# Cost

**Status:** Review · **Last updated:** 2026-09-28 · **Owner:** Vroe Labs · **Version:** 1.0

Always the lowest-cost solution that still meets the security, reliability,
performance, compliance and user-value requirements. Do not add infrastructure or
complexity without proportional value. The decision record for the current picture
is [ADR-018](../../08_DECISIONS/ENGINEERING/ADR-018-infrastructure-cost-review-cloudflare-free-tier-only.md).

## Today

| Item | Cost |
| --- | --- |
| Cloudflare Workers, two KV namespaces, Workers Logs | Free tier: $0 a month |
| The subscriber backup | $0: it is a file on the maintainer's computer, made with Wrangler. The cost is the maintainer's attention and disk space (about 0.3 MB per 1,000 subscribers a day, 30 kept) ([ADR-022](../../08_DECISIONS/ENGINEERING/ADR-022-subscriber-backup-to-the-maintainers-computer.md)) |
| Cloudflare Web Analytics | Not enabled |
| Supabase, PostHog, Sentry | Not used, on cost and complexity grounds ([ADR-010](../../08_DECISIONS/ENGINEERING/ADR-010-cloudflare-kv-not-supabase.md), [011](../../08_DECISIONS/ENGINEERING/ADR-011-cloudflare-web-analytics-not-posthog.md), [012](../../08_DECISIONS/ENGINEERING/ADR-012-sentry-deferred.md)) |
| Domain registration | An annual cost paid to the registrar, Cloudflare. The amount is not recorded here |
| GitHub Actions minutes | Shared by every private repository on the account (3,000 a month on GitHub Pro), with no paid overage. Vroe's share is **300 minutes a month**. Estimated use after 2026-09-28: pull-request CI about 90, docs-impact about 30, deploys about 30, the health check about 60 (twice a day), Dependabot about 20, so about 230. September 2026 used about 450, mostly the three-hourly health check and CI running twice on every merge |

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
