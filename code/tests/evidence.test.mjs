/**
 * Evidence layer contracts.
 *
 * Three groups. The data tests hold the real evidence to the integrity rules in
 * docs/10-evidence.md. The fixture tests run the ranking and validation logic on
 * small synthetic data, so a rule is proven on a case built to break it rather
 * than on whatever today's figures happen to be. The built-page tests read the
 * prerendered /trove and /vero, so `npm run build` must have run first.
 */

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { createEvidence, formatParts, recencyProblems } from "../src/content/evidence/derive.js";
import { EVIDENCE, MINIMUM_DATA_YEAR, evidenceProblems } from "../src/content/evidence/index.js";
import { COUNTRIES } from "../src/content/evidence/countries.js";
import { METRICS } from "../src/content/evidence/metrics.js";
import { SOURCES } from "../src/content/evidence/sources.js";
import { TROVE_EVIDENCE } from "../src/content/evidence/trove.js";

const dist = new URL("../dist/client/", import.meta.url);
const src = new URL("../src/", import.meta.url);
const read = (file, base = dist) => readFile(new URL(file, base), "utf8");

const data = EVIDENCE.trove.data;
const close = (a, b) => Math.abs(a - b) <= Math.max(1e-9, Math.abs(b) * 1e-9);

/* ─── The real data ────────────────────────────────────────────────────── */

test("the evidence data and every story reference validate with no problems", () => {
  assert.deepEqual(evidenceProblems(), []);
});

test("every figure was collected and published in 2024 or later", () => {
  assert.equal(MINIMUM_DATA_YEAR, 2024);
  assert.deepEqual(recencyProblems({ sources: SOURCES, metrics: METRICS, countries: COUNTRIES }, MINIMUM_DATA_YEAR), []);
  for (const metric of Object.values(METRICS)) {
    assert.ok(metric.year >= MINIMUM_DATA_YEAR, `${metric.id} was collected in ${metric.year}`);
    assert.ok(SOURCES[metric.sourceId].year >= MINIMUM_DATA_YEAR, `${metric.sourceId} was published too early`);
  }
});

test("every figure resolves to a source, year, population, locator, date and confidence", () => {
  const required = ["country", "metric", "value", "unit", "population", "year", "source", "sourceUrl",
    "sourceLocator", "methodology", "lastVerified", "confidence"];
  for (const country of data.countries) {
    for (const obs of country.observations) {
      const record = data.resolve(country.iso, obs.metric);
      for (const field of required) {
        assert.ok(record[field] !== undefined && record[field] !== null && record[field] !== "",
          `${record.id} is missing ${field}`);
      }
      assert.equal(record.origin, "external", `${record.id} must be external evidence`);
      if (!record.comparable) {
        assert.ok(record.comparabilityNotes, `${record.id} is national-only and must say why it is not comparable`);
      }
    }
  }
});

test("calculated figures are computed from their published inputs, never typed", () => {
  for (const country of data.countries) {
    for (const obs of country.observations) {
      if (data.metrics[obs.metric].calculation) {
        assert.equal(obs.value, undefined, `${country.iso}:${obs.metric} types a value its metric calculates`);
      }
    }
  }
  // India 2024: (fin24aN + fin24aVD) × 100, straight from the Findex file.
  const india = data.resolve("IN", "fragility-findex2024");
  assert.ok(close(india.value, (0.048162454234269673 + 0.650398290895633) * 100));
});

test("aggregates multiply by a population with the same age band and year", () => {
  for (const country of data.countries) {
    for (const obs of country.observations) {
      const metric = data.metrics[obs.metric];
      if (!metric.aggregate) continue;
      const agg = data.aggregate(country.iso, obs.metric);
      assert.ok(agg, `${country.iso}:${obs.metric} has no population to aggregate against`);
      assert.equal(agg.population.ageBand, metric.ageBand, `${country.iso}:${obs.metric} age band mismatch`);
      if (obs.populationYear === undefined) {
        assert.equal(agg.population.year, metric.year, `${country.iso}:${obs.metric} year mismatch`);
      } else {
        assert.ok(obs.populationYearNote, `${country.iso}:${obs.metric} borrows another year's population silently`);
      }
    }
  }
  const time = data.aggregate("IN", "time-finance-tus2024");
  assert.ok(close(time.quantity, ((0.138 * 365) / 60) * 1077731602));
});

test("headline figures carry high confidence", () => {
  for (const item of TROVE_EVIDENCE.india.sequence) {
    assert.equal(data.resolve(TROVE_EVIDENCE.primaryCountry, item.metric).confidence, "high", item.metric);
  }
});

