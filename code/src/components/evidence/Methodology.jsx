import { EVIDENCE, METHOD_STAGES } from "../../content/evidence/index.js";
import { figure, inline } from "./figures.js";

const number = (n) => (Number.isInteger(n) ? n.toLocaleString("en-GB") : String(n));

/**
 * "How we measured this": the method, every calculation with its inputs, what
 * cannot be compared, and every source. Built from <details> so it needs no
 * JavaScript. Ends with the impact layer, kept visibly separate from the
 * research above it.
 */
export function Methodology({ product }) {
  const { story, data } = EVIDENCE[product];
  const m = story.method;

  // Every derived figure: calculated values and population aggregates.
  const calculations = [];
  for (const country of data.countries) {
    for (const obs of country.observations) {
      const metric = data.metrics[obs.metric];
      if (metric.calculation) {
        const f = figure(data, { iso: country.iso, metric: obs.metric, show: "value" });
        calculations.push({
          key: `${f.id}:calc`,
          f,
          title: `${country.name} — ${metric.label}`,
          formula: metric.calculation.formula,
          inputs: Object.entries(obs.inputs).map(([k, v]) => `${k} = ${number(v)}`).join("; "),
          population: null,
        });
      }
      const agg = figure(data, { iso: country.iso, metric: obs.metric, show: "aggregate" });
      if (agg) {
        const pop = agg.aggregate.population;
        calculations.push({
          key: agg.id,
          f: agg,
          title: `${country.name} — ${metric.label}, across the population`,
          formula: metric.aggregate.formula,
          inputs: `${metric.burden === "inverse" ? "share not" : "value"} = ${inline(figure(data, { iso: country.iso, metric: obs.metric, show: metric.burden === "inverse" ? "burden" : "value" }))}`,
          population: `${number(pop.value)} (${pop.ageBand}, ${pop.year}; ${data.sources[pop.sourceId].shortName}, ${pop.sourceLocator})${agg.aggregate.populationYearNote ? `. ${agg.aggregate.populationYearNote}` : ""}`,
        });
      }
    }
  }

  // Comparability notes, once per metric in use.
  const notes = new Map();
  for (const country of data.countries) {
    for (const obs of country.observations) {
      const record = data.resolve(country.iso, obs.metric);
      if (record.comparabilityNotes) {
        const key = `${record.metric}:${record.comparabilityNotes}`;
        const prior = notes.get(key);
        notes.set(key, { record, countries: prior ? [...prior.countries, country.name] : [country.name] });
      }
    }
  }

  const pending = new Set(m.pendingStages);

  return (
    <section className="section evidence-method" id={m.id} aria-labelledby={`${m.id}-title`}>
      <h2 id={`${m.id}-title`}>{m.heading}<span className="accent-dot">.</span></h2>

      <p className="method-stages-label">{m.stagesLabel}</p>
      <ol className="method-stages">
        {METHOD_STAGES.map((stage) => (
          <li key={stage.id} className={pending.has(stage.id) ? "is-pending" : undefined}>
            <span className="method-stage-name">{stage.label}</span>
            <span>{stage.question}</span>
            {pending.has(stage.id) ? <span className="method-stage-status">{m.stagePending}</span> : null}
          </li>
        ))}
      </ol>

      <div className="method-details">
        {m.sections.map((section) => (
          <details key={section.key}>
            <summary>{section.summary}</summary>
            <div>{section.body.map((p) => <p key={p}>{p}</p>)}</div>
          </details>
        ))}

        <details>
          <summary>{m.calculationsSummary}</summary>
          <div>
            <p>{m.calculationsIntro}</p>
            <ul className="method-list">
              {calculations.map((c) => (
                <li key={c.key}>
                  <strong>{c.title}</strong>
                  <span className="method-formula">{c.formula}</span>
                  <span>{m.inputsLabel}: {c.inputs}</span>
                  {c.population ? <span>{m.populationLabel}: {c.population}</span> : null}
                  <span>{m.resultLabel}: {inline(c.f)}</span>
                </li>
              ))}
            </ul>
          </div>
        </details>

        <details>
          <summary>{m.comparabilitySummary}</summary>
          <div>
            <ul className="method-list">
              {[...notes.values()].map(({ record, countries }) => (
                <li key={`${record.metric}-${countries.join()}`}>
                  <strong>{record.label}</strong>
                  <span>{countries.join(", ")} · {data.sources[record.sourceId].shortName}, {record.year}</span>
                  <span>{record.comparabilityNotes}</span>
                </li>
              ))}
            </ul>
          </div>
        </details>

        <details>
          <summary>{m.sourcesSummary}</summary>
          <div>
            <ul className="source-list">
              {data.citedSources().map((source) => (
                <li key={source.id} id={`source-${source.id}`}>
                  <a href={source.url} rel="noopener noreferrer">{source.title}</a>
                  <dl>
                    {Object.entries(m.sourceFields).map(([field, label]) =>
                      source[field] ? (
                        <div key={field}>
                          <dt>{label}</dt>
                          <dd>{source[field]}</dd>
                        </div>
                      ) : null,
                    )}
                  </dl>
                </li>
              ))}
            </ul>
          </div>
        </details>
      </div>

      <div className="impact-layer" data-impact-layer="">
        <h3>{m.impact.heading}</h3>
        {data.impact.length === 0 ? (
          <p>{m.impact.empty}</p>
        ) : (
          <ul>
            {data.impact.map((entry) => (
              <li key={entry.id} data-impact-id={entry.id}>
                <strong>{entry.label}</strong> {number(entry.value)} · {m.impact.updated} {entry.updated}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
