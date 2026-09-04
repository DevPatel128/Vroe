import { ArrowRight, ArrowUpRight, EnvelopeSimple } from "@phosphor-icons/react/dist/ssr";
import { HERO, PRODUCTS_SECTION, NOTES_SECTION, BELIEFS, EARLY_ACCESS } from "../content/copy.js";
import { SITE } from "../content/site.js";
import { Picture } from "../components/Picture.jsx";
import { TroveCard, VeroCard } from "../components/ProductCard.jsx";
import { NoteCards } from "../components/NoteCard.jsx";
import { SubscribeForm } from "../components/SubscribeForm.jsx";

export function HomePage() {
  return (
    <>
      <section className="hero-section" aria-labelledby="hero-title">
        <Picture
          className="hero-image"
          name={HERO.image.src}
          alt={HERO.image.alt}
          sizes="(max-width: 700px) 100vw, (max-width: 980px) 760px, 1360px"
          priority
        />
        <div className="hero-copy">
          <span className="eyebrow with-rule">{HERO.eyebrow}</span>
          <h1 id="hero-title">
            {HERO.headline[0]}<br />{HERO.headline[1]}<span className="accent-dot">.</span>
          </h1>
          <p>{HERO.body}</p>
          <div className="hero-actions">
            <a className="button button-primary" href={HERO.primaryCta.href}>
              {HERO.primaryCta.label} <ArrowRight aria-hidden="true" />
            </a>
            <a className="text-link" href={HERO.secondaryCta.href}>
              {HERO.secondaryCta.label} <ArrowUpRight aria-hidden="true" />
            </a>
          </div>
        </div>
        <div className="hero-caption">
          <span>{HERO.caption.index}</span>
          <span>{HERO.caption.text}</span>
        </div>
      </section>

      <section className="section products-section" id="products" aria-labelledby="products-title">
        <div className="section-intro">
          <div>
            <span className="eyebrow">{PRODUCTS_SECTION.eyebrow}</span>
            <h2 id="products-title">
              {PRODUCTS_SECTION.headline[0]}<br />{PRODUCTS_SECTION.headline[1]}
            </h2>
          </div>
          <p>{PRODUCTS_SECTION.body}</p>
        </div>
        <div className="product-grid">
          <TroveCard />
          <VeroCard />
        </div>
      </section>

      <section className="section notes-section" id="notes" aria-labelledby="notes-title">
        <div className="section-intro notes-intro">
          <div>
            <span className="eyebrow">{NOTES_SECTION.eyebrow}</span>
            <h2 id="notes-title">
              {NOTES_SECTION.headline[0]}<br />{NOTES_SECTION.headline[1]}
            </h2>
          </div>
          <p>{NOTES_SECTION.body}</p>
        </div>
        <NoteCards />
      </section>

      <section className="section thinking-section" id="thinking" aria-labelledby="thinking-title">
        <div className="thinking-marker">
          <span className="eyebrow">{BELIEFS.eyebrow}</span>
          <span className="marker-line" />
        </div>
        <div className="thinking-grid">
          <h2 id="thinking-title">
            {BELIEFS.headline[0]}<br />{BELIEFS.headline[1]}<br />
            {BELIEFS.headline[2]}<span className="accent-dot">.</span>
          </h2>
          <div className="thinking-copy">
            {BELIEFS.paragraphs.map((text) => <p key={text}>{text}</p>)}
            <strong>{BELIEFS.closer}</strong>
          </div>
          <Picture
            className="thinking-object"
            name={BELIEFS.image.src}
            alt={BELIEFS.image.alt}
            sizes="150px"
          />
        </div>
      </section>

      <section className="section access-section" id="early-access" aria-labelledby="access-title">
        <div className="access-icon"><EnvelopeSimple aria-hidden="true" /></div>
        <div className="access-copy">
          <span className="eyebrow">{EARLY_ACCESS.eyebrow}</span>
          <h2 id="access-title">
            {EARLY_ACCESS.headline[0]}<br />{EARLY_ACCESS.headline[1]}
          </h2>
          <p>{EARLY_ACCESS.body}</p>
          <a className="contact-email" href={`mailto:${SITE.email}`}>{SITE.email}</a>
        </div>
        <SubscribeForm />
      </section>
    </>
  );
}
