import { ArrowRight, ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { NOTE_BY_ID } from "../content/notes.js";
import { PRODUCTS } from "../content/products.js";
import { Breadcrumbs } from "../components/Breadcrumbs.jsx";

const LONG_DATE = new Intl.DateTimeFormat("en-GB", {
  day: "numeric", month: "long", year: "numeric",
});

export function NotePage({ id }) {
  const note = NOTE_BY_ID[id];
  const product = PRODUCTS[note.product];
  const published = new Date(`${note.published}T00:00:00Z`);

  return (
    <>
      <div className="page-hero">
        <Breadcrumbs
          trail={[
            { label: "Home", href: "/" },
            { label: "Notes", href: "/#notes" },
            { label: note.title, href: note.slug },
          ]}
        />
        <span className="eyebrow with-rule">{note.eyebrow}</span>
        <h1>
          {note.headline[0]} {note.headline[1]}
        </h1>
        <div className="article-meta">
          {/* dateTime is the machine-readable form the Article JSON-LD also uses. */}
          <time dateTime={note.published}>{LONG_DATE.format(published)}</time>
          <span aria-hidden="true">·</span>
          <span>{note.readingTime}</span>
        </div>
      </div>

      <article className="section">
        <div className="article-body">
          {note.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </div>

        <div className="article-footer">
          <p>
            {note.id === "trove"
              ? "This is the thinking behind Trove, the personal finance app we are building."
              : "This is the thinking behind Vero, our exploration of verified work history."}
          </p>
          <a className="text-link" href={product.href}>
            {note.id === "trove"
              ? "Explore the Trove personal finance app"
              : "Learn about Vero’s verified work history"}{" "}
            <ArrowRight aria-hidden="true" />
          </a>
          <p className="stack-md">
            {note.id === "trove"
              ? "The companion piece asks a different question about ownership:"
              : "The companion piece asks a different question about ownership:"}
          </p>
          <a className="text-link" href={note.id === "trove" ? "/notes/vero" : "/notes/trove"}>
            {note.id === "trove"
              ? "Read the idea behind portable proof of work"
              : "Read how Trove approaches financial clarity"}{" "}
            <ArrowUpRight aria-hidden="true" />
          </a>
        </div>
      </article>
      <div className="pad-end-lg" />
    </>
  );
}
