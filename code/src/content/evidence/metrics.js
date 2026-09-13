/**
 * Metric definitions for the evidence layer.
 *
 * A metric is one question asked one way: one source, one year, one population.
 * The same idea measured by two instruments is two metrics, because mixing
 * instruments is how comparisons quietly become meaningless.
 *
 *   year        the year the data was collected. 2024 or later only
 *               (MINIMUM_DATA_YEAR in index.js).
 *   comparable  true when the instrument was identical in every country that has
 *               it. Only comparable metrics can rank countries, and only when
 *               every listed country has a value (see derive.js).
 *   burden      "direct"  higher value = more burden
 *               "inverse" burden is 100 − value (e.g. share with good knowledge)
 *               "none"    context, never ranked
 *   calculation for figures built from raw source values. The inputs are typed
 *               in countries.js exactly as the source publishes them (Findex
 *               shares are fractions of 1); the displayed value is computed.
 *   aggregate   how a per-person figure becomes a population-wide resource cost.
 *               Needs a population with the same age band and year.
 */

/** Share of a population × that population = people. Uses the burden side. */
const PEOPLE = {
  kind: "people",
  formula: "share ÷ 100 × population",
  compute: (record, population) => (record.burdenValue / 100) * population,
};

/** Average minutes per person per day × 365 ÷ 60 × population = hours a year. */
const HOURS_A_YEAR = {
  kind: "hours-per-year",
  formula: "average minutes per person per day × 365 ÷ 60 × population",
  compute: (record, population) => ((record.value * 365) / 60) * population,
};

const TIME_USE_NOTE =
  "National time-use surveys use different activity codes, diary rules and age coverage, so a time figure is shown for its own country only and is never ranked against another. India’s diary, for example, records an activity sharing a half-hour slot only if it took 10 minutes or more.";

const TUS_METHOD =
  "ICATUS 2016 codes 351 (paying household bills) and 352 (budgeting, planning and organising household duties), from the TUS 2024 person file, weighted. Where a 30-minute slot held several activities, its time is split equally between them — the method that reproduces MoSPI’s published tables.";

const NATIONAL_ONLY = "A national survey with no equivalent in the other countries shown.";

const SEBI_NOTE = `${NATIONAL_ONLY} SEBI surveys households and investors about securities market products specifically, not money management as a whole.`;

