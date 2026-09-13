/**
 * The only JavaScript this site ships.
 *
 * The pages are prerendered and fully readable without it: this file adds the
 * mobile menu toggle and turns the subscribe form into a fetch instead of a
 * navigation. If it fails to load, the content is still there and the form
 * still posts normally.
 *
 * Deliberately dependency-free and written as plain DOM code — pulling in a
 * framework to toggle one class would undo the entire point of prerendering.
 */

/* ─── Mobile menu ─────────────────────────────────────────────────────── */

function initMenu() {
  const toggle = document.querySelector("[data-menu-toggle]");
  const nav = document.getElementById("site-nav");
  if (!toggle || !nav) return;

  const closedIcon = toggle.querySelector('[data-menu-icon="closed"]');
  const openIcon = toggle.querySelector('[data-menu-icon="open"]');

  const setOpen = (open) => {
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    if (closedIcon) closedIcon.hidden = open;
    if (openIcon) openIcon.hidden = !open;
  };

  toggle.addEventListener("click", () => {
    setOpen(toggle.getAttribute("aria-expanded") !== "true");
  });

  // Following a link should close the menu behind you.
  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) setOpen(false);
  });

  // Escape closes it and returns focus to the button, so keyboard users are
  // never left inside a menu they cannot dismiss.
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
      setOpen(false);
      toggle.focus();
    }
  });
}

/* ─── Subscribe form ──────────────────────────────────────────────────── */

const TURNSTILE_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

let turnstileWidgetId = null;
let turnstileLoading = null;

/**
 * Load Turnstile lazily, on first interaction with the form rather than on page
 * load. A visitor who never touches the form never pays for the script, which
 * keeps it off the critical path entirely.
 */
function loadTurnstile(siteKey, mount) {
  if (turnstileLoading) return turnstileLoading;

  turnstileLoading = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = TURNSTILE_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (typeof window.turnstile === "undefined") return resolve(false);
      turnstileWidgetId = window.turnstile.render(mount, {
        sitekey: siteKey,
        theme: "light",
        action: "subscribe",
      });
      resolve(true);
    };
    // A blocked or failed script must not break the form. The honeypot and the
    // server-side rate limit still apply.
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });

  return turnstileLoading;
}

function initSubscribe() {
  const form = document.querySelector("[data-subscribe-form]");
  if (!form) return;

  const status = form.querySelector("[data-form-status]");
  const button = form.querySelector('button[type="submit"]');
  const email = form.querySelector('input[name="email"]');
  const consent = form.querySelector('input[name="consent"]');
  const mount = form.querySelector("#turnstile-widget");
  const contactEmail = form.dataset.contactEmail ?? "";

  // The label is "Join the list" plus an arrow SVG. Assigning button.textContent
  // would replace both with a bare text node and the arrow would never come back,
  // so the original nodes are kept and restored verbatim.
  const buttonNodes = [...button.childNodes];

  const say = (message, tone) => {
    if (!status) return;
    status.textContent = message;
    status.dataset.tone = tone;
    status.hidden = false;
  };

  /**
   * The bot check could not load, so there is nothing on screen to complete.
   * Saying "retry the verification" here would ask for something impossible —
   * offer the human route instead. Built with DOM nodes rather than innerHTML.
   */
  const sayBlocked = () => {
    if (!status) return;
    status.textContent =
      "We could not load the bot check — a browser extension or network filter may be blocking it. ";
    if (contactEmail) {
      status.append("Email ");
      const link = document.createElement("a");
      link.href = `mailto:${contactEmail}`;
      link.textContent = contactEmail;
      status.append(link, " and we will add you to the list by hand.");
    } else {
      status.append("Please contact us and we will add you to the list by hand.");
    }
    status.dataset.tone = "error";
    status.hidden = false;
  };

  /**
   * Fetch the site key and mount the widget. Idempotent, and returns a promise
   * so the submit handler can await it rather than race it.
   *
   * Resolves { expected, ready }:
   *   expected — the server advertised a site key, so it will demand a token
   *   ready    — the widget mounted and can actually produce one
   */
  let armPromise = null;
  const arm = () => {
    if (armPromise) return armPromise;
    armPromise = fetch("/api/config", { headers: { Accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : null))
      .then(async (config) => {
        const siteKey = config?.turnstile_site_key;
        if (!siteKey) return { expected: false, ready: false };
        if (!mount) return { expected: true, ready: false };
        return { expected: true, ready: await loadTurnstile(siteKey, mount) };
      })
      .catch(() => ({ expected: false, ready: false }));
    return armPromise;
  };
  form.addEventListener("focusin", arm, { once: true });

  let submitting = false;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (submitting) return;

    // Mirror the server's validation so the common mistakes are caught without
    // a round trip. The server re-checks everything regardless.
    if (!email.value.trim() || !email.checkValidity()) {
      email.setAttribute("aria-invalid", "true");
      email.focus();
      return say("Please enter a valid email address.", "error");
    }
    email.removeAttribute("aria-invalid");

    if (consent && !consent.checked) {
      consent.focus();
      return say("Please tick the box to confirm you are happy for us to store your address.", "error");
    }

    submitting = true;
    button.disabled = true;
    button.replaceChildren("Joining…");
    say("Sending…", "pending");

    try {
      // Wait for the bot check instead of racing it. focusin starts the load, but
      // someone who types an address and presses Enter can submit before the
      // widget has mounted — without this await they would be sent tokenless and
      // told to retry a check that had not appeared yet.
      const turnstile = await arm();

      if (turnstile.expected && !turnstile.ready) return sayBlocked();

      const payload = {
        email: email.value.trim(),
        consent: true,
        company: form.querySelector('input[name="company"]')?.value ?? "",
      };

      if (turnstile.ready && turnstileWidgetId !== null && window.turnstile) {
        const token = window.turnstile.getResponse(turnstileWidgetId);
        if (!token) {
          return say("Please complete the verification check, then try again.", "error");
        }
        payload.cf_turnstile_response = token;
      }

      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => ({}));

      if (response.ok) {
        form.querySelector(".field-row")?.setAttribute("hidden", "");
        form.querySelector(".consent")?.setAttribute("hidden", "");
        form.querySelector(".smallprint")?.setAttribute("hidden", "");
        if (mount) mount.hidden = true;
        return say(body.message || "You're on the list. We'll be in touch.", "success");
      }

      // The server demanded a token we were never able to produce — reachable
      // when /api/config itself failed, so `expected` was never learned.
      if (response.status === 403 && !turnstile.ready) return sayBlocked();

      say(body.error || "Something went wrong. Please try again shortly.", "error");
    } catch {
      say("We could not reach the server. Please try again, or email us directly.", "error");
    } finally {
      submitting = false;
      button.disabled = false;
      button.replaceChildren(...buttonNodes);
      if (turnstileWidgetId !== null && window.turnstile) {
        window.turnstile.reset(turnstileWidgetId);
      }
    }
  });
}

