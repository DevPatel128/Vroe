## What changed and why

<!-- One or two sentences. The why matters more than the what. -->

## Documentation

Documentation is part of the change, not a follow-up. The `docs-impact` check fails
this pull request if it changes something the docs describe and no canonical
document changed with it.

- [ ] I updated the canonical root document for what I changed (`PRODUCT.md`,
      `SYSTEM.md`, `RUNBOOK.md`, `GROWTH.md`, or `docs/03_RESEARCH/` for evidence).
- [ ] A new non-obvious decision has a new row in `DECISIONS.md`, and a mistake
      has a row in `MISTAKES.md` with its enforcing check.
- [ ] If I changed what the subscribe endpoint stores or keeps, I updated
      `code/src/content/legal.js` (the privacy policy) in this same change.

If this really needs no documentation, say so on a line of its own, with the reason,
and delete the boxes above:

```
Docs: none, <why nothing the documentation describes has changed>
```

## Checks

- [ ] `npm run build && npm test && npm audit --audit-level=high` pass in `code/`
- [ ] I looked at the change in a browser (if it touches what a visitor sees)
- [ ] Nothing claims a product is available, and no inline `style` attribute was added
