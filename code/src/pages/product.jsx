import { ArrowRight, ArrowUpRight, Wallet } from "@phosphor-icons/react/dist/ssr";
import { PRODUCTS } from "../content/products.js";
import { NOTE_BY_ID } from "../content/notes.js";
import { EVIDENCE } from "../content/evidence/index.js";
import { Breadcrumbs } from "../components/Breadcrumbs.jsx";
import { TrovePreview } from "../components/TrovePreview.jsx";
import { VeroPreview } from "../components/VeroPreview.jsx";
import { EvidenceIndia } from "../components/evidence/EvidenceIndia.jsx";
import { CountryRanking } from "../components/evidence/CountryRanking.jsx";
import { CapabilityGrid } from "../components/evidence/CapabilityGrid.jsx";
import { Methodology } from "../components/evidence/Methodology.jsx";

/**
 * Shared template for /trove and /vero.
 *
 * The status callout is not decoration — it is the page's honesty guarantee.
 * It sits directly under the hero, before anything else, so a visitor never
 * has to scroll past a pitch to find out the product is not available yet.
 *
 * A product with an evidence story (content/evidence/index.js) gets the
 * evidence layer instead of a plain capability showcase: problem and evidence
 * first, then the product's response, mapped to the burden each capability is
 * meant to reduce. A product without one — Vero, for now — gets its own
 * capability showcase and illustration, built to the same standard.
 */
export function ProductPage({ id }) {
  const p = PRODUCTS[id];
  const note = NOTE_BY_ID[id];
  const evidence = EVIDENCE[id] ?? null;

  const statusText =
    id === "trove"
      ? "Trove is being built and is not yet available to use. There is no download, no sign-up and no waiting list beyond the email updates below."
      : "Vero is an exploration rather than a product. Nothing described here has been built yet — there is no escrow, no payments, no dispute process and no public profiles.";

  return (
    <>
      <div className="page-hero">
        <Breadcrumbs
          trail={[
            { label: "Home", href: "/" },
            { label: p.name, href: p.href },
          ]}
        />
        <div className="page-hero-meta">
          {id === "trove" ? (
            <span className="product-icon coral"><Wallet weight="fill" aria-hidden="true" /></span>
          ) : (
            <span className="product-icon lime" aria-hidden="true"><span>V</span></span>
          )}
          <span className="product-name">{p.name}</span>
          <span className={`status-pill ${p.status.tone}`}>{p.status.label}</span>
        </div>
        <h1>
          {p.headline[0]} {p.headline[1]}<span className="accent-dot">.</span>
        </h1>
        <p className="lede">{p.intro}</p>
      </div>

      <div className="section pad-end-sm">
        <div className="status-callout">
          <p><strong>Where this stands.</strong> {statusText}</p>
        </div>
      </div>

      {evidence ? (
        <>
          <EvidenceIndia product={id} />
          <CountryRanking product={id} />
        </>
      ) : (
        <section className="section" aria-labelledby="capabilities-title">
          <span className="eyebrow with-rule">WHAT WE’RE BUILDING</span>
          <h2 id="capabilities-title">
            What {p.name} is being built to do<span className="accent-dot">.</span>
          </h2>
          <div className="capability-feature-list">
            {p.capabilities.map((c, i) => (
              <div className="capability-feature" key={c.title}>
                <span className={`capability-feature-index ${i % 2 === 0 ? "coral" : "lime"}`}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3>{c.title}</h3>
                  <p>{c.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {id === "trove" ? (
        <section className="section products-section" aria-label="A look at the Trove interface">
          <div className="product-card trove-card-shell">
            <div className="product-card-copy">
              <span className="eyebrow">A ROUGH LOOK</span>
              <h3>Early<br />interface<span className="accent-dot">.</span></h3>
              <p>
                An impression of how Trove is shaping up. The figures are invented for the
                illustration, and the design will keep changing.
              </p>
            </div>
            <TrovePreview />
          </div>
        </section>
      ) : (
        <section className="section products-section" aria-label="A look at a Vero record">
          <div className="product-card vero-card-shell">
            <div className="product-card-copy">
              <span className="eyebrow">A ROUGH LOOK</span>
              <h3>Early<br />record<span className="accent-dot">.</span></h3>
              <p>
                An impression of what a confirmed record might look like. The names and
                details are invented for the illustration.
              </p>
            </div>
            <VeroPreview />
          </div>
        </section>
      )}

      {evidence ? (
        <section className="section evidence-response" id={evidence.story.response.id} aria-labelledby={`${evidence.story.response.id}-title`}>
          <span className="eyebrow with-rule">{evidence.story.response.eyebrow}</span>
          <h2 id={`${evidence.story.response.id}-title`}>
            {evidence.story.response.headline[0]}<br />{evidence.story.response.headline[1]}<span className="accent-dot">.</span>
          </h2>
          <p className="evidence-lede">{evidence.story.response.lede}</p>
          <CapabilityGrid product={id} capabilities={p.capabilities} />
        </section>
      ) : null}

      <section className="section pad-end-md" aria-labelledby="principles-title">
        <h2 id="principles-title">
          {id === "trove" ? "How we are building it" : "What we are working out"}
          <span className="accent-dot">.</span>
        </h2>
        <ul className="principles">
          {p.principles.map((line) => <li key={line}>{line}</li>)}
        </ul>
      </section>

      {evidence ? <Methodology product={id} /> : null}

      <section className="section pad-end-xl">
        <div className="article-footer flush-top">
          <p>{note.description}</p>
          <a className="text-link" href={note.slug}>
            {id === "trove"
              ? "Read how Trove approaches financial clarity"
              : "Read the idea behind portable proof of work"}{" "}
            <ArrowRight aria-hidden="true" />
          </a>
          <p className="stack-md">
            Want to hear when {p.name} is ready?{" "}
            <a href="/#early-access">Join the list</a>, or{" "}
            <a href="/contact">get in touch</a>.
          </p>
          <a className="text-link" href={id === "trove" ? "/vero" : "/trove"}>
            {id === "trove"
              ? "Learn about Vero’s verified work history"
              : "Explore the Trove personal finance app"}{" "}
            <ArrowUpRight aria-hidden="true" />
          </a>
        </div>
      </section>
    </>
  );
}
