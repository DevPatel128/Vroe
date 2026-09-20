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

Read [docs/00_START_HERE/README.md](docs/00_START_HERE/README.md). It says where every kind of
information lives, and has a load order and a "where do I change X?" table. For
agents, [CLAUDE.md](CLAUDE.md) is the short version.

## The rules

The canonical statement is [docs/01_PRINCIPLES/PRINCIPLES.md](docs/01_PRINCIPLES/PRINCIPLES.md);
in short:

1. **Never claim a product is available.** Neither Trove nor Vero has shipped.
   No external product links, no `offers` in structured data, no present-tense
   "Trove is a…". See [docs/04_DESIGN/CONTENT.md](docs/04_DESIGN/CONTENT.md).
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

If you make a choice the next person would reasonably make differently, add an
ADR under [docs/08_DECISIONS](docs/08_DECISIONS/DECISIONS.md), using the template
there. Context, decision, consequences. Include what it cost, not just what it
gained.

## Documentation

Every concept has one canonical home, and `docs/` has ten numbered areas and
nothing else. Every document opens with a status header. Before adding a file, read
the conventions in [docs/00_START_HERE/README.md](docs/00_START_HERE/README.md); `npm run test:docs`
checks the structure, the headers and the links.

## Security

Do not open a public issue for a vulnerability. See [SECURITY.md](SECURITY.md).
