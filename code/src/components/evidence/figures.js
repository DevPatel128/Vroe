import { formatParts } from "../../content/evidence/derive.js";

/**
 * Resolve a story item ({ iso?, metric, show }) to exactly what the page shows.
 *
 *   show "value"     the metric's own value (e.g. 27% literate)
 *   show "burden"    the burden side (e.g. 73% not literate)
 *   show "aggregate" the population-wide resource cost (people, hours a year)
 *
 * Returns null when the country has no such figure, so a component can fall
 * back to "Insufficient comparable data" rather than rendering a blank.
 */
export function figure(data, { iso, metric, show = "value" }) {
  const country = iso ?? data.primaryCountry;
  const record = data.resolve(country, metric);
  if (!record) return null;

  if (show === "aggregate") {
    const aggregate = data.aggregate(country, metric);
    if (!aggregate) return null;
    return {
      record,
      aggregate,
      id: aggregate.id,
      quantity: aggregate.quantity,
      kind: aggregate.kind,
      parts: formatParts(aggregate.kind, aggregate.quantity),
    };
  }

  const quantity = show === "burden" ? record.burdenValue : record.value;
  if (quantity === null) return null;
  return {
    record,
    aggregate: null,
    id: record.id,
    quantity,
    kind: record.unit,
    parts: formatParts(record.unit, quantity),
  };
}

/** The figure as one short string: "73%", "3.7", "753 million". */
export function inline({ parts, kind }) {
  if (kind === "percent") return `${parts.number}%`;
  return parts.scale ? `${parts.number} ${parts.scale}` : parts.number;
}
