# Working in this repository, for agents

**Status:** Review · **Last updated:** 2026-09-19 · **Owner:** Vroe Labs · **Version:** 1.0

How an AI agent navigates the documentation, decides what it may claim, proposes
changes, and reports what it did. It follows the company framework's AI operating
rules; [FRAMEWORK-MAP.md](../../00_START_HERE/FRAMEWORK-MAP.md) says how. Start at
[00_START_HERE](../../00_START_HERE/README.md). The mechanics of making a change
(commands, tasks, pitfalls) are in [DEVELOPMENT.md](../DEVELOPMENT/DEVELOPMENT.md).

## What the AI is, and is not

The AI is a researcher, analyst, documenter, reviewer and implementation assistant.
It is **not** the final authority on product strategy, legal approval, financial
decisions, privacy policy, security exceptions or production deployment. A human
approves those. `main` reflects that: nothing reaches it except through a pull
request that passes CI, and merging is a human act.

## The navigation rule

An agent must:

1. Read [START_HERE](../../00_START_HERE/README.md).
2. Identify the task.
3. Go only to the canonical documents that task needs. Do not search the whole
   documentation tree without reason.
4. Never create a document if an existing canonical one owns the concept.
5. Never modify an approved document without checking
   [DECISIONS.md](../../08_DECISIONS/DECISIONS.md).
6. Check [RESEARCH.md](../../03_RESEARCH/RESEARCH.md) before making a consequential
   external claim.
7. Check [PRINCIPLES.md](../../01_PRINCIPLES/PRINCIPLES.md) before making a product
   decision.
8. Check the engineering documents ([05_ENGINEERING](../README.md)) before changing
   architecture or implementation.
9. **Report which canonical documents were consulted.**

## Before you claim anything

When a change touches a product claim, a number, or anything a user reads —
not internal engineering — say which of these it is before proposing it:

- **Fact** — verified, with a source. [10-evidence.md](../../03_RESEARCH/RESEARCH.md)'s
  evidence layer enforces a stricter version of this for `/trove`'s figures.
- **Assumption** — plausible, not verified. Say so.
- **Unknown** — a valid answer. Don't fill a gap with a guess.

The test suite catches fabricated structured data and evidence figures
(`tests/seo.test.mjs`, `tests/evidence.test.mjs`); it does not catch a false
claim written into prose copy, so this is a discipline, not a safety net.

Also ask: is the evidence current, and is there evidence against it? Does the
reader need to know how uncertain this is?

## Before a consequential change

Mirrors the company framework's AI operating rules (see
[00-framework-map.md](../../00_START_HERE/FRAMEWORK-MAP.md)). Before proposing anything beyond
a wording fix or a routine bug fix, answer:

- **Why** should this change be made?
- **Impact** — what changes, what results should it yield, what are the
  risks and trade-offs?
- **How** will it be implemented?
- **Cost** — money, complexity, maintenance. Is there a cheaper way to get
  the same result?
- **Is the cost justified?**

Record the answer in a new [07-decisions.md](../../08_DECISIONS/DECISIONS.md) ADR for
anything non-obvious — that file has a template with the same fields.

Before recommending something, also say what it would cost, what cheaper
alternatives exist, the evidence, the assumptions, and what remains uncertain.

## Proposing a documentation change

When code, product requirements, research, design, business assumptions,
architecture or policy changes, work out what changed, which documents it affects,
whether new research is needed, whether an existing decision is touched, and
whether privacy, terms or security documentation changes. Then show:

```text
CHANGE
WHY
FILES AFFECTED
EVIDENCE
RISKS
```

and ask for human approval before changing an approved strategic document. Mark
superseded content rather than silently erasing it, and record the decision in
[DECISIONS.md](../../08_DECISIONS/DECISIONS.md).

Some changes need a human or legal look regardless: anything involving personal
data, payments, AI, analytics, sharing, external APIs, children, biometrics,
location, authentication, authorization, infrastructure, secrets or production
access. Flag it; do not settle it.

## Creating or splitting a document

Before creating a file, ask: does a canonical document for this concept already
exist? If yes, update it. If no, decide which area owns the concept. Add a file
only when the concept is genuinely distinct, will be referenced repeatedly, and
would make another document harder to understand if kept there. Split a document
only when navigation gets easier, never merely to have more files.

Every document opens with the status header, and `npm run test:docs` checks it.

## Before production

Human approval is mandatory. An agent may prepare, test and open a pull request; it
does not merge or deploy.
