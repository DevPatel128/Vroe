# Relationship to the product framework

**Status:** Review · **Last updated:** 2026-09-20 · **Owner:** Vroe Labs · **Version:** 1.0

The Vroe Labs product framework (`The Framework./` at the repo root, kept out of
git — see `.gitignore`) is a process and governance system: a lifecycle, a
universal change-decision framework (why → impact → how → cost → is it
justified), an engineering checklist, rules for how AI may act, and a system for
organising documentation. It replaced an earlier 5-step meta-prompt template set,
now archived outside this repository.

This repository is a **marketing website** for products that have not shipped.
The framework is written for a full venture — recommendation systems, databases,
auth, an investor narrative. Applying it literally here would produce exactly the
overengineering it warns against. This file records what is followed, what is
adapted, and what is deliberately absent, file by file.

## The rule

When the framework and this repository disagree, the framework is a template and
this repository is the running system. Follow the framework's *intent* — secure,
honest, lowest justified cost, one source of truth — not its file list.

## Where each framework file lives here

| Framework file | Here | Status |
| --- | --- | --- |
| `PRINCIPLES.md` | [PRINCIPLES.md](../01_PRINCIPLES/PRINCIPLES.md) | Covered, with a coverage table |
| `AI_OPERATING_RULES.md` | [AI-WORKFLOW.md](../05_ENGINEERING/AI/AI-WORKFLOW.md) | Covered |
| `PRODUCT_CREATION_SYSTEM.md`, `INTERVIEW.md` | Not in this repo | Not applicable; see below |
| `RESEARCH.md` | [RESEARCH.md](../03_RESEARCH/RESEARCH.md) | Stricter than the template |
| `PRODUCT.md` | [PRODUCT.md](../02_PRODUCT/PRODUCT.md) | Drafted for review |
| `THESIS.md` | [THESIS.md](../02_PRODUCT/THESIS.md) | Drafted for review, deliberately partial |
| `EXPERIENCE.md` | [EXPERIENCE.md](../02_PRODUCT/EXPERIENCE.md) | Drafted for review |
| `INVESTOR.md` | [INVESTOR.md](../07_BUSINESS/INVESTOR.md) | Deliberately not written |
| `DECISIONS.md` | [DECISIONS.md](../08_DECISIONS/DECISIONS.md) | Covered, one file per decision |
| `ENGINEERING.md` | [05_ENGINEERING](../05_ENGINEERING/README.md), status in [FOUNDATION.md](../05_ENGINEERING/FOUNDATION/FOUNDATION.md) | Covered |
| `DOCUMENT_AGENT.md`, `UPDATE_AGENT.md`, `REVIEW_AGENT.md`, `RESEARCH_AGENT.md` | [AI-WORKFLOW.md](../05_ENGINEERING/AI/AI-WORKFLOW.md) and the test suite | Partly; see below |
| `SUMMARY.md` | Not in this repo | The framework's own map |
| `Documentation_Organization_System.md` | The layout of `docs/` itself | Followed literally; see below |

## What is not applicable, and why

**`PRODUCT_CREATION_SYSTEM.md` and `INTERVIEW.md`** describe company-level idea
discovery and the whole product lifecycle. Trove and Vero exist and are described
here, and the discovery that produced them belongs with the company rather than
the website repository.

**`INVESTOR.md`** is deliberately not written. An investor narrative for products
that have not shipped would contradict rule 1 ([never claim a
product is available](../01_PRINCIPLES/PRINCIPLES.md)) and the ban on user counts,
revenue, funding and testimonials in [CONTENT.md](../04_DESIGN/CONTENT.md). The
framework's own investor quality gate — reject fabricated metrics, unsupported
market claims, guaranteed outcomes — is already enforced here, more strictly, by
`tests/seo.test.mjs` and `tests/evidence.test.mjs`, which fail the build on
exactly those things. See [INVESTOR.md](../07_BUSINESS/INVESTOR.md).

