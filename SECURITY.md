# Security

## Reporting a vulnerability

Email **vroelabs@gmail.com** with:

- A description of the issue
- Steps to reproduce
- Impact — what an attacker could actually do
- Optionally, a suggested fix

We aim to acknowledge within 72 hours and to fix high-severity issues within 7
days. We are happy to credit you publicly once a fix has shipped.

**There is no bug bounty programme.** We are a small studio and cannot pay for
reports. We would still very much like to hear from you.

## Scope

In scope: `https://vroelabs.com`, `https://www.vroelabs.com`, and the `/api/*`
endpoints on those hosts.

Out of scope:

- Denial-of-service and volumetric attacks
- Social engineering of Vroe Labs staff
- Third-party services — report to them directly (Cloudflare, GitHub)
- Self-XSS
- Missing best-practice headers with no working proof of concept
- Vulnerabilities in unmodified dependencies — please file upstream
- Automated scanner output with no demonstrated impact
- Reports about `trove.vroelabs.com` or other subdomains, which are separate
  systems with their own policies

## Testing guidelines

Please test only against your own submissions, keep request volume to what you
need, and do not attempt to access or modify other people's data. Good-faith
research within these guidelines is welcome and is not a breach of our
[terms of use](https://vroelabs.com/terms).

Do not run automated scanners at a rate that would degrade the service for
others. If you need to, tell us first and we will arrange a window.

## What this site actually is

A static marketing site with one write endpoint (`/api/subscribe`) that stores an
email address, a timestamp, a country code and a consent flag in Cloudflare
Workers KV. There are no user accounts, no sessions, no cookies set by us, no
payments and no database.

Being accurate about that helps: it means the interesting surface is the
subscribe endpoint, the security headers, and the deployment pipeline.

## What we do

- Strict Content Security Policy — no `unsafe-inline`, no `unsafe-eval`
- Full security header set on every response, including assets and errors
- Turnstile, a honeypot, and per-IP rate limiting on the one write endpoint
- No email address is ever written to a log line
- Exact pinned dependencies, a committed lockfile, and `npm ci --ignore-scripts` in CI
- `npm audit --audit-level=high` and an SBOM on every CI run
- No secrets in the repository; a test fails the build if one appears in the output
- Scoped Cloudflare API tokens, never a global key

We do **not** claim this site is "bank-grade", "fully secure" or "unhackable".
[SECURITY-AUDIT.md](docs/05_ENGINEERING/SECURITY/SECURITY-AUDIT.md) records the known limitations.

## Disclosure

We follow coordinated disclosure. Please give us 90 days, or until a fix ships,
whichever comes first.
