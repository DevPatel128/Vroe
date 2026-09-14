/**
 * Functional and accessibility contracts.
 *
 * These cover the behaviour a visitor actually meets — links that go somewhere,
 * a form that never lies about what happened, a menu a keyboard can escape, and
 * text that can be read. Each test here exists because the thing it checks was
 * broken at some point, so a green run means those specific regressions are gone.
 *
 * They read the built output in dist/client and the source of the one script the
 * browser gets, so `npm run build` must have run first.
 */

import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import test from "node:test";

const distClient = new URL("../dist/client/", import.meta.url);
const src = new URL("../src/", import.meta.url);

const read = (file, base = distClient) => readFile(new URL(file, base), "utf8");

/** Every prerendered page, as [route, html]. */
async function pages() {
  const out = [];
  const walk = async (dir, prefix) => {
    for (const entry of await readdir(new URL(dir, distClient), { withFileTypes: true })) {
      if (entry.isDirectory()) await walk(`${dir}${entry.name}/`, `${prefix}${entry.name}/`);
      else if (entry.name.endsWith(".html")) out.push([`${prefix}${entry.name}`, await read(`${dir}${entry.name}`)]);
    }
  };
  await walk("", "");
  return out;
}

/* ─── Links go where they say they go ──────────────────────────────────── */

test("every in-page anchor target exists on the page that links to it", async () => {
  for (const [route, html] of await pages()) {
    const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
    // Same-page fragments only. "/#products" is a link to the home page.
    for (const [, frag] of html.matchAll(/href="#([^"]+)"/g)) {
      assert.ok(ids.has(frag), `${route} links to #${frag}, which is not an id on that page`);
    }
  }
});

