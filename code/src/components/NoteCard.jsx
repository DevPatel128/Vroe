import { ArrowRight, Wallet } from "@phosphor-icons/react/dist/ssr";
import { NOTES } from "../content/notes.js";

/**
 * Homepage note cards. Each links to its full article, with anchor text that
 * says what the reader will get rather than "read more" — descriptive anchors
 * are both better for assistive technology and better for crawlers.
 */
export function NoteCards() {
  const linkText = {
    trove: "Read how Trove approaches financial clarity",
    vero: "Read the idea behind portable proof of work",
  };

  return (
    <div className="notes-grid">
      {NOTES.map((note) => (
        <article className={`note-card note-card-${note.id}`} key={note.id}>
          <div className="note-topline">
            <span>{note.eyebrow}</span>
            {note.id === "trove" ? (
              <Wallet weight="fill" aria-hidden="true" />
            ) : (
              <span className="note-mark" aria-hidden="true">V</span>
            )}
          </div>
          <h3>
            {note.headline[0]}<br />{note.headline[1]}
          </h3>
          <p>{note.body[0]}</p>
          <p>{note.body[1]}</p>
          <a className="text-link" href={note.slug}>
            {linkText[note.id]} <ArrowRight aria-hidden="true" />
          </a>
        </article>
      ))}
    </div>
  );
}
