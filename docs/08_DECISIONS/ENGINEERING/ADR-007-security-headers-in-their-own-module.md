# ADR-007 — Security headers in their own module

**Status:** Approved · **Last updated:** 2026-09-01 · **Owner:** Vroe Labs · **Version:** 1.0

**Category:** Engineering · **Recorded:** 2026-09-01

**Context.** `worker/index.js` exported `CSP` so the tests could assert on it.
The Workers runtime refused to start: *"Incorrect type for map entry 'CSP': the
provided value is not of type 'function or ExportedHandler'."* Every named export
of a Worker entry module must be a handler.

**Decision.** Move the policy and headers to `worker/headers.js`.

**Consequences.** The worker and the tests import the same values, and the entry
module exports only functions. Caught by running the site — a unit test against
the module could never have found it.

---

*Recorded before the decision template in [DECISIONS.md](../DECISIONS.md). Evidence, cost and approver were not captured at the time and are not back-filled here.*
