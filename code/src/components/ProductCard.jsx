import { ArrowRight, ArrowUpRight, Wallet } from "@phosphor-icons/react/dist/ssr";
import { PRODUCTS } from "../content/products.js";
import { Picture } from "./Picture.jsx";
import { TrovePreview } from "./TrovePreview.jsx";

/**
 * Homepage product cards.
 *
 * Both link INTERNALLY. Neither product is released, so there is nothing
 * legitimate to link out to, and `product.url` is null for both. If a card ever
 * needs an external link again, it comes from `product.url` — never a literal
 * URL typed into this file. See docs/08_DECISIONS/DECISIONS.md, ADR-006.
 */

export function TroveCard() {
  const p = PRODUCTS.trove;
  return (
    <article className="product-card trove-card-shell" id="trove">
      <div className="product-card-copy">
        <div className="product-meta">
          <span className="product-icon coral"><Wallet weight="fill" aria-hidden="true" /></span>
          <span className="product-name">{p.name}</span>
          <span className={`status-pill ${p.status.tone}`}>{p.status.label}</span>
        </div>
        <h3>
          {p.headline[0]}<br />{p.headline[1]}<span className="accent-dot">.</span>
        </h3>
        <p>{p.summary}</p>
        <a className="button button-coral" href={p.href}>
          Explore the Trove personal finance app <ArrowRight aria-hidden="true" />
        </a>
      </div>
      <TrovePreview />
    </article>
  );
}

export function VeroCard() {
  const p = PRODUCTS.vero;
  return (
    <article className="product-card vero-card-shell" id="vero">
      <div className="product-meta">
        <span className="product-icon lime" aria-hidden="true"><span>V</span></span>
        <span className="product-name">{p.name}</span>
        <span className={`status-pill ${p.status.tone}`}>{p.status.label}</span>
      </div>
      <div className="vero-copy">
        <h3>
          {p.headline[0]}<br />{p.headline[1]}<span className="accent-dot">.</span>
        </h3>
        <p>{p.summary}</p>
        <a className="text-link dark-link" href={p.href}>
          Learn about Vero&rsquo;s verified work history <ArrowUpRight aria-hidden="true" />
        </a>
      </div>
      <Picture
        className="vero-image"
        name="vero-still-life"
        alt="A chartreuse circle resting against a textured cream art object"
        sizes="(max-width: 700px) 100vw, (max-width: 980px) 720px, 430px"
      />
    </article>
  );
}