/* ─── Ranking and validation rules, on synthetic data ──────────────────── */

const source = (id, extra = {}) => ({
  id, shortName: id, publisher: "Publisher", title: `Title ${id}`, year: 2025,
  url: `https://example.org/${id}`, geography: "Everywhere", population: "Adults",
  methodology: "Method", tier: "statistical-agency", lastVerified: "2026-01-01", ...extra,
});
const metric = (id, extra = {}) => ({
  id, dimension: "literacy", label: `Metric ${id}`, unit: "percent", burden: "direct", comparable: true,
  sourceId: "s1", year: 2024, ageBand: "15+", population: "Adults", methodology: "Method", ...extra,
});
const obs = (id, value, extra = {}) => ({
  metric: id, value, sourceLocator: "p. 1", confidence: "high", lastVerified: "2026-01-01", ...extra,
});

function fixture({ metrics, countries, impact } = {}) {
  return createEvidence({
    sources: { s1: source("s1") },
    metrics: metrics ?? { a: metric("a"), b: metric("b", { year: 2025 }) },
    countries: countries ?? [
      { iso: "IN", name: "India", observations: [obs("a", 30), obs("b", 10)] },
      { iso: "XA", name: "Alpha", observations: [obs("a", 50), obs("b", 40)] },
      { iso: "XB", name: "Beta", observations: [obs("a", 70)] },
    ],
    primaryCountry: "IN",
    impact,
    today: "2026-09-14",
  });
}

test("a measure missing for even one listed country cannot rank", () => {
  assert.deepEqual(fixture().rankableMetrics().map((m) => m.id), ["a"]);
});

test("a measure from a national-only instrument never ranks, even with full coverage", () => {
  const e = fixture({
    metrics: { a: metric("a"), n: metric("n", { comparable: false, comparabilityNotes: "National only" }) },
    countries: [
      { iso: "IN", name: "India", observations: [obs("a", 1), obs("n", 1)] },
      { iso: "XA", name: "Alpha", observations: [obs("a", 2), obs("n", 2)] },
    ],
  });
  assert.deepEqual(e.rankableMetrics().map((m) => m.id), ["a"]);
});

test("the default ranking uses the most recent qualifying measure", () => {
  const e = fixture({
    metrics: { a: metric("a", { year: 2024 }), c: metric("c", { year: 2026 }) },
    countries: [
      { iso: "IN", name: "India", observations: [obs("a", 1), obs("c", 1)] },
      { iso: "XA", name: "Alpha", observations: [obs("a", 2), obs("c", 2)] },
    ],
  });
  assert.equal(e.defaultRankingMetric().id, "c");
});

test("the primary country is listed first but keeps its true rank", () => {
  const { rows } = fixture().rankCountries("a");
  assert.deepEqual(rows.map((r) => [r.iso, r.rank]), [["IN", 3], ["XB", 1], ["XA", 2]]);
});

test("a country without the measure gets no rank and follows the ranked countries", () => {
  const { rows, rankedCount } = fixture().rankCountries("b");
  assert.equal(rankedCount, 2);
  assert.deepEqual(rows.map((r) => [r.iso, r.rank]), [["IN", 2], ["XA", 1], ["XB", null]]);
});

test("an inverse measure ranks by its burden side, and equal burdens share a rank", () => {
  const e = fixture({
    metrics: { lit: metric("lit", { burden: "inverse" }) },
    countries: [
      { iso: "IN", name: "India", observations: [obs("lit", 24)] },
      { iso: "XA", name: "Alpha", observations: [obs("lit", 60)] },
      { iso: "XB", name: "Beta", observations: [obs("lit", 60)] },
    ],
  });
  const { rows } = e.rankCountries("lit");
  assert.deepEqual(rows.map((r) => [r.iso, r.rank, r.observation.burdenValue]), [["IN", 1, 76], ["XA", 2, 40], ["XB", 2, 40]]);
});

test("validation rejects typed values on calculated metrics, future dates and missing notes", () => {
  const e = fixture({
    metrics: {
      calc: metric("calc", { calculation: { formula: "x × 100", inputs: ["x"], compute: ({ x }) => x * 100 } }),
      nat: metric("nat", { comparable: false }),
    },
    countries: [
      { iso: "IN", name: "India", observations: [obs("calc", 5), obs("nat", 5, { lastVerified: "2099-01-01" })] },
    ],
  });
  const problems = e.problems().join("\n");
  assert.match(problems, /must not carry a typed value/);
  assert.match(problems, /input "x" must be a number/);
  assert.match(problems, /in the future/);
  assert.match(problems, /needs comparabilityNotes/);
});

