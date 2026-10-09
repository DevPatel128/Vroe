# PRODUCT.md

The Vroe Labs website at `vroelabs.com`. The products it describes, Trove and Vero, are not defined here: their records are `code/src/content/products.js`, and their own repositories hold their specifications. Approved by Dev on 2026-09-20 (product, thesis and experience). Items marked *assumption* are not from research.

## Brief
- **User:** people curious about Vroe Labs and its products, including people who want to hear when Trove is ready. *Assumption: inferred from the copy and the form; no visitor research exists.*
- **Problem (in their words):** UNKNOWN. No visitor research exists. The studio's own framing: a studio with no shipped product still needs a credible, truthful presence and a way to hear from interested people (*assumption*).
- **Today they:** UNKNOWN.
- **Outcome we promise:** within seconds a visitor can tell what Vroe Labs is, what Trove and Vero are, and that neither is available yet. They can leave an email address with explicit consent, and read sourced evidence for the problem Trove is being built for.
- **Product promise:** nothing on the site is claimed that is not true today.
- **Why now:** not written on purpose. No verified account exists, and inventing one breaks the no-fabrication rule.
- **Different because:** not written on purpose. It would assert something about a product that has not shipped.
- **Non-goals:** the site is not the products (no download, sign-in or waiting list beyond email updates). It never claims a product is available or states pricing, user numbers, downloads, launch dates, ratings or reviews. No payments, accounts or user-generated content. No cookies of its own and no cross-site tracking; analytics, if enabled, is cookieless (ADR-011). No client-side framework (ADR-001).
- **North Star metric:** UNKNOWN. No target is set for sign-ups or visitors, and visitor analytics is off. Setting one is the maintainer's decision.
- **Falsifiers (we are wrong if):** not yet defined. It needs the maintainer's judgement.
- **Go / pivot / kill thresholds:** UNKNOWN.
- **Constraints:** static HTML with a strict CSP; Cloudflare free tier only (ADR-018); the privacy policy must describe what the Worker actually stores; one maintainer.

## Thesis (as published, beliefs not findings)
- **Trove:** "Most people do not have a money problem so much as a money-visibility problem." The measured costs of managing personal finances, India first, are in `docs/03_RESEARCH/RESEARCH.md`. They describe the problem, never an effect Trove has had.
- **Vero:** work history is hard to prove, and proof should belong to the person who earned it. Vero is an exploration with no research base yet.

## Pages (acceptance criteria get IDs; PRs deliver IDs)
`code/src/content/routes.js` is the source of truth for every route; it drives prerendering, the sitemap, the navigation and the link checker.

### P1 `/` — Done
Intent: who Vroe Labs is, the two products, the early-access form. Primary CTA: join the early-access list.
- P1.1 Given a visitor, when the page loads, then it names the studio and both products, and each product's status reads as not yet available.
- P1.2 Given the form, when a visitor submits without ticking consent, then nothing is stored and the form says why. Consent is never pre-ticked or inferred.
- P1.3 Given a successful store, when the Worker confirms the record, then and only then the form shows success.
- P1.4 Given the bot check cannot load, when a visitor tries to submit, then the form says so and offers a real email route.
- States: loading (bot check arming) · error (invalid address, `aria-invalid="true"`) · success (after store) · denied (rate limited, failed bot check).

### P2 `/products` — Done
Intent: the index of what is being made. Primary CTA: open a product page.
- P2.1 Given the page, then it has the page `h1` and one `h2` card per product, with no skipped heading level.

### P3 `/trove` and `/vero` — Done
Intent: one page per product, status first. Primary CTA: join the list.
- P3.1 Given a product page, then a "Where this stands" callout sits directly under the hero, before anything else.
- P3.2 Given `/trove`, then every displayed figure carries `data-evidence-id` and `data-source-id` and is recomputed from its source data by `npm run test:evidence`.
- P3.3 Given `/trove`, then India's evidence shows first and a country switch reveals other countries' panels, which are already in the HTML.
- P3.4 Given `/vero`, then its four non-existent systems (escrow, payments, disputes, public profiles) are named as not built, and no evidence layer renders.

### P4 `/notes/trove` and `/notes/vero` — Done
Intent: the thinking behind each product. Primary CTA: the product page.
- P4.1 Given a note, then `published` is 2026-09-01 (the site launch), and `updated` changes only when the text changes. Both feed the `Article` JSON-LD.

### P5 `/about` and `/contact` — Done
Intent: the studio, and how to reach it. Primary CTA: contact.
- P5.1 Given any link, then its text is descriptive; "click here", "read more" and "learn more" fail `npm run test:seo`.

