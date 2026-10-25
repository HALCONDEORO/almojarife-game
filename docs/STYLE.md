# Window and interface style manual

One visual language for the whole game: a merchant's ledger on parchment,
walnut, brass and harbour green. Desktop only, keyboard and mouse,
1280x720 and up. When a window and this manual disagree, the manual wins;
change the manual in its own PR.

Each rule below gives the concrete value and points to a figure. Figures:

- **Sheet**: `docs/style/components.png` (regenerate from
  `docs/style/components.html`, screenshot at 1120 px wide).
- **Real windows**: `docs/style/window-market.png` and
  `docs/style/window-hall.png`, captured in ES from the current build.

Status tags: **[applied]** ships today, **[target]** the window PRs migrate to it.

## Contents

1. Principles
2. Colour
3. Type
4. Spacing and sizing
5. Window chrome
6. Components
7. Content rules
8. Status by window
9. Per-window PR checklist

## 1. Principles

- **Ledger first.** Serif type, parchment body, wood-and-brass frame. No flat modern panels.
- **One chrome.** Every floating window uses the same frame, header and close button.
- **Density with air.** Dense tables on a clear grid: one spacing scale, aligned numbers, visible headings.
- **Colour marks state, never style.** One accent (harbour green), one buy, one sell, one danger.
- **Spanish and English ship together.** Check both for overflow and tildes.

## 2. Colour

Use these as CSS custom properties on `:root`; never raw hex in new or
migrated CSS. Sheet: top panel.

| Token | Value | Use |
|---|---|---|
| `--paper` | `#f4ead0` | window body |
| `--paper-raised` | `#fff6e0` | cards, table rows, inputs |
| `--paper-sunken` | `#e5d7b7` | intro strips, subdued panels |
| `--paper-alt` | `#eee2c4` | zebra rows |
| `--ink` | `#302719` | body text |
| `--ink-soft` | `#5a4a32` | secondary text |
| `--ink-faint` | `#7a6845` | captions, empty states |
| `--line` | `#c5ae80` | hairlines, card borders |
| `--line-strong` | `#bba373` | section rules |
| `--wood` | `#6b4f2a` | window frame border |
| `--wood-hi` / `--wood-lo` | `#6d543a` / `#3d2d1b` | header gradient ends |
| `--brass` | `#c9a35f` | frame outline, header rule |
| `--brass-bright` | `#ffd876` | focus outline on dark |
| `--green` | `#405e4a` | the accent: headings, table headers, active |
| `--green-deep` | `#243b34` | header gradient end (with `#3d5246`) |
| `--gold-cream` | `#fff0cd` | text on the dark header |
| `--buy` | `#2e6b34` | buy side, gains |
| `--sell` | `#8a5a17` | sell side |
| `--danger` | `#a11` | destructive, bad state |

**[target]** Today's CSS carries a dozen one-off browns and greens;
migration collapses them onto this scale. No near-duplicates.

## 3. Type

Georgia, "Times New Roman", serif everywhere in game UI. Sheet: left panel.

| Role | Value |
|---|---|
| Window title | 22 px regular, letter-spacing .5 px |
| Section heading | 21 px regular, usually `--green` |
| Sub-heading | 13 px small-caps, `--ink-faint` |
| Body | 15 px / 1.5 |
| Table body | 13-14 px |
| Table header | 11-12 px bold, `--green` |
| Meta, caption | 12-13 px `--ink-faint` |
| Empty state | 15 px `--ink-faint`, centered |

Numbers in tables: right-aligned, tabular rhythm, never centered.

## 4. Spacing and sizing

- Spacing scale: **4, 6, 8, 12, 16, 20, 28 px**. No other steps.
- Window body padding: 12-16 px.
- Controls: min-height 30 px (32 px in window chrome), padding 4-10 px.
- Radius: 2-4 px windows and cards, 3 px buttons, pill (11-20 px) only
  for chips and quantity pills.

