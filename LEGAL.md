# LEGAL.md

Not legal advice. AI drafts this file; a human approves it before launch. `scripts/legal-check.sh` reads the two tables marked "checked".

## Business
- **Legal name:** Vroe Labs (trading name of Dev Patel; not a registered company yet) · **Address:** not published (owner decision, 2026-10-11) · **Contact and grievance contact:** Dev Patel, founder, vroelabs@gmail.com (`SITE.email` in `code/src/content/site.js`, shown on `/contact` and in the privacy policy). vroelabs.com has no MX record (checked 2026-10-11), so no @vroelabs.com address can receive mail.
- **Status:** building (not yet in testing). The site says so at the bottom of `/privacy`, `/terms` and `/contact` and in the footer (`COMPANY_STATUS` in `code/src/content/copy.js`): "Vroe Labs is not yet a registered company. Its products are being built and are not yet in testing. Full legal details will be published before launch."
- **Licence:** PolyForm Strict 1.0.0 (the Vroe Labs licence), `LICENSE`; ADR-026. Third-party notices stay in `NOTICE` and this file.
- **Jurisdictions served:** UNKNOWN (owner fills; the site is public and the `/trove` evidence covers India and the United States) · **Governing law:** India (owner decision 2026-10-12; the company is based in India; matches the terms page)
- **Age rule:** the privacy policy says the site is not directed at children and nothing is knowingly collected from anyone under 16. The form has no age check.
- **Paid:** no. Nothing is sold; neither product is available. · **Refund window:** n/a · **Cancel path:** email the contact address to be removed (privacy policy, "Your choices"). There is no self-serve unsubscribe yet.

## Legal pages (checked: each Path must exist in the build, unless Status is n/a)
| Page | Path | Status |
|---|---|---|
| Privacy policy | /privacy | live (`PRIVACY` in `code/src/content/legal.js`) |
| Terms of service | /terms | live (`TERMS` in `code/src/content/legal.js`) |
| Refund and cancellation | /refund | n/a until paid |
| Contact (email, company status) | /contact | live with the email and the company-status line; no postal address by owner decision |

## Third parties (checked: every external host the build loads must be listed)
| Host | What | Data it gets | Licence / terms | Needs consent |
|---|---|---|---|---|
| challenges.cloudflare.com | Turnstile, loaded by `src/client/enhance.js` only when the early-access form is used | IP, browser signals | Cloudflare terms | no (security) |
| static.cloudflareinsights.com | Web Analytics beacon. Not loaded today: `CF_ANALYTICS_TOKEN` in `site.js` is empty; the host stays in the CSP so enabling it is one line | cookieless page views (when enabled) | Cloudflare terms | no |

Hosting is Cloudflare Workers, with Workers KV for storage and Workers Logs for logs. Cloudflare processes request data (IP, user agent, path) as the host. Fonts are self-hosted; no other external host is requested by the browser. Links to source websites on `/trove` are plain links, not loads.

## Data map
| Data | Why (feature) | Lawful basis / consent | Retention | Where stored | Shared with |
|---|---|---|---|---|---|
| Email address | Early-access list (`/api/subscribe`) | Consent: the box must be ticked (`consent === true`) | 730 days (`RETENTION_DAYS`, KV `expirationTtl`) or until a deletion request | KV `SUBSCRIBERS`, key is SHA-256 of the lowercased address | Cloudflare (processor) |
| Subscribed-at timestamp | Record of when consent was given | Consent | Same record | KV `SUBSCRIBERS` | Cloudflare (processor) |
| Country code (`request.cf.country`) | Stored with the signup | Consent | Same record | KV `SUBSCRIBERS` | Cloudflare (processor) |
| Consent flag | Proof of consent | Consent | Same record | KV `SUBSCRIBERS` | Cloudflare (processor) |
| IP address | Per-IP rate limit, 5 per 10 minutes | Legitimate interest (abuse prevention) | 600 seconds (`RATE_LIMIT_WINDOW_S`, KV `expirationTtl`) | KV `RATE_LIMIT`, as part of the counter key | Cloudflare (processor) |
| IP address, browser signals | Turnstile bot check | Legitimate interest (security) | Cloudflare's terms | Cloudflare Turnstile | Cloudflare |
| Backup of the subscriber list | Restore after data loss (`npm run backup`, run by hand; nothing schedules it) | Same as the records | Copies older than 30 days (`BACKUP_RETENTION_DAYS`) are deleted when the next backup runs | Maintainer's computer, `backups/subscribers/` (gitignored) | Nobody |
| CSP violation report (directive, blocked URI, document URI) | Detect CSP breakage (`/api/csp-report`) | Legitimate interest (security) | Workers Logs retention (UNKNOWN, Cloudflare default) | Workers Logs | Cloudflare (processor) |

