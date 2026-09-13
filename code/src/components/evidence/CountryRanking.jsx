import { EVIDENCE } from "../../content/evidence/index.js";
import { PRODUCTS } from "../../content/products.js";
import { CountryPanel } from "./CountryPanel.jsx";
import { figure, inline } from "./figures.js";

/** "Ranked by adults who could not raise emergency money… — World Bank Global Findex, 2024." */
function rankedByText(copy, data, metric) {
  const source = data.sources[metric.sourceId];
  return `${copy.rankedBy} ${(metric.burdenLabel ?? metric.label).toLowerCase()} — ${source.shortName}, ${metric.year}.`;
}

/**
 * The global view.
 *
 * When at least one recent, comparable measure covers every listed country, the
 * countries are ranked by it in descending order of burden, India first. Every
 * comparable measure's ranking is rendered into the markup; the first is visible
 * and the rest carry `hidden`, and enhance.js reveals a switch between them.
 *
 * When no such measure exists — the case today — nothing is ranked. The section
 * says so, and shows each country's recent national figures on their own.
 */
export function CountryRanking({ product }) {
  const { story, data } = EVIDENCE[product];
  const w = story.world;
  const capabilities = PRODUCTS[product].capabilities;
  const rankings = data.rankableMetrics().map((m) => data.rankCountries(m.id));
  const ranked = rankings.length > 0;

  const rankOf = (ranking, iso) => ranking.rows.find((r) => r.iso === iso)?.rank ?? null;
  const titlesFor = (dimension) =>
    (story.dimensions[dimension]?.capabilities ?? [])
      .map((id) => capabilities.find((c) => c.id === id)?.title)
      .filter(Boolean)
      .join(", ");

  // Primary country first, then the order the data lists them in.
  const countryOrder = ranked
    ? rankings[0].rows.map((r) => r.iso)
    : [data.primaryCountry, ...data.countries.map((c) => c.iso).filter((iso) => iso !== data.primaryCountry)];

  const headline = ranked ? w.headline : w.headlineUnranked;

  return (
    <section className="section evidence-section" id={w.id} aria-labelledby={`${w.id}-title`}>
      <span className="eyebrow with-rule">{w.eyebrow}</span>
      <h2 id={`${w.id}-title`}>
        {headline[0]}<br />{headline[1]}<span className="accent-dot">.</span>
      </h2>
      <p className="evidence-lede">{ranked ? w.lede : w.ledeUnranked}</p>

      {rankings.length > 1 ? (
        <div className="ranking-controls" data-rank-controls="" hidden>
          <span className="ranking-controls-label" id={`${w.id}-rank-by`}>{w.rankToggleLabel}</span>
          <div className="rank-options" role="group" aria-labelledby={`${w.id}-rank-by`}>
            {rankings.map((r, i) => (
              <button
                type="button"
                className="rank-button"
                key={r.metric.id}
                data-rank-by={r.metric.id}
                data-rank-label={rankedByText(w, data, r.metric)}
                aria-pressed={i === 0 ? "true" : "false"}
              >
                {r.metric.shortLabel}, {r.metric.year}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {ranked ? (
        <>
          <p className="ranked-by" data-ranked-by="" aria-live="polite">{rankedByText(w, data, rankings[0].metric)}</p>

          <ol className="ranking-list" data-ranking-list="">
            {rankings[0].rows.map((row) => {
              const pinned = row.iso === data.primaryCountry;
              const rankAttributes = Object.fromEntries(
                rankings.map((r) => [`data-rank-${r.metric.id}`, rankOf(r, row.iso) ?? ""]),
              );
              return (
                <li
                  key={row.iso}
                  className={pinned ? "ranking-row is-pinned" : "ranking-row"}
                  data-iso={row.iso}
                  {...(pinned ? { "data-pinned": "" } : {})}
                  {...rankAttributes}
                >
                  <a className="ranking-link" href={`#country-${row.iso.toLowerCase()}`} data-country-link={row.iso}>
                    <span className="ranking-rank">
                      {pinned ? <span className="ranking-pin">{w.pinnedNote}</span> : null}
                      {rankings.map((r, i) => {
                        const rank = rankOf(r, row.iso);
                        return (
                          <span key={r.metric.id} data-show-for={r.metric.id} hidden={i !== 0}>
                            {rank ? w.rank(rank, r.rankedCount) : w.unranked}
                          </span>
                        );
                      })}
                    </span>

                    <span className="ranking-country">{row.name}</span>

                    <span className="ranking-measure">
                      {rankings.map((r, i) => {
                        const f = figure(data, { iso: row.iso, metric: r.metric.id, show: "burden" });
                        return (
                          <span className="ranking-measure-item" key={r.metric.id} data-show-for={r.metric.id} hidden={i !== 0}>
                            <span className="row-figure">{f ? inline(f) : w.insufficient}</span>
                            {f ? (
                              <svg className="ranking-bar" viewBox="0 0 100 8" preserveAspectRatio="none" aria-hidden="true" focusable="false">
                                <rect className="bar-track" width="100" height="8" rx="4" />
                                <rect className="bar-value" width={Math.max(0, Math.min(100, f.quantity))} height="8" rx="4" />
                              </svg>
                            ) : null}
                          </span>
                        );
                      })}
                    </span>

                    {w.columns.map((col) => {
                      const f = col.metrics.map((metric) => figure(data, { iso: row.iso, metric, show: col.show })).find(Boolean);
                      return (
                        <span className="ranking-cell" key={col.key}>
                          <span className="ranking-cell-label">{col.label}</span>
                          {f ? (
                            <span className="row-figure" data-evidence-id={f.id} data-source-id={f.record.sourceId} data-quantity={f.quantity} data-kind={f.kind}>
                              {inline(f)}{col.unitWords ? ` ${col.unitWords}` : ""}
                            </span>
                          ) : (
                            <span className="row-missing">{col.missing ?? w.insufficient}</span>
                          )}
                          {f && !f.record.comparable ? <span className="tag">{w.notComparable}</span> : null}
                        </span>
                      );
                    })}
                  </a>
                </li>
              );
            })}
          </ol>

          {rankings.map((r, i) => {
            const titles = titlesFor(r.metric.dimension);
            return titles ? (
              <p className="ranking-relevance" key={r.metric.id} data-show-for={r.metric.id} hidden={i !== 0}>
                {w.relevance(story.dimensions[r.metric.dimension].label, titles)}
              </p>
            ) : null;
          })}
        </>
      ) : null}

      <div className="country-panels" data-country-panels="">
        {countryOrder.map((iso) => (
          <CountryPanel key={iso} data={data} story={story} iso={iso} capabilities={capabilities} />
        ))}
      </div>
    </section>
  );
}
