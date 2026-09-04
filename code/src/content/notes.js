/**
 * Notes — the curiosity-led articles behind each product.
 *
 * DATES ARE REAL. `published` is the date the article first went live on
 * vroelabs.com, not the date the prototype file was written. `updated` changes
 * only when the article's text actually changes. Article JSON-LD reads both
 * fields directly, so backdating either one would put a false date in front of
 * Google. See docs/05-seo.md.
 */

export const NOTES = [
  {
    id: "trove",
    slug: "/notes/trove",
    index: "01",
    product: "trove",
    eyebrow: "01 / TROVE",
    title: "The spreadsheet was telling us something",
    /** Rendered as the <h1>, split for the display-serif line breaks. */
    headline: ["The spreadsheet", "was telling us something"],
    description:
      "Why the humble spreadsheet still beats most personal finance apps, and what Trove takes from it.",
    published: "2026-09-01",
    updated: "2026-09-01",
    image: "/assets/og-trove.jpg",
    imageAlt:
      "A ceramic vase and leafy branch resting on a stack of books in soft daylight",
    readingTime: "3 min read",
    body: [
      "Ask someone who is genuinely on top of their money how they do it, and a surprising number will admit it comes down to a spreadsheet. Not an app with a waiting list. A grid, maintained by hand, usually a bit ugly.",
      "This is easy to read as a failure of tooling, and mostly it is. But it is worth asking why the grid keeps winning. Each finance app tends to understand one part of your money extremely well — the current account, the card, the portfolio, the bills. The spreadsheet understands none of them well, and all of them together. When the question is \"where do I actually stand\", the second thing turns out to be more useful than the first.",
      "The grid has a second quality that is harder to name: it does not argue with you. It never re-categorises a transaction overnight, never quietly restates last year in this year's terms, never decides a payment was a transfer. Whatever it shows you, you put there. For something as personal as money, that predictability is worth more than a lot of automation.",
      "Trove is an attempt to keep that sense of ownership and then add the things a grid genuinely cannot do: a little structure, a little memory, and a clearer view of what is changing over time. Categorisation should be a suggestion you can overrule, not a verdict handed down. History should stay true — a transaction from eight months ago keeps the exchange rate it actually happened at, because restating the past with today's rate is a quiet form of lying.",
      "None of this is a finished argument. It is the belief the product is being built on, and the part most worth getting wrong in public.",
    ],
  },
  {
    id: "vero",
    slug: "/notes/vero",
    index: "02",
    product: "vero",
    eyebrow: "02 / VERO",
    title: "What if proof travelled with you?",
    headline: ["What if proof", "travelled with you?"],
    description:
      "A CV is a claim and a portfolio can be copied. Vero is exploring what it would take for proof of work to belong to the worker.",
    published: "2026-09-01",
    updated: "2026-09-01",
    image: "/assets/og-vero.jpg",
    imageAlt: "A chartreuse circle resting against a textured cream art object",
    readingTime: "3 min read",
    body: [
      "A CV is a claim. A portfolio can be copied. A five-star rating often says more about one transaction, on one platform, on one day, than it does about the person who did the work.",
      "For anyone whose reputation is attached to a recognisable employer, this barely registers. For everyone else — freelancers, contractors, tradespeople, anyone who works job to job — it is a genuine and recurring cost. You do the work, the work is good, and then you start again from zero the moment you move to a different platform. The proof stayed behind, because it was never really yours.",
      "The interesting question is not how to build a better rating system. It is who the record belongs to. If a job was genuinely completed, both the person who did it and the business who asked for it already know. Both could say so. And the resulting record could sit with the worker rather than with whichever marketplace happened to broker the introduction.",
      "That is the idea Vero is exploring: work that both sides sign off on, producing proof the worker owns and can take with them. Two-sided confirmation is doing the real work there — a record only means something if the other party had to agree to it too.",
      "This is an exploration, not a product announcement. There is no escrow, no payments, no dispute process and no public profile. What exists is a question worth taking seriously, and a conviction that proof should belong to the person who earned it.",
    ],
  },
];

export const NOTE_BY_ID = Object.fromEntries(NOTES.map((n) => [n.id, n]));
