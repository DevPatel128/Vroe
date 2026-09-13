/**
 * Source registry for the evidence layer.
 *
 * Every figure on the page resolves, through its metric, to exactly one record
 * here. A record describes the study itself — who ran it, when, on whom, and how
 * — so a reader can judge a number without leaving the page, and follow `url` to
 * check it.
 *
 * RECENCY. `year` is the year of publication and must be 2024 or later
 * (MINIMUM_DATA_YEAR in index.js). Older studies — even widely cited ones — are
 * not kept here. docs/impact-research/README.md lists what was set aside and why.
 *
 * PRIORITY OF SOURCES (docs/10-evidence.md): government and regulators, central
 * banks, statistical agencies, universities, research institutions, international
 * organisations, then industry bodies. News coverage was used only to find the
 * primary documents listed here, never as a source.
 *
 * `archived` is the local copy in docs/impact-research/raw/. Those files are
 * gitignored for size; docs/impact-research/README.md lists each one's URL and
 * SHA-256 so the exact bytes can be fetched again and checked.
 */

export const SOURCES = {
  "findex-2025": {
    id: "findex-2025",
    shortName: "World Bank Global Findex",
    publisher: "World Bank",
    title: "The Global Findex Database 2025",
    year: 2025,
    fieldwork: "2024",
    url: "https://www.worldbank.org/en/publication/globalfindex/download-data",
    geography: "141 economies",
    population: "Adults aged 15 and over, probability-based and nationally representative",
    sample: "About 145,000 adults",
    methodology:
      "Face-to-face or telephone interviews. Country figures are weighted shares of adults, published in the database file GlobalFindexDatabase2025.csv.",
    tier: "international-organisation",
    archived: "docs/impact-research/raw/global/WorldBank-Global-Findex-Database-2025.csv",
    lastVerified: "2026-09-13",
  },

  "mospi-tus-2024": {
    id: "mospi-tus-2024",
    shortName: "MoSPI Time Use Survey",
    publisher: "National Statistics Office, Ministry of Statistics and Programme Implementation, Government of India",
    title: "Time Use Survey 2024, unit-level person data",
    year: 2025,
    fieldwork: "January to December 2024",
    url: "https://microdata.gov.in/NADA/index.php/catalog/236",
    geography: "All India",
    population: "Household members aged 6 and over",
    sample: "139,487 households; 454,192 people aged 6 and over",
    methodology:
      "A 24-hour diary from 4am to 4am in 30-minute slots, up to three activities per slot, coded to ICATUS 2016. Household financial management is codes 351 (paying household bills) and 352 (budgeting, planning and organising household duties). Computed from the person file by docs/impact-research/scripts/tus2024_household_finance_time.py, using MoSPI’s own definitions and survey weights.",
    tier: "statistical-agency",
    archived: "docs/impact-research/raw/india/MoSPI-TUS-2024-Person-Level-Data-CSV.zip",
    lastVerified: "2026-09-13",
  },

  "bls-atus-2025": {
    id: "bls-atus-2025",
    shortName: "BLS American Time Use Survey",
    publisher: "U.S. Bureau of Labor Statistics",
    title: "American Time Use Survey: financial management, average hours per day (series TUU10101AA01048669)",
    year: 2026,
    fieldwork: "2025",
    url: "https://data.bls.gov/timeseries/TUU10101AA01048669",
    geography: "United States",
    population: "People aged 15 and over",
    sample: "Nationally representative time-diary survey",
    methodology:
      "A diary of the previous day. Financial management is ATUS activity code 020901, which includes paying bills. BLS publishes the average to two decimal places of an hour, so 0.03 hours covers anything from about 1.5 to 2.1 minutes.",
    tier: "statistical-agency",
    archived: null,
    lastVerified: "2026-09-13",
  },

  "sebi-investor-survey-2025": {
    id: "sebi-investor-survey-2025",
    shortName: "SEBI Investor Survey",
    publisher: "Securities and Exchange Board of India (SEBI)",
    title: "Investor Survey 2025: Main Report",
    year: 2025,
    fieldwork: "May to July 2025",
    url: "https://www.sebi.gov.in/reports-and-statistics/research/jan-2026/investor-survey-2025-_99170.html",
    geography: "All India, excluding Lakshadweep and Manipur",
    population: "Households, interviewing the most educated member",
    sample: "91,950 households in the listing survey, across more than 400 towns and 1,000 villages",
    methodology:
      "Face-to-face household listing and main survey, weighted to a household universe of 33.72 crore households.",
    tier: "regulator",
    archived: "docs/impact-research/raw/india/SEBI-Investor-Survey-2025-Main-Report.pdf",
    lastVerified: "2026-09-14",
  },

  "amfi-monthly-2026-08": {
    id: "amfi-monthly-2026-08",
    shortName: "AMFI monthly note",
    publisher: "Association of Mutual Funds in India (AMFI)",
    title: "Monthly note: mutual fund data for August 2026",
    year: 2026,
    fieldwork: "As on 31 August 2026",
    url: "https://portal.amfiindia.com/spages/amaug2026repo.pdf",
    geography: "India",
    population: "Mutual fund folios (accounts), not people",
    sample: "Industry-wide totals",
    methodology:
      "Grand total of folios across open-ended, close-ended and interval schemes. One investor can hold many folios, so this counts accounts, not investors.",
    tier: "industry-body",
    archived: "docs/impact-research/raw/india/AMFI-Monthly-Note-August-2026.pdf",
    lastVerified: "2026-09-13",
  },
};
