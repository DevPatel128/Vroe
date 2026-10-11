---
name: repo
description: Audit a product repo end to end (inventory, local vs GitHub, structure, secrets in full history, backend security, presentation) and give a publication verdict. Use before making a repo public, when inheriting one, monthly, or when asked to clean up, document or secure a repo or GitHub portfolio.
---
# Repo

Rule 0: blunt. Report what you ran and what you could not. Never claim a repo is secure; say what the audit covered.
Never print a secret value. Name file, commit, rule and severity only.
Never discard, move, rewrite, force-push, delete branches or tags, or change visibility without the human's explicit OK for that action. The guard blocks most of these.

## 1. Inventory (read only)
For the local folder and its GitHub repo, record:
- Path, remote, visibility, default branch, other branches, tags, open PRs (`gh pr list`).
- Uncommitted, untracked and unpushed work (`git status -sb`, `git log origin/main..`, `git stash list`). Check worktrees too (`git worktree list`).
- Local versus remote: `git fetch --all`, then compare branch tips. Neither side is assumed correct. List every difference before changing anything.
- What the app really is: entry points, framework, data store, auth, integrations, deploy target, from code and config. Do not go by `package.json` alone.
- Docs present, generated files tracked (`git ls-files` for build output, `.next`, `dist`, logs), duplicated or stale folders.
- Build and test status: run the project's check and test commands and record pass, fail or not runnable.

## 2. Secrets (current files and every ref)
- `bash scripts/secret-scan.sh [client-build]`. It covers gitleaks on every commit of every ref, forbidden file names in history, and the client bundle. If gitleaks is missing, the history scan is NOT RUN: say so.
- Classify each hit by shape only, not value: placeholder, public by design (for example a PostHog `phc_` key or a Turnstile site key), or real.
- **Real credential:** rotate it at the provider first, move it to Worker secrets or GitHub secrets, verify the app, and confirm the old value fails. Then propose a history clean.
- **History clean:** list affected refs, forks and PRs. Write a recovery plan following https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository and stop for approval. `git filter-repo` and the force-push need the human.
- **False positive:** add its fingerprint to `.gitleaksignore` with a one-line reason.

## 3. Backend and infrastructure review
Check each item against code, and mark it n/a when it does not apply:
- Session handling.
- Authorization on every route, with user data only through `db.ts`. On Supabase: RLS on every table, grants, `security definer` functions, client/server key split.
- Input validation, upload limits, CORS and security headers (CSP), rate limits.
- Error leaks, logging of personal data, retention.
- Prod/dev separation, CI token scopes, Actions `permissions:` and SHA pins.

Findings go in the `review` format, grouped Must / Should / Nice.

## 4. Presentation
- `bash scripts/repo-check.sh` checks README topics, placeholders, links, diagrams, licence, description, topics and public-repo scanning.
- Fill gaps from verified code only:
  - README per `README.md` in the kit (Shipped vs Planned, real stack, tested commands);
  - Mermaid diagrams in `SYSTEM.md` with no internal hostnames or IDs;
  - `.github/SECURITY.md`, `CONTRIBUTING.md`, PR and issue templates.
- Never invent screenshots, features or metrics. Unknown means `UNKNOWN`.
- Metadata changes (description, topics) and enabling secret scanning, push protection or CodeQL default setup are settings changes. List them as exact commands, then run them only after OK.
- Structure: move files only when the build allows it, update every reference, and prove the build and tests still pass. Untrack generated files with `git rm --cached` only after checking that nothing needs them.

## 5. Verify
Run build, typecheck, lint, tests, e2e where present, `secret-scan`, `repo-check`, `legal-check` on the client build, and `docs-impact`. Review the final diff:
- no lost work;
- no credentials;
- no unrelated changes;
- links and imports intact.

One PR per repo, CI green before merge.

## 6. Report (per repo, in this order)
1. Overview: purpose, state, structural findings.
2. Presentation changes.
3. Local vs remote: differences found and what was synced.
4. Security findings: severity, location, status. No values.
5. History: refs scanned, cleanup done or still needed.
6. Automation: which checks run on PRs, pushes and the weekly scan, and which GitHub settings are on. Say "not available on a private free repo" where true.
7. Validation: each check with passed, failed, skipped or not run.
8. Outstanding actions that need credentials, provider access or approval.
9. Verdict, exactly one of:
   - **READY FOR PUBLICATION**: every check ran and passed, and no known blocking issue remains.
   - **NOT READY — ACTION REQUIRED**: a blocking issue remains (list it).
   - **PARTIALLY VERIFIED**: some checks could not run, so safety is not established.