/* ─── Evidence: country panels and ranking switch (/trove) ─────────────── */

/**
 * The prerendered page already shows every country panel stacked and the
 * default ranking, so it reads fine without this. Enhanced, it shows one panel at
 * a time (the primary country by default, or the one named in the URL hash),
 * and lets the visitor re-rank by any comparable measure.
 */
function initEvidence() {
  const list = document.querySelector("[data-ranking-list]");
  const panels = [...document.querySelectorAll("[data-country-panel]")];
  if (!list || panels.length === 0) return;

  const links = [...list.querySelectorAll("[data-country-link]")];
  const primary = list.querySelector("[data-pinned]")?.dataset.iso ?? panels[0].dataset.countryPanel;

  const showCountry = (iso) => {
    const target = panels.find((p) => p.dataset.countryPanel === iso)
      ?? panels.find((p) => p.dataset.countryPanel === primary);
    for (const panel of panels) panel.hidden = panel !== target;
    for (const link of links) {
      if (link.dataset.countryLink === target.dataset.countryPanel) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    }
    return target;
  };

  for (const link of links) {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const panel = showCountry(link.dataset.countryLink);
      history.replaceState(null, "", `#${panel.id}`);
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      panel.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      panel.focus({ preventScroll: true });
    });
  }

  const fromHash = panels.find((p) => `#${p.id}` === window.location.hash);
  showCountry(fromHash ? fromHash.dataset.countryPanel : primary);

  const controls = document.querySelector("[data-rank-controls]");
  const buttons = controls ? [...controls.querySelectorAll("button[data-rank-by]")] : [];
  if (buttons.length < 2) return;

  const rankedBy = document.querySelector("[data-ranked-by]");
  const section = list.closest("section");
  const rows = [...list.children];
  const rankIn = (row, metric) => Number(row.getAttribute(`data-rank-${metric}`)) || Infinity;

  const rankBy = (button) => {
    const metric = button.dataset.rankBy;
    const pinned = rows.filter((row) => row.hasAttribute("data-pinned"));
    const others = rows.filter((row) => !row.hasAttribute("data-pinned"))
      .sort((a, b) => rankIn(a, metric) - rankIn(b, metric));
    list.append(...pinned, ...others);
    for (const b of buttons) b.setAttribute("aria-pressed", String(b === button));
    for (const el of section.querySelectorAll("[data-show-for]")) el.hidden = el.dataset.showFor !== metric;
    if (rankedBy) rankedBy.textContent = button.dataset.rankLabel;
  };

  for (const button of buttons) button.addEventListener("click", () => rankBy(button));
  controls.hidden = false;
}

initMenu();
initSubscribe();
initEvidence();
