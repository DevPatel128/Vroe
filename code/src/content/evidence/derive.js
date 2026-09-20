/**
 * Evidence derivation — pure functions over the evidence content modules.
 *
 * THE RULE THIS FILE ENFORCES
 * ---------------------------
 * Only raw values from a source are typed by hand (in countries.js). Everything
 * the page shows that is not a raw value — a composite of two survey answers, a
 * people count, an annual hours total, a rank — is computed here at build time
 * from those inputs. A derived number therefore cannot drift from the source
 * figures it came from, and every one of them can be traced back through
 * `resolve()` to a source, a year, a population and a page reference.
 *
 * `createEvidence()` takes its data as arguments so the tests can run the same
 * logic against small synthetic fixtures. `index.js` builds the real instance.
 *
 * See docs/03_RESEARCH/RESEARCH.md for the methodology this implements.
 */

export const UNITS = ["percent", "minutes-per-day", "hours-per-day", "count"];
export const BURDEN = ["direct", "inverse", "none"];
export const CONFIDENCE = ["high", "medium", "low"];
export const DIMENSIONS = ["time", "literacy", "complexity", "stress", "information", "money"];
export const TIERS = [
  "government",
  "regulator",
  "central-bank",
  "statistical-agency",
  "university",
  "research-institution",
  "international-organisation",
  "industry-body",
];

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const isNumber = (n) => typeof n === "number" && Number.isFinite(n);

/* ─── Formatting ─────────────────────────────────────────────────────────
   One fixed rule per quantity type, applied identically to every country, so a
   unit can never be switched to make one number look bigger than another. */

/** Round to three significant figures, keeping whole numbers whole. */
function sig3(n) {
  if (n === 0) return "0";
  const digits = Math.floor(Math.log10(Math.abs(n))) + 1;
  const decimals = Math.max(0, 3 - digits);
  return n.toFixed(Math.min(decimals, 1));
}

/**
 * Split a quantity into the number and the scale word, for the display type.
 * `scale` is "" | "million" | "billion"; the unit noun comes from content.
 */
export function formatParts(kind, n) {
  // Small shares and durations keep enough digits to stay distinguishable:
  // two decimals below 1, one below 10, whole numbers from 10 up.
  const small = (x) => (x < 1 ? x.toFixed(2) : x < 10 ? x.toFixed(1) : String(Math.round(x)));
  switch (kind) {
    case "percent":
    case "minutes-per-day":
      return { number: small(n), scale: "" };
    case "people":
    case "hours-per-year":
    case "count":
      if (n >= 1e9) return { number: sig3(n / 1e9), scale: "billion" };
      if (n >= 1e6) return { number: sig3(n / 1e6), scale: "million" };
      return { number: Math.round(n).toLocaleString("en-GB"), scale: "" };
    default:
      throw new Error(`No format rule for "${kind}"`);
  }
}

/* ─── The evidence instance ──────────────────────────────────────────── */

