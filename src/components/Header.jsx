import { ArrowUpRight, List, X } from "@phosphor-icons/react/dist/ssr";
import { NAV_ITEMS } from "../content/routes.js";

/**
 * Site header.
 *
 * Stateless by design. The prototype held the mobile menu in React state; this
 * page ships no React, so the toggle lives in src/client/enhance.js and works
 * by flipping `is-open` on the nav — the class the CSS already keyed off.
 * Both icons are rendered here and CSS shows whichever matches the state, so
 * the button never has to build an icon at runtime.
 */
export function Header({ currentPath }) {
  return (
    <header className="site-header">
      <a className="wordmark" href="/" aria-label="Vroe Labs — home">
        Vroe Labs
      </a>

      <button
        className="menu-toggle"
        type="button"
        aria-label="Open menu"
        aria-expanded="false"
        aria-controls="site-nav"
        data-menu-toggle
      >
        <span data-menu-icon="closed" aria-hidden="true"><List /></span>
        <span data-menu-icon="open" aria-hidden="true" hidden><X /></span>
      </button>

      <nav className="site-nav" id="site-nav" aria-label="Main">
        {NAV_ITEMS.map((item) => (
          <a
            key={item.href}
            href={item.href}
            {...(item.href === currentPath ? { "aria-current": "page" } : {})}
          >
            {item.label}
          </a>
        ))}
        <a className="nav-cta" href="/#early-access">
          Join the list <ArrowUpRight aria-hidden="true" />
        </a>
      </nav>
    </header>
  );
}
