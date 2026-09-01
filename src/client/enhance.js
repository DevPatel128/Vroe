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

  const say = (message, tone) => {
    if (!status) return;
    status.textContent = message;
    status.dataset.tone = tone;
    status.hidden = false;
  };

  // Fetch the site key and mount the widget the first time someone engages.
  let armed = false;
  const arm = () => {
    if (armed) return;
    armed = true;
    fetch("/api/config", { headers: { Accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : null))
      .then((config) => {
        if (config && config.turnstile_site_key && mount) {
          loadTurnstile(config.turnstile_site_key, mount);
        }
      })
      .catch(() => {
        /* Not fatal — the server still enforces its own checks. */
      });
  };
  form.addEventListener("focusin", arm, { once: true });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

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

    const payload = {
      email: email.value.trim(),
      consent: true,
      company: form.querySelector('input[name="company"]')?.value ?? "",
    };

    if (turnstileWidgetId !== null && window.turnstile) {
      const token = window.turnstile.getResponse(turnstileWidgetId);
      if (!token) {
        return say("Please complete the verification check, then try again.", "error");
      }
      payload.cf_turnstile_response = token;
    }

    const original = button.textContent;
    button.disabled = true;
    button.textContent = "Joining…";
    say("Sending…", "pending");

    try {
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

      say(body.error || "Something went wrong. Please try again shortly.", "error");
    } catch {
      say("We could not reach the server. Please try again, or email us directly.", "error");
    } finally {
      button.disabled = false;
      button.textContent = original;
      if (turnstileWidgetId !== null && window.turnstile) {
        window.turnstile.reset(turnstileWidgetId);
      }
    }
  });
}

initMenu();
initSubscribe();
