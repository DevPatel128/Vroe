# Observability

**Status:** Review · **Last updated:** 2026-09-20 · **Owner:** Vroe Labs · **Version:** 1.0

How to know whether the site is up and behaving, and what is deliberately not
watched. Design of the pieces is in
[RELIABILITY.md](../05_ENGINEERING/RELIABILITY/RELIABILITY.md).

## What exists

| Signal | Where | Notes |
| --- | --- | --- |
| Logs and errors | Workers Logs (`observability.enabled` in `wrangler.jsonc`) | The only error aggregation. Sentry was deferred ([ADR-012](../08_DECISIONS/ENGINEERING/ADR-012-sentry-deferred.md)) |
| Health | `/api/health` | Booleans only, never a secret. `ready` is false, with a 503, if the assets or a KV binding is missing. Turnstile is reported but is not required. Three more booleans describe the subscriber backup (`backups_r2`, `backup_ever`, `backup_recent`); they are **not** part of `ready` |
| CSP violations | `/api/csp-report`, logged | See below |
| Deploy verification | The smoke test at the end of `deploy.yml` | Fails the run, and triggers a rollback |
| Availability over time | The scheduled health check | Below |

**CSP reports.** Bot Fight Mode injects an inline script that the CSP blocks, so
roughly one violation per page view is the expected baseline. Anything with a
different directive or blocked URI is worth investigating.

**Never logged:** passwords, tokens, private keys, and email addresses. The subscribe
handler never writes an address to a log line, and a test enforces it.

## The scheduled health check

`.github/workflows/health.yml` runs every three hours and checks the deployed
Worker: `/api/health` reports ready, `/`, `/trove` and `/vero` return 200, the CSP
header is present, and the custom domain answers. It also watches the subscriber
backup: it fails if the bucket is not bound, if a backup exists but the newest is
over 36 hours old, or if R2 cannot be read ([BACKUPS.md](BACKUPS.md)). It tries
three times, 30 seconds apart, so one dropped request is not an alert. A failure is
a failed Actions run, and GitHub emails those. There is no other alerting.

Two things to set up, once:

1. **The `WORKER_URL` repository variable** (Settings → Secrets and variables →
   Actions → Variables): the deployed Worker's workers.dev address, which the last
   successful Deploy run prints. It is a variable, not a secret, because it is
   public. If the account's workers.dev subdomain is ever renamed, update it. The
   check fails loudly, saying so, while the variable is missing or wrong.
2. **Your notifications** (github.com → Settings → Notifications → Actions):
   enable "Send notifications for failed workflows only". Scheduled-run failures
   go to whoever last edited the cron line in the workflow file.

Bot Fight Mode challenges GitHub runners on `vroelabs.com`, so the check leans on
the workers.dev address for the real verdict and treats a challenge on the custom
domain as "cannot verify from here", not as an outage.

## What is not watched

- **Page views and visitors.** Web Analytics is not enabled, so nothing counts them.
- **A backup that never ran.** Until the first backup exists there is nothing to be
  stale, so the check is quiet; the first one is run by hand before merging.
- **Anything beyond email.** The only alert channel is GitHub's failed-workflow email.
  If that is switched off, or `WORKER_URL` is wrong, nothing notices.
