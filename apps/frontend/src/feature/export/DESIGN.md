# PDF Export — Design Reference

Keep the PDF document visually consistent with the web UI. react-pdf uses its own
layout engine (not CSS), so this file translates the design tokens from
`src/styles/global.css` and `src/components/ui/` into values you can use directly
in `StyleSheet.create()`.

---

## Shared stylesheet

All shared styles live in `pdfStyles.ts` and are exported as a single `pdf` object.
Import from there before adding local styles — do not re-declare `page`, `sectionHeader`,
`card`, or the typography variants in individual components.

```ts
import { pdf } from './pdfStyles';
```

---

## Colours

| Role | Hex | Source token |
|---|---|---|
| Foreground (body text) | `#191919` | `--neutral-850` |
| Muted text | `#5f6061` | `--neutral-550` |
| Border | `#757575` | `--neutral-450` |
| Subtle background / section fill | `#f4f4f4` | `--neutral-150` |
| Divider / rule | `#e5e5e5` | `--neutral-200` |
| Page background | `#ffffff` | `--white` |
| Primary / accent | `#e30613` | `--regensburg-red` |
| Primary dark | `#8b2412` | `--regensburg-red-dark` |

### Energy efficiency class colours

| Class | Hex |
|---|---|
| A+ | `#1B9E3E` |
| A | `#4CAF50` |
| B | `#6CB432` |
| C | `#B3CC2A` |
| D | `#ECDB23` |
| E | `#E8A824` |
| F | `#E67322` |
| G | `#D9381E` |
| H | `#A11A1A` |

---

## Typography

Open Sans is registered via `registerPdfFonts.ts` using the **math** font files from
`@fontsource/open-sans`. The math variant is required to render special characters
such as ² and ₂ correctly in plain `<Text>` nodes without switching font family.

A second family `Open Sans Symbols` is registered for use via `<PdfSymbol>` when
a symbol falls outside the math subset.

| Variant | Key in `pdf` | Size | Weight |
|---|---|---|---|
| Document title | `pdf.h1` | 34 | 700 |
| Page title | `pdf.h2` | 24 | 700 |
| Section header | `pdf.sectionHeader` | 16 | 700 |
| Body | (page default) | 12 | 400 |
| Muted | `pdf.muted` | 10 | 400 |

Muted text always uses `#5f6061` — never a lighter grey invented for the PDF.

---

## Shape

The Regensburg web theme uses sharp corners for surfaces while keeping floating
controls rounded. The PDF follows the **sharp-corner** surface policy; do not
add `borderRadius` to boxes, cards, or badges in the PDF.

---

## Spacing

Page padding is **48 pt**. Internal section gaps follow `gap-4` (16 pt) and
`gap-3` (12 pt). These are already set on `pdf.page` and `pdf.card`.

---

## Cards

Web `Paper` maps to `pdf.card`: white background, `#e5e5e5` border (1 pt), `padding: 16`.
Do not replicate box-shadow — borders read better in print.

---

## Page breaks

Use `wrap={false}` on any `<View>` that should never be split across pages.
Apply it to logical units: a set of stat cards, a chart, an individual renovation item.
Do not wrap entire sections — only the smallest block that must stay together.

---

## Icons and symbols

- **Arrows and directional icons**: use `<PdfIcon>` (SVG-based, no font dependency).
- **Special characters** that fall outside the math font subset: use `<PdfSymbol>` to
  switch to `Open Sans Symbols` for that text node.
- Characters covered by the math font (², ₂, €, –) render correctly in plain `<Text>`
  without any wrapper.

---

## What to avoid

- Do not invent colours not present in the token table above.
- Do not add rounded corners (`borderRadius`).
- Do not use font sizes outside the type scale.
- Do not add drop shadows (use borders instead).
- Do not use `Helvetica` — Open Sans is registered and must be used.
- Do not redeclare styles that already exist in `pdfStyles.ts`.
