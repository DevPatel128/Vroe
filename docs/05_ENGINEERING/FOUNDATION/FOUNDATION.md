# Engineering foundation

**Status:** Review · **Last updated:** 2026-09-19 · **Owner:** Vroe Labs · **Version:** 1.0

The engineering principles this repository holds itself to, and how it meets the
company engineering framework. The framework file is `ENGINEERING.md`; this is its
status here, section by section, with a pointer to the document that owns each
concern.

## Principles

Secure by default. Least privilege. Public-repository safe. The smallest practical
architecture. One source of truth. Measure before optimising. Fail safely. Recover
deliberately. Observe production. Automate repetitive work. Minimise sensitive
data. Minimise infrastructure. Lowest justified cost. Human approval for
consequential production decisions.

**The public-repository test.** A repository is public-safe only when publishing
the source exposes no credentials, no private data and no practical path to
unauthorised production access. This one is heading public, so it is assumed public.

## Status against the framework

| Area | Status | Owned by |
| --- | --- | --- |
| Repository and GitHub security | Satisfied. Pinned Actions, exact dependency versions, Dependabot (reviewed, never auto-merged), a custom secret-scan job, `.gitignore` covers `.env` and `.dev.vars` | [CI-CD.md](../CI-CD/CI-CD.md), [DEVELOPER-EXPERIENCE.md](../DEVELOPER-EXPERIENCE/DEVELOPER-EXPERIENCE.md) |
| Architecture | Satisfied. Every infrastructure decision records why a heavier component was rejected | [ARCHITECTURE.md](../ARCHITECTURE/ARCHITECTURE.md) |
| Cloudflare | Satisfied. Scoped API token, `run_worker_first` cost documented, rate limiting, caching tuned per asset | [INFRASTRUCTURE.md](../INFRASTRUCTURE/INFRASTRUCTURE.md) |
| Supabase and data, authentication, authorization, RLS | Not applicable: no database, no accounts | [DATA.md](../DATA/DATA.md) |
| Least privilege | Satisfied. CI jobs run with `contents: read`, `npm ci --ignore-scripts`, a four-permission Cloudflare token | [CI-CD.md](../CI-CD/CI-CD.md) |
| Accountability and auditability | Partial. Business events are logged usefully; manual deletions have an audit trail | [DELETION-LOG.md](../../06_OPERATIONS/RUNBOOKS/DELETION-LOG.md) |
| Confidentiality, integrity, availability | Satisfied | [RELIABILITY.md](../RELIABILITY/RELIABILITY.md) |
| Data minimisation | Satisfied. The subscriber record is four fields | [DATA.md](../DATA/DATA.md) |
| Performance | Satisfied. Byte budgets and Lighthouse budgets in CI | [PERFORMANCE.md](../PERFORMANCE/PERFORMANCE.md) |
| Cost optimisation | Satisfied | [COST.md](../COST/COST.md) |
| Testing | Satisfied. Seven suites, run in CI and before every deploy | [DEVELOPER-EXPERIENCE.md](../DEVELOPER-EXPERIENCE/DEVELOPER-EXPERIENCE.md) |
| Deployment and production approval | Satisfied. `main` requires `verify`; the merge is the approval | [CI-CD.md](../CI-CD/CI-CD.md) |
| Observability | Satisfied. Logs, a health endpoint, a scheduled check that emails on failure | [OBSERVABILITY.md](../../06_OPERATIONS/OBSERVABILITY.md) |
| Failure and recovery | **Partial.** A bad deploy rolls back automatically; there is no backup of the subscriber list and no restore drill | [RELIABILITY.md](../RELIABILITY/RELIABILITY.md), [BACKUPS.md](../../06_OPERATIONS/BACKUPS.md) |
| Security incident response | Satisfied | [INCIDENTS.md](../../06_OPERATIONS/INCIDENTS.md) |

## The quality gate

A system is engineering-complete when: the source can safely be public; secrets are
protected; authentication is correct; authorization is explicit; least privilege is
applied; data access is appropriately protected; CIA risks are considered; important
actions are auditable; performance is measured where material; cost is justified;
appropriate tests pass; failure and recovery are understood; production is
observable; and human approval requirements are satisfied.

Here, the two open items are the subscriber-list backup and an untested recovery
path. Both are recorded as gaps in [FRAMEWORK-MAP.md](../../00_START_HERE/FRAMEWORK-MAP.md).
