/**
 * The Vroe evidence method, and which products have earned it.
 *
 * Every Vroe product is told the same way, in the same order:
 *
 *   PROBLEM → EVIDENCE → RESOURCE COST → PRODUCT RESPONSE → MEASURED IMPACT
 *
 * The first four come from external research. The fifth comes only from a
 * product's own data, and stays empty until that data exists — the two are never
 * merged (see derive.js, `problems()`, and docs/03_RESEARCH/RESEARCH.md).
 *
 * MATURITY GATE. A product appears in `EVIDENCE` only once it has a researched
 * story. Trove does. Vero does not yet, so /vero renders no evidence layer at all.
 * A future product inherits the whole system by adding one entry here: a story
 * module shaped like trove.js, over the same sources, metrics and countries.
 */

import { PRODUCTS } from "../products.js";
import { COUNTRIES } from "./countries.js";
import { createEvidence, recencyProblems } from "./derive.js";
import { METRICS } from "./metrics.js";
import { SOURCES } from "./sources.js";
import { TROVE_EVIDENCE } from "./trove.js";

/**
 * Only data collected and published in this year or later may appear. A study
 * that falls short is left out entirely rather than mixed in with recent ones,
 * and where no recent source exists the page shows nothing for it.
 */
export const MINIMUM_DATA_YEAR = 2024;

export const METHOD_STAGES = [
  { id: "problem", label: "Problem", question: "What is happening in people’s lives?" },
  { id: "evidence", label: "Evidence", question: "What does the most reliable research say?" },
  { id: "resourceCost", label: "Resource cost", question: "What does it cost in time, attention and money?" },
  { id: "productResponse", label: "Product response", question: "What is the product being built to change?" },
  { id: "measuredImpact", label: "Measured impact", question: "What has the product actually changed?" },
];

const build = (story) =>
  createEvidence({
    sources: SOURCES,
    metrics: METRICS,
    countries: COUNTRIES,
    primaryCountry: story.primaryCountry,
    impact: story.impact,
  });

export const EVIDENCE = {
  trove: { story: TROVE_EVIDENCE, data: build(TROVE_EVIDENCE) },
};

/** Story items point at figures by metric id. Every one must resolve. */
function storyProblems(productId, { story, data }) {
  const out = [];
  const capabilityIds = new Set(PRODUCTS[productId].capabilities.map((c) => c.id));

  const check = (item, where, { headline = false } = {}) => {
    const iso = item.iso ?? story.primaryCountry;
    const record = data.resolve(iso, item.metric);
    if (!record) return out.push(`${where}: ${iso} has no ${item.metric} observation`);
    if (item.show === "aggregate" && !data.aggregate(iso, item.metric)) {
      out.push(`${where}: ${item.metric} has no population to aggregate against`);
    }
    if (item.show === "burden" && record.burdenValue === null) {
      out.push(`${where}: ${item.metric} has no burden direction`);
    }
    if (headline && record.confidence !== "high") {
      out.push(`${where}: a headline figure needs high confidence, ${item.metric} is ${record.confidence}`);
    }
  };

  story.india.sequence.forEach((item, i) => check(item, `india.sequence[${i}]`, { headline: true }));
  story.india.burdenSources.items.forEach((item, i) => {
    check(item, `india.burdenSources[${i}]`);
    if (item.pair) check(item.pair, `india.burdenSources[${i}].pair`);
  });

  for (const [dimension, d] of Object.entries(story.dimensions)) {
    for (const id of d.capabilities) {
      if (!capabilityIds.has(id)) out.push(`dimensions.${dimension}: unknown capability "${id}"`);
    }
  }
  for (const group of [story.world.columns, story.panel.rows, story.panel.cost]) {
    for (const entry of group) {
      for (const id of entry.metrics) if (!METRICS[id]) out.push(`${entry.key}: unknown metric "${id}"`);
    }
  }
  return out;
}

/** Every data, recency and story problem across every product. Empty means publishable. */
export function evidenceProblems() {
  const recency = recencyProblems({ sources: SOURCES, metrics: METRICS, countries: COUNTRIES }, MINIMUM_DATA_YEAR);
  return [
    ...recency.map((p) => `recency: ${p}`),
    ...Object.entries(EVIDENCE).flatMap(([id, evidence]) => [
      ...evidence.data.problems().map((p) => `${id}: ${p}`),
      ...storyProblems(id, evidence).map((p) => `${id}: ${p}`),
    ]),
  ];
}
