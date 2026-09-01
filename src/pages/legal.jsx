import { PRIVACY, TERMS, LEGAL_EFFECTIVE } from "../content/legal.js";
import { SITE } from "../content/site.js";
import { Breadcrumbs } from "../components/Breadcrumbs.jsx";

/** Shared renderer for /privacy and /terms. */
export function LegalPage({ kind }) {
  const doc = kind === "privacy" ? PRIVACY : TERMS;
  const href = kind === "privacy" ? "/privacy" : "/terms";

  return (
    <>
      <div className="page-hero">
        <Breadcrumbs trail={[{ label: "Home", href: "/" }, { label: doc.title, href }]} />
        <h1>{doc.title}</h1>
        <p className="lede">{doc.lede}</p>
      </div>

      <div className="section prose">
        <p className="legal-effective">Effective {LEGAL_EFFECTIVE}</p>

        {doc.sections.map((section) => (
          <section key={section.heading}>
            <h2>{section.heading}</h2>
            {section.paragraphs?.map((p) => <p key={p}>{p}</p>)}
            {section.list ? (
              <ul>{section.list.map((item) => <li key={item}>{item}</li>)}</ul>
            ) : null}
            {section.after?.map((p) => <p key={p} className="stack-sm">{p}</p>)}
            {section.contact ? (
              <p className="stack-sm">
                <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
              </p>
            ) : null}
          </section>
        ))}

        <section>
          <p>
            {kind === "privacy" ? (
              <>See also our <a href="/terms">terms of use</a>.</>
            ) : (
              <>See also our <a href="/privacy">privacy policy</a>.</>
            )}
          </p>
        </section>
      </div>
    </>
  );
}
