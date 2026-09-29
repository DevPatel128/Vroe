# ADR-020 — Production safeguards: a required check, a health check, automatic rollback

**Status:** Approved · **Last updated:** 2026-09-29 · **Owner:** Vroe Labs · **Version:** 1.0

**Category:** Engineering · **Recorded:** 2026-09-19

**Status.** Approved.

**Context.** On 2026-09-16 Dependabot's Vite 6→8 pull request (#9) was merged
while its `verify` check was failing (ADR-019). CI and Deploy went red on
`main` and nothing told anyone. Production kept serving the previous version
only because the failed build never reached `wrangler deploy`. That exposed
three separate gaps: nothing stopped a red merge; nothing detected a broken
`main` or a broken production; and a deploy that built fine but failed its
smoke test would have stayed live until a human noticed and rolled it back.

**Decision.** Three measures.

1. Branch protection on `main` requires the `verify` check, and applies to
   admins. Every change goes through a pull request, and merging it is the
   human approval before production.
2. `.github/workflows/health.yml` checks the deployed Worker every three hours
   and fails loudly, so GitHub's own Actions notifications reach the maintainer.
3. `deploy.yml` runs `wrangler rollback` when a deployed version fails its
   smoke test, waits for `/api/health` to report ready, and still ends red.

**Why.** The engineering framework asks for human approval before production
(sections 16 and 20), alerts (17), and detect → contain → recover → verify
(18). All three were missing, and the first one has now cost something.

**Cost.** No new service and no new dependency. GitHub Actions minutes: about
eight health-check runs a day, each billed at the one-minute minimum, is
roughly 240 of the 2,000 free minutes a month on a private repository — an
estimate, so confirm in Settings → Billing; it costs nothing once the
repository is public. The rollback step runs only when a deploy fails. The
real cost is friction: no more pushing straight to `main`. Cheaper
alternatives: do nothing and rely on discipline, which is what failed on
2026-09-16; or rely on GitHub's default emails, which would have said the run
failed but not that production was at risk.

**Consequences.** Direct pushes to `main` are rejected, admin included; an
emergency bypass is documented in `docs/06_OPERATIONS/RUNBOOKS/PRODUCTION-CHECKLIST.md`. A required
*review* is not possible on a solo repository, since nobody else can approve,
so it is not required. The automatic rollback could misfire on a false alarm.
It is limited by the smoke test polling for three minutes before it fails, by
rolling back to the last version that itself passed, and by the run staying
red. A rollback changes code only, so KV data is untouched. Monitoring depends
on the `WORKER_URL` repository variable staying correct.

**Alternatives.** A required-reviewer rule on the `production` environment:
not evaluated, because the pull-request merge already is the approval step and
a solo maintainer would be approving their own deploy. An external uptime
service: a new third party for something GitHub Actions already does, and
rejected under lowest justified cost. Manual rollback only: the status quo,
which leaves a bad deploy live for as long as it takes someone to notice.

**Revisit when.** The repository goes public (shorten the health interval,
since minutes stop counting); a second maintainer joins (require a review);
or the health check raises a false alarm.

**Amendment, 2026-09-29.** The repository is now public, so the Actions-minutes
cost above is zero. The health check stays at every three hours; the interval is
now only a question of how fast an outage should be noticed. A proposal to trim
it to twice a day to save minutes was closed as unnecessary.

**Approved by.** Dev — **Date.** 2026-09-19.
