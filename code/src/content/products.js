/**
 * Product records — the single source of truth for how Trove and Vero are
 * described anywhere on the site.
 *
 * STATUS DISCIPLINE (see docs/08_DECISIONS/DECISIONS.md, ADR-006)
 * -----------------------------------------------------
 * Neither product is live. `status.label` is the only string that says where a
 * product stands, and `url` is null while it is unreleased. Nothing in this file
 * may claim availability, pricing, users, downloads or a launch date. When Trove
 * ships, set `url` and change `status` here — the pill, the buttons, the
 * structured data and the sitemap all follow from these two fields.
 */

export const PRODUCTS = {
  trove: {
    id: "trove",
    name: "Trove",
    href: "/trove",
    /** No external link until Trove is genuinely usable. */
    url: null,
    status: { label: "Taking shape", tone: "building" },
    category: "Personal finance",
    /** One-line summary used on the homepage card. */
    summary:
      "Accounts, spending, subscriptions, budgets, goals and investments in one place, with dated currency conversion that keeps your history honest.",
    headline: ["Your whole", "money picture"],
    /** Longer positioning used on /trove. */
    intro:
      "Most people do not have a money problem so much as a money-visibility problem. The current account says one thing, the card app says another, three subscriptions renew quietly, and the only place the whole picture ever comes together is a spreadsheet somebody maintains by hand.",
    /**
     * Capability list. Written as intent, never as shipped features.
     * `id` is what the evidence layer maps burdens to (content/evidence/trove.js),
     * so a title can be reworded without breaking that mapping.
     */
    capabilities: [
      {
        id: "accounts",
        title: "Accounts in one view",
        body: "Balances across current accounts, savings and cards, so the total is something you can see rather than assemble.",
      },
      {
        id: "spending",
        title: "Spending you can read",
        body: "Categorised spending over time, designed to answer where the month actually went instead of listing every transaction back at you.",
      },
      {
        id: "subscriptions",
        title: "Subscriptions surfaced",
        body: "Recurring payments gathered in one list, including the ones that renew quietly at a price you no longer remember agreeing to.",
      },
      {
        id: "budgets-goals",
        title: "Budgets and goals",
        body: "A budget you can keep to and goals that show progress honestly, including when progress has stalled.",
      },
      {
        id: "investments",
        title: "Investments in context",
        body: "Holdings sit alongside everything else, because an investment balance means little on its own.",
      },
      {
        id: "currencies",
        title: "Money across currencies",
        body: "Dated conversion, so a transaction from eight months ago keeps the rate it actually happened at rather than today's.",
      },
    ],
    /** Why the product is being built this way. Used on /trove and /notes/trove. */
    principles: [
      "Your data stays yours, and the app earns access to it rather than assuming it.",
      "Manual control is a feature. Automatic categorisation is a suggestion, not a verdict.",
      "History should stay true. Restating the past with today's exchange rate is a quiet form of lying.",
    ],
    /**
     * Explicit non-claims, same discipline as Vero's `notYetBuilt` below.
     * Trove is being built and is not yet available; this is what
     * src/pages/product.jsx's status callout already says in prose — kept
     * here too so it's the one place both draw from.
     */
    notYetBuilt: ["a download", "sign-up", "a waiting list beyond the email updates"],
  },

  vero: {
    id: "vero",
    name: "Vero",
    href: "/vero",
    url: null,
    status: { label: "Upcoming", tone: "upcoming" },
    category: "Verified work history",
    summary:
      "A trust-first marketplace where the worker and the business both sign off on a completed job, creating a record the worker owns.",
    headline: ["Proof for", "the work you do"],
    intro:
      "Work history is remarkably hard to prove. A CV is a claim. A portfolio can be copied. A rating often says more about one transaction than about the person who did the work. For anyone whose reputation is not attached to a well-known employer, that gap is expensive.",
    capabilities: [
      {
        title: "Two-sided confirmation",
        body: "A job counts as done when both the worker and the business say it is, rather than when one party rates the other.",
      },
      {
        title: "Proof the worker owns",
        body: "The record belongs to the person who did the work, not to the platform the work happened on.",
      },
      {
        title: "Portable reputation",
        body: "Evidence that travels between platforms, so starting somewhere new does not mean starting from zero.",
      },
    ],
    principles: [
      "Proof should belong to the person who earned it.",
      "A record is only worth something if both sides had to agree to it.",
      "Reputation should survive changing platforms.",
    ],
    /**
     * Explicit non-claims. Vero is an exploration; these systems do not exist
     * and must not be implied anywhere in copy. Referenced by docs/04_DESIGN/CONTENT.md.
     */
    notYetBuilt: ["escrow", "payments", "dispute resolution", "public work profiles"],
  },
};

export const PRODUCT_LIST = [PRODUCTS.trove, PRODUCTS.vero];
