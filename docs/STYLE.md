# Window and interface style manual

One visual language for the whole game: a merchant's ledger on parchment,
limestone, walnut, brass and harbour green. The title book, the sea chart
and every window (port services, ship window, reports, messages, dialogs)
share the same tokens, type scale and components below. Desktop only:
density and layout target a keyboard-and-mouse screen at 1280x720 and up.

This manual is the base for the per-window UI PRs. When a window and this
manual disagree, the manual wins; change the manual in its own PR.

## 1. Principles

- **Ledger first.** Every window reads as a page or a record book: serif
  type, parchment body, wood-and-brass frame. No flat modern panels.
- **One chrome.** All floating windows use the same frame, header, title
  and close button. No per-window colour inventions.
- **Density with air.** Desktop means information-dense tables and forms,
  but on a clear grid: aligned numeric columns, one spacing scale, visible
  section headings. Empty states are designed, not leftover lines.
- **Hierarchy before decoration.** One accent colour (harbour green),
  one warn colour, one danger colour. Colour marks state, never style.
- **Spanish and English are equals.** Both blocks ship together; check
  both for overflow, tildes and line breaks.

## 2. Colour tokens

Define as CSS custom properties on `:root` and use the variables, never
raw hex, in new or migrated CSS.

| Token | Value | Use |
|---|---|---|
| `--paper` | `#f4ead0` | window body (parchment) |
| `--paper-raised` | `#fff6e0` | cards, table rows, inputs background |
| `--paper-sunken` | `#e5d7b7` | intro strips, subdued panels |
| `--paper-alt` | `#eee2c4` | zebra rows |
| `--ink` | `#302719` | body text |
| `--ink-soft` | `#5a4a32` | secondary text |
| `--ink-faint` | `#7a6845` | captions, meta, empty states |
| `--line` | `#c5ae80` | hairlines, card borders |
| `--line-strong` | `#bba373` | section rules, table header underline |
| `--wood` | `#6b4f2a` | window frame border |
| `--wood-hi` / `--wood-lo` | `#6d543a` / `#3d2d1b` | header gradient |
| `--brass` | `#c9a35f` | frame outline, header underline, focus gold |
| `--brass-bright` | `#ffd876` | focus-visible outline |
| `--green` | `#405e4a` | the accent: headings, table headers, active state |
| `--green-deep` | `#243b34` | header gradient end (with `#3d5246`) |
| `--green-ink` | `#304c3c` | accent text on paper |
| `--gold-cream` | `#fff0cd` | text on the dark header |
| `--buy` | `#2e6b34` | gains, buy-side marks |
| `--sell` | `#8a5a17` | sell-side marks |
| `--danger` | `#a11` | destructive actions, bad state |
| `--shadow` | `#000a` | window drop shadow (with transparency) |

Do not introduce near-duplicates of these (the current CSS carries a
dozen one-off browns; migration collapses them onto the scale above).

## 3. Typography

- Family: `Georgia, "Times New Roman", serif` everywhere in game UI.
- Scale (desktop):

| Role | Size | Weight/style |
|---|---|---|
| Window title | 22px | regular, letter-spacing .5px |
| Section heading (h3) | 21px | regular, often in `--green` |
| Sub-heading (h4) | 13px | small-caps, `--ink-faint` |
| Body | 15px/1.5 | regular |
| Table body | 13-14px | regular |
| Table header | 11-12px | bold, uppercase or `--green` |
| Meta / caption | 12-13px | `--ink-faint` |
| Empty state | 15px | centered, `--ink-faint` |

- Numerals in tables: right-aligned, tabular rhythm; never centered.
- Long prose hints go in intro strips (see 6), one per window, not
  repeated inline paragraphs.

## 4. Spacing and sizing

- Spacing scale: 4, 6, 8, 12, 16, 20, 28 px. Use these steps only.
- Window body padding: 12-16 px desktop.
- Interactive controls: min-height 30 px desktop (32 px in window
  chrome), padding 4-10 px. The 44 px mobile floor does not apply.
- Radius: 2-4 px on windows and cards, 3 px on buttons, pill (11-20 px)
  only for count chips and quantity pills.

## 5. Window chrome (all floating windows)

One component, today `.pwin`:

- Frame: `--paper` background, 3 px `--wood` border, 1 px `--brass`
  outline offset -5 px, drop shadow, 60 px inner parchment glow.
- Header: gradient `linear-gradient(#6d543a, #4a3722 55%, #3d2d1b)`,
  title 22 px `--gold-cream` Georgia, bottom border 2 px `--brass`,
  sticky while scrolling, draggable.
- Close button: right side of the header, labelled `Cerrar (Esc)` /
  `Close (Esc)`, brass border, min-height 32 px.
- Service windows opened from the city rail reuse the same chrome; the
  green-gradient variant (`.ui2d-heading`) is being folded into the
  single wood header so all windows match.

A window shows a `data-city-panel` / id attribute so per-window CSS
only sizes and lays out; it never restyles the chrome.

## 6. Components

- **Intro strip**: one `--paper-sunken` box with a 1 px `--line-strong`
  border under the header when a service needs an explanation. Heading
  optional. All other inline hint paragraphs are removed.
- **Buttons**: primary action is a solid `--wood`-gradient button with
  cream text (today's `.pwin-close` family); secondary actions are
  paper buttons with `--line` border; destructive uses `--danger` text
  on paper. Disabled: dashed border + italic reason text, not a fade
  that hides the reason (see `.bldoffer-locked`).
- **Tables**: header row in `--green` 11-13 px over a `--line-strong`
  rule; body rows `--paper-raised` with `--paper-alt` zebra; hairline
  `--line` row separators; numbers right-aligned; row min-height from
  the density target of the window (market: whole list without scroll
  at 1366x768).
- **Cards and tiles**: `--paper-raised`, 1 px `--line`, optional 4 px
  left accent in `--green` (state) or `--line-strong`; heading in
  Georgia; meta in `--ink-faint`.
- **Chips / counts**: pill, `--paper-sunken` background, `--line`
  border, 13 px.
- **Forms**: inputs and selects on `--paper-raised`, 1 px `#aa9367`
  border, Georgia 15 px, min-height 30 px; labels 13 px `--ink-soft`.
- **Empty states**: centered block, optional 42-48 px line icon or
  ornament, one short sentence in `--ink-faint`. Never a bare italic
  line at the margin.
- **Dialogs (menu, confirm)**: same `.pwin` chrome, centered, actions
  in one row at the bottom, equal-width buttons, primary last.
- **Focus**: `:focus-visible` outline 3 px `--brass-bright` on dark
  surfaces, `--green` on paper. Never remove it.
- **Icons**: the single inline-SVG stroke set (1.7 stroke, round caps)
  used by the city rail; goods keep their own illustrated icons. Do
  not mix in a second icon family.

## 7. Content rules

- All player-facing strings in both `es` and `en` blocks (i18n-parity
  test enforces this).
- No mobile wording in copy or controls: no long-press instructions as
  primary hints, no touch-sized layouts.
- Empty windows still get the full chrome and a designed empty state.

## 8. Migration checklist (per window PR)

1. Wrap the window in the shared chrome (or confirm it already is).
2. Replace raw hex with the tokens of section 2.
3. Type and spacing to sections 3-4; remove one-off font sizes.
4. Tables, buttons, forms, empty states to section 6.
5. Before/after screenshots in ES at 1366x860 attached to the PR.
6. Tests: `npm test` plus the window's UI suite; CI green before merge.
