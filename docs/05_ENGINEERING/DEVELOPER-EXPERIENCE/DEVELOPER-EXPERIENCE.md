# Developer experience

**Status:** Review · **Last updated:** 2026-09-19 · **Owner:** Vroe Labs · **Version:** 1.0

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
| `npm run build` | Fonts, images, Vite, prerender, sitemap |
| `npm run preview` | Serve the built site through the real Worker. `wrangler dev` uses port 8787, or the next free one |
| `npm test` | Every suite below |
| `npm run perf` | Lighthouse budgets against a running preview; needs Chrome and `cd perf && npm ci` once |
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