test("the recency rule rejects old collection years, old publications and old populations", () => {
  const problems = recencyProblems({
    sources: { old: source("old", { year: 2015 }), fresh: source("fresh") },
    metrics: { stale: metric("stale", { year: 2014 }), fresh: metric("fresh") },
    countries: [{ iso: "IN", name: "India", observations: [], populations: [{ ageBand: "15+", year: 2021, value: 1 }] }],
  }, 2024).join("\n");
  assert.match(problems, /metric stale: collected in 2014/);
  assert.match(problems, /source old: published in 2015/);
  assert.match(problems, /IN: population for 2021/);
  assert.ok(!/fresh/.test(problems), "recent data must pass");
});

test("impact figures must be product data with a measurement date, never research", () => {
  const e = fixture({ impact: [{ id: "hours", label: "Hours", value: 5, updated: "2026-01-01" }] });
  const problems = e.problems().join("\n");
  assert.match(problems, /origin: "product"/);
  assert.match(problems, /measuredBy/);
});

test("one formatting rule per quantity type, applied the same way everywhere", () => {
  assert.deepEqual(formatParts("hours-per-year", 904755680), { number: "905", scale: "million" });
  assert.deepEqual(formatParts("hours-per-year", 3022066771), { number: "3.0", scale: "billion" });
  assert.deepEqual(formatParts("people", 752860991), { number: "753", scale: "million" });
  assert.deepEqual(formatParts("percent", 0.36), { number: "0.36", scale: "" });
  assert.deepEqual(formatParts("percent", 9.5), { number: "9.5", scale: "" });
  assert.deepEqual(formatParts("percent", 68.19), { number: "68", scale: "" });
  assert.deepEqual(formatParts("minutes-per-day", 38.3), { number: "38", scale: "" });
});

/* ─── The built pages ──────────────────────────────────────────────────── */

const attrs = (tag) => Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map((m) => [m[1], m[2]]));

test("India comes first: its section and its country panel lead", async () => {
  const html = await read("trove/index.html");
  assert.ok(html.indexOf('id="evidence-india"') > 0, "the India section is missing");
  assert.ok(html.indexOf('id="evidence-india"') < html.indexOf('id="evidence-world"'), "India must precede the global view");
  assert.equal(html.match(/data-country-panel="(\w+)"/)[1], "IN");
});

test("countries are ranked only by a recent measure that covers them all, and the page says which", async () => {
  const html = await read("trove/index.html");
  const rankable = data.rankableMetrics();

  if (rankable.length === 0) {
    assert.ok(!/data-ranking-list|data-ranked-by|data-rank-controls/.test(html),
      "a ranking is shown although no recent measure compares the countries");
    assert.ok(html.includes(TROVE_EVIDENCE.world.ledeUnranked), "the page must say why nothing is ranked");
    return;
  }

  const list = html.match(/<ol[^>]*data-ranking-list[^>]*>([\s\S]*?)<\/ol>/)[1];
  const order = [...list.matchAll(/<li[^>]*data-iso="(\w+)"/g)].map((m) => m[1]);
  const metric = data.defaultRankingMetric();
  assert.equal(order[0], "IN");
  assert.deepEqual(order, data.rankCountries(metric.id).rows.map((r) => r.iso));
  const burdens = order.slice(1).map((iso) => data.resolve(iso, metric.id).burdenValue);
  for (let i = 1; i < burdens.length; i += 1) {
    assert.ok(burdens[i - 1] >= burdens[i], `ranking is not descending at position ${i}`);
  }

  const label = html.match(/<p[^>]*data-ranked-by[^>]*>([^<]*)<\/p>/)[1];
  assert.match(label, /^Ranked by /);
  assert.ok(label.includes(String(metric.year)), "the label must name the survey year");

  if (rankable.length > 1) {
    const controls = html.match(/<div[^>]*data-rank-controls[^>]*>[\s\S]*?<\/div>\s*<\/div>/)[0];
    assert.match(controls.match(/<div[^>]*>/)[0], /\shidden/, "the switch must start hidden");
    for (const [b] of controls.matchAll(/<button[^>]*>/g)) {
      assert.match(b, /type="button"/);
      assert.match(b, /aria-pressed="(true|false)"/);
    }
  }
});

