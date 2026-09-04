import { SITE, SITE_URL, THEME_COLOR, GOOGLE_SITE_VERIFICATION, CF_ANALYTICS_TOKEN } from "../content/site.js";

/**
 * Everything that belongs in <head>, derived from one route record.
 *
 * There is no react-helmet and no client-side metadata: the prerenderer renders
 * this straight into the static HTML, so a crawler sees the final tags in the
 * first response rather than after executing JavaScript.
 *
 * `absolute()` is why og:url and og:image are always fully qualified — relative
 * Open Graph URLs are a common reason link previews come back blank.
 */
const absolute = (p) => (p.startsWith("http") ? p : `${SITE_URL}${p}`);

export function SeoHead({ route, jsonLd = [] }) {
  const url = absolute(route.path === "/404" ? "/" : route.path);
  const image = absolute(route.ogImage);
  const canonical = route.path === "/" ? `${SITE_URL}/` : `${SITE_URL}${route.path}`;

  return (
    <>
      <meta charSet="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>{route.title}</title>
      <meta name="description" content={route.description} />

      {/* One canonical per page. /404 is excluded from indexing entirely. */}
      {route.indexable ? (
        <link rel="canonical" href={canonical} />
      ) : (
        <meta name="robots" content="noindex, follow" />
      )}

      <meta name="theme-color" content={THEME_COLOR} />
      <meta name="color-scheme" content="light" />
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />

      {/* Open Graph */}
      <meta property="og:site_name" content={SITE.name} />
      <meta property="og:locale" content="en_GB" />
      <meta property="og:type" content={route.ogType} />
      <meta property="og:title" content={route.title} />
      <meta property="og:description" content={route.description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={`${SITE.name} — ${SITE.tagline}`} />

      {/* Twitter / X */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={route.title} />
      <meta name="twitter:description" content={route.description} />
      <meta name="twitter:image" content={image} />

      {GOOGLE_SITE_VERIFICATION ? (
        <meta name="google-site-verification" content={GOOGLE_SITE_VERIFICATION} />
      ) : null}

      {/* Self-hosted, so there is no third-party font origin to preconnect to.
          Preloading only the two faces used above the fold. */}
      <link
        rel="preload" as="font" type="font/woff2" crossOrigin="anonymous"
        href="/fonts/instrument-serif-latin-400-normal.woff2"
      />
      <link
        rel="preload" as="font" type="font/woff2" crossOrigin="anonymous"
        href="/fonts/dm-sans-latin-400-normal.woff2"
      />

      {jsonLd.map((block, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serialise(block) }}
        />
      ))}

      {CF_ANALYTICS_TOKEN ? (
        <script
          defer
          src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon={`{"token":"${CF_ANALYTICS_TOKEN}"}`}
        />
      ) : null}
    </>
  );
}

/**
 * JSON-LD is the one place this codebase emits a raw string into HTML, so it
 * gets escaped deliberately. `<` is neutralised so a "</script>" that ever
 * appeared in content could not close the block early, and U+2028/U+2029 are
 * escaped because they are literal line terminators in JavaScript.
 */
function serialise(data) {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