test("home-page fragment links resolve against the home page", async () => {
  const home = await read("index.html");
  const ids = new Set([...home.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
  const seen = new Set();
  for (const [, html] of await pages()) {
    for (const [, frag] of html.matchAll(/href="\/#([^"]+)"/g)) seen.add(frag);
  }
  assert.ok(seen.size > 0, "expected at least one /#anchor link");
  for (const frag of seen) {
    assert.ok(ids.has(frag), `something links to /#${frag}, which is not an id on the home page`);
  }
});

test("no link is a dead placeholder", async () => {
  // Regression: the footer shipped a LinkedIn icon labelled "Vroe Labs on
  // LinkedIn" whose href was https://www.linkedin.com/ — the network's own
  // homepage. A link that does not go where its label says is worse than no link.
  const deadEnds = [
    /href="#"/,
    /href=""/,
    /href="https:\/\/(www\.)?linkedin\.com\/?"/,
    /href="https:\/\/(www\.)?(twitter|x|instagram|facebook)\.com\/?"/,
    /href="https:\/\/example\.(com|org)/,
    /href="(TODO|CHANGEME|#TODO)"/i,
  ];
  for (const [route, html] of await pages()) {
    for (const pattern of deadEnds) {
      assert.ok(!pattern.test(html), `${route} contains a placeholder link matching ${pattern}`);
    }
  }
});

test("nothing looks clickable without being a link or a button", async () => {
  for (const [route, html] of await pages()) {
    // role="button" without a real control behind it is the usual way this creeps in.
    assert.ok(!/role="button"/.test(html), `${route} fakes a button with role="button"`);
    assert.ok(!/<a(?=[\s>])(?![^>]*\bhref=)[^>]*>/.test(html), `${route} has an <a> with no href`);
  }
});

/* ─── The decorative product mock is not mistaken for a real UI ─────────── */

test("the Trove preview is hidden from assistive tech and holds no controls", async () => {
  const home = await read("index.html");
  const preview = home.match(/<div class="trove-preview"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/);
  assert.ok(/<div class="trove-preview"[^>]*aria-hidden="true"/.test(home), "the mock must be aria-hidden");
  if (preview) {
    assert.ok(!/<(a|button|input|select|textarea)\b/.test(preview[1]),
      "the fake product UI must not contain focusable controls");
  }
});

/* ─── The subscribe form never overstates what happened ─────────────────── */

test("the form collects consent explicitly and links the policy at the point of collection", async () => {
  const home = await read("index.html");
  // React emits attributes in its own order, so test the element, not a sequence.
  const consent = home.match(/<input[^>]*id="subscribe-consent"[^>]*>/)[0];
  assert.match(consent, /type="checkbox"/, "consent must be a checkbox");
  assert.match(consent, /\brequired(=|\s|\/|>)/, "consent must be required, not implied by submitting");
  assert.ok(!/\bchecked\b/.test(consent), "consent must never be pre-ticked");
  const form = home.match(/<form[^>]*data-subscribe-form[\s\S]*?<\/form>/)[0];
  assert.match(form, /href="\/privacy"/, "the privacy policy must be linked inside the form");
});

test("the form carries the address the blocked-bot-check fallback needs", async () => {
  // Regression: if Turnstile is blocked, enhance.js tells the visitor to email us
  // instead. That message needs a real address to offer.
  const home = await read("index.html");
  const form = home.match(/<form[^>]*data-subscribe-form[^>]*>/)[0];
  assert.match(form, /data-contact-email="[^"]+@[^"]+"/, "form must expose a contact address");
});

test("a submit that reaches the network cannot destroy the button label", async () => {
  // Regression: `button.textContent = "Joining…"` replaced the label AND the
  // arrow icon with a text node, and restoring textContent never brought the
  // icon back. replaceChildren keeps the original nodes.
  const enhance = await read("client/enhance.js", src);
  assert.ok(!/button\.textContent\s*=/.test(enhance),
    "assigning button.textContent destroys the icon; use replaceChildren");
  assert.match(enhance, /button\.replaceChildren\(\.\.\.buttonNodes\)/,
    "the original button nodes must be restored verbatim");
});

test("submitting waits for the bot check instead of racing it", async () => {
  // Regression: arm() ran on focusin and the submit handler did not await it, so
  // typing an address and pressing Enter could submit before the widget mounted.
  // The server then rejected it and the visitor was told to complete a check that
  // was not on screen.
  const enhance = await read("client/enhance.js", src);
  assert.match(enhance, /await arm\(\)/, "the submit handler must await arm()");
  assert.match(enhance, /expected\s*&&\s*!\w*\.?ready|turnstile\.expected && !turnstile\.ready/,
    "a bot check that was expected but never mounted must be handled explicitly");
  assert.match(enhance, /sayBlocked/, "there must be an honest blocked-bot-check message");
});

test("the blocked message offers a real route rather than an impossible retry", async () => {
  const enhance = await read("client/enhance.js", src);
  const blocked = enhance.match(/const sayBlocked[\s\S]*?\n  \};/)[0];
  assert.match(blocked, /mailto:/, "the fallback must offer an email route");
  assert.ok(!/innerHTML/.test(blocked), "build the message from nodes, not innerHTML");
});

/* ─── Keyboard and assistive technology ────────────────────────────────── */

test("every page starts with a skip link that points at the main landmark", async () => {
  for (const [route, html] of await pages()) {
    assert.match(html, /class="skip-link"[^>]*href="#main"/, `${route} has no skip link`);
    assert.match(html, /id="main"/, `${route} has no #main target`);
  }
});

test("the menu toggle is a real button wired to the nav it controls", async () => {
  const home = await read("index.html");
  const toggle = home.match(/<button[^>]*data-menu-toggle[^>]*>/)[0];
  assert.match(toggle, /aria-expanded="false"/, "must report its collapsed state");
  assert.match(toggle, /aria-controls="site-nav"/, "must name the nav it controls");
  assert.match(toggle, /aria-label="[^"]+"/, "an icon-only button needs a name");
  assert.match(home, /id="site-nav"/);
});

test("Escape closes the menu and returns focus to the toggle", async () => {
  const enhance = await read("client/enhance.js", src);
  assert.match(enhance, /event\.key === "Escape"/);
  assert.match(enhance, /toggle\.focus\(\)/, "focus must return to the button, not be lost");
});

test("the closed mobile menu is removed from the tab order, not just hidden", async () => {
  // opacity/height tricks leave the links focusable and a keyboard user tabs into
  // an invisible menu. display:none is what actually removes them.
  const css = await read("styles/responsive.css", src);
  assert.match(css, /\.site-nav\s*\{[^}]*display:\s*none/s,
    ".site-nav must be display:none when closed at mobile widths");
  assert.match(css, /\.site-nav\.is-open\s*\{\s*display:\s*flex/);
});

test("icon-only links carry an accessible name and hide the glyph", async () => {
  for (const [route, html] of await pages()) {
    for (const [, attrs, inner] of html.matchAll(/<a([^>]*)>([\s\S]*?)<\/a>/g)) {
      const text = inner.replace(/<[^>]*>/g, "").trim();
      if (text) continue;
      assert.match(attrs, /aria-label="[^"]+"/, `${route} has a link with neither text nor aria-label`);
      assert.match(inner, /aria-hidden="true"/, `${route} has an icon link whose glyph is not hidden`);
    }
  }
});

/* ─── Readability ──────────────────────────────────────────────────────── */

test("no real content is set below 11px", async () => {
  // These selectors all live inside the .trove-preview mock, which is
  // aria-hidden and deliberately reads as a scaled-down app screenshot — no
  // assistive technology reaches them and no information is carried only there.
  // Everything else is real content and must clear the floor.
  const DECORATIVE = new Set([
    ".trove-user", ".trove-nav-item", ".trove-status", ".trove-brand-lockup",
    ".positive", ".muted", ".card-heading", ".chart-labels",
    ".transaction", ".transaction-amount",
    ".avatar", ".mini-action", ".goal-card", ".bars",
  ]);
  const isDecorative = (sel) => {
    if (sel.startsWith(".trove-")) return true;              // any descendant of the mock
    const leaf = sel.split(/\s+/).pop().replace(/::?[a-z-]+$/, "");
    return DECORATIVE.has(leaf) || DECORATIVE.has(sel.split(/\s+/)[0]);
  };
  for (const file of ["base.css", "layout.css", "hero.css", "sections.css", "products.css", "evidence.css", "responsive.css"]) {
    const css = await read(`styles/${file}`, src);
    for (const [, selector, size] of css.matchAll(/([^{};\n]+)\{[^}]*font-size:\s*(\d+(?:\.\d+)?)px/g)) {
      const sel = selector.trim().split(",")[0].trim().replace(/^[\s>+~]+/, "");
      if (Number(size) >= 11) continue;
      assert.ok(isDecorative(sel),
        `${file}: "${sel}" sets ${size}px on non-decorative content`);
    }
  }
});

/* ─── Colour contrast, computed rather than asserted by eye ────────────── */

function relLuminance(hexColour) {
  const h = hexColour.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const f = (v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function contrast(a, b) {
  const [l1, l2] = [relLuminance(a), relLuminance(b)];
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

test("brand tokens still hold the values the contrast maths assumes", async () => {
  const tokens = await read("styles/tokens.css", src);
  const value = (name) => tokens.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`))[1].toLowerCase();
  assert.equal(value("ink"), "#081b4a");
  assert.equal(value("coral"), "#ff674f");
  assert.equal(value("white"), "#fffdf9");
});

test("the coral calls to action meet WCAG AA for their text size", async () => {
  // Regression: both coral CTAs used --white, which is 2.83:1 on coral and fails
  // the 4.5:1 that 13px text needs. --ink is 5.77:1 and keeps the brand colour.
  const base = await read("styles/base.css", src);
  const layout = await read("styles/layout.css", src);

  assert.match(base, /\.button-coral\s*\{[^}]*color:\s*var\(--ink\)/s,
    ".button-coral must use --ink on coral");
  assert.match(layout, /\.nav-cta\s*\{[^}]*color:\s*var\(--ink\)/s,
    ".nav-cta must use --ink on coral");

  assert.ok(contrast("#081b4a", "#ff674f") >= 4.5, "ink on coral must clear 4.5:1");
  assert.ok(contrast("#081b4a", "#f2543b") >= 4.5, "ink on the coral hover shade must clear 4.5:1");
  assert.ok(contrast("#fffdf9", "#ff674f") < 4.5, "sanity: white on coral is the failing pairing");
});

test("the focus ring stays visible on every brand surface", async () => {
  // Coral alone is 1.70:1 on sky and 2.66:1 on paper, under the 3:1 WCAG 1.4.11
  // asks of a focus indicator. The ink halo carries the contrast on light
  // surfaces; the coral ring carries it on ink.
  const base = await read("styles/base.css", src);
  const rule = base.match(/:focus-visible\s*\{[^}]*\}/s)[0];
  assert.match(rule, /outline:\s*3px solid var\(--coral\)/);
  assert.match(rule, /box-shadow:[^;]*var\(--ink\)/, "the ink halo is what makes it visible on light surfaces");

  for (const surface of ["#f7f6f2", "#fffdf9", "#a9cbed", "#d4e779"]) {
    assert.ok(contrast("#081b4a", surface) >= 3,
      `the ink halo must clear 3:1 on ${surface}`);
  }
  assert.ok(contrast("#ff674f", "#081b4a") >= 3, "the coral ring must clear 3:1 on ink surfaces");
});

test("the consent checkbox is a large enough target", async () => {
  const css = await read("styles/sections.css", src);
  const rule = css.match(/\.consent input\[type="checkbox"\]\s*\{[^}]*\}/s)[0];
  const w = Number(rule.match(/width:\s*(\d+)px/)[1]);
  const h = Number(rule.match(/height:\s*(\d+)px/)[1]);
  assert.ok(w >= 24 && h >= 24, `consent checkbox is ${w}x${h}, WCAG 2.5.8 wants 24x24`);
});

/* ─── Assets the page depends on ───────────────────────────────────────── */

test("the favicon is referenced and actually present", async () => {
  const home = await read("index.html");
  const href = home.match(/<link rel="icon"[^>]*href="([^"]+)"/)[1];
  await access(new URL(href.replace(/^\//, ""), distClient));
});

test("the touch icon is referenced, 180x180 and opaque", async () => {
  // Without it Safari's Favourites show a letter tile instead of the logo.
  const home = await read("index.html");
  const href = home.match(/<link rel="apple-touch-icon"[^>]*href="([^"]+)"/)?.[1];
  assert.ok(href, "no apple-touch-icon link in <head>");
  const png = await readFile(new URL(href.replace(/^\//, ""), distClient));
  // IHDR: width and height are big-endian at bytes 16 and 20, colour type at 25.
  assert.equal(png.toString("ascii", 1, 4), "PNG");
  assert.equal(png.readUInt32BE(16), 180);
  assert.equal(png.readUInt32BE(20), 180);
  // Colour type 2 is RGB with no alpha. iOS paints transparent pixels black.
  assert.equal(png[25], 2, "the touch icon must have no alpha channel");
});

test("every local asset referenced by a page exists in the build", async () => {
  const missing = [];
  for (const [route, html] of await pages()) {
    const refs = new Set();
    for (const [, url] of html.matchAll(/(?:href|src)="(\/[^"#?]+\.[a-z0-9]+)"/g)) refs.add(url);
    for (const [, list] of html.matchAll(/srcset="([^"]+)"/g)) {
      for (const part of list.split(",")) {
        const u = part.trim().split(/\s+/)[0];
        if (u.startsWith("/")) refs.add(u);
      }
    }
    for (const ref of refs) {
      try {
        await access(new URL(ref.replace(/^\//, ""), distClient));
      } catch {
        missing.push(`${route} -> ${ref}`);
      }
    }
  }
  assert.deepEqual(missing, [], `referenced files are absent from the build:\n${missing.join("\n")}`);
});

test("the 404 page is a real page that keeps itself out of the index", async () => {
  const html = await read("404.html");
  assert.match(html, /<meta name="robots" content="noindex/);
  assert.match(html, /<h1[^>]*>/);
  assert.match(html, /href="\/"/, "a 404 must offer a way back");
});
