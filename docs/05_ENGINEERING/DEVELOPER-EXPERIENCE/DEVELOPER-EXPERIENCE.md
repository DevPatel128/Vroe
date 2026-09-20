# Developer experience

**Status:** Review · **Last updated:** 2026-09-20 · **Owner:** Vroe Labs · **Version:** 1.0

The tooling around making a change: the local environment, the commands, the test
suites and the dependency policy. What to *do* when making a change is in
[DEVELOPMENT.md](../DEVELOPMENT/DEVELOPMENT.md).

Every command assumes you are in `code/`. Node 22 or newer.

# Local development

```bash
npm run build      # wrangler serves dist/client, so build first
npm run preview    # wrangler dev on :8787 (next free port if taken), real worker, local KV
```

`.dev.vars` holds `TURNSTILE_SECRET_KEY` for local use and is gitignored.

To exercise the success path locally without a browser widget, temporarily swap
in Cloudflare's always-passes test secret
(`1x0000000000000000000000000000000AA`), then restore. Local KV lives in
`.wrangler/state/`; delete that directory to clear test data.

## Commands

| Command | Does |
| --- | --- |
| `npm run dev` | Vite's dev server, for working on styles and components. It has no Worker, so use `preview` to see the real thing |
| `npm run build` | The whole pipeline: `build:fonts`, `build:images`, Vite, `build:prerender` (components to HTML) and `build:seo` (sitemap, robots, security.txt) |
| `npm run deploy` | Build, then `wrangler deploy` from your machine. Normally CI deploys when a pull request merges; this is for emergencies |
| `npm run preview` | Serve the built site through the real Worker. `wrangler dev` uses port 8787, or the next free one |
| `npm test` | Every suite below |
| `npm run perf` | Lighthouse budgets against a running preview; needs Chrome and `cd perf && npm ci` once |
| `npm run backup` | Copy the live subscriber list to `../backups/subscribers/YYYY-MM-DD.json`, keeping 30 days. Uses your `wrangler login`. See [BACKUPS.md](../../06_OPERATIONS/BACKUPS.md) |
| `npm run backup:check` | Fail if the newest backup is not from today or yesterday, or an old one was kept |
| `npm run audit:deps` | `npm audit --audit-level=high` |
| `npm run audit:sbom` | A CycloneDX SBOM to `sbom.json` |
| `npm run build:fonts`, `build:images`, `build:og`, `build:icons` | Asset pipelines. `build:og` and `build:icons` are not part of `build`; the outputs are committed |

## Test suites

| Suite | Covers |
| --- | --- |
| `test:sites` | Worker routing |
| `test:security` | Headers, CSP, the subscribe pipeline, build hygiene |
| `test:functionality` | Behaviour of the built pages |
| `test:seo` | Metadata, structured data, sitemap, links, images |
| `test:evidence` | Every displayed figure recomputed from its source data |
| `test:performance` | Byte budgets ([PERFORMANCE.md](../PERFORMANCE/PERFORMANCE.md)) |
| `test:docs` | The documentation system's structure, headers and links |
| `test:docs-sync` | Documentation follows the code: every script, workflow, route, binding, endpoint, secret and cited decision is documented, and the retention periods agree |
| `test:accessibility` | No skipped heading levels, the illustration palette and brand text meet WCAG AA, coral is never text |
| `test:backup` | The subscriber backup: file shape, restore round trip, retention and pruning, atomic writes, the check, that `backups/` can never be tracked by git, that nothing personal is printed, and a full backup and restore against Wrangler's local simulation |
| `test:docs-impact` | The rule that a change to what the docs describe must come with a docs change (`scripts/docs-impact.mjs`), tested without git |

## Dependencies

Every package is a `devDependency`, because nothing ships to the browser.
Versions are pinned exactly (`save-exact`) with a committed lockfile, installs use
`--ignore-scripts`, and `npm audit --audit-level=high` gates CI. Dependabot opens
grouped pull requests weekly for the app and monthly for `perf/` and for Actions.
They are **reviewed, never auto-merged**: a lockfile change is the main way a
compromised package reaches a build machine, and `main` will not accept one whose
`verify` check is red ([ADR-020](../../08_DECISIONS/ENGINEERING/ADR-020-production-safeguards-a-required-check-a-health-check.md)).

A package a script imports directly must be a *direct* dependency, not one that
happens to arrive through another ([ADR-019](../../08_DECISIONS/ENGINEERING/ADR-019-declare-esbuild-as-a-direct-devdependency.md)).

## Previews

`workers_dev` and `preview_urls` are on, so every deploy has a workers.dev address.
The canonical-host redirect deliberately leaves workers.dev alone so previews stay
reachable.
