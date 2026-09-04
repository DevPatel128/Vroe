import { EnvelopeSimple } from "@phosphor-icons/react/dist/ssr";
import { CONTACT, EARLY_ACCESS } from "../content/copy.js";
import { SITE } from "../content/site.js";
import { Breadcrumbs } from "../components/Breadcrumbs.jsx";
import { SubscribeForm } from "../components/SubscribeForm.jsx";

export function ContactPage() {
  return (
    <>
      <div className="page-hero">
        <Breadcrumbs trail={[{ label: "Home", href: "/" }, { label: "Contact", href: "/contact" }]} />
        <span className="eyebrow with-rule">{CONTACT.eyebrow}</span>
        <h1>{CONTACT.headline[0]}<span className="accent-dot">.</span></h1>
        <p className="lede">{CONTACT.lede}</p>
      </div>

      <div className="section pad-end-sm">
        <div className="contact-grid">
          {CONTACT.reasons.map((reason) => (
            <div className="contact-reason" key={reason.heading}>
              <h2>{reason.heading}</h2>
              <p>
                {reason.body}
                {reason.heading === "Security" ? (
                  <> <a href="/.well-known/security.txt">Read the security policy</a>.</>
                ) : null}
              </p>
            </div>
          ))}
        </div>

        <div className="contact-panel">
          <h2>{CONTACT.emailLabel}</h2>
          <a className="contact-email" href={`mailto:${SITE.email}`}>{SITE.email}</a>
          <p className="contact-response">{CONTACT.responseNote}</p>
        </div>
      </div>

      <section className="section access-section" id="early-access" aria-labelledby="access-title">
        <div className="access-icon"><EnvelopeSimple aria-hidden="true" /></div>
        <div className="access-copy">
          <span className="eyebrow">{EARLY_ACCESS.eyebrow}</span>
          <h2 id="access-title">
            {EARLY_ACCESS.headline[0]}<br />{EARLY_ACCESS.headline[1]}
          </h2>
          <p>{EARLY_ACCESS.body}</p>
        </div>
        <SubscribeForm />
      </section>
      <div className="pad-end-lg" />
    </>
  );
}
