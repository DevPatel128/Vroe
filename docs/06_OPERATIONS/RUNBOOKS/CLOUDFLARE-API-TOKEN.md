# Cloudflare API token

**Status:** Review · **Last updated:** 2026-09-20 · **Owner:** Vroe Labs · **Version:** 1.0

Creating, storing, replacing and revoking the token CI uses to deploy. Why the
pipeline is scoped this way is in
[CI-CD.md](../../05_ENGINEERING/CI-CD/CI-CD.md).

Do this yourself. A deploy credential should never pass through a third party,
and it is only ever pasted into Cloudflare's and GitHub's own forms.

**1. Create the token** at
`dash.cloudflare.com` → profile menu → **API Tokens** → **Create Token** →
**Create Custom Token**. Do *not* use "Global API Key" — that one can do
anything to the whole account.

Give it exactly these permissions and nothing more:

| Type | Resource | Access |
| --- | --- | --- |
| Account | Workers Scripts | Edit |
| Account | Workers KV Storage | Edit |
| Account | Account Settings | Read |
| Zone | Workers Routes | Edit |

Scope it under **Account Resources** to your Cloudflare account, and
under **Zone Resources** to `vroelabs.com` only. Set a TTL if you want one —
the deploy will start failing when it expires, which is a loud, safe failure.

Copy the token when it is shown. Cloudflare will not show it again.

**2. Store it as a GitHub secret.** Either paste it at
`github.com/DevPatel128/Vroe` → **Settings → Secrets and variables → Actions →
New repository secret**, named `CLOUDFLARE_API_TOKEN` — or from your terminal:

```bash
gh secret set CLOUDFLARE_API_TOKEN
```

That prompts for the value and sends it straight to GitHub; it does not appear
in your shell history or in this transcript.

**3. Confirm it landed** (this prints names and dates only, never values):

```bash
gh secret list
```

You should see `CLOUDFLARE_API_TOKEN` alongside `CLOUDFLARE_ACCOUNT_ID`. The
next push to `main` will then deploy.

If the token ever leaks, revoke it in the same Cloudflare API Tokens screen —
that invalidates it immediately — then create a new one and re-run step 2.

The account id is stored the same way:

```bash
gh secret set CLOUDFLARE_ACCOUNT_ID --repo DevPatel128/Vroe
```

Use a scoped token, never a Global API Key. If exposure is suspected, follow
[INCIDENTS.md](../INCIDENTS.md) and rotate it immediately.
