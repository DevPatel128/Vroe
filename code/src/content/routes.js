/**
 * The route table — ONE source of truth for every URL on this site.
 *
 * Drives: prerendering (scripts/prerender.mjs), the sitemap
 * (scripts/generate-sitemap.mjs), the header/footer navigation, and the
 * internal link checker in tests/seo.test.mjs. A page that is not listed here
 * does not get built, so the sitemap cannot drift out of step with reality.
 *
 * `indexable: false` keeps a route out of the sitemap (currently only /404).
 */

import { NOTES } from "./notes.js";

/**
 * Titles and descriptions are per-page and unique — a duplicate of either is a
 * test failure in tests/seo.test.mjs.
 *
 * On Trove's description: the supplied copy read "Trove is a free personal
 * finance app for tracking…", whose present tense asserts that the app exists
 * and is free. Trove is not released, so the clause is rephrased to describe
 * what it is being built to do. Same keywords, no availability claim.
 * See docs/07-decisions.md, ADR-006.
 */
export const ROUTES = [
  {
    path: "/",
    page: "home",
    title: "Vroe Labs | Useful Products, Made Thoughtfully",
    description:
      "Vroe Labs builds thoughtful digital products that make everyday life easier, including Trove for personal finance and Vero for verified work history.",
    ogImage: "/assets/og-vroe-labs.jpg",
    ogType: "website",
    priority: "1.0",
    changefreq: "monthly",
    indexable: true,
    nav: null,
  },
  {
    path: "/trove",
    page: "trove",
    title: "Trove | A Clearer Way to Understand Your Money",
    description:
      "Trove is a personal finance app in development, built for tracking spending, budgets, subscriptions, goals, investments, and money across currencies.",
    ogImage: "/assets/og-trove.jpg",
    ogType: "website",
    priority: "0.9",
    changefreq: "monthly",
    indexable: true,
    nav: null,
  },
  {
    path: "/vero",
    page: "vero",
    title: "Vero | Verified Proof of Work",
    description:
      "Vero is an upcoming trust marketplace exploring how completed work can become portable proof owned by the person who did it.",
    ogImage: "/assets/og-vero.jpg",
    ogType: "website",
    priority: "0.9",
    changefreq: "monthly",
    indexable: true,
    nav: null,
  },
  {
    path: "/products",
    page: "products",
    title: "Products | Vroe Labs",
    description:
      "Trove and Vero: two products Vroe Labs is building, a personal finance app and an exploration of verified work history. Neither is available yet.",
    ogImage: "/assets/og-vroe-labs.jpg",
    ogType: "website",
    priority: "0.9",
    changefreq: "monthly",
    indexable: true,
    nav: null,
  },
  {
    path: "/notes/trove",
    page: "note",
    noteId: "trove",
    title: "The Spreadsheet Was Telling Us Something | Vroe Labs",
    description:
      "Why the humble spreadsheet still beats most personal finance apps at showing the whole picture, and what Trove takes from it.",
    ogImage: "/assets/og-trove.jpg",
    ogType: "article",
    priority: "0.7",
    changefreq: "yearly",
    indexable: true,
    nav: null,
  },
  {
    path: "/notes/vero",
    page: "note",
    noteId: "vero",
    title: "What If Proof Travelled With You? | Vroe Labs",
    description:
      "A CV is a claim and a portfolio can be copied. The idea behind Vero: proof of completed work that belongs to the worker.",
    ogImage: "/assets/og-vero.jpg",
    ogType: "article",
    priority: "0.7",
    changefreq: "yearly",
    indexable: true,
    nav: null,
  },
  {
    path: "/about",
    page: "about",
    title: "About Vroe Labs | A Product Studio for Useful Ideas",
    description:
      "Vroe Labs is a small product studio building human-centered technology. How we choose problems, how we build, and what we believe about useful products.",
    ogImage: "/assets/og-vroe-labs.jpg",
    ogType: "website",
    priority: "0.8",
    changefreq: "yearly",
    indexable: true,
    nav: "About",
  },
  {
    path: "/contact",
    page: "contact",
    title: "Contact Vroe Labs | Get in Touch",
    description:
      "Talk to Vroe Labs about Trove, Vero, or an idea of your own. Email us directly, or join the list for occasional updates on what we are building.",
    ogImage: "/assets/og-vroe-labs.jpg",
    ogType: "website",
    priority: "0.6",
    changefreq: "yearly",
    indexable: true,
    nav: "Contact",
  },
  {
    path: "/privacy",
    page: "privacy",
    title: "Privacy Policy | Vroe Labs",
    description:
      "What Vroe Labs collects when you join our list, how long we keep it, who it is shared with, and how to have it deleted.",
    ogImage: "/assets/og-vroe-labs.jpg",
    ogType: "website",
    priority: "0.3",
    changefreq: "yearly",
    indexable: true,
    nav: null,
  },
  {
    path: "/terms",
    page: "terms",
    title: "Terms of Use | Vroe Labs",
    description:
      "The terms that apply to the Vroe Labs website, including acceptable use, intellectual property, and the limits of what this site promises.",
    ogImage: "/assets/og-vroe-labs.jpg",
    ogType: "website",
    priority: "0.3",
    changefreq: "yearly",
    indexable: true,
    nav: null,
  },
  {
    path: "/404",
    page: "notFound",
    title: "Page Not Found | Vroe Labs",
    description: "That page does not exist. Find your way back to Vroe Labs.",
    ogImage: "/assets/og-vroe-labs.jpg",
    ogType: "website",
    indexable: false,
    nav: null,
  },
];

/** Routes that belong in sitemap.xml. */
export const INDEXABLE_ROUTES = ROUTES.filter((r) => r.indexable);

export const ROUTE_BY_PATH = Object.fromEntries(ROUTES.map((r) => [r.path, r]));

/**
 * Primary navigation. Products and Notes are section anchors on the homepage;
 * About and Contact are real pages, so they come from the route table above.
 */
export const NAV_ITEMS = [
  { label: "Products", href: "/products" },
  { label: "Notes", href: "/#notes" },
  ...ROUTES.filter((r) => r.nav).map((r) => ({ label: r.nav, href: r.path })),
];

/** Sanity check used by tests/seo.test.mjs. */
export function findDuplicateMetadata() {
  const problems = [];
  for (const field of ["title", "description", "path"]) {
    const seen = new Map();
    for (const r of ROUTES) {
      if (seen.has(r[field])) problems.push(`duplicate ${field}: ${r.path} and ${seen.get(r[field])}`);
      seen.set(r[field], r.path);
    }
  }
  for (const n of NOTES) {
    if (!ROUTE_BY_PATH[n.slug]) problems.push(`note ${n.id} has no route: ${n.slug}`);
  }
  return problems;
}
