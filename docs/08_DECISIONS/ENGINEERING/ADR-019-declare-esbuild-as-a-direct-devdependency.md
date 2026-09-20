# ADR-019 — Declare `esbuild` as a direct devDependency

**Status:** Review · **Last updated:** 2026-09-19 · **Owner:** Vroe Labs · **Version:** 1.0

**Category:** Engineering · **Recorded:** 2026-09-19

**Status.** Proposed — in the pull request that adds ADR-020 and ADR-021;
approved when that merges.

**Context.** `scripts/prerender.mjs` imports `esbuild` directly. That only
resolved because Vite up to 7 depended on esbuild and npm hoisted it. The
Dependabot bump from Vite 6 to 8 (#9) removed that transitive copy, and CI and
Deploy both failed with `ERR_MODULE_NOT_FOUND` on 2026-09-16, leaving `main`
red. Vite 8 lists esbuild only as an optional peer, `^0.27.0 || ^0.28.0`.

**Decision.** Add `esbuild` 0.28.1 as an exact `devDependency`.

**Why.** A package a script imports directly has to be a direct dependency.
Relying on a transitive one is what let a routine version bump break the build.

**Cost.** Nothing recurring. No new package to trust: 0.28.1 was already in the
tree through wrangler, and the lockfile changes by two packages in, two out.

**Consequences.** The build is restored. `esbuild` now gets its own Dependabot
updates and must stay inside Vite's peer range, or `npm install` reports a
conflict.

**Alternatives.** Pin Vite back to 6.4.3 and `@vitejs/plugin-react` to 5.x:
undoes a supported major upgrade and only defers the same problem. Rewrite the
prerenderer on Vite 8's own bundler: a larger change with no user-facing
benefit. Keep esbuild 0.25.12 with `--force`: accepts a known peer conflict.

**Revisit when.** The prerenderer is rewritten, or Vite offers a supported way
to bundle SSR scripts programmatically.

**Approved by.** — **Date.**
