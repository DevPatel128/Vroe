# CI/CD

**Status:** Review · **Last updated:** 2026-09-20 · **Owner:** Vroe Labs · **Version:** 1.0

How a change reaches production and what stands in its way. This is the design of
the pipeline; the procedures for when it misbehaves are in
[06_OPERATIONS](../../06_OPERATIONS/README.md).

## The pipeline

The engineering framework's deployment flow, and where each stage is here:

| Stage | Here |
| --- | --- |
| CODE | A branch and a pull request. Nothing goes to `main` directly |
| CHECK, TEST | The `verify` job: `npm ci --ignore-scripts`, `npm audit`, build, every test suite. The `docs-impact` job checks that the documentation changed with the code |
| SECURITY SCAN | Dependency audit, an SBOM, a scan of the build output for source maps, dotfiles and secret names, and a scan of tracked files for credentials |
| BUILD | `npm run build` |
| PREVIEW | The pull request's checks, plus looking at the site with `npm run preview` |
| HUMAN APPROVAL | Merging the pull request. `main` requires `verify` and `docs-impact`, and applies to admins |
| PRODUCTION | `deploy.yml` on push to `main`: build, test, `wrangler deploy`, smoke test |
| AFTER | The smoke test, an automatic rollback if it fails, and a scheduled health check |

## Deploy

```bash
npm run deploy
```

That runs `npm run build` then `wrangler deploy`. Pushing to `main` does the same
through GitHub Actions, then smoke-tests the deployment on its workers.dev
address (Bot Fight Mode challenges CI on the custom domain; see the workflow).

**Nothing reaches `main` except through a pull request.** `main` requires the
`verify` check (audit, build, every test, the secret scans) and the `docs-impact`
check, and the rule applies
to admins, so a red pull request cannot be merged and a direct push is rejected.
Merging the pull request is the human approval before production; the merge is
what deploys. A second CI job, `performance`, runs the Lighthouse budgets on
every pull request; it is not yet a required check (see
[PRODUCTION_CHECKLIST.md](../../06_OPERATIONS/RUNBOOKS/PRODUCTION-CHECKLIST.md), item 6).

## What the workflows do

`.github/workflows/deploy.yml` runs on push to `main` and will fail the deploy
if any of these break. Nothing here needs doing by hand.

- Install with `--ignore-scripts`; actions pinned to commit SHAs
- Build, then the full test suite
- Deploy via `wrangler deploy` using a scoped API token (not a global key)
- Post-deploy smoke test: eight security headers present, no `unsafe-inline`,
  twelve routes returning 200, an unknown path returning 404, and `/api/health`
  ready. Run against the `workers.dev` address, because Bot Fight Mode
  challenges the runner on the custom domain — same Worker, same assets, and no
  injected script. The production hostname is probed too; a challenge there is a
  notice rather than a failure

`.github/workflows/ci.yml` additionally runs `npm audit`, generates an SBOM, and
fails on any source map, unexpected dotfile, or secret name in `dist/client`.

It also runs **"Check the repository for committed secrets"**, which stands in
for GitHub's secret scanning and push protection (unavailable on a private repo
without Advanced Security). It adds no third-party action — it greps the files
git actually tracks for environment files, credential-shaped assignments, and
private-key headers. A line can opt out with a trailing `allowlist secret`
comment; the two Turnstile test fixtures use it, so a real key pasted into a
test still fails the build. Both directions were verified against planted
secrets.

`.github/workflows/deploy.yml` also runs the automatic rollback described in
[ROLLBACKS.md](../../06_OPERATIONS/ROLLBACKS.md), and
`.github/workflows/health.yml` runs the scheduled check described in
[OBSERVABILITY.md](../../06_OPERATIONS/OBSERVABILITY.md).

## The `docs-impact` workflow

`.github/workflows/docs-impact.yml` runs on every pull request, including when its
description is edited, and fails it when it changes something the documentation
describes without changing the documentation. The rule table, the `Docs: none,
<reason>` escape hatch and the `Last updated` date check are in
`code/scripts/docs-impact.mjs`; why it exists is
[ADR-023](../../08_DECISIONS/ENGINEERING/ADR-023-documentation-follows-every-change-enforced-in-ci.md).
It installs nothing and reads no secret. Run it locally before pushing:

```bash
BASE_SHA=$(git merge-base origin/main HEAD) node code/scripts/docs-impact.mjs
```

The pull request template (`.github/pull_request_template.md`) asks the same
question up front. Dependabot pull requests are exempt.

## The `performance` job

A separate job in `ci.yml` runs Lighthouse against the real Worker, from its own
dependency tree so the deploy job never installs it. What it enforces, and why, is
in [PERFORMANCE.md](../PERFORMANCE/PERFORMANCE.md).

## Secrets and permissions

CI references no secrets, so it is safe to run on pull requests from forks. Deploy
holds the two Cloudflare secrets and nothing else. Both workflows run with
`contents: read`. The Cloudflare token is scoped to four permissions and is not a
global key; creating or rotating it is a runbook
([CLOUDFLARE-API-TOKEN.md](../../06_OPERATIONS/RUNBOOKS/CLOUDFLARE-API-TOKEN.md)).
Actions are pinned to commit SHAs, and dependencies are pinned exactly and updated
through Dependabot, reviewed and never auto-merged
([DEVELOPER-EXPERIENCE.md](../DEVELOPER-EXPERIENCE/DEVELOPER-EXPERIENCE.md)).

## Why it is built this way

[ADR-020](../../08_DECISIONS/ENGINEERING/ADR-020-production-safeguards-a-required-check-a-health-check.md)
records why `main` requires a check, why there is a health check, and why a failed
deploy rolls itself back. [ADR-008](../../08_DECISIONS/ENGINEERING/ADR-008-run-worker-first-true.md)
records why every request goes through the Worker.
