# ADR-024 — Accessible colours and heading order

**Status:** Approved · **Last updated:** 2026-09-20 · **Owner:** Vroe Labs · **Version:** 1.0

**Category:** Design · **Recorded:** 2026-09-20

**Decision.**

1. The product illustrations' text colours become one green, `#4e6e3f`, and one grey,
   `#6a7381`, defined once as `--preview-green` and `--preview-muted` on
   `.trove-preview, .vero-preview`.
2. **Coral is never a text colour.** The "waiting for product data" label on `/trove`
   and the pinned-country note in the ranking are Ink Soft, and carry a small coral
   dot in front of them. The brand accent stays; nothing asks coral to be read.
3. A product card's title level is chosen by the page: `TroveCard` and `VeroCard`
   take a `headingLevel` (default 3). `/products`, where the cards sit directly under
   the page's `h1`, passes 2.
4. The Lighthouse audit covers all ten indexable routes, and `KNOWN_ISSUES` is empty.
5. `tests/accessibility.test.mjs` keeps all of this true without a browser: no page
   skips a heading level, the illustration palette meets 4.5:1 on every surface it is
   drawn on, the brand text tokens meet AA, and coral is not used as a text colour.

**Context.** The Lighthouse budget added by [ADR-021](../ENGINEERING/ADR-021-performance-and-accessibility-budgets-bytes-in-the-tests.md)
found two accessibility failures and recorded them as known issues. Investigating them
showed the problem was larger than recorded: 8 distinct failing colour pairs across 35
nodes on four pages, not 4; and one was in *visible* content, not only the decorative
illustration. Coral `#ff674f` on Paper is 2.66:1, and the pending-stage label on
`/trove` set 11px bold text in it.

**Reason.** WCAG AA asks 4.5:1 for text this size. The illustration is `aria-hidden`
and so arguably exempt, but an automated audit still flags it, low-vision visitors see
it, and an exemption that needs explaining is worse than a colour that passes. The
brand guide is the client's read-only document, so the fix stays inside existing tokens
where it can: Ink Soft, an existing token, is 9.5:1 on Paper.

**Evidence.** Contrast was computed with the WCAG formula, hue and saturation
preserved, darkening only as far as needed and a little beyond:

| Element | Before | After | On |
| --- | --- | --- | --- |
| Green text | `#5c824a` 3.60 to 4.35, `#617c4c` 4.10 | `#4e6e3f` | 4.72 on `#eae8e1`, 5.09 on `#f2f0eb`, 5.70 on `#fffdf9` |
| Grey text | `#7e8795` 3.57, `#8c929e` 3.07, `#88909c` 3.17 | `#6a7381` | 4.72 on `#fffdf9` |
| Pending-stage label | coral 2.65 | Ink Soft | 9.50 on Paper |

**Cost.** Nothing recurring. About a minute and a half more CI time for the four extra
audit runs. The visible change is that the illustration's greens and greys are slightly
darker.

**Alternatives.**

- *Keep the `aria-hidden` exemption and teach the audit about it.* Rejected: it leaves
  low-contrast text on screen and adds a special case to maintain.
- *Recolour the illustration entirely in brand tokens.* A bigger change to a design
  that was approved; the hue-preserving fix reaches AA with almost no visible change.
- *A darker coral text token.* It would be a new brand colour, and the brand guide is
  read-only.
- *A visually hidden `h2` above the cards on `/products`.* It repairs the outline by
  adding content nobody sees; making the card titles the `h2` is cleaner.

**Consequences.** The coral full stop after each display headline is unchanged. It is
decorative punctuation that carries no information, following a high-contrast heading,
and is the one accepted deviation ([ACCESSIBILITY.md](../../04_DESIGN/ACCESSIBILITY.md)).
The illustration's colours are now variables, so retuning them is a one-line change the
test will check. Any future coral text fails `npm test` with an instruction to use Ink
Soft and a dot.

**Revisit condition.** The brand guide gains a text-safe coral, or the illustration is
redesigned.

**Approved by.** Dev delegated the call ("it's your call") — **Date.** 2026-09-20.
