import { EVIDENCE } from "../../content/evidence/index.js";
import { formatParts } from "../../content/evidence/derive.js";
import { figure, inline } from "./figures.js";
import { SourceNote } from "./SourceNote.jsx";

/** Group breakdowns (age, gender, area) under a figure, in the record's own unit. */
function Breakdowns({ record, label }) {
  if (record.breakdowns.length === 0) return null;
  return (
    <div className="evidence-breakdowns">
      <p className="evidence-breakdowns-label">{label}</p>
      <ul>
        {record.breakdowns.map((b) => (
          <li key={b.group}>
            {b.group}: {inline({ parts: formatParts(record.unit, b.value), kind: record.unit })}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * India, the primary market: one number, one statement, one explanation, one
 * source — repeated — then what the numbers mean and where the burden comes from.
 */
export function EvidenceIndia({ product }) {
  const { story, data } = EVIDENCE[product];
  const s = story.india;

  return (
    <section className="section evidence-section" id={s.id} aria-labelledby={`${s.id}-title`}>
      <span className="eyebrow with-rule">{s.eyebrow}</span>
      <h2 id={`${s.id}-title`}>
        {s.headline[0]}<br />{s.headline[1]}<span className="accent-dot">.</span>
      </h2>
      <p className="evidence-lede">{s.lede}</p>

      <ol className="evidence-sequence">
        {s.sequence.map((item) => {
          const f = figure(data, item);
          if (!f) return null;
          // Templates get figures already formatted: the share behind an aggregate,
          // the year, and any other metric for the same country.
          const share = item.show === "aggregate" ? figure(data, { ...item, show: "burden" }) : null;
          const explanation =
            typeof item.explanation === "function"
              ? item.explanation({
                  share: share ? inline(share) : null,
                  year: f.record.year,
                  value: (metric, show = "value") => inline(figure(data, { iso: item.iso, metric, show })),
                })
              : item.explanation;
          const breakdownRecord = item.breakdownsFrom
            ? data.resolve(item.iso ?? data.primaryCountry, item.breakdownsFrom)
            : f.record;
          return (
            <li
              className="evidence-stat"
              key={f.id}
              data-evidence-id={f.id}
              data-source-id={f.record.sourceId}
              data-quantity={f.quantity}
              data-kind={f.kind}
            >
              <p className="evidence-figure">
                <span className="evidence-number">{f.parts.number}</span>
                {f.kind === "percent" ? <span className="evidence-scale">%</span> : null}
                {f.parts.scale ? <span className="evidence-scale">{f.parts.scale}</span> : null}
                {item.unitWords ? <span className="evidence-unit">{item.unitWords}</span> : null}
              </p>
              <div className="evidence-copy">
                <p className="evidence-statement">{item.statement}</p>
                <p className="evidence-explanation">{explanation}</p>
                {item.show === "value" && breakdownRecord ? (
                  <Breakdowns record={breakdownRecord} label={item.breakdownLabel} />
                ) : null}
                <SourceNote data={data} story={story} record={f.record} />
              </div>
            </li>
          );
        })}
      </ol>

      <div className="evidence-meaning">
        <h3>{s.meaning.heading[0]}<br />{s.meaning.heading[1]}</h3>
        <div>
          {s.meaning.paragraphs.map((p) => <p key={p}>{p}</p>)}
        </div>
      </div>

      <h3 className="burden-heading">
        {s.burdenSources.heading[0]}<br />{s.burdenSources.heading[1]}<span className="accent-dot">.</span>
      </h3>
      <ul className="burden-sources">
        {s.burdenSources.items.map((item) => {
          const f = figure(data, item);
          if (!f) return null;
          const pair = item.pair ? figure(data, item.pair) : null;
          return (
            <li
              className="burden-source"
              key={item.id}
              data-evidence-id={f.id}
              data-source-id={f.record.sourceId}
              data-quantity={f.quantity}
              data-kind={f.kind}
            >
              <span className="eyebrow">{item.title}</span>
              <p className="burden-figure">{inline(f)}</p>
              {item.unitWords ? <p className="burden-unit">{item.unitWords}</p> : null}
              <p className="burden-statement">{item.statement}</p>
              {pair ? (
                <>
                  <p
                    className="burden-figure burden-figure-pair"
                    data-evidence-id={pair.id}
                    data-source-id={pair.record.sourceId}
                    data-quantity={pair.quantity}
                    data-kind={pair.kind}
                  >
                    {inline(pair)}
                  </p>
                  <p className="burden-statement">{item.pair.statement}</p>
                </>
              ) : null}
              <Breakdowns record={f.record} label={item.breakdownLabel} />
              <SourceNote data={data} story={story} record={f.record} />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
