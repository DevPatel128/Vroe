# ADR-014 — The HTTPS upgrade is gated on `CF-Ray`

**Status:** Approved · **Last updated:** 2026-09-02 · **Owner:** Vroe Labs · **Version:** 1.0

**Category:** Engineering · **Recorded:** 2026-09-02

**Context.** `npm run preview` served nothing but 301 redirects. `wrangler dev`
derives the request URL — and the Host header — from the first entry in
`routes`, so the worker saw `http://vroelabs.com/…` on a local request. That is
the canonical host over plain HTTP, so `canonicalRedirect()` took the
HTTPS-upgrade branch and returned `https://vroelabs.com/…`; wrangler then
rewrote that `Location` back to `http://localhost:8788/…` and the browser looped
until it gave up. The existing `isLocal` check could not catch it, because by
the time the worker sees the request nothing about it looks local any more.

**Decision.** Gate the scheme upgrade — and only the scheme upgrade — on the
presence of the `CF-Ray` request header:

```js
const atEdge = request.headers.has("cf-ray");
const insecure = url.protocol === "http:" && atEdge;
```

**Rationale.** Cloudflare attaches `CF-Ray` to every request that reaches the
edge and overwrites anything the client sends, so it cannot be suppressed by a
visitor in production. It is absent under `wrangler dev`. This was **verified
rather than assumed**: running the worker on real Cloudflare infrastructure with
`wrangler dev --remote` and probing the request showed `cf-ray` present, host
`vroelabs.com`, protocol `https:`.

The canonical-host redirect is deliberately **not** gated. If the edge ever
stopped sending `CF-Ray`, the worst case is that the worker stops upgrading
plain HTTP — which Cloudflare's "Always Use HTTPS" setting and HSTS both still
cover — rather than the site quietly becoming reachable on two hostnames.

**Alternative rejected.** A `dev` block in `wrangler.jsonc` (`ip`, `port`,
`local_protocol`) does not change the URL wrangler hands the worker; it was
tried and had no effect. Relying on config would also leave the loop in place
for anyone running `wrangler dev` without it.

`tests/security.test.mjs` covers both directions: a request without `CF-Ray` is
never redirected, an edge request still upgrades and canonicalises, and www
still folds to the apex without `CF-Ray`.

---

*Recorded before the decision template in [DECISIONS.md](../DECISIONS.md). Evidence, cost and approver were not captured at the time and are not back-filled here.*
