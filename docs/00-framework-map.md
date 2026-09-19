# Relationship to the product framework

The Vroe Labs product framework (`The Framework./` at the repo root, kept out
of git — see `.gitignore`) is a process and governance system: a lifecycle,
a universal change-decision framework (why → impact → how → cost → is it
justified), an engineering checklist, and rules for how AI may act. It
replaced an earlier 5-step meta-prompt template set, now archived outside
this repository.

This repository is a **marketing website** for products that have not
shipped. The framework is written for a full venture — recommendation
systems, databases, auth, an investor narrative. Applying it literally here
would produce exactly the overengineering it warns against. This file
records what's followed, what's adapted, and what's deliberately absent,
file by file.

## The rule

When the framework and this repository disagree, the framework is a template
and this repository is the running system. Follow the framework's *intent* —
secure, honest, lowest justified cost, one source of truth — not its file
list.

## PRINCIPLES.md

23 stated principles. Solidly enforced here:

| Principle | Where |
| --- | --- |
| Never fabricate | [03-content.md](03-content.md) §3 "No invented facts anywhere"; `npm run test:seo` fails on any `offers`, `aggregateRating` or `review` |
| Evidence before confidence | [10-evidence.md](10-evidence.md) — every figure traces to a source and is confidence-gated; nothing `low` is displayed |
| One source of truth | `src/content/` holds every user-visible string ([03-content.md](03-content.md)); `products.js` drives the pill, buttons, structured data and sitemap from two fields |
| Accessibility is part of quality | [01-brand/design-system.md](01-brand/design-system.md) — focus-visible, skip link, reduced motion |
| Secure by default | `run_worker_first: true` (ADR-008) makes headers structural, not a discipline someone can forget |
| Public-safe by design | [04-security.md](04-security.md) — a test asserts no secret appears in any published byte |

Genuinely not applicable to a static marketing site: **progressive
disclosure** and **notifications must earn attention** — there's no app UI
or notification surface to apply them to.

Practiced, but never stated as a repo-wide rule until now:

- **Lowest justified cost.** Every infrastructure ADR (010, 011, 012, 018)
  already picks the cheapest option that meets the requirement.
- **Distinguish fact from assumption.** [10-evidence.md](10-evidence.md) does
  this rigorously for numbers; [08-ai-workflow.md](08-ai-workflow.md) now
  states it as a general rule for anyone proposing a change.

The remaining principles (user value first, trust before growth, no dark
patterns, privacy by design, and others) are consistent with how this site
is built but have no dedicated statement — reasonable for a static page with
no accounts, no recommendations and no notifications. Worth restating
explicitly once Trove or Vero has a real product surface to hold to them.

## AI_OPERATING_RULES.md → [08-ai-workflow.md](08-ai-workflow.md)

Covered: the build/test gate before changing anything, the five rules, a
"before a consequential change" why/impact/how/cost/justified checklist, and
a fact/assumption/unknown labelling convention.

