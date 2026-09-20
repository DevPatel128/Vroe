# ADR-008 — `run_worker_first: true`

**Status:** Approved · **Last updated:** 2026-09-01 · **Owner:** Vroe Labs · **Version:** 1.0

**Category:** Engineering · **Recorded:** 2026-09-01

**Context.** With static assets configured, Cloudflare serves a matching asset
**directly and never invokes the worker**. Every security header was therefore
absent from exactly the responses that mattered most: the HTML pages. `curl -I`
against the running site showed only `Cache-Control`.

**Decision.** Set `assets.run_worker_first: true` so every request goes through
the worker, which fetches the asset via the `ASSETS` binding and attaches the
headers on the way out. Also `html_handling: "drop-trailing-slash"`, because the
default 307-redirects `/trove` to `/trove/` — making every canonical URL on the
site a redirect.

**Consequences.** One worker invocation per request. Well within the free tier
for a marketing site, and consistent headers across HTML, assets and errors is
the entire requirement.

---

*Recorded before the decision template in [DECISIONS.md](../DECISIONS.md). Evidence, cost and approver were not captured at the time and are not back-filled here.*
