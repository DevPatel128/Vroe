/**
 * Page copy that is not a product record, a note, or a legal document.
 *
 * VOICE (docs/01-brand/brand-guide.md): say what the product makes easier;
 * prefer specific, human language over feature lists; leave room for curiosity;
 * never imply a product is live when it is not; no hype, no invented metrics.
 */

export const HERO = {
  eyebrow: "PRODUCT STUDIO",
  headline: ["Useful ideas,", "made real"],
  body: "We build thoughtful products that remove friction, create clarity, and make everyday life a little easier.",
  primaryCta: { label: "Explore our products", href: "/#products" },
  secondaryCta: { label: "Get updates", href: "/#early-access" },
  caption: { index: "01", text: "Small products. Meaningful change." },
  image: {
    src: "vroe-hero-still-life",
    alt: "A ceramic vase and a leafy olive branch resting on a stack of books in soft morning daylight",
  },
};

export const PRODUCTS_SECTION = {
  eyebrow: "OUR PRODUCTS",
  headline: ["Things we're", "making useful."],
  body: "We start with the small points of friction that quietly take up too much room in a person's day.",
};

export const NOTES_SECTION = {
  eyebrow: "FROM THE LAB",
  headline: ["Two ideas", "worth following."],
  body: "Every product starts with a question. These are the early versions of the answers.",
};

export const BELIEFS = {
  eyebrow: "WHAT WE BELIEVE",
  headline: ["Better products", "start with real", "human needs"],
  paragraphs: [
    "Vroe Labs is a product studio for useful ideas. We notice the parts of life that feel harder, noisier, or less trustworthy than they need to be, then turn those observations into focused tools.",
    "Our products may solve different problems, but they share a point of view: technology should give people more clarity and agency, not more work. Trove is being built to help people understand their money. Vero is exploring how people can carry trustworthy proof of their work.",
    "We build with care, stay close to the real problem, and leave room for the product to become better through use.",
  ],
  closer: "Small products. Meaningful change.",
  image: {
    src: "belief-still-life",
    alt: "An olive-green arch and a coral sphere arranged on a cream surface",
  },
};

export const EARLY_ACCESS = {
  eyebrow: "EARLY ACCESS",
  headline: ["Be the first to know", "what we're making."],
  body: "Occasional updates on what we are building. No more than that.",
  consent:
    "I agree to Vroe Labs storing my email address so they can send me occasional updates.",
  privacyNote: "We store only your address, the date, and your country. Read our",
  successMessage: "You're on the list. We'll be in touch.",
  smallprint: "No spam. Unsubscribe anytime.",
};

export const ABOUT = {
  eyebrow: "ABOUT",
  headline: ["A product studio", "for useful ideas"],
  lede: "Vroe Labs is a small studio building human-centered technology. We make focused digital products for the parts of everyday life that feel harder than they should.",
  sections: [
    {
      heading: "Why the studio exists",
      paragraphs: [
        "Most software is built to capture attention. A smaller amount is built to give it back. Vroe Labs exists to work on the second kind: tools that reduce the number of things a person has to hold in their head.",
        "We are deliberately small. A studio rather than a startup factory means we can choose problems on their merits, spend longer than is strictly reasonable getting something right, and say honestly when a product is not ready.",
      ],
    },
    {
      heading: "The problems we work on",
      paragraphs: [
        "We look for friction that people have quietly accepted. Not the dramatic problems that make good conference talks, but the recurring ones — the spreadsheet maintained by hand because no app shows the whole picture, the proof of good work that stays behind on a platform when you leave it.",
        "These problems share a shape. Information exists, it is genuinely the person's own, and yet it is scattered, unreliable, or held by someone else. That is the shape we build for.",
      ],
    },
    {
      heading: "How we build",
      paragraphs: [
        "We stay close to the real problem for longer than is comfortable, build the smallest honest version, and let the product improve through use rather than through a roadmap written in advance.",
        "We also try to be accurate about status. A product that is being built is described as being built. Nothing on this site claims to be available when it is not — a small discipline, but the one that makes everything else we say worth reading.",
      ],
    },
    {
      heading: "What we believe about technology",
      paragraphs: [
        "Technology should give people more clarity and more agency, not more work. That means data that belongs to the person it describes, defaults that can be overruled, and interfaces that answer the question actually being asked.",
        "It also means restraint. Most products would be better with fewer features and a clearer point of view, and that is the version we would rather ship.",
      ],
    },
  ],
  closer: "Small products. Meaningful change.",
};

export const CONTACT = {
  eyebrow: "CONTACT",
  headline: ["Say hello"],
  lede: "Whether you have a question about Trove, an interest in what Vero is exploring, or an idea of your own, we would like to hear it.",
  reasons: [
    {
      heading: "About the products",
      body: "Questions about Trove or Vero, or something you would want either of them to do. Early opinions are genuinely useful while a product is still taking shape.",
    },
    {
      heading: "Working together",
      body: "Partnerships, collaborations, and the kind of conversation that starts with a problem worth solving.",
    },
    {
      heading: "Security",
      body: "If you have found a vulnerability, please read our security policy first — it explains how to report it and what to expect back.",
    },
  ],
  emailLabel: "Email us directly",
  responseNote: "A person reads every message. We usually reply within a couple of days.",
};

export const FOOTER = {
  note: "Small products. Meaningful change.",
  copyright: `© ${new Date().getFullYear()} Vroe Labs. Made with care.`,
};

export const NOT_FOUND = {
  eyebrow: "404",
  headline: ["This page", "does not exist"],
  body: "The link may be out of date, or the page may have moved. Here is the way back.",
};
