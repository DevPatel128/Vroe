import { SITE, SITE_URL } from "../content/site.js";
import { PRODUCTS } from "../content/products.js";

/**
 * JSON-LD builders.
 *
 * HONESTY RULES — these are load-bearing, not stylistic:
 *
 *  - No `aggregateRating`, `review`, `interactionStatistic`, `award` or any
 *    other social-proof property. We have no such data and inventing it is
 *    both a Google structured-data violation and a lie.
 *  - No `Offer` on either product. An offer asserts that something is
 *    purchasable (or free) right now. Neither product is released, so no
 *    price, no availability, no `datePublished` standing in for a launch.
 *  - Structured data must only describe what a human can see on the page. Every
 *    builder below takes its values from the same content modules the page
 *    renders from, so the two cannot drift apart.
 *
 * See docs/05-seo.md and docs/07-decisions.md (ADR-006).
 */

const abs = (p) => (p.startsWith("http") ? p : `${SITE_URL}${p}`);

export const organization = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: SITE.name,
  url: `${SITE_URL}/`,
  email: SITE.email,
  description: SITE.description,
  foundingDate: SITE.founded,
  logo: { "@type": "ImageObject", url: abs("/favicon.svg") },
  sameAs: [],
});

export const website = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  name: SITE.name,
  url: `${SITE_URL}/`,
  description: SITE.description,
  inLanguage: "en",
  publisher: { "@id": `${SITE_URL}/#organization` },
});

export const webPage = (route) => ({
  "@context": "https://schema.org",
  "@type": route.path === "/contact" ? "ContactPage" : "WebPage",
  "@id": `${SITE_URL}${route.path}#webpage`,
  url: `${SITE_URL}${route.path === "/" ? "/" : route.path}`,
  name: route.title,
  description: route.description,
  inLanguage: "en",
  isPartOf: { "@id": `${SITE_URL}/#website` },
  primaryImageOfPage: { "@type": "ImageObject", url: abs(route.ogImage) },
});

export const breadcrumbs = (trail) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: trail.map((crumb, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: crumb.label,
    item: `${SITE_URL}${crumb.href === "/" ? "/" : crumb.href}`,
  })),
});

/**
 * SoftwareApplication for Trove.
 *
 * Deliberately carries NO `offers` block. The brief originally specified a free
 * Offer at price 0 INR, written when Trove was assumed to be live. It is not
 * released, so an offer would assert availability and pricing that do not
 * exist. Add `offers` back on the day Trove actually ships — not before.
 */
export const troveApplication = () => {
  const p = PRODUCTS.trove;
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${SITE_URL}/trove#software`,
    name: p.name,
    applicationCategory: "FinanceApplication",
    description: p.summary,
    url: `${SITE_URL}/trove`,
    image: abs("/assets/og-trove.jpg"),
    publisher: { "@id": `${SITE_URL}/#organization` },
    featureList: p.capabilities.map((c) => c.title),
  };
};

export const article = (note, route) => ({
  "@context": "https://schema.org",
  "@type": "Article",
  "@id": `${SITE_URL}${note.slug}#article`,
  headline: note.title,
  description: note.description,
  image: abs(note.image),
  datePublished: note.published,
  dateModified: note.updated,
  inLanguage: "en",
  author: { "@id": `${SITE_URL}/#organization` },
  publisher: { "@id": `${SITE_URL}/#organization` },
  mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}${route.path}#webpage` },
  articleSection: note.product === "trove" ? "Personal finance" : "Work and trust",
  wordCount: note.body.join(" ").split(/\s+/).length,
});
