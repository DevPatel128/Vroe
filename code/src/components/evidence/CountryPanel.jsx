import { figure, inline } from "./figures.js";
import { SourceNote } from "./SourceNote.jsx";

/** First figure a country has from an ordered list of candidate metrics. */
const firstFigure = (data, iso, metrics, show) =>
  metrics.map((metric) => figure(data, { iso, metric, show })).find(Boolean) ?? null;

/** "time, understanding and money" */
const listOf = (labels) =>
  labels.length < 2 ? labels.join("") : `${labels.slice(0, -1).join(", ")} and ${labels.at(-1)}`;

/**
 * One country, one consistent structure: time, understanding, fragility,
 * complexity and money, then the human cost. Only dimensions with a recent
 * figure are shown; the rest are named in one sentence so their absence is
 * stated rather than hidden or padded with older data.
 */
export function CountryPanel({ data, story, iso, capabilities }) {
  const c = story.panel;
  const country = data.countries.find((x) => x.iso === iso);
  const slug = `country-${iso.toLowerCase()}`;

  const cells = c.rows.map((row) => ({ row, f: firstFigure(data, iso, row.metrics, row.show) }));
  const present = cells.filter(({ f }) => f);
  const missing = cells.filter(({ f }) => !f).map(({ row }) => row.label.toLowerCase());
  const costs = c.cost
    .map((item) => ({ item, f: firstFigure(data, iso, item.metrics, "aggregate") }))
    .filter(({ f }) => f);

  const dimensions = [...new Set(present.map(({ f }) => f.record.dimension))];
  const capabilityIds = [...new Set(dimensions.flatMap((d) => story.dimensions[d]?.capabilities ?? []))];
  const titles = capabilityIds.map((id) => capabilities.find((cap) => cap.id === id)?.title).filter(Boolean);

  return (
    <article
      className="country-panel"
      id={slug}
      data-country-panel={iso}
      tabIndex={-1}
      aria-labelledby={`${slug}-title`}
    >
      <span className="eyebrow">{c.eyebrow}</span>
      <h3 id={`${slug}-title`}>{country.name}</h3>

      <dl className="panel-grid">
        {present.map(({ row, f }) => (
          <div className="panel-cell" key={row.key}>
            <dt className="eyebrow">{row.label}</dt>
            <dd data-evidence-id={f.id} data-source-id={f.record.sourceId} data-quantity={f.quantity} data-kind={f.kind}>
              <span className="panel-figure">{inline(f)}</span>
              {row.unitWords ? <span className="panel-unit">{row.unitWords}</span> : null}
              <span className="panel-label">{row.show === "burden" ? f.record.burdenLabel : f.record.label}</span>
              {f.record.comparable ? null : <span className="tag">{c.notComparable}</span>}
              <SourceNote data={data} story={story} record={f.record} />
            </dd>
          </div>
        ))}

        {costs.length > 0 ? (
          <div className="panel-cell panel-cost">
            <dt className="eyebrow">{c.costLabel}</dt>
            <dd>
              <ul className="panel-cost-list">
                {costs.map(({ item, f }) => (
                  <li key={item.key} data-evidence-id={f.id} data-source-id={f.record.sourceId} data-quantity={f.quantity} data-kind={f.kind}>
                    <span className="panel-cost-figure">{inline(f)}</span>{" "}
                    <span className="panel-unit">{item.unitWords}</span>
                    <span className="panel-label">{item.caption(f.record)}</span>
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        ) : null}
      </dl>

      {missing.length > 0 ? <p className="panel-missing-note">{c.missing(listOf(missing), country.name)}</p> : null}

      {titles.length > 0 ? (
        <p className="panel-relevance">
          <strong>{c.relevanceIntro}</strong> {titles.join(", ")}.
        </p>
      ) : null}
    </article>
  );
}
