# Development

**Status:** Review · **Last updated:** 2026-09-19 · **Owner:** Vroe Labs · **Version:** 1.0

How to make a change to this repository. The rules you must not break are in
[PRINCIPLES.md](../../01_PRINCIPLES/PRINCIPLES.md); which file to edit for which
change is the table in [START_HERE](../../00_START_HERE/README.md); the tooling
around this (local setup, commands, dependency policy) is in
[DEVELOPER-EXPERIENCE.md](../DEVELOPER-EXPERIENCE/DEVELOPER-EXPERIENCE.md). Agents
also follow [AI-WORKFLOW.md](../AI/AI-WORKFLOW.md).

Every command assumes you are in `code/`: that is where `package.json` and
`wrangler.jsonc` live.

## Before you change anything

```bash
npm ci
npm run build
npm test          # all must pass before you start
```

If tests fail on a clean checkout, fix that before doing anything else.

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

Record any non-obvious decision in [07-decisions.md](../../08_DECISIONS/DECISIONS.md) as a new
ADR. "Non-obvious" means: the next person would reasonably do it differently.
