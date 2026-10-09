# Contributing

## Setup

```bash
cd code           # the buildable app lives here, not the repo root
npm ci
npm run build
npm test          # all must pass before you start
```

Node 22 or newer. `npm run preview` serves the built site through the real
worker on `http://localhost:8787` (wrangler uses the next free port if that one is taken).

## Before you change anything

Read [AGENTS.md](AGENTS.md). It has the commands, the project rules and where each
kind of information lives. Agents start there too.

## The rules

The canonical statement is the project block of [AGENTS.md](AGENTS.md);
in short:

1. **Never claim a product is available.** Neither Trove nor Vero has shipped.
   No external product links, no `offers` in structured data, no present-tense
   "Trove is a…". See [PRODUCT.md](PRODUCT.md), "Honesty rules".
2. **Never weaken the CSP.** No `unsafe-inline`, no `unsafe-eval`, no wildcards.
   **No inline `style` attributes** — they are blocked and the browser drops the
   styling silently. Use a class.
3. **Copy lives in `src/content/`**, never hard-coded in a component.
4. **No React in the browser.** Components are pure — no hooks, no state.
   Interactivity goes in `src/client/enhance.js`.
5. **No invented structured data.** No ratings, reviews, offers or counts.
6. **If you change what the form stores, update `src/content/legal.js` in the
   same commit.** The privacy policy is written against the worker's actual
   behaviour; a mismatch is a false statement to users.

## Adding a dependency

Justify it first. Every package here is a `devDependency`, because nothing ships
to the browser — adding a runtime dependency is a change in kind, not degree.

Check the package's ownership, maintenance and release history. Watch for
typosquatting. Pin the exact version (`save-exact=true` is already set), commit
the lockfile, and run `npm audit --audit-level=high`.

## Before you open a PR

```bash
cd code
npm run build
npm test
npm audit --audit-level=high
```

Then **look at the site**. Three real bugs were found while building this and two
of them were invisible to the test suite — a CSP that silently dropped styling,
and security headers that were missing in practice because Cloudflare was
bypassing the worker. Run `npm run preview` and open it.

Check both breakpoints: **390×844** and **1440×900**.

## Commit messages

Present tense, explain the why rather than the what. The diff already says what.

```
Move chart bar heights into CSS

style-src 'self' blocks inline style attributes, so the bars were
rendering at zero height with no error visible to the user.
```

## Recording decisions

If you make a choice the next person would reasonably make differently, add a
row to [DECISIONS.md](DECISIONS.md) with the next free ADR number. Decision, why,
options rejected, trade-off. Include what it cost, not just what it
gained.

## Documentation

Every concept has one canonical home in the root kit docs (see [AGENTS.md](AGENTS.md));
`docs/` holds only the research record. Update the canonical document rather than
adding a new file. `npm run test:docs` checks that the kit docs exist and that every
link resolves.

## Security

Do not open a public issue for a vulnerability. See [SECURITY.md](SECURITY.md).

By taking part you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).
