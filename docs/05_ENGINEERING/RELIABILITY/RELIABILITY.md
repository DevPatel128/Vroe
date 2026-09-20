# Reliability

**Status:** Review · **Last updated:** 2026-09-20 · **Owner:** Vroe Labs · **Version:** 1.0

How the site fails, what a visitor sees, and how it recovers. What a person does
about it is in [06_OPERATIONS](../../06_OPERATIONS/README.md).

## Failure modes

| What fails | What happens | Why that is safe |
| --- | --- | --- |
| The rate-limit KV is unavailable | The subscribe request is allowed through | It **fails open**: a KV outage should not take the form offline. The honeypot and Turnstile still apply |
| The subscriber KV write fails | The form reports failure | Success is only claimed after the record is stored |
| Turnstile cannot load | The form says so and offers a real email route | Turnstile is hardening, not a dependency |
| A bad version is deployed | The post-deploy smoke test fails and the deploy rolls itself back | The previous version is known to have passed its own smoke test ([ROLLBACKS.md](../../06_OPERATIONS/ROLLBACKS.md)) |
| A dependency update breaks the build | CI goes red and `main` will not accept the change | The failed build never reaches `wrangler deploy` ([ADR-019](../../08_DECISIONS/ENGINEERING/ADR-019-declare-esbuild-as-a-direct-devdependency.md)) |
| Production degrades unnoticed | The scheduled health check fails a run and GitHub emails it | [OBSERVABILITY.md](../../06_OPERATIONS/OBSERVABILITY.md) |
| The daily backup fails | The run is reported failed in Cloudflare, nothing partial is written, and the health check fails once the newest backup is over 36 hours old | The site is unaffected: the backup is deliberately outside `ready`, so it can never roll back a good deploy. Details in [BACKUPS.md](../../06_OPERATIONS/BACKUPS.md) |
| The subscriber list is lost or corrupted | Restored from the newest daily backup, then the deletion log is re-applied | Up to 24 hours of signups can be lost ([RESTORE-SUBSCRIBERS.md](../../06_OPERATIONS/RUNBOOKS/RESTORE-SUBSCRIBERS.md)) |

## Recovery

Detect, contain, recover, verify, document, improve. The concrete steps are
[ROLLBACKS.md](../../06_OPERATIONS/ROLLBACKS.md) for a bad deploy,
[INCIDENTS.md](../../06_OPERATIONS/INCIDENTS.md) for exposure, and
[DISASTER-RECOVERY.md](../../06_OPERATIONS/DISASTER-RECOVERY.md) for losing something
larger. The subscriber list is backed up daily
([BACKUPS.md](../../06_OPERATIONS/BACKUPS.md)); what a restore has and has not been
rehearsed against is recorded in DISASTER-RECOVERY.md.

## Confidentiality, integrity, availability

- **Confidentiality:** secrets are never committed; subscriber keys are hashes.
- **Integrity:** the canonical-host redirect never trusts the request's `Host`;
  writes require a same-origin request.
- **Availability:** the rate limiter fails open; the smoke test and health check
  detect loss of service; a failed deploy is undone. The residual risk of failing
  open is accepted, and is recorded in [SECURITY-AUDIT.md](../SECURITY/SECURITY-AUDIT.md).
