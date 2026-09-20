import { PRODUCTS_HUB } from "../content/productsHub.js";
import { Breadcrumbs } from "../components/Breadcrumbs.jsx";
import { TroveCard, VeroCard } from "../components/ProductCard.jsx";

/**
 * /products — the index of everything Vroe Labs is building.
 *
 * Deliberately not a store: no prices, no "buy", no availability claims. Just
 * the two product cards already used on the homepage, given their own page
 * and their own URL so "our products" is somewhere to link, not only scroll to.
 */
export function ProductsHubPage() {
  const { closing } = PRODUCTS_HUB;
  return (
    <>
      <div className="page-hero">
        <Breadcrumbs trail={[{ label: "Home", href: "/" }, { label: "Products", href: "/products" }]} />
        <span className="eyebrow with-rule">{PRODUCTS_HUB.eyebrow}</span>
        <h1>
          {PRODUCTS_HUB.headline[0]}<br />{PRODUCTS_HUB.headline[1]}<span className="accent-dot">.</span>
        </h1>
        <p className="lede">{PRODUCTS_HUB.lede}</p>
      </div>

      <section className="section products-section" aria-label="Products">
        <div className="product-grid">
          <TroveCard headingLevel={2} />
          <VeroCard headingLevel={2} />
        </div>
      </section>

      <section className="section pad-end-xl">
        <div className="article-footer flush-top">
          <p>
            {closing.body}{" "}
            <a href={closing.joinHref}>{closing.joinLabel}</a>, or{" "}
            <a href={closing.contactHref}>{closing.contactLabel}</a>.
          </p>
        </div>
      </section>
    </>
  );
}
