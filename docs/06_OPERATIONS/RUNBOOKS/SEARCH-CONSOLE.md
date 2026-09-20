# Google Search Console setup

**Status:** Approved · **Last updated:** 2026-09-04 · **Owner:** Vroe Labs · **Version:** 1.0

One-time setup for `vroelabs.com`. Roughly 15 minutes, plus waiting for DNS.

## 1. Create a Domain property

Go to [Search Console](https://search.google.com/search-console) → **Add
property** → choose **Domain** (the left-hand option), not URL prefix.

Enter `vroelabs.com`.

A Domain property covers `http`, `https`, `www` and every subdomain in one place.
A URL-prefix property would treat `https://vroelabs.com` and
`https://www.vroelabs.com` as different sites.

## 2. Verify ownership via DNS

Search Console will show a TXT record like
`google-site-verification=AbCdEf...`.

The domain is registered at Cloudflare and uses Cloudflare nameservers, so add
the record there: **Cloudflare dashboard → vroelabs.com → DNS → Add record**

| Field | Value |
| --- | --- |
| Type | `TXT` |
| Name | `@` |
| Content | the full `google-site-verification=…` string |
| TTL | Auto |

Then press **Verify**. Cloudflare DNS usually propagates within a minute or two;
if it fails, wait five minutes and retry rather than adding a second record.

**Do not delete the TXT record afterwards.** Google re-checks it periodically and
will unverify the property if it disappears.

### The HTML-tag fallback

Only if the DNS method is unavailable: set `GOOGLE_SITE_VERIFICATION` in
`src/content/site.js` to the token, then rebuild and deploy. It renders a
`<meta name="google-site-verification">` on every page. It is empty by default,
so no tag is emitted, which is correct while DNS verification is in use.

## 3. Confirm the canonical domain

The site 301-redirects `www.vroelabs.com` to `vroelabs.com`, and every canonical
tag points at the apex over HTTPS. Confirm:

```bash
curl -sI https://www.vroelabs.com/ | grep -i location   # → https://vroelabs.com/
curl -s https://vroelabs.com/trove | grep canonical      # → https://vroelabs.com/trove
```

## 4. Submit the sitemap

**Sitemaps** → enter `sitemap.xml` → **Submit**.

Full URL: `https://vroelabs.com/sitemap.xml` — nine URLs.

Status should reach "Success" within a day. "Couldn't fetch" usually means it was
submitted before DNS finished propagating; resubmit.

## 5. Inspect the homepage

**URL Inspection** → `https://vroelabs.com/` → **Test Live URL**.

Check that: the page is crawlable, the rendered HTML contains the real content
(it will — the site is prerendered), the canonical Google chose matches ours, and
no `noindex` is reported.

## 6. Inspect the remaining pages

Run URL Inspection on each:

```
https://vroelabs.com/trove
https://vroelabs.com/vero
https://vroelabs.com/notes/trove
https://vroelabs.com/notes/vero
https://vroelabs.com/about
https://vroelabs.com/contact
https://vroelabs.com/privacy
https://vroelabs.com/terms
```

## 7. Request indexing

For each of the above, use **Request Indexing**.

**This does not guarantee indexing.** It adds the URL to a crawl queue. Google
decides what to index and when, and a new domain with no inbound links can take
days or weeks. Requesting repeatedly does not help.

## 8. Reports to watch

Check weekly for the first month, then monthly.

| Report | What to look for |
| --- | --- |
| **Page indexing** | How many of the 9 are indexed, and the reason for any that are not. "Discovered – currently not indexed" is normal early on |
| **Core Web Vitals** | Needs real traffic before it populates. LCP, INP and CLS should all be green given the ~111 KB payload |
| **HTTPS** | Should be 100%. Anything else means a resource is being served over HTTP |
| **Mobile Usability** | Tap targets, text size, viewport |
| **Enhancements → Breadcrumbs** | `BreadcrumbList` on the product, note and legal pages |
| **Sitemaps** | 9 discovered. A drop means a page stopped building |
| **Security Issues** and **Manual Actions** | Both should stay empty |

## Also worth doing

**Bing Webmaster Tools** ([bing.com/webmasters](https://www.bing.com/webmasters))
can import directly from Search Console once verified. Bing also feeds DuckDuckGo.

**Cloudflare Web Analytics** — create a site for `vroelabs.com` in the Cloudflare
dashboard, then put the beacon token in `CF_ANALYTICS_TOKEN` in
`src/content/site.js`. It is cookieless and needs no consent banner. Until the
token is set, no beacon is injected.

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| Verification fails | DNS not propagated. Wait 5 minutes; do not add a second TXT record |
| Sitemap "Couldn't fetch" | Submitted too early, or the deploy has not finished |
| "Page with redirect" | You inspected the `www` URL. Inspect the apex |
| "Alternate page with proper canonical tag" | Expected for `www` variants; harmless |
| "Crawled – currently not indexed" | Common for new sites with no inbound links. Nothing to fix technically |
| "Blocked by robots.txt" | Only `/api/` is disallowed. If a real page reports this, check `scripts/generate-sitemap.entry.jsx` |