No cookies, no accounts, no analytics today. Addresses are never written to logs (`worker/index.js` logs "New subscriber stored" only).

Delete and export: there is no `db.ts` and no self-serve path, and no unsubscribe link (the form says "Ask us to remove you anytime"). Requests go to the contact address; the maintainer reads or deletes the KV record with Wrangler (`RUNBOOK.md`). Answer requests within 30 days (GDPR allows 1 month; CCPA 45 days).

Privacy policy accuracy (fixed 2026-10-11): the "Analytics" section follows `CF_ANALYTICS_TOKEN`. It is empty, so the policy says the site uses no analytics. A test in `code/tests/docs-sync.test.mjs` fails if the policy and the token disagree. Enabling analytics also needs a new `LEGAL_EFFECTIVE` date. The policy also covers the per-IP rate-limit counter (600 s), CSP reports (Workers Logs) and hand-made backups.

## Assets
| Asset (font, image, icon, video) | Source | Licence | Proof (link or receipt) |
|---|---|---|---|
| DM Sans (self-hosted woff2) | `@fontsource/dm-sans` 5.3.0 | OFL-1.1 | package.json `license` in node_modules |
| Instrument Serif (self-hosted woff2) | `@fontsource/instrument-serif` 5.3.0 | OFL-1.1 | package.json `license` in node_modules |
| Icons, rendered to inline SVG at build time | `@phosphor-icons/react` 2.1.10 | MIT | package.json `license` in node_modules |
| Still-life photography (`assets-src/`, `public/assets/`) | Vroe Labs, per `NOTICE` | (c) Vroe Labs, not licensed for reuse (the code is under the Vroe Labs licence, PolyForm Strict 1.0.0) | UNKNOWN: how the images were made is not recorded (owner fills) |
| OG cards, favicon, touch icon | Generated by `scripts/generate-og.mjs` and `generate-icons.mjs` from the brand assets | (c) Vroe Labs | Generated in repo |

## Launch checklist (each line: done, n/a with reason, or open)
- [ ] Privacy policy, terms, refund and cookie sections match the data map above.
- [ ] No non-essential cookie or tracker before opt-in. Reject is as easy as accept. Cookieless analytics needs no banner.
- [ ] Forms: consent boxes unticked; link to privacy; marketing opt-in separate from terms.
- [ ] Data minimization: every field in the data map has a feature that uses it.
- [ ] Every SDK and script audited: listed above, data it gets, loaded only after consent when it tracks.
- [ ] No dark patterns: pre-ticked boxes, confirmshaming, fake timers or scarcity, forced signup, nagging, cancel harder than signup.
- [ ] No hidden fees: full price (tax, fees, renewal) shown before checkout.
- [ ] No fake, bought-undisclosed or AI-invented reviews or testimonials. Every claim (numbers, "best", "secure") has evidence.
- [ ] Accessibility: `alt` on every image, WCAG 2.2 AA contrast, full keyboard use, visible focus, labelled fields (axe in e2e).
- [ ] Business details (legal name, address, contact) on the contact page and in the footer.
- [ ] Age rule enforced at signup; no child data unless built and approved for it.
- [ ] Marketing email: unsubscribe link, one-click `List-Unsubscribe` header, postal address. Transactional email has no marketing.
- [ ] Every font and image has a licence row above.
- [ ] Data deletion and export work end to end and are tested.

## Regional notes (checked 2026-10-11 from secondary sources; recheck before launch)
- **EU/UK GDPR + ePrivacy:** privacy notice, lawful basis, rights requests within 1 month, consent before non-essential cookies.
- **India DPDP Act 2023 + Rules 2025:** notified Nov 2025. Notice, consent, rights, breach notice and verifiable parental consent for under-18s apply from about 13 May 2027.
- **US COPPA (amended):** under-13 data needs verifiable parental consent; full compliance due 22 Apr 2026. CAN-SPAM: honour unsubscribe within 10 business days. FTC rule bans fake reviews and testimonials. CCPA applies above its thresholds.
- **EU Accessibility Act:** applies since 28 Jun 2025 to e-commerce and consumer services. Microenterprise service providers (<10 staff and ≤€2M turnover or balance sheet) are exempt; still meet WCAG to avoid ADA-style claims elsewhere.
- **India dark patterns:** consumer-protection guidelines (2023) ban 13 patterns, including drip pricing, false urgency and subscription traps.
- **Email providers:** Gmail and Yahoo require one-click unsubscribe from bulk senders (5,000+ a day).
