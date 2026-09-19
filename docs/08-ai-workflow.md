# Working in this repo (for agents)

Read [README.md](README.md) first — it has the load order and the "where do I
change…?" table. This file is the conventions.

## Before you change anything

```bash
npm ci
npm run build
npm test          # all must pass before you start
```

If tests fail on a clean checkout, fix that before doing anything else.

## The five rules

1. **Never claim a product is available.** Neither Trove nor Vero has shipped.
   No external product links, no `offers` in structured data, no present-tense
   "Trove is a…". [03-content.md](03-content.md).
2. **Never weaken the CSP.** No `'unsafe-inline'`, no `'unsafe-eval'`, no
   wildcard. If something needs them, the something is wrong.
   [04-security.md](04-security.md).
3. **Content in `src/content/`,** never hard-coded in a component.
4. **No React in the browser.** No hooks, no state, no client framework.
   [02-architecture.md](02-architecture.md).
5. **No invented structured data.** No ratings, reviews, offers or counts.

## Before a consequential change

Mirrors the company framework's AI operating rules (see
[00-framework-map.md](00-framework-map.md)). Before proposing anything beyond
a wording fix or a routine bug fix, answer:

- **Why** should this change be made?
- **Impact** — what changes, what results should it yield, what are the
  risks and trade-offs?
- **How** will it be implemented?
- **Cost** — money, complexity, maintenance. Is there a cheaper way to get
  the same result?
- **Is the cost justified?**

Record the answer in a new [07-decisions.md](07-decisions.md) ADR for
anything non-obvious — that file has a template with the same fields.

## Fact, assumption, or unknown?

When a change touches a product claim, a number, or anything a user reads —
not internal engineering — say which of these it is before proposing it:

- **Fact** — verified, with a source. [10-evidence.md](10-evidence.md)'s
  evidence layer enforces a stricter version of this for `/trove`'s figures.
- **Assumption** — plausible, not verified. Say so.
- **Unknown** — a valid answer. Don't fill a gap with a guess.

The test suite catches fabricated structured data and evidence figures
(`tests/seo.test.mjs`, `tests/evidence.test.mjs`); it does not catch a false
claim written into prose copy, so this is a discipline, not a safety net.

## Things that will bite you

| Symptom | Cause |
| --- | --- |
| Styling silently missing | You used an inline `style` attribute. CSP blocks it. Use a class. ADR-009 |
| Worker refuses to start, "not of type 'function or ExportedHandler'" | You added a non-function named export to `worker/index.js`. Put constants in `worker/headers.js`. ADR-007 |
| Security headers missing in production | `assets.run_worker_first` got turned off. ADR-008 |
| Canonical URLs 307-redirecting | `html_handling` is not `drop-trailing-slash`. ADR-008 |
| Fonts fall back to Georgia | `public/fonts/` is out of step with `fonts.css`. Run `npm run build:fonts` |
| OG card text clipped | A single `<path>` with a very long `d` — librsvg truncates it. One path per glyph. ADR-005 |
| `npm run build` fails on JSX in a script | `scripts/*.entry.jsx` needs its esbuild runner; don't import JSX from a plain `.mjs` |

## Common tasks

**Change wording** → edit `src/content/`, run `npm run build && npm test`.

**Add a page** → route record in `src/content/routes.js` → component in
`src/pages/` → case in `renderRoute()` in `scripts/prerender.entry.jsx`. The
sitemap, nav and link checker follow automatically. Run `npm run test:seo`.

**Add an image** → drop the original in `assets-src/`, add an entry to `IMAGES`
in `scripts/optimize-images.mjs`, run `npm run build:images`, then use
`<Picture name="..." alt="..." sizes="..." />`. Never reference a raw file from
`assets-src/`.

**Change what the form stores** → `worker/index.js`, and **update
`src/content/legal.js` in the same change**. The privacy policy is written
against the worker's actual behaviour; a mismatch is a false statement to users.
`RETENTION_DAYS` exists in both files and must stay in step.

**Add a dependency** → justify it. Everything here is a `devDependency` because
nothing ships to the browser; a runtime dependency would be a change in kind.
Check ownership and release history, pin the exact version, run
`npm audit --audit-level=high`.

## When you finish

```bash
npm run build && npm test && npm audit --audit-level=high
```

Then look at the site — `npm run preview` and open it. Two of the three real
bugs found while building this were invisible to the test suite and obvious in
the browser.

Record any non-obvious decision in [07-decisions.md](07-decisions.md) as a new
ADR. "Non-obvious" means: the next person would reasonably do it differently.
