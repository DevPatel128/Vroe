import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { ABOUT } from "../content/copy.js";
import { Breadcrumbs } from "../components/Breadcrumbs.jsx";
import { Picture } from "../components/Picture.jsx";

export function AboutPage() {
  return (
    <>
      <div className="page-hero">
        <Breadcrumbs trail={[{ label: "Home", href: "/" }, { label: "About", href: "/about" }]} />
        <span className="eyebrow with-rule">{ABOUT.eyebrow}</span>
        <h1>
          {ABOUT.headline[0]}<br />{ABOUT.headline[1]}<span className="accent-dot">.</span>
        </h1>
        <p className="lede">{ABOUT.lede}</p>
      </div>

      <div className="section prose">
        {ABOUT.sections.map((section) => (
          <section key={section.heading}>
            <h2>{section.heading}</h2>
            {section.paragraphs.map((p) => <p key={p}>{p}</p>)}
          </section>
        ))}

        <section>
          <h2>What we are building</h2>
          <p>
            Two products, both in progress.{" "}
            <a href="/trove">Trove</a> is a personal finance app for spending, budgets,
            subscriptions, goals and investments across currencies.{" "}
            <a href="/vero">Vero</a> is an exploration of verified work history and portable
            proof of work. Neither is available yet, and each page says plainly where it stands.
          </p>
          <p>
            If you would rather read the thinking than the pitch, start with{" "}
            <a href="/notes/trove">how Trove approaches financial clarity</a> or{" "}
            <a href="/notes/vero">the idea behind portable proof of work</a>.
          </p>
          <span className="closer">{ABOUT.closer}</span>
        </section>

        <section>
          <Picture
            name="belief-still-life"
            alt="An olive-green arch and a coral sphere arranged on a cream surface"
            sizes="600px"
            className="thinking-object"
          />
          <p className="stack-lg">
            <a className="text-link" href="/contact">
              Get in touch with Vroe Labs <ArrowRight aria-hidden="true" />
            </a>
          </p>
        </section>
      </div>
    </>
  );
}
