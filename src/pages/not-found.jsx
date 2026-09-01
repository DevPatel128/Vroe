import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { NOT_FOUND } from "../content/copy.js";

export function NotFoundPage() {
  return (
    <div className="section notfound">
      <span className="eyebrow">{NOT_FOUND.eyebrow}</span>
      <h1>
        {NOT_FOUND.headline[0]}<br />{NOT_FOUND.headline[1]}<span className="accent-dot">.</span>
      </h1>
      <p>{NOT_FOUND.body}</p>
      <div className="notfound-links">
        <a className="button button-primary" href="/">
          Back to the homepage <ArrowRight aria-hidden="true" />
        </a>
        <a className="text-link" href="/trove">Explore the Trove personal finance app</a>
        <a className="text-link" href="/vero">Learn about Vero&rsquo;s verified work history</a>
      </div>
    </div>
  );
}