test("every displayed figure traces to a source and matches its computation", async () => {
  const html = await read("trove/index.html");
  const tags = [...html.matchAll(/<[a-z]+[^>]*data-evidence-id="[^"]+"[^>]*>/g)];
  assert.ok(tags.length >= 10, `expected every figure to be traced, found ${tags.length}`);

  for (const match of tags) {
    const a = attrs(match[0]);
    const id = a["data-evidence-id"];
    assert.ok(SOURCES[a["data-source-id"]], `${id} cites unknown source ${a["data-source-id"]}`);

    const [iso, metricId, isAggregate] = id.split(":");
    const quantity = Number(a["data-quantity"]);
    const expected = isAggregate
      ? [data.aggregate(iso, metricId).quantity]
      : [data.resolve(iso, metricId).value, data.resolve(iso, metricId).burdenValue];
    assert.ok(expected.some((e) => e !== null && close(quantity, e)), `${id} shows ${quantity}, computed ${expected.join(" or ")}`);

    const { number } = formatParts(a["data-kind"], quantity);
    const after = html.slice(match.index, match.index + 600);
    assert.ok(after.includes(number), `${id} does not render its formatted number ${number}`);
  }
});

test("the page names no study year before 2024", async () => {
  const html = await read("trove/index.html");
  const text = html
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/ICATUS 2016/g, "ICATUS");  // an activity classification's name, not a data year
  const old = [...text.matchAll(/\b(19\d{2}|20(?:[01]\d|2[0-3]))\b/g)].map((m) => m[1]);
  assert.deepEqual(old, [], `older years appear on the page: ${old.join(", ")}`);
});

test("no measured-impact number appears while Trove has no product data", async () => {
  assert.deepEqual(TROVE_EVIDENCE.impact, [], "this test must change the day real impact data arrives");
  const html = await read("trove/index.html");
  const layer = html.match(/<div[^>]*data-impact-layer[^>]*>([\s\S]*?)<\/div>/)[1];
  assert.ok(!/\d/.test(layer.replace(/<[^>]*>/g, "")), "the impact layer shows a number without product data");
});

test("research evidence and product impact never share an element", async () => {
  const html = await read("trove/index.html");
  const layer = html.match(/<div[^>]*data-impact-layer[^>]*>[\s\S]*?<\/div>/)[0];
  assert.ok(!/data-evidence-id/.test(layer), "research figures inside the impact layer");
  assert.ok(!/data-impact-id/.test(html.replace(layer, "")), "impact figures outside the impact layer");
});

test("Vero has not reached the evidence stage, so its page has no evidence layer", async () => {
  const html = await read("vero/index.html");
  assert.ok(!/data-evidence-id|evidence-india|evidence-world|data-impact-layer/.test(html));
});

test("every country panel is in the page, so it reads fully without JavaScript", async () => {
  const html = await read("trove/index.html");
  const panels = [...html.matchAll(/<article[^>]*data-country-panel="[^"]+"[^>]*>/g)].map((m) => m[0]);
  assert.equal(panels.length, data.countries.length);
  for (const tag of panels) assert.ok(!/\shidden/.test(tag), `a panel is hidden in the static page: ${tag}`);
});

test("the evidence script moves existing nodes and never injects markup", async () => {
  const enhance = await read("client/enhance.js", src);
  const body = enhance.match(/function initEvidence\(\)[\s\S]*?\n}\n/)[0];
  assert.ok(!/innerHTML|outerHTML|insertAdjacentHTML/.test(body));
  assert.match(body, /history\.replaceState/, "the chosen country should be linkable");
  assert.match(body, /aria-pressed/, "the switch must report its state");
});

test("the story never claims an effect Trove has not had", async () => {
  const strings = [];
  const walk = (value) => {
    if (typeof value === "string") strings.push(value);
    else if (typeof value === "function") strings.push(String(value));
    else if (value && typeof value === "object") Object.values(value).forEach(walk);
  };
  walk(TROVE_EVIDENCE);
  const html = await read("trove/index.html");
  const text = [...strings, html.replace(/<[^>]*>/g, " ")].join("\n");

  assert.ok(!/\bTrove\s+(saves|will save|has saved|helps you save|gives you back|has reduced|reduces|cuts)\b/i.test(text),
    "copy claims Trove's effect");
  assert.ok(!/\bTrove users\b/i.test(text), "copy mentions Trove users before any exist");
  // The approved route description reads "Trove is a personal finance app in
  // development" (docs/03-content.md); only the unqualified claim is banned.
  assert.ok(!/\bTrove is a (free\b|personal finance app(?! in development))/i.test(text), "present-tense availability claim");
});