export const METRICS = {
  "fragility-findex2024": {
    id: "fragility-findex2024",
    dimension: "stress",
    label: "Adults who could not raise emergency money within 30 days, or only with great difficulty",
    shortLabel: "Financial fragility",
    unit: "percent",
    burden: "direct",
    comparable: true,
    sourceId: "findex-2025",
    year: 2024,
    ageBand: "15+",
    population: "Adults aged 15 and over",
    methodology:
      "Share of adults who said coming up with emergency funds within 30 days would be not possible (Findex fin24aN), plus the share who said possible but very difficult (fin24aVD). The two answers do not overlap.",
    comparabilityNotes:
      "The same question was asked worldwide, but the 2025 database does not publish it for most high-income economies, so it cannot compare the countries on this page.",
    calculation: {
      formula: "(not possible + possible but very difficult) × 100",
      inputs: ["notPossible", "veryDifficult"],
      compute: ({ notPossible, veryDifficult }) => (notPossible + veryDifficult) * 100,
    },
    aggregate: PEOPLE,
  },

  "worry-bills-findex2024": {
    id: "worry-bills-findex2024",
    dimension: "stress",
    label: "Adults whose most worrying financial issue is paying monthly expenses or bills",
    shortLabel: "Worry about bills",
    unit: "percent",
    burden: "direct",
    comparable: true,
    sourceId: "findex-2025",
    year: 2024,
    ageBand: "15+",
    population: "Adults aged 15 and over",
    methodology:
      "Findex indicator fin45d: adults naming money for monthly expenses or bills as the financial issue that worries them most.",
    comparabilityNotes: "Not published for most high-income economies in the 2025 database, so it is shown for India only.",
    calculation: {
      formula: "fin45d × 100",
      inputs: ["share"],
      compute: ({ share }) => share * 100,
    },
    aggregate: PEOPLE,
  },

  "time-finance-tus2024": {
    id: "time-finance-tus2024",
    dimension: "time",
    label: "Time recorded paying household bills and budgeting",
    shortLabel: "Time on household finances",
    unit: "minutes-per-day",
    burden: "direct",
    comparable: false,
    sourceId: "mospi-tus-2024",
    year: 2024,
    ageBand: "15+",
    population: "Everyone aged 15 and over, including people who did none that day",
    methodology: `${TUS_METHOD} Averaged across all adults.`,
    comparabilityNotes: `${TIME_USE_NOTE} Short tasks such as a quick bill payment often go unrecorded, so this is a floor.`,
    aggregate: HOURS_A_YEAR,
  },

  "time-finance-participants-tus2024": {
    id: "time-finance-participants-tus2024",
    dimension: "time",
    label: "Time spent by adults who paid bills or budgeted that day",
    shortLabel: "Time among those who did it",
    unit: "minutes-per-day",
    burden: "none",
    comparable: false,
    sourceId: "mospi-tus-2024",
    year: 2024,
    ageBand: "15+",
    population: "Adults aged 15 and over who recorded either activity on the diary day",
    methodology: `${TUS_METHOD} Averaged across the adults who recorded either activity.`,
    comparabilityNotes: TIME_USE_NOTE,
  },

  "participation-finance-tus2024": {
    id: "participation-finance-tus2024",
    dimension: "time",
    label: "Adults who recorded paying bills or budgeting on an average day",
    shortLabel: "Adults who did it that day",
    unit: "percent",
    burden: "none",
    comparable: false,
    sourceId: "mospi-tus-2024",
    year: 2024,
    ageBand: "15+",
    population: "Adults aged 15 and over",
    methodology: `${TUS_METHOD} Share of adults with any time against either code.`,
    comparabilityNotes: TIME_USE_NOTE,
  },

  "time-finance-atus2025": {
    id: "time-finance-atus2025",
    dimension: "time",
    label: "Time spent on financial management",
    shortLabel: "Time on financial management",
    unit: "minutes-per-day",
    burden: "direct",
    comparable: false,
    sourceId: "bls-atus-2025",
    year: 2025,
    ageBand: "15+",
    population: "Everyone aged 15 and over, including people who did none that day",
    methodology: "BLS average hours per day for activity code 020901, converted to minutes.",
    comparabilityNotes: `${TIME_USE_NOTE} BLS rounds to 0.01 hours, so this figure is only precise to about ±0.3 minutes.`,
    calculation: {
      formula: "hours per day × 60",
      inputs: ["hoursPerDay"],
      compute: ({ hoursPerDay }) => hoursPerDay * 60,
    },
    aggregate: HOURS_A_YEAR,
  },

  "knowledge-sebi2025": {
    id: "knowledge-sebi2025",
    dimension: "literacy",
    label: "Investors with high or moderate knowledge of the securities market",
    burdenLabel: "Investors with low knowledge of the securities market",
    shortLabel: "Investor knowledge",
    unit: "percent",
    burden: "inverse",
    comparable: false,
    sourceId: "sebi-investor-survey-2025",
    year: 2025,
    ageBand: "investors",
    population: "Investors: households invested in securities market products",
    methodology:
      "Two questions: familiarity with stock markets, and whether 5% returns against 6% inflation buy more, the same or less after a year. Low knowledge means little market familiarity or not recognising that such savings buy less.",
    comparabilityNotes: SEBI_NOTE,
  },

  "barrier-complexity-sebi2025": {
    id: "barrier-complexity-sebi2025",
    dimension: "complexity",
    label: "Non-investors held back by complexity and information gaps",
    shortLabel: "Held back by complexity",
    unit: "percent",
    burden: "none",
    comparable: false,
    sourceId: "sebi-investor-survey-2025",
    year: 2025,
    ageBand: "households",
    population: "Households not invested in securities market products",
    methodology:
      "Share of non-investors naming at least one barrier in SEBI’s complexity and information gaps group: not knowing how products work, not knowing how to start, confusion from information overload, or too many options.",
    comparabilityNotes: SEBI_NOTE,
  },

  "awareness-sebi2025": {
    id: "awareness-sebi2025",
    dimension: "information",
    label: "Households aware of at least one securities market product",
    shortLabel: "Awareness of market products",
    unit: "percent",
    burden: "none",
    comparable: false,
    sourceId: "sebi-investor-survey-2025",
    year: 2025,
    ageBand: "households",
    population: "Households",
    methodology: "Share of households aware of at least one product such as mutual funds, shares, bonds or derivatives.",
    comparabilityNotes: SEBI_NOTE,
  },

  "participation-sebi2025": {
    id: "participation-sebi2025",
    dimension: "information",
    label: "Households invested in securities market products",
    shortLabel: "Households invested",
    unit: "percent",
    burden: "none",
    comparable: false,
    sourceId: "sebi-investor-survey-2025",
    year: 2025,
    ageBand: "households",
    population: "Households",
    methodology: "Share of households with at least one securities market investment.",
    comparabilityNotes: SEBI_NOTE,
  },

  "finfluencer-decisions-sebi2025": {
    id: "finfluencer-decisions-sebi2025",
    dimension: "information",
    label: "Investors who make some investment decisions based on finfluencer recommendations",
    shortLabel: "Decisions led by finfluencers",
    unit: "percent",
    burden: "none",
    comparable: false,
    sourceId: "sebi-investor-survey-2025",
    year: 2025,
    ageBand: "investors",
    population: "Investors surveyed",
    methodology:
      "Share of surveyed investors reporting that some of their investment decisions follow recommendations from financial influencers on social media.",
    comparabilityNotes: SEBI_NOTE,
  },

  "folios-amfi2026": {
    id: "folios-amfi2026",
    dimension: "complexity",
    label: "Mutual fund folios open across India",
    shortLabel: "Mutual fund folios",
    unit: "count",
    burden: "none",
    comparable: false,
    sourceId: "amfi-monthly-2026-08",
    year: 2026,
    ageBand: "folios",
    population: "Folios (accounts), not people — one investor can hold many",
    methodology: "AMFI grand total of folios as on 31 August 2026.",
    comparabilityNotes: "An industry count of accounts, not a per-person measure, and not collected the same way elsewhere.",
  },
};
