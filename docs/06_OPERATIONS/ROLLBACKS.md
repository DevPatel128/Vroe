# Rollbacks

**Status:** Review · **Last updated:** 2026-09-20 · **Owner:** Vroe Labs · **Version:** 1.0

Putting the previous version back.

```bash
npx wrangler deployments list
npx wrangler rollback --message "reason"
```

Assets and worker roll back together. HTML is `must-revalidate`, so a rollback is
visible immediately; hashed assets are immutable and unaffected.

**The deploy workflow does this itself.** If a deploy succeeds but then fails its
smoke test, the workflow runs `wrangler rollback` to the version uploaded before
it, waits for `/api/health` to report ready, and still ends red, so a bad deploy
is visible even though it was undone. It does nothing when the build or the tests
fail, because nothing was deployed. A rollback changes code only: KV data and
bindings are untouched, and Cloudflare refuses one if a binding the older version
uses has since been deleted. If the automatic rollback fails, the run says so and
you roll back by hand as above. ADR-020.
