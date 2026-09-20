/**
 * Vroe Labs — site-wide configuration.
 *
 * SITE_URL is the ONLY place the production origin is written down. Canonicals,
 * Open Graph URLs, the sitemap, robots.txt and every JSON-LD block derive from
 * it, so repointing the site at a new domain is a one-line change here.
 */

export const SITE_URL = "https://vroelabs.com";

export const SITE = {
  name: "Vroe Labs",
  tagline: "Useful ideas, made real.",
  /** Used as the Organization description in JSON-LD and the /about page lede. */
  description:
    "Vroe Labs is a product studio building thoughtful digital products that remove friction, create clarity, and make everyday life a little easier.",
  email: "vroelabs@gmail.com",
  /**
   * Empty until the Vroe Labs company page exists.
   *
   * It used to point at the bare LinkedIn root to avoid inventing a vanity URL.
   * That still shipped a footer icon labelled "Vroe Labs on LinkedIn" that
   * landed on LinkedIn's own homepage — a link that does not go where it says
   * it goes. The Footer omits the icon entirely while this is empty; set it to
   * the real company URL and the icon comes back. See docs/04_DESIGN/CONTENT.md.
   */
  linkedin: "",
  locale: "en",
  founded: "2026",
};

/**
 * Google Search Console verification.
 *
 * DNS TXT is the primary verification method for the domain property, so this
 * stays empty and the meta tag is simply not rendered. Set it only if you fall
 * back to the HTML-tag method. See docs/06_OPERATIONS/RUNBOOKS/SEARCH-CONSOLE.md.
 */
export const GOOGLE_SITE_VERIFICATION = "";

/**
 * Cloudflare Web Analytics beacon token.
 *
 * Cookieless and collects no personal data. Empty means the beacon is not
 * injected at all, which is the correct behaviour for local development.
 * The token is public by design — it is visible in the page source of every
 * site that uses it and grants no read access to the analytics data.
 */
export const CF_ANALYTICS_TOKEN = "";

/** Brand colour used for <meta name="theme-color">. Matches --blue in tokens.css. */
export const THEME_COLOR = "#a9cbed";
