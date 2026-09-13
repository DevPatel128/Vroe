import { ArrowRight, ArrowUpRight, Wallet } from "@phosphor-icons/react/dist/ssr";
import { PRODUCTS } from "../content/products.js";
import { NOTE_BY_ID } from "../content/notes.js";
import { EVIDENCE } from "../content/evidence/index.js";
import { Breadcrumbs } from "../components/Breadcrumbs.jsx";
import { Picture } from "../components/Picture.jsx";
import { TrovePreview } from "../components/TrovePreview.jsx";
import { EvidenceIndia } from "../components/evidence/EvidenceIndia.jsx";
import { CountryRanking } from "../components/evidence/CountryRanking.jsx";
import { CapabilityGrid } from "../components/evidence/CapabilityGrid.jsx";
import { Methodology } from "../components/evidence/Methodology.jsx";

/**
 * Shared template for /trove and /vero.
 *
 * The status callout is not decoration — it is the page's honesty guarantee.
 * Every product page states in plain words that the product is not available,
 * so a visitor can never leave thinking they could sign up today.
 *
 * A product with an evidence story (content/evidence/index.js) gets the evidence
 * layer: problem, evidence and resource cost before the product, the method
 * after it. A product without one — Vero, for now — renders exactly as before.
 */
export function ProductPage({ id }) {
  const p = PRODUCTS[id];
  const note = NOTE_BY_ID[id];
  const evidence = EVIDENCE[id] ?? null;

  const statusText =
    id === "trove"
      ? "Trove is being built and is not yet available to use. There is no download, no sign-up and no waiting list beyond the email updates below."
      : "Vero is an exploration rather than a product. Nothing described here has been built yet — there is no escrow, no payments, no dispute process and no public profiles.";

  const statusCallout = (
    <div className="status-callout">
      <p><strong>Where this stands.</strong> {statusText}</p>
    </div>
  );

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

      {evidence ? (
        <>
          <EvidenceIndia product={id} />
          <CountryRanking product={id} />
        </>
      ) : (
        <section className="section" aria-labelledby="capabilities-title">
          <h2 id="capabilities-title" className="sr-only">What {p.name} is being built to do</h2>
          <div className="capability-grid">
            {p.capabilities.map((c) => (
              <div className="capability" key={c.title}>
                <h3>{c.title}</h3>
                <p>{c.body}</p>
              </div>
            ))}
          </div>
          {statusCallout}
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
        <section className="section products-section" aria-label="Vero">
          <div className="product-card vero-card-shell">
            <div className="vero-copy pad-start-md">
              <h3>What we are<br />working out<span className="accent-dot">.</span></h3>
              <ul className="principles">
                {p.principles.map((line) => <li key={line}>{line}</li>)}
              </ul>
            </div>
            <Picture
              className="vero-image"
              name="vero-still-life"
              alt="A chartreuse circle resting against a textured cream art object"
              sizes="(max-width: 700px) 100vw, 900px"
            />
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
          {statusCallout}
        </section>
      ) : null}

      {id === "trove" ? (
        <section className="section pad-end-md" aria-labelledby="principles-title">
          <h2 id="principles-title">How we are building it<span className="accent-dot">.</span></h2>
          <ul className="principles">
            {p.principles.map((line) => <li key={line}>{line}</li>)}
          </ul>
        </section>
      ) : null}

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