The framework requires human approval before production ("Before
production"). `main` now requires the `verify` check and rejects direct
pushes, so a production deploy always follows a pull request that passed CI
and was merged on purpose — the merge is the approval (ADR-020).

## PRODUCT_CREATION_SYSTEM.md, INTERVIEW.md, RESEARCH.md

Mostly not applicable to this repository specifically — these describe
company-level idea discovery and research that either already happened
(Trove and Vero exist and are described here) or belongs with the company
rather than the website repo. The one part that does live here:
[10-evidence.md](10-evidence.md) is a stricter, code-enforced version of
`RESEARCH.md`'s evidence ledger — every figure has a source, a date, a
confidence level, and a test that recomputes it.

## PRODUCT.md → `src/content/products.js`

A real, populated analogue: Identity (name, summary, category), Core
capabilities, and Product principles all exist and drive the site directly.
Non-goals exist as `notYetBuilt` on both Trove and Vero — explicit,
already-true non-claims, not aspirational scope.

**Deliberately absent:** Success metrics, Constraints, and an Approval
footer. Filling these in would mean inventing numbers or decisions that
don't exist yet. Add them when there's a real answer, not before.

## THESIS.md — distributed, not a standalone document

The substance (problem, insight, evidence) lives in
`src/content/evidence/trove.js` and [10-evidence.md](10-evidence.md),
grounded harder than the template requires. **Why now**, **differentiation**
and **defensibility** are deliberately unwritten: claiming any of them would
edge toward the availability and effectiveness claims
[03-content.md](03-content.md) forbids for a product that hasn't shipped.

## EXPERIENCE.md → [01-brand/](01-brand/)

Partial. Voice, typography and some interaction principles are covered
(`brand-guide.md`; accessibility rules in `design-system.md`). No mental
model, core journey, or AI-experience section exists, because there's no
live product surface yet for a user to move through — this is a marketing
page, not the product.

## INVESTOR.md — deliberately absent

Correctly so. An investor narrative for Trove or Vero would directly
contradict rule 1 ("never claim a product is available") and
[03-content.md](03-content.md)'s ban on user counts, revenue, funding and
testimonials. `INVESTOR.md`'s own quality gate — reject fabricated metrics,
unsupported market claims, guaranteed outcomes — is already enforced here by
a stricter mechanism: `tests/seo.test.mjs` and `tests/evidence.test.mjs` fail
the build on exactly those things.

## DECISIONS.md → [07-decisions.md](07-decisions.md)

The mechanism matches — a decision log, "read before reversing" — but the
template didn't, until now. ADRs 001–017 have Context / Decision /
Consequences / Alternatives, with no Status, Cost, Approved-by or Date. A
template with those fields now sits at the top of the file for ADR-018
onward; the 17 historical entries aren't retrofitted.

## ENGINEERING.md

| Area | Status |
| --- | --- |
| Repo/GitHub security | Satisfied — pinned Actions, exact dependency versions, Dependabot (reviewed, never auto-merged), a custom secret-scan job, `.gitignore` covers `.env`/`.dev.vars` |
| Architecture | Satisfied — every infrastructure ADR records why a heavier component was rejected |
| Cloudflare | Satisfied — scoped API token, `run_worker_first` cost documented, rate limiting, caching tuned per asset |
| Supabase/data, Authentication, Authorization, RLS | N/A — no database, no accounts (ADR-010; `src/content/legal.js`) |
| Least privilege | Satisfied — CI jobs run with `contents: read`, `npm ci --ignore-scripts`, a 4-permission Cloudflare token |
| Accountability/auditability | Partial — business events are logged with useful fields; manual KV deletions now have an audit trail ([deletion-log.md](deletion-log.md)) |
| CIA triad | Satisfied — confidentiality (secrets never committed, hashed KV keys), integrity (the canonical-host redirect never trusts `Host`), availability (the rate limiter fails open by design) |
| Data minimization | Satisfied — the subscriber record is 4 fields; no IP, no user agent |
| Performance | Satisfied — byte budgets in `tests/performance.test.mjs` (every `npm test`, CI and pre-deploy) and Lighthouse timing and audit budgets in the CI `performance` job (ADR-021) |
| Cost optimization | Satisfied — ADR-018 consolidates the free-tier cost picture |
| Testing | Satisfied — six suites (worker routing, security, functionality, SEO, evidence, performance budgets), run in CI and before every deploy |
| Deployment | Satisfied — CODE→CHECK→TEST→SCAN→BUILD in CI; PREVIEW is the pull request's checks; HUMAN APPROVAL is the merge, since `main` requires `verify` and rejects direct pushes (ADR-020) |
| Observability | Satisfied — logs, a health endpoint and errors, plus a scheduled health check that fails a GitHub Actions run, which GitHub emails ([06-deployment.md](06-deployment.md#monitoring)) |
| Failure/recovery | Satisfied — a deploy that fails its smoke test is rolled back automatically and the run still ends red; manual rollback is documented (ADR-020) |
| Security incident response | Satisfied — [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md) now covers Turnstile-secret and KV-data exposure, not just the Cloudflare API token |
| Production approval | Satisfied — see Deployment |

## DOCUMENT_AGENT.md, UPDATE_AGENT.md, REVIEW_AGENT.md

No standalone document plays this role, but two things now cover most of
their intent: the "before a consequential change" checklist in
[08-ai-workflow.md](08-ai-workflow.md) (a propose-don't-silently-change
discipline), and the test suite as a mechanical review gate —
`tests/security.test.mjs`, `tests/evidence.test.mjs` and `tests/seo.test.mjs`
check exactly what REVIEW_AGENT.md's Engineering, Research and Trust
checklists ask about, just against code output rather than prose. There's no
PASS / PASS WITH CHANGES / BLOCK narrative review for a documentation
change — low value at this repo's current size, worth adding if the docs set
grows substantially.

## What closed the gaps

The first version of this file listed four open gaps. All four are closed, and
the reason they mattered is on record: on 2026-09-16 Dependabot's Vite 6→8 pull
request (#9) was merged while its `verify` check was failing, `main` went red,
and nothing noticed. Production kept serving the previous deploy only because
the failed build never reached `wrangler deploy` (ADR-019).

| Gap | Closed by |
| --- | --- |
| No human approval before production | `main` requires `verify` and rejects direct pushes (ADR-020) |
| No alerting | Scheduled health check that fails a run, which GitHub emails (ADR-020) |
| No automatic rollback | Deploy rolls back on a failed smoke test and still ends red (ADR-020) |
| No performance budget in CI (this file wrongly claimed one) | Byte budgets in the tests, Lighthouse in CI (ADR-021) |

## Known gaps (open)

1. **Two accessibility failures found by the new budget and not yet fixed.**
   Text in the product illustrations is below the WCAG AA contrast ratio (four
   pages), and `/products` skips heading levels. Both are listed in
   `KNOWN_ISSUES` in `perf/run.mjs` so they cannot spread. Fixing contrast
   changes the visual design, so it needs a decision.
2. **The `performance` job is not a required check yet.** Timing metrics can
   vary on shared runners, so it reports on every pull request without
   blocking one. Promote it once it has shown it does not flake.
3. **No second reviewer.** A solo repository cannot require a review from
   anyone else, so the approval is the maintainer's own merge. Revisit when a
   second maintainer joins.
4. **Alerting is one email channel.** It depends on GitHub Actions
   notifications being switched on and on the `WORKER_URL` variable being
   right. Nothing checks either.
