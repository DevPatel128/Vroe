# ADR-005 — Render OG card text as vector outlines

**Status:** Approved · **Last updated:** 2026-09-01 · **Owner:** Vroe Labs · **Version:** 1.0

**Category:** Design · **Recorded:** 2026-09-01

**Context.** The three 1200×630 social cards need Instrument Serif. sharp renders
SVG through librsvg, which resolves `font-family` via fontconfig — and Instrument
Serif is not a system font. It silently fell back to a sans-serif locally and
would fall back to something different again on a CI runner.

**Decision.** Parse the woff with opentype.js and convert text to SVG paths,
positioning glyphs individually with kerning.

**Consequences.** Byte-stable output on any machine, no system font dependency.
Two wrinkles worth knowing: opentype.js's own `getPath()` throws on this font
(an unsupported ccmp GSUB lookup), hence the manual per-glyph layout; and each
glyph is emitted as its own `<path>` because **librsvg silently truncates a very
long `d` attribute** — one 6 KB path lost the tail of every line of text.

`npm run build:og` is not part of `npm run build`; the cards are committed.

---

*Recorded before the decision template in [DECISIONS.md](../DECISIONS.md). Evidence, cost and approver were not captured at the time and are not back-filled here.*
