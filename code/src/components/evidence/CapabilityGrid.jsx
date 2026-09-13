import { EVIDENCE } from "../../content/evidence/index.js";

/**
 * The product's capabilities, each naming the burden it is meant to reduce.
 * The mapping lives in the product's evidence story; a capability with no
 * mapped burden simply shows no label rather than a stretched connection.
 */
export function CapabilityGrid({ product, capabilities }) {
  const { story } = EVIDENCE[product];
  const dimensions = Object.values(story.dimensions);
  return (
    <div className="capability-grid">
      {capabilities.map((c) => {
        const reduces = dimensions.filter((d) => d.capabilities.includes(c.id)).map((d) => d.label);
        return (
          <div className="capability" key={c.id}>
            <h3>{c.title}</h3>
            <p>{c.body}</p>
            {reduces.length > 0 ? (
              <p className="capability-addresses">
                <span className="capability-addresses-label">{story.response.addressesLabel}</span>
                {reduces.map((label) => <span className="burden-chip" key={label}>{label}</span>)}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
