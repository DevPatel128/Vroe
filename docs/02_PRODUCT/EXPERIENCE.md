# Experience

**Status:** Approved · **Last updated:** 2026-09-20 · **Owner:** Vroe Labs · **Version:** 1.0

How the site should feel and behave for a visitor. This is the canonical
description of the *experience*. The visual rules that realise it are in
[04_DESIGN](../04_DESIGN/README.md), which points back here rather than repeating
it. Written from the brand guide, the design system and the content rules; approved
by Dev on 2026-09-20.

## Experience promise

Warm, editorial, useful and quietly optimistic: a small studio with strong taste,
thoughtful products, clear language and visual confidence without unnecessary
polish ([BRAND-GUIDE.md](../04_DESIGN/BRAND-GUIDE.md)). It never implies a product
is live when it is not.

## Mental model

A studio's notebook. The home page says who is behind it. Each product has a page
that says what is being made and, first of all, where it stands. Two notes explain
the thinking. One form lets you hear when there is news. That is the whole site.

## Experience hierarchy

On every page, in this order:

1. **What do I need to know?** On a product page, that it is not available yet. The
   "Where this stands" callout sits directly under the hero, before anything else.
2. **What should I do?** Read on, or join the list. One clear primary action.
3. **Why does it matter?** The problem the product addresses, with its evidence.
4. **Details.** Capabilities, principles, notes.
5. **Advanced controls.** None exist.

## Core journey

Discovery (a search result or a social card) → first value (in seconds, a visitor
knows what Vroe Labs is and what stage each product is at) → deeper value (the
evidence and the notes) → long-term outcome (email updates when there is news).
There is no habit loop, by design: nothing on this site is meant to be returned to
daily.

## Information architecture

`code/src/content/routes.js` is the source of truth for every page:

| Route | Purpose |
| --- | --- |
| `/` | Who Vroe Labs is; the two products; the early-access form |
| `/products` | The index of what is being made: the page title, then a card for each product (`h1`, then `h2`, `h2`) |
| `/trove`, `/vero` | One page per product, status first |
| `/notes/trove`, `/notes/vero` | The thinking behind each product |
| `/about`, `/contact` | The studio, and how to reach it |
| `/privacy`, `/terms` | What is stored and the terms of use |
| `/404` | The not-found page, served with a real 404 status |

## Progressive disclosure

Everything is in the HTML, so the site reads fully without JavaScript. The one
place detail is revealed on demand is the evidence layer on `/trove`: India is
shown first, and a country switch lets a reader look at other countries' national
figures. Every country's panel is already in the page.

## Interaction principles

- One clear primary action per page.
- Minimal competing actions: no pop-ups, banners or interstitials.
- Preserve context: the menu returns focus to its button when it closes.
- Make important state visible: product status, form errors, success only after
  the record is actually stored.
- Keep recovery easy: if the bot check cannot load, the form says so and offers a
  real email route.

## AI experience

There is none. No feature on the site uses AI, so there is nothing to disclose,
correct or ground.

## Notifications

None. The only messages a person receives are email updates they asked for, with
consent given explicitly.

## Accessibility

Keyboard, screen-reader, contrast, motion, touch and language requirements are in
[ACCESSIBILITY.md](../04_DESIGN/ACCESSIBILITY.md). The state today: Lighthouse
reports no failing accessibility audit on any of the ten routes, headings never skip
a level on any page, and text colours in the product illustrations meet WCAG AA
(2026-09-20, [ADR-024](../08_DECISIONS/DESIGN/ADR-024-accessible-colours-and-heading-order.md)).
Tests keep it that way.

## Trust

- **Status is stated in plain words**, first, on every product page.
- **Consent is explicit.** The checkbox must be ticked; it is never inferred from
  pressing submit. The privacy notice is at the point of collection.
- **Data use is stated exactly.** The policy lists the four fields stored, the
  retention period and the 30-day backup, and is written against what the
  worker does ([DATA.md](../05_ENGINEERING/DATA/DATA.md)).
- **Uncertainty is shown.** Figures the site cannot stand behind are not shown; the
  India time figure is labelled a floor, not the whole.
- **Nothing irreversible happens without notice.** A signup can be removed on
  request ([RUNBOOKS](../06_OPERATIONS/RUNBOOKS/README.md)); it leaves the live list
  at once and the backups within 30 days, and the policy says so.

## Change decision

For meaningful experience changes, answer the checklist in
[AI-WORKFLOW.md](../05_ENGINEERING/AI/AI-WORKFLOW.md). Prefer the simplest
experience and lowest-cost implementation that delivers the outcome.

## Quality gate

A page is not experience-complete until it is understandable without
documentation.
