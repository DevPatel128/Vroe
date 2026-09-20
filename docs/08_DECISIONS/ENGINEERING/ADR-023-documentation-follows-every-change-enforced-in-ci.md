# ADR-023 — Documentation follows every change, enforced in CI

**Status:** Approved · **Last updated:** 2026-09-20 · **Owner:** Vroe Labs · **Version:** 1.0

**Category:** Engineering · **Recorded:** 2026-09-20

**Decision.** Whenever something is added or changed that the documentation
describes, the documentation changes in the same pull request. Three mechanisms
enforce it, each catching a different failure:

1. **`tests/docs-sync.test.mjs`** reads the code's own inventory (npm scripts, test
   files, workflows, routes, Cloudflare bindings and cron triggers, `/api/*`
   endpoints, secrets and variables, cited decisions, the retention period) and
   fails when something exists that its canonical document does not mention.
2. **`docs-impact`**, a workflow and a **required** check on `main`
   (`.github/workflows/docs-impact.yml`, `code/scripts/docs-impact.mjs`). A rule
   table maps changed paths to the canonical documents that must change with them.
   A pull request passes when a mapped document changed, a new ADR was added, or the
   description carries `Docs: none, <reason>`. A changed document must also carry a
   `Last updated` date no earlier than its newest commit. Dependabot is exempt.
3. **A pull request template** that puts the question in front of the author.

**Context.** The documentation was reorganised into ten areas on 2026-09-19, and
`docs.test.mjs` keeps its structure, headers and links sound. Nothing kept its
*content* true. The first `docs-sync` run, written straight after the
reorganisation, found seven things that already existed and were undocumented.
Documentation that is not updated with the change it describes is wrong by the
next morning.

**Reason.** A rule people are asked to remember gets forgotten; a rule the pipeline
checks does not. The two checks fail differently on purpose. `docs-sync` is exact and
has no false positives (a script either appears in its document or it does not), but
it can only see facts the code declares. `docs-impact` sees intent (a change to
`code/worker/` *should* touch a security, data, architecture, reliability or
observability document) but cannot tell a good edit from a token one, so it has an
escape hatch that leaves a visible trace.

**Evidence.** Seven undocumented facts found by the first `docs-sync` run, all now
documented. `docs-impact` was run against this branch's own diff and passed, and
its rule table is tested for every workflow, content file and style path
(`tests/docs-impact.test.mjs`).

**Cost.** A few seconds of CI on each pull request, and some friction: a code change
now needs a documentation edit or a stated reason. The workflow installs nothing and
reads no secret. The rule table is one more thing to keep in step with the folder
layout; a test fails if a document it names is moved or removed.

**Alternatives.**

- **Ask people to remember, or rely on review.** This is what failed above.
- **Generate the documentation from the code.** Right for inventories (and
  `docs-sync` does the checking half); wrong for the reasons, which are the
  valuable part and cannot be generated.
- **Make `docs-impact` advisory (not required).** Cheaper, but an advisory check that
  can be ignored is the situation that produced a red `main` in September
  ([ADR-020](ADR-020-production-safeguards-a-required-check-a-health-check.md)).
  Dev chose the required check on 2026-09-20.
- **Require a documentation change on every pull request.** Too blunt. A dependency
  bump, or an edit to a test, describes nothing the documentation states.

**Consequences.** `docs-impact` becomes a second required check beside `verify`.
The escape hatch (`Docs: none, <reason>`) is a line in the pull request description,
so editing the description re-runs the check. A wrong or missing rule is fixed in
`RULES` in `code/scripts/docs-impact.mjs`, not by loosening a test. Risk: an author
can satisfy the rule by touching the right document without saying anything true in
it. The check makes forgetting hard, not honesty automatic; review still has to look
at the words.

**Revisit condition.** If the escape hatch is used often (visible in the pull
request history) or the rule table needs frequent correction, the rules are wrong and
should be reshaped. If a second maintainer joins, add review of the documentation
change itself.

**Approved by.** Dev — **Date.** 2026-09-20. (Dev chose the required-check option; the
branch-protection change that makes it required was made separately and is recorded in
[CI-CD.md](../../05_ENGINEERING/CI-CD/CI-CD.md).)
