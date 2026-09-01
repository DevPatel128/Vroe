# Content

## The rule

**All user-visible text lives in `src/content/`.** A component may lay text out;
it may not contain it. This is what makes copy reviewable without reading JSX,
and what lets the honesty rules below be enforced in one place.

| File | Holds |
| --- | --- |
| `site.js` | `SITE_URL`, contact address, LinkedIn, theme colour, analytics/verification tokens |
| `routes.js` | Every URL, its `<title>`, meta description, OG image and sitemap data |
| `products.js` | Trove and Vero: status, headline, summary, capabilities, principles |
| `notes.js` | The two articles, with real publication dates |
| `legal.js` | Privacy policy and terms |
| `copy.js` | Hero, section intros, beliefs, early access, about, contact, 404 |

## Honesty rules

These are not stylistic. They come from the brand guide ("never imply a product
is live when it is not") and they are enforced by tests.

### 1. Neither product is available

| | Status | External link |
| --- | --- | --- |
| Trove | `Taking shape` | none — `url: null` |
| Vero | `Upcoming` | none — `url: null` |

Trove's live URL was removed from the site entirely. Neither
`trove.devpatel1286.workers.dev` nor `trove.vroelabs.com` appears anywhere. Both
product cards and both note cards link to internal pages.

**When Trove ships**, set `url` and `status` in `src/content/products.js`. The
pill, the buttons, the structured data and the sitemap all follow from those two
fields — no other file needs editing.

### 2. Every product page states its status in plain words

`src/pages/product.jsx` renders a "Where this stands" callout:

> **Trove** is being built and is not yet available to use. There is no
> download, no sign-up and no waiting list beyond the email updates below.

> **Vero** is an exploration rather than a product. Nothing described here has
> been built yet — there is no escrow, no payments, no dispute process and no
> public profiles.

Vero's four non-existent systems are listed in `products.js` as `notYetBuilt`.
Do not describe any of them as though they work.

### 3. No invented facts anywhere

No user counts, download numbers, revenue, funding, testimonials, ratings,
reviews, awards, or launch dates. The structured data carries no `offers`,
`aggregateRating` or `review` — `npm run test:seo` fails if any appear.

### 4. Capabilities are written as intent, not as shipped features

"Recurring payments gathered in one list" describes what Trove is being built to
do. Avoid "Trove tracks your subscriptions", which reads as a live feature.

### 5. Article dates are real

`published` is the date an article first went live on vroelabs.com — **2026-09-01**
for both, which is when this site launched, not when the prototype file was
written. `updated` changes only when the text actually changes. Both feed the
`Article` JSON-LD directly, so backdating either puts a false date in front of
Google.

## One deviation from the supplied SEO brief

The brief specified this Trove meta description:

> Trove **is** a free personal finance app for tracking spending, budgets,
> subscriptions, goals, investments, and money across currencies.

The present tense asserts the app exists and is free. It does not. The shipped
version keeps every keyword and rephrases one clause:

> Trove **is a personal finance app in development, built for** tracking
> spending, budgets, subscriptions, goals, investments, and money across
> currencies.

The supplied titles for Home, Trove and Vero, and the Vero description, are used
verbatim — none of them assert availability.

## Voice

From the brand guide: say what the product makes easier; prefer specific, human
language over feature lists; leave room for curiosity; avoid hype, invented
metrics, and claims that cannot be demonstrated.

In practice: British spelling, sentence case in body copy, em dashes with
spaces, and no exclamation marks. Headlines are split into an array of lines so
the display serif breaks where it is meant to — `["Your whole", "money picture"]`
renders across two lines with the coral full stop appended.

## Link text

Descriptive, never "click here" / "read more" / "learn more" — a test fails on
those. The standard anchors:

- "Explore the Trove personal finance app"
- "Learn about Vero's verified work history"
- "Read how Trove approaches financial clarity"
- "Read the idea behind portable proof of work"

## Placeholders that still need a real value

- **LinkedIn** — `SITE.linkedin` is `https://www.linkedin.com/`, the bare root,
  because the Vroe Labs company page does not exist yet. Deliberately not an
  invented vanity URL. Replace it in `src/content/site.js` when the page exists.
- **`CF_ANALYTICS_TOKEN`** — empty, so no beacon is injected. Set it after
  creating the Cloudflare Web Analytics site.
- **`GOOGLE_SITE_VERIFICATION`** — empty. DNS TXT is the primary method; see
  [SEARCH_CONSOLE_SETUP.md](../SEARCH_CONSOLE_SETUP.md).