### P6 `/privacy` and `/terms` — Done
Intent: what is stored and the terms of use.
- P6.1 Given the policy, then it lists exactly the four stored fields, the 730-day retention and the 30-day backup, matching the Worker and the backup script.

### P7 `/404` — Done
Intent: the not-found page, served with a real 404 status.
- P7.1 Given an unknown path, then the response is a 404 with this page, `noindex, follow`, no canonical, and not in the sitemap.

### All pages
- PA.1 One `h1`, headings in order, landmarks, and a skip link as the first focusable element.
- PA.2 Every image has `alt`, `width` and `height`; decorative previews are `aria-hidden`.
- PA.3 Lighthouse (CI `performance` job, all ten indexable routes): performance at least 0.95, FCP, LCP, TBT and CLS inside Google's "good" thresholds, and no failing accessibility, best-practice or SEO audit.
- PA.4 No horizontal overflow at any width; breakpoints at 980px (product grid to one column) and 700px (gutter 80px to 20px, navigation becomes a menu).
- PA.5 Readable without JavaScript. One clear primary action per page; no pop-ups, banners or interstitials.

## Honesty rules (enforced by tests)
1. Neither product is available. Trove is `Taking shape`, Vero is `Upcoming`, both with `url: null`. When Trove ships, set `url` and `status` in `products.js`; the pill, buttons, structured data and sitemap follow. Re-add `offers` in `src/seo/JsonLd.jsx` only that day (ADR-006).
2. Every product page states its status in plain words, first.
3. No user counts, downloads, revenue, funding, testimonials, ratings, reviews, awards or launch dates. `npm run test:seo` fails on `offers`, `aggregateRating` or `review`.
4. Capabilities are written as intent, not shipped features ("Recurring payments gathered in one list", never "Trove tracks your subscriptions").
5. Evidence describes the problem, never Trove's effect. No number is typed in `src/content/evidence/trove.js`. `npm run test:evidence` fails on "Trove saves", "Trove users" and similar.
6. The Trove meta description says "a personal finance app in development", not "is a free personal finance app". This is the one deviation from the supplied SEO brief.

## Design tokens
Source: the brand guide (the client's document; treat it as read-only), expressed in `code/src/styles/tokens.css`. Never add a colour, radius or width the brand guide does not define.
- **Type:** display `Instrument Serif` (fallback Georgia), regular weight, tight tracking; interface `DM Sans` (400/500/600/700). Self-hosted from `/fonts/` (ADR-003). Hero `h1` `clamp(68px, 7.2vw, 110px)`; section `h2` `clamp(52px, 6vw, 86px)`; product `h3` `clamp(44px, 4.4vw, 66px)`; body 14 to 15px desktop, 13px mobile, line-height 1.55 to 1.6; article body 17px / 1.7; eyebrow 10px, 700, 0.16em, uppercase. Display headings are arrays of lines, followed by a decorative coral full stop.
- **Color (light only; no dark theme exists):** Ink `#081b4a` (text, dark surfaces, primary button) · Ink Soft `#29406c` (supporting copy; 9.5:1 on Paper) · Sky `#a9cbed` (hero, Vero, contact) · Paper `#f7f6f2` (page) · White `#fffdf9` (cards) · Coral `#ff674f` (CTAs, accents, focus ring; never a text colour, 2.66:1 on Paper) · Lime `#d4e779` (status, Trove notes) · Line `rgba(8,27,74,0.17)`. Preview-only: `--preview-green #4e6e3f`, `--preview-muted #6a7381` (ADR-024). Danger: UNKNOWN (not defined by the brand guide).
- **Space:** content width 1200px, hero and header 1360px; gutters 80px desktop, 20px mobile. The kit's 4/8/12/16/24/32/48 scale is not the brand's; spacing utilities live in `base.css`.
- **Radius / shadow / motion:** card 20px (hero 24px), control 12px, pill 999px. Shadow: soft ink shadows on cards and the mobile menu (`rgba(8, 27, 74, 0.1)` to `0.12`, in `products.css` and `responsive.css`); not a brand-guide token. `prefers-reduced-motion: reduce` disables smooth scrolling and collapses every transition. Focus: two-tone ring, 3px coral outline with an ink halo.
- **Tone:** warm, editorial, quietly optimistic. Do: say what the product makes easier; specific, human language; British spelling; sentence case; spaced em dashes. Don't: hype, invented metrics, exclamation marks, or anything that implies a product is live.