## 5. Window chrome

One component (`.pwin`) for every floating window. Sheet: bottom right;
real frame: `window-hall.png`.

- Frame: `--paper`, 3 px `--wood` border, 1 px `--brass` outline at -5 px,
  drop shadow.
- Header: gradient `--wood-hi` to `--wood-lo`, title 22 px `--gold-cream`,
  2 px `--brass` bottom rule, sticky, draggable (pointer and arrow keys).
- Close: top right, labelled `Cerrar (Esc)` / `Close (Esc)`, min-height 32 px.
- Per-window CSS only sizes and lays out (via `data-city-panel`); it never
  restyles the chrome.

**[applied]** The frame, header, close button and drag. **[target]** the
green-gradient heading variant (`.ui2d-heading`) folds into the single wood
header, and every window clears the right rail: today only the market
window sets `right: 238px`, so the rest open under the rail (P0).

## 6. Components

Sheet panels named in brackets.

- **Intro strip**: at most one per window, `--paper-sunken` with 1 px
  `--line-strong` border, under the header. All other inline hint
  paragraphs go away. **[target]**
- **Buttons** [Buttons]: primary = wood gradient with cream text; secondary
  = paper with `--line` border; destructive = `--danger` text on paper;
  disabled = dashed border plus the reason in italics, never a bare fade.
- **Tables** [Table]: header `--green` 11-13 px over a `--line-strong`
  rule; rows `--paper-raised` with `--paper-alt` zebra; hairline `--line`
  separators; numbers right-aligned. Real table: `window-market.png`.
- **Cards** [Card]: `--paper-raised`, 1 px `--line`, optional 4 px left
  accent in `--green` for state. Real cards: `window-hall.png`.
- **Chips** [Card and chip]: pill, `--paper-sunken`, `--line` border, 13 px.
- **Forms** [Form row]: inputs `--paper-raised`, 1 px `#aa9367` border,
  Georgia 15 px, min-height 30 px; labels 13 px `--ink-soft`.
- **Empty states** [Empty state]: centered block, optional 42-48 px
  ornament, one short sentence in `--ink-faint`. Never a bare italic line.
- **Dialogs** [Dialog chrome]: same `.pwin` frame, centered, actions in
  one bottom row, equal widths, primary last.
- **Focus** [Buttons]: `:focus-visible` outline 3 px `--brass-bright` on
  dark, `--green` on paper. Never remove it.
- **Icons**: one inline-SVG stroke set (1.7 stroke, round caps) for chrome;
  goods keep their own illustrated icons. No second icon family.

## 7. Content rules

- Every player-facing string in both the `es` and `en` blocks
  (i18n-parity test enforces it).
- Desktop copy only: no touch or long-press instructions.
- Money in prose and logs renders as whole coins; cents stay in prices
  and deal pills.
- An empty window still gets the full chrome and a designed empty state.

## 8. Status by window

| Window | Today | Remaining (target) |
|---|---|---|
| Mercado | ledger style | fluid width + inner scroll under ~1200 px; rail clearance rule shared |
| Banco, Almacén, Informes, Mensajes | ledger style | rail clearance |
| Ayuntamiento | chrome + cards | rail clearance |
| Astillero, Taberna, Ruta, Casa, Construir | old flat style | full migration to this manual |
| Barco (ship window) | old flat style | full migration |
| Menú and dialogs | `.pwin` chrome | button row rule (equal widths, primary last) |
| Title book | own parchment style | token alignment only |

## 9. Per-window PR checklist

1. Window wrapped in the shared chrome; header, close and drag work.
2. Raw hex replaced with the tokens of section 2.
3. Type and spacing match sections 3-4; one-off sizes removed.
4. Tables, buttons, forms and empty states match section 6.
5. Before/after screenshots in ES at 1366x860 attached to the PR.
6. `npm test` plus the window's UI suite green.
