import { SeoHead } from "../seo/SeoHead.jsx";
import { Header } from "../components/Header.jsx";
import { Footer } from "../components/Footer.jsx";

/**
 * The full <html> document.
 *
 * Rendered by scripts/prerender.mjs with renderToStaticMarkup, so what ships is
 * the finished HTML — no hydration, no client-side routing, no framework in the
 * browser. `enhance.js` is the only script tag, and it is deferred because
 * nothing on the page depends on it to be readable.
 *
 * The stylesheet and script paths are injected by the prerenderer from Vite's
 * manifest, so they carry content hashes and can be cached immutably.
 */
export function Document({ route, jsonLd, css, js, children }) {
  return (
    <html lang="en">
      <head>
        <SeoHead route={route} jsonLd={jsonLd} />
        {css.map((href) => (
          <link key={href} rel="stylesheet" href={href} />
        ))}
      </head>
      <body>
        <a className="skip-link" href="#main">Skip to content</a>
        <div className="site-shell">
          <Header currentPath={route.path} />
          <main id="main">{children}</main>
          <Footer />
        </div>
        {js ? <script type="module" src={js} defer /> : null}
      </body>
    </html>
  );
}
