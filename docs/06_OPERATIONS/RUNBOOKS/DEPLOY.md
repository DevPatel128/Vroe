# Deploying and verifying

**Status:** Review · **Last updated:** 2026-09-20 · **Owner:** Vroe Labs · **Version:** 1.0

Confirming a deploy, and what to do when one fails. The pipeline itself is in
[CI-CD.md](../../05_ENGINEERING/CI-CD/CI-CD.md); before you deploy, run
[PRODUCTION-CHECKLIST.md](PRODUCTION-CHECKLIST.md).

## Verifying a deploy

```bash
curl -sI https://vroelabs.com | grep -i "content-security-policy\|strict-transport"
curl -s -o /dev/null -w '%{http_code}\n' https://vroelabs.com/trove          # 200
curl -s -o /dev/null -w '%{redirect_url}\n' https://www.vroelabs.com/         # apex
curl -s https://vroelabs.com/api/health                                       # ready:true
curl -s https://vroelabs.com/robots.txt
```

Then submit the form once for real and read the record back out of KV.

```bash
curl -sI https://vroelabs.com | grep -i "content-security-policy\|strict-transport"
curl -s https://vroelabs.com/api/health
```

`/api/health` returns booleans only — never a secret value. If `ready` is
`false`, a KV binding is missing. Roll back with `wrangler rollback`, or
re-deploy the previous commit; the worker and the assets ship together, so a
rollback restores both.

## If a deploy fails

| Symptom | Cause |
| --- | --- |
| "not of type 'function or ExportedHandler'" | A non-function named export in `worker/index.js`. ADR-007 |
| Security headers missing in production | `run_worker_first` disabled. ADR-008 |
| `/trove` returns 307 | `html_handling` is not `drop-trailing-slash` |
| Build fails, "Vite manifest not found" | `vite build` did not run before the prerenderer |
| Build fails, "Evidence data failed validation" | A figure lacks a source, is older than 2024, or cannot be recomputed. See [10-evidence.md](../../03_RESEARCH/RESEARCH.md) |
| Smoke test: "still cannot be reached" | The workers.dev address did not resolve. Check `workers_dev` in `wrangler.jsonc` and the account's workers.dev subdomain |
| Custom domain not resolving | First deploy can take a few minutes to provision the certificate |

A deploy that fails its smoke test rolls itself back; see
[ROLLBACKS.md](../ROLLBACKS.md).
