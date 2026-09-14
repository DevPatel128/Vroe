import { LinkedinLogo } from "@phosphor-icons/react/dist/ssr";
import { SITE } from "../content/site.js";
import { FOOTER } from "../content/copy.js";

/**
 * Footer. Doubles as the site's secondary navigation, so every important page
 * is reachable from the bottom of every page — which is also what keeps the
 * internal link graph crawlable without relying on the header menu.
 */
export function Footer() {
  return (
    <footer className="site-footer">
      <div>
        <a className="wordmark footer-wordmark" href="/">
          Vroe Labs
        </a>
        <span>{FOOTER.copyright}</span>
      </div>

      <nav className="footer-nav" aria-label="Footer">
        <a href="/products">Products</a>
        <a href="/trove">Trove</a>
        <a href="/vero">Vero</a>
        <a href="/about">About</a>
        <a href="/contact">Contact</a>
        <a href="/privacy">Privacy</a>
        <a href="/terms">Terms</a>
        {SITE.linkedin ? (
          <a
            href={SITE.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Vroe Labs on LinkedIn (opens in a new tab)"
          >
            <LinkedinLogo aria-hidden="true" />
          </a>
        ) : null}
      </nav>
    </footer>
  );
}
