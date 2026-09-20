/**
 * Security headers and the Content Security Policy.
 *
 * These live in their own module because the Workers runtime requires every
 * named export of the entry module to be a function or an ExportedHandler —
 * exporting the policy string from worker/index.js makes workerd refuse to
 * start. Keeping them here lets the worker and tests/security.test.mjs import
 * the same values without that constraint.
 */

/** Where CSP violation reports are posted. Must match the route in index.js. */
export const CSP_REPORT_PATH = "/api/csp-report";

/**
 * `default-src 'none'` followed by an explicit allowance per resource type, so
 * a directive nobody thought about denies rather than inheriting something
 * permissive.
 *
 * There is no 'unsafe-inline' and no 'unsafe-eval'. Styles and fonts are
 * self-hosted, and the only inline element on the site is the JSON-LD block —
 * which needs no script permission, because application/ld+json is data rather
 * than executable code.
 *
 * The three third-party origins are all deliberate:
 *   challenges.cloudflare.com      Turnstile: its script and its iframe
 *   static.cloudflareinsights.com  cookieless Web Analytics beacon
 *   cloudflareinsights.com         where that beacon reports to
 */
const CSP_DIRECTIVES = [
  "default-src 'none'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' https://challenges.cloudflare.com https://static.cloudflareinsights.com",
  "style-src 'self'",
  "font-src 'self'",
  "img-src 'self' data:",
  "connect-src 'self' https://cloudflareinsights.com",
  "frame-src https://challenges.cloudflare.com",
  "manifest-src 'self'",
  "worker-src 'self'",
  `report-uri ${CSP_REPORT_PATH}`,
  "upgrade-insecure-requests",
];

export const CSP = CSP_DIRECTIVES.join("; ");

/**
 * Applied to every response — assets, pages and errors alike.
 *
 * Deliberately absent:
 *  - `X-XSS-Protection` — retired; its filter introduced vulnerabilities of
 *    its own and modern browsers ignore it.
 *  - `Expect-CT` — obsolete since Certificate Transparency became mandatory.
 *  - `Cross-Origin-Embedder-Policy` — `require-corp` would break the Turnstile
 *    iframe, and nothing here needs cross-origin isolation.
 *  - HSTS `preload` — withheld on purpose. `includeSubDomains` already covers
 *    subdomains, but preload is effectively irreversible and
 *    trove.vroelabs.com is not live yet. Add it only once every subdomain is
 *    confirmed HTTPS-only. See docs/08_DECISIONS/DECISIONS.md, ADR-004.
 */
export const SECURITY_HEADERS = {
  "Content-Security-Policy": CSP,
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "accelerometer=(), autoplay=(), camera=(), display-capture=(), encrypted-media=(), " +
    "fullscreen=(self), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), " +
    "midi=(), payment=(), picture-in-picture=(), publickey-credentials-get=(), " +
    "screen-wake-lock=(), sync-xhr=(), usb=(), xr-spatial-tracking=(), interest-cohort=()",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
};

/** Copy the security headers onto a response without disturbing its body. */
export function withSecurity(response) {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) headers.set(key, value);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