export function createEvidence({
  sources,
  metrics,
  countries,
  primaryCountry,
  impact = [],
  // The latest date a verification may carry. Dates are written in local time,
  // and a timezone ahead of UTC (India is +5:30) is already on tomorrow's date
  // for part of every UTC day, so a date is only "in the future" once it is
  // ahead of tomorrow in UTC. Without this the build fails in the small hours IST.
  today = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
}) {
  const countryByIso = new Map(countries.map((c) => [c.iso, c]));

  const burdenOf = (metric, value) => {
    if (metric.burden === "inverse") return 100 - value;
    if (metric.burden === "direct") return value;
    return null;
  };

  const rawObservation = (iso, metricId) =>
    countryByIso.get(iso)?.observations.find((o) => o.metric === metricId) ?? null;

  /** The displayed value: typed for a raw metric, computed for a derived one. */
  const valueOf = (metric, obs) =>
    metric.calculation ? metric.calculation.compute(obs.inputs) : obs.value;

  /**
   * Everything known about one country's figure for one metric, with every
   * field the data-integrity rules require resolved from metric and source.
   */
  function resolve(iso, metricId) {
    const country = countryByIso.get(iso);
    const obs = rawObservation(iso, metricId);
    const metric = metrics[metricId];
    if (!country || !obs || !metric) return null;
    const source = sources[metric.sourceId];
    const value = valueOf(metric, obs);
    return {
      id: `${iso}:${metricId}`,
      country: country.name,
      iso,
      metric: metricId,
      dimension: metric.dimension,
      label: metric.label,
      burdenLabel: metric.burdenLabel ?? metric.label,
      value,
      unit: metric.unit,
      burdenValue: burdenOf(metric, value),
      population: metric.population,
      ageBand: metric.ageBand,
      year: metric.year,
      source: source?.title ?? null,
      publisher: source?.publisher ?? null,
      sourceId: metric.sourceId,
      sourceUrl: source?.url ?? null,
      sourceLocator: obs.sourceLocator,
      methodology: metric.methodology,
      calculation: metric.calculation
        ? { formula: metric.calculation.formula, inputs: obs.inputs }
        : null,
      lastVerified: obs.lastVerified,
      confidence: obs.confidence,
      comparable: Boolean(metric.comparable),
      comparabilityNotes: obs.comparabilityNotes ?? metric.comparabilityNotes ?? null,
      breakdowns: obs.breakdowns ?? [],
      origin: "external",
    };
  }

  /** Population record matching a metric's age band and (possibly overridden) year. */
  function populationFor(iso, metricId) {
    const country = countryByIso.get(iso);
    const metric = metrics[metricId];
    const obs = rawObservation(iso, metricId);
    if (!country || !metric || !obs) return null;
    const year = obs.populationYear ?? metric.year;
    return (
      (country.populations ?? []).find((p) => p.ageBand === metric.ageBand && p.year === year) ?? null
    );
  }

  /**
   * The resource cost of one figure across a whole population — people for a
   * share, hours a year for a daily time. Null when the metric has no aggregate
   * or no population with the same age band and year exists.
   */
  function aggregate(iso, metricId) {
    const metric = metrics[metricId];
    const record = resolve(iso, metricId);
    if (!metric?.aggregate || !record) return null;
    const population = populationFor(iso, metricId);
    if (!population) return null;
    const obs = rawObservation(iso, metricId);
    return {
      id: `${iso}:${metricId}:aggregate`,
      quantity: metric.aggregate.compute(record, population.value),
      kind: metric.aggregate.kind,
      formula: metric.aggregate.formula,
      population,
      populationYearNote: obs.populationYearNote ?? null,
      observation: record,
    };
  }

  /**
   * Metrics that may rank countries: measured with one instrument (`comparable`),
   * carrying a burden direction, and present for every country listed. A metric
   * missing for even one country is not rankable — it is shown, not ranked.
   *
   * Order is the documented default rule: most recent year first; ties broken by
   * id so the order is stable rather than arbitrary.
   */
  function rankableMetrics(isoList = countries.map((c) => c.iso)) {
    return Object.values(metrics)
      .filter((m) => m.comparable && m.burden !== "none")
      .filter((m) => isoList.every((iso) => rawObservation(iso, m.id)))
      .sort((a, b) => b.year - a.year || a.id.localeCompare(b.id));
  }

  const defaultRankingMetric = () => rankableMetrics()[0] ?? null;

  /**
   * Countries in descending order of burden on one metric. The primary country
   * is always listed first but keeps its true rank. Countries without the metric
   * get no rank and follow the ranked ones.
   */
  function rankCountries(metricId) {
    const metric = metrics[metricId];
    const entries = countries.map((c) => ({
      iso: c.iso,
      name: c.name,
      observation: resolve(c.iso, metricId),
      rank: null,
    }));
    const ranked = entries
      .filter((e) => e.observation)
      .sort((a, b) => b.observation.burdenValue - a.observation.burdenValue || a.name.localeCompare(b.name));

    // Standard competition ranking: equal burdens share a rank.
    ranked.forEach((e, i) => {
      const prev = ranked[i - 1];
      e.rank = prev && prev.observation.burdenValue === e.observation.burdenValue ? prev.rank : i + 1;
    });

    const unranked = entries.filter((e) => !e.observation);
    const ordered = [...ranked, ...unranked];
    const primary = ordered.find((e) => e.iso === primaryCountry);
    return {
      metric,
      rankedCount: ranked.length,
      rows: [primary, ...ordered.filter((e) => e.iso !== primaryCountry)].filter(Boolean),
    };
  }

  /** First metric from `candidates` this country has, resolved. */
  function firstAvailable(iso, candidates) {
    for (const id of candidates) {
      const record = resolve(iso, id);
      if (record) return record;
    }
    return null;
  }

  /** Sources actually cited by at least one observation or population. */
  function citedSources() {
    const ids = new Set();
    for (const c of countries) {
      for (const o of c.observations) if (metrics[o.metric]) ids.add(metrics[o.metric].sourceId);
      for (const p of c.populations ?? []) ids.add(p.sourceId);
    }
    return [...ids].map((id) => sources[id]).filter(Boolean);
  }

  /* ─── Validation ─────────────────────────────────────────────────────── */

  function problems() {
    const out = [];
    const need = (cond, message) => {
      if (!cond) out.push(message);
    };
    const checkDate = (value, where) => {
      need(ISO_DATE.test(value ?? ""), `${where}: lastVerified/updated must be an ISO date`);
      if (ISO_DATE.test(value ?? "")) need(value <= today, `${where}: date ${value} is in the future`);
    };

    for (const [id, s] of Object.entries(sources)) {
      const where = `source ${id}`;
      need(s.id === id, `${where}: id does not match its key`);
      for (const field of ["publisher", "title", "year", "url", "geography", "population", "methodology", "tier"]) {
        need(s[field] !== undefined && s[field] !== "", `${where}: missing ${field}`);
      }
      need(/^https:\/\//.test(s.url ?? ""), `${where}: url must be https`);
      need(TIERS.includes(s.tier), `${where}: unknown tier "${s.tier}"`);
      checkDate(s.lastVerified, where);
    }

    for (const [id, m] of Object.entries(metrics)) {
      const where = `metric ${id}`;
      need(m.id === id, `${where}: id does not match its key`);
      need(Boolean(sources[m.sourceId]), `${where}: source "${m.sourceId}" does not exist`);
      need(UNITS.includes(m.unit), `${where}: unknown unit "${m.unit}"`);
      need(BURDEN.includes(m.burden), `${where}: unknown burden direction "${m.burden}"`);
      need(DIMENSIONS.includes(m.dimension), `${where}: unknown dimension "${m.dimension}"`);
      need(isNumber(m.year), `${where}: year must be a number`);
      for (const field of ["label", "population", "ageBand", "methodology"]) {
        need(Boolean(m[field]), `${where}: missing ${field}`);
      }
      if (!m.comparable) need(Boolean(m.comparabilityNotes), `${where}: a national-only metric needs comparabilityNotes`);
      if (m.calculation) {
        need(typeof m.calculation.compute === "function", `${where}: calculation.compute must be a function`);
        need(Boolean(m.calculation.formula), `${where}: calculation needs a human-readable formula`);
        need(Array.isArray(m.calculation.inputs) && m.calculation.inputs.length > 0, `${where}: calculation needs named inputs`);
      }
      if (m.aggregate) {
        need(typeof m.aggregate.compute === "function", `${where}: aggregate.compute must be a function`);
        need(Boolean(m.aggregate.formula), `${where}: aggregate needs a human-readable formula`);
      }
    }

    for (const c of countries) {
      const seen = new Set();
      for (const o of c.observations) {
        const where = `${c.iso}:${o.metric}`;
        const m = metrics[o.metric];
        need(Boolean(m), `${where}: metric does not exist`);
        need(!seen.has(o.metric), `${where}: duplicate observation`);
        seen.add(o.metric);
        if (!m) continue;
        need(o.origin === undefined || o.origin === "external", `${where}: evidence must be external, never product data`);
        need(Boolean(o.sourceLocator), `${where}: missing sourceLocator (page, table or column)`);
        need(CONFIDENCE.includes(o.confidence), `${where}: unknown confidence "${o.confidence}"`);
        checkDate(o.lastVerified, where);
        if (m.calculation) {
          need(o.value === undefined, `${where}: a calculated metric must not carry a typed value`);
          for (const name of m.calculation.inputs) {
            need(isNumber(o.inputs?.[name]), `${where}: input "${name}" must be a number`);
          }
        } else {
          need(isNumber(o.value), `${where}: value must be a number`);
        }
        const value = m.calculation && o.inputs ? valueOf(m, o) : o.value;
        if (isNumber(value) && m.unit === "percent") need(value >= 0 && value <= 100, `${where}: percent out of range`);
        if (o.populationYear !== undefined) {
          need(Boolean(o.populationYearNote), `${where}: a population from a different year needs populationYearNote`);
        }
        if (m.aggregate) need(Boolean(populationFor(c.iso, o.metric)), `${where}: no ${m.ageBand} population for its year`);
        for (const b of o.breakdowns ?? []) {
          need(Boolean(b.group) && isNumber(b.value), `${where}: breakdowns need a group and a numeric value`);
        }
      }
      for (const p of c.populations ?? []) {
        const where = `${c.iso}:population ${p.ageBand} ${p.year}`;
        need(isNumber(p.value) && p.value > 0, `${where}: value must be positive`);
        need(Boolean(sources[p.sourceId]), `${where}: source "${p.sourceId}" does not exist`);
        need(Boolean(p.sourceLocator), `${where}: missing sourceLocator`);
      }
    }

    need(countryByIso.has(primaryCountry), `primary country ${primaryCountry} is not in the country list`);

    // Problem-level evidence and product-level impact are never the same thing.
    for (const [i, entry] of impact.entries()) {
      const where = `impact[${i}]`;
      need(entry.origin === "product", `${where}: impact metrics must come from product data (origin: "product")`);
      need(Boolean(entry.measuredBy), `${where}: missing measuredBy`);
      checkDate(entry.updated, where);
      need(isNumber(entry.value), `${where}: value must be a number`);
    }

    return out;
  }

  return {
    primaryCountry,
    countries,
    metrics,
    sources,
    impact,
    resolve,
    aggregate,
    populationFor,
    rankableMetrics,
    defaultRankingMetric,
    rankCountries,
    firstAvailable,
    citedSources,
    problems,
  };
}

/**
 * The recency rule: every metric must be collected, and every source published,
 * in `minimumYear` or later; so must every population a figure is multiplied by.
 * Older studies are removed from the content, not hidden, so this checks every
 * definition rather than only the ones in use. The year itself is set once, in
 * index.js. See docs/03_RESEARCH/RESEARCH.md.
 */
export function recencyProblems({ sources, metrics, countries }, minimumYear) {
  const out = [];
  for (const [id, m] of Object.entries(metrics)) {
    if (!(m.year >= minimumYear)) out.push(`metric ${id}: collected in ${m.year}, before ${minimumYear}`);
  }
  for (const [id, s] of Object.entries(sources)) {
    if (!(s.year >= minimumYear)) out.push(`source ${id}: published in ${s.year}, before ${minimumYear}`);
  }
  for (const c of countries) {
    for (const p of c.populations ?? []) {
      if (!(p.year >= minimumYear)) out.push(`${c.iso}: population for ${p.year}, before ${minimumYear}`);
    }
  }
  return out;
}
