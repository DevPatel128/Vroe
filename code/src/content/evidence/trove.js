/**
 * Trove's evidence story — the words around the figures on /trove.
 *
 * NO NUMBERS IN THIS FILE. Each item names a metric (and a country, when it is
 * not the primary one), and the page renders the value derive.js computes from
 * countries.js, so the copy and the data cannot disagree. Where a sentence needs
 * a figure, it is a function that receives the figure already formatted.
 *
 * HONESTY (docs/04_DESIGN/CONTENT.md). Everything here describes the problem, never
 * Trove's effect on it. Trove has no users, so nothing may say or imply that it
 * saves time or money. `impact` stays empty until real product data exists, and
 * the tests fail if a Trove-impact claim appears in this copy.
 */

export const TROVE_EVIDENCE = {
  primaryCountry: "IN",

  /** Product data only — `origin: "product"`, `measuredBy`, `updated`. Empty until Trove has users. */
  impact: [],

  /** Burden dimensions, and the Trove capabilities (by id) meant to reduce each. */
  dimensions: {
    time: { label: "Time", capabilities: ["accounts", "subscriptions"] },
    literacy: { label: "Understanding", capabilities: ["spending", "investments"] },
    stress: { label: "Fragility and worry", capabilities: ["budgets-goals", "subscriptions"] },
    complexity: { label: "Fragmentation", capabilities: ["accounts", "investments"] },
    information: { label: "Information", capabilities: [] },
    money: { label: "Money", capabilities: [] },
  },

  india: {
    id: "evidence-india",
    eyebrow: "India · The problem",
    headline: ["What money", "asks of India"],
    lede: "Trove is being built for India first, so India is where we looked hardest. Every figure below was collected in 2024 or later by a statistics office, a financial regulator or the World Bank, and links to where it came from.",
    sequence: [
      {
        metric: "time-finance-tus2024",
        show: "aggregate",
        unitWords: "hours a year",
        statement: "recorded by adults in India paying household bills and budgeting.",
        explanation:
          "A floor, not the whole. When several things happen in a half-hour slot, India’s time-use diary keeps only those that take 10 minutes or more, so a quick bill payment usually leaves no trace.",
      },
      {
        metric: "time-finance-participants-tus2024",
        show: "value",
        unitWords: "minutes",
        statement: "spent on the day by the adults who paid bills or budgeted.",
        explanation: ({ value }) =>
          `${value("participation-finance-tus2024")} of adults recorded doing so on an average day. Younger adults did so least often.`,
        breakdownsFrom: "participation-finance-tus2024",
        breakdownLabel: "Share of adults who did it on an average day",
      },
      {
        metric: "fragility-findex2024",
        show: "aggregate",
        unitWords: "adults",
        statement: "could not raise emergency money within 30 days, or could only with great difficulty.",
        explanation: ({ share, year }) => `That is ${share} of adults in India aged 15 and over, in ${year}.`,
      },
    ],
    meaning: {
      heading: ["What these", "numbers mean"],
      paragraphs: [
        "None of them is about one bank, one app or one habit. Together they describe the attention money asks for before any decision gets made: the bills that have to be paid, the plans that have to be kept, and the cushion many people do not have.",
      ],
    },
    burdenSources: {
      heading: ["Where the burden", "comes from"],
      items: [
        {
          id: "understanding",
          title: "Understanding",
          metric: "knowledge-sebi2025",
          show: "burden",
          statement:
            "of investors show low knowledge of the market they invest in: little familiarity with it, or not recognising that savings earning less than inflation buy less.",
        },
        {
          id: "complexity",
          title: "Complexity",
          metric: "barrier-complexity-sebi2025",
          show: "value",
          statement:
            "of households that do not invest say complexity or missing information holds them back: not knowing how products work or how to start, conflicting information, or too many options.",
        },
        {
          id: "information",
          title: "Information",
          metric: "awareness-sebi2025",
          show: "value",
          statement: "of households know of at least one market product, such as mutual funds or shares.",
          pair: {
            metric: "participation-sebi2025",
            show: "value",
            statement: "have invested in one.",
          },
        },
        {
          id: "advice",
          title: "Advice",
          metric: "finfluencer-decisions-sebi2025",
          show: "value",
          statement: "of investors make some of their investment decisions on the recommendation of social media finfluencers.",
        },
        {
          id: "fragmentation",
          title: "Fragmentation",
          metric: "folios-amfi2026",
          show: "value",
          unitWords: "mutual fund folios",
          statement: "are open across India. Each is a separate account, and one investor can hold many.",
        },
        {
          id: "worry",
          title: "Worry",
          metric: "worry-bills-findex2024",
          show: "value",
          statement: "of adults say monthly expenses or bills are the financial issue that worries them most.",
        },
      ],
    },
  },

  world: {
    id: "evidence-world",
    eyebrow: "Around the world",
    // Used when a recent comparable measure exists and countries can be ranked.
    headline: ["The burden isn’t", "the same everywhere"],
    lede: "A ranking is only honest when every country was asked the same question in the same way. The measures you can rank by below meet that bar for every country listed. India stays at the top because Trove starts there; its rank beside it is its own.",
    // Used when no recent comparable measure exists, so nothing is ranked.
    headlineUnranked: ["Beyond India,", "recent data runs thin"],
    ledeUnranked:
      "No survey collected in 2024 or later asks the same questions in the same way across the countries we researched, so this page does not compare or rank them. Where a recent national figure exists, it is shown for its own country only. Countries with no recent figures are left out.",
    rankToggleLabel: "Rank countries by",
    rankedBy: "Ranked by",
    pinnedNote: "Shown first",
    rank: (rank, count) => `Rank ${rank} of ${count}`,
    unranked: "Not ranked",
    insufficient: "Insufficient comparable data",
    notComparable: "National survey, not comparable",
    relevance: (dimension, titles) => `Where Trove is meant to help with ${dimension.toLowerCase()}: ${titles}.`,
    columns: [
      {
        key: "time",
        label: "Time a year",
        metrics: ["time-finance-tus2024", "time-finance-atus2025"],
        show: "aggregate",
        unitWords: "hours",
        missing: "No recent time-use figure",
      },
      { key: "fragility", label: "Financially fragile", metrics: ["fragility-findex2024"], show: "value" },
    ],
  },

  panel: {
    eyebrow: "Financial management burden",
    notComparable: "National survey, not comparable",
    relevanceIntro: "Where Trove is meant to help:",
    missing: (labels, name) =>
      `No source collected in 2024 or later measures ${labels} for ${name}, so none is shown.`,
    rows: [
      {
        key: "time",
        label: "Time",
        metrics: ["time-finance-tus2024", "time-finance-atus2025"],
        show: "value",
        unitWords: "minutes a day",
      },
      { key: "understanding", label: "Understanding", metrics: ["knowledge-sebi2025"], show: "burden" },
      { key: "fragility", label: "Fragility", metrics: ["fragility-findex2024"], show: "value" },
      { key: "complexity", label: "Complexity", metrics: ["barrier-complexity-sebi2025"], show: "value" },
      { key: "money", label: "Money", metrics: [], show: "value" },
    ],
    costLabel: "Estimated human cost",
    cost: [
      {
        key: "time",
        metrics: ["time-finance-tus2024", "time-finance-atus2025"],
        unitWords: "hours a year",
        caption: (record) => `on household finances, ${record.year}`,
      },
      {
        key: "fragility",
        metrics: ["fragility-findex2024"],
        unitWords: "adults",
        caption: (record) => `financially fragile, ${record.year}`,
      },
    ],
  },

  response: {
    id: "evidence-response",
    eyebrow: "Trove’s response",
    headline: ["Built to make money", "easier to understand"],
    lede: "Trove is being built for the problems above. Each capability names the burden it is meant to reduce. None of it is available yet, so none of it has reduced anything.",
    addressesLabel: "Meant to reduce",
  },

  method: {
    id: "evidence-method",
    heading: "How we measured this",
    stagesLabel: "The Vroe evidence method",
    stagePending: "Waiting for product data",
    pendingStages: ["measuredImpact"],
    confidenceMedium: "Moderate confidence",
    sections: [
      {
        key: "recency",
        summary: "Why every figure is from 2024 or later",
        body: [
          "Every figure on this page was collected in 2024 or later and published in 2024 or later. Older studies are left out rather than mixed in, even well-known ones, so the page describes money as people manage it now.",
          "Where no recent source exists, the page shows nothing for it rather than reaching for an older number.",
        ],
      },
      {
        key: "ranking",
        summary: "Why countries are not ranked",
        body: [
          "A ranking is only honest when every country was asked the same question, the same way, by one survey. No survey collected in 2024 or later does that for the countries we researched. The World Bank’s 2024 Global Findex survey, for example, does not publish its financial fragility and worry questions for most high-income economies.",
          "So the page ranks nothing. If a recent comparable survey appears, the ranking is generated from it automatically, with its measure, source and year stated beside it, and India listed first with its true rank.",
        ],
      },
      {
        key: "composite",
        summary: "Why there is no single burden score",
        body: [
          "A composite index would need every ingredient measured the same way in every country. Among recent sources, none is: time-use surveys record activities differently, and we found no source that measures money lost to fees, missed savings, subscriptions or avoidable interest comparably across countries.",
          "Combining them anyway would turn gaps in the data into a number that only looks precise.",
        ],
      },
      {
        key: "money",
        summary: "Why the page shows no money figures",
        body: [
          "We found no recent source measuring money lost to poor financial management that we could verify, so there are none here. Where the page counts time and people, these are costs associated with the problem Trove is designed to help people understand and manage — not savings Trove delivers.",
        ],
      },
    ],
    calculationsSummary: "Every calculation",
    calculationsIntro: "Each figure on this page that is not a published value, the formula behind it, and the inputs it used.",
    inputsLabel: "Inputs",
    populationLabel: "Population",
    resultLabel: "Result",
    comparabilitySummary: "What cannot be compared",
    sourcesSummary: "Every source",
    sourceFields: {
      publisher: "Publisher",
      fieldwork: "Fieldwork",
      geography: "Coverage",
      population: "Population",
      sample: "Sample",
      methodology: "Method",
      lastVerified: "Last verified",
    },
    impact: {
      heading: "What Trove has changed",
      empty:
        "Nothing yet. Trove has no users, so there is no measured impact to report. When there is, it will come from product data, appear here separately from the research above, and show when it was last updated.",
      updated: "Updated",
    },
  },
};
