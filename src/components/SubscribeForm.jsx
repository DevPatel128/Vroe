import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { EARLY_ACCESS } from "../content/copy.js";
import { SITE } from "../content/site.js";

/**
 * Early-access signup.
 *
 * Genuinely stores the address (worker/index.js -> SUBSCRIBERS KV). Because it
 * really collects data, three things are non-negotiable and must not be
 * "simplified" away:
 *
 *   1. The consent checkbox is `required`. Consent has to be an affirmative act,
 *      not a pre-ticked box or an implication of pressing submit.
 *   2. The privacy notice is linked at the point of collection, next to the
 *      field, not buried in the footer.
 *   3. The honeypot below is invisible to people but present in the DOM. It is
 *      positioned off-screen rather than display:none, because some bots skip
 *      hidden inputs. `tabIndex={-1}` and `autoComplete="off"` keep it away
 *      from keyboard users and password managers.
 *
 * No JS is required for the markup to be correct; enhance.js takes over submit
 * and only then loads Turnstile. If Turnstile cannot load at all, enhance.js
 * says so and points at `data-contact-email` rather than asking the visitor to
 * complete a check that is not on screen. See docs/04-security.md.
 */
export function SubscribeForm() {
  return (
    <form
      className="access-form"
      data-subscribe-form
      /* enhance.js falls back to this address when the bot check cannot load. */
      data-contact-email={SITE.email}
      noValidate
    >
      <div className="field-row">
        <label className="sr-only" htmlFor="subscribe-email">
          Email address
        </label>
        <input
          id="subscribe-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="Email address"
          maxLength={254}
          required
          aria-describedby="subscribe-smallprint"
        />
        <button className="button button-coral" type="submit">
          Join the list <ArrowRight aria-hidden="true" />
        </button>
      </div>

      {/* Honeypot. Never remove — see the note above. */}
      <div className="hp-field" aria-hidden="true">
        <label htmlFor="subscribe-company">Company (leave this empty)</label>
        <input id="subscribe-company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="consent">
        <input id="subscribe-consent" name="consent" type="checkbox" value="yes" required />
        <label htmlFor="subscribe-consent">{EARLY_ACCESS.consent}</label>
      </div>

      {/* Turnstile mounts here on first interaction, not on page load. */}
      <div id="turnstile-widget" />

      <p className="smallprint" id="subscribe-smallprint">
        {EARLY_ACCESS.privacyNote} <a href="/privacy">privacy policy</a>. {EARLY_ACCESS.smallprint}
      </p>

      {/* Announced to screen readers when enhance.js writes into it. */}
      <p className="form-status" data-form-status role="status" aria-live="polite" hidden />
    </form>
  );
}