**`THESIS.md`** is partly written. The substance (problem, insight, evidence)
lives in [RESEARCH.md](../03_RESEARCH/RESEARCH.md), grounded harder than the
template asks. *Why now*, *differentiation*, *defensibility* and *falsifiers* are
deliberately unwritten: claiming any of them would edge toward the availability
and effectiveness claims this site forbids for a product that has not shipped.

**`PRODUCT.md`** has no Success metrics or Approval footer filled beyond what is
true today. Filling them would mean inventing numbers or decisions that do not
exist yet. Add them when there is a real answer, not before.

## The agents

No standalone document plays the role of `DOCUMENT_AGENT.md`, `UPDATE_AGENT.md`
or `REVIEW_AGENT.md`, but their intent is covered in two places. The change
checklist and the "propose, don't silently change" discipline are in
[AI-WORKFLOW.md](../05_ENGINEERING/AI/AI-WORKFLOW.md). The test suite is the
mechanical review gate: `tests/security.test.mjs`, `tests/evidence.test.mjs` and
`tests/seo.test.mjs` check what `REVIEW_AGENT.md`'s Engineering, Research and
Trust lists ask about, and `tests/docs.test.mjs` checks the documentation system
itself. There is no PASS / PASS WITH CHANGES / BLOCK narrative review for a prose
change; that is low value at this repository's size.

## The documentation system

`Documentation_Organization_System.md` prescribes ten numbered areas, one
canonical home per concept, a README per folder and a status header on every
document. `docs/` follows it literally: exactly ten areas, every folder and file
the system lists, and `tests/docs.test.mjs` enforces the parts a machine can check.
Where the system lists something this site has nothing to put in — the business
documents, backups, disaster recovery — the file exists and says so plainly, with
a status, rather than being left out or padded.

## What closed the gaps

The first version of this file listed four open gaps. All four are closed, and the
reason they mattered is on record: on 2026-09-16 Dependabot's Vite 6→8 pull
request (#9) was merged while its `verify` check was failing, `main` went red, and
nothing noticed. Production kept serving the previous deploy only because the
failed build never reached `wrangler deploy` ([ADR-019](../08_DECISIONS/ENGINEERING/ADR-019-declare-esbuild-as-a-direct-devdependency.md)).

| Gap | Closed by |
| --- | --- |
| No human approval before production | `main` requires `verify` and rejects direct pushes ([ADR-020](../08_DECISIONS/ENGINEERING/ADR-020-production-safeguards-a-required-check-a-health-check.md)) |
| No alerting | A scheduled health check that fails a run, which GitHub emails (ADR-020) |
| No automatic rollback | Deploy rolls back on a failed smoke test and still ends red (ADR-020) |
| No performance budget in CI (this file wrongly claimed one) | Byte budgets in the tests, Lighthouse in CI ([ADR-021](../08_DECISIONS/ENGINEERING/ADR-021-performance-and-accessibility-budgets-bytes-in-the-tests.md)) |
| Two accessibility failures found by that budget | Fixed, and larger than first recorded (eight colour pairs, one in visible content). Guarded by tests and by Lighthouse on all ten routes ([ADR-024](../08_DECISIONS/DESIGN/ADR-024-accessible-colours-and-heading-order.md)) |

## Known gaps (open)

1. **The `performance` job is not a required check yet.** Timing metrics can vary
   on shared runners, so it reports on every pull request without blocking one.
   Promote it once it has shown it does not flake.
2. **No second reviewer.** A solo repository cannot require a review from anyone
   else, so the approval is the maintainer's own merge. Revisit when a second
   maintainer joins.
3. **Alerting is one email channel.** It depends on GitHub Actions notifications
   being switched on and on the `WORKER_URL` variable being right. Nothing checks
   either. See [OBSERVABILITY.md](../06_OPERATIONS/OBSERVABILITY.md).
4. **No backup of the subscriber list.** See [BACKUPS.md](../06_OPERATIONS/BACKUPS.md).
   The documentation system asked for a place to say so, and saying so surfaced it.
