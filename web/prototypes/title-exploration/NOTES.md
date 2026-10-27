# El Almojarife — The merchant's ledger

**Delivered: interactive visual prototype, 25 October 2026.** Open `index.html`
directly from this directory. It needs no server, build, package installation or
network connection. Keep it inside the repository so its relative image paths
remain valid. CSS, SVG ornaments, translations and JavaScript are inline.

This is an isolated exploration of the title screen. The save data and actions
are demonstrations; they do not access the game's storage or launch a campaign.

## Design

The open ledger is the interface: the left page introduces the world, and the
right page offers the next action. Red sealing wax (`#8c2a1c`), parchment
(`#d9c79c`), aged gold (`#f0d88a`) and dark walnut retain the game's palette.
Georgia and local serif fallbacks provide the typography, without remote fonts.

The desk has directional grain, board joints, warm candlelight and a vignette.
The book adds leather binding, fine page edges, a recessed gutter, stained paper,
folio numbers and a red bookmark. CSS gradients and inline SVG turbulence create
the surfaces. The paper grain is static; only the candle flame and resting quill
move subtly. Reduced-motion preferences remove animations and transitions.

The harbour plate combines the real Iberian relief map with existing chapel,
warehouse, merchant-house, quay and boat artwork. Muted colour, sea washes,
engraved ripples, bearing lines, a compass rose and a caption unify the collage.
It is an imagined merchant's view of Cádiz, not a geographically exact panorama
or a historical reconstruction. No artwork from Patrician is reproduced.

A glossy, impressed wax seal carries an original merchant's scales emblem.
The same mark appears in the desk signature and save record. An inkpot, feather,
brass compass and stacked coins frame the book. Hover brings a restrained warm
ink glow and a small drawn arrow to an entry; keyboard focus has a visible ring.

The layout targets a desktop around 1400 × 800. Below 760 px, the pages stack,
the gutter disappears and the large desk objects are hidden. At 390 px the book
uses narrower margins, wrapping text and vertically scrollable content. The menu
keeps its reading order, and its mobile action targets are at least 47 px high.
These are implementation choices, not claims of browser-measured fit.

## Development of the v4 direction

The supplied v4 description establishes an open book, red initials and desk
objects. This version develops those ideas with a more substantial binding,
layered paper, local textured harbour artwork, a consistent merchant emblem,
subtle motion and a distinct primary action. Save protection and complete
language/state demonstrations are part of the screen itself.

The actual `web/mock/start.html` inspected in this checkout is a campaign-card
proposal. The comparison with the two-page v4 is therefore based on the supplied
description. That file was not changed.

## Demonstration scenarios

Append a query to the local `index.html` URL, or use the two scenario links below
the book. Those links preserve the selected language and reload the example.

| Query | Initial state |
| --- | --- |
| No query, or `?save=1` | Casa de la Vega, day 38, 2,480 coins; previous copy from day 37. Continue is first and active. |
| `?save=0` | Start is first. Continue, Export and Restore are disabled. No last-save record. |
| `?save=1&backup=0` | Saved game present; Restore is disabled because there is no previous copy. |
| `?save=0&backup=1` | No current save, but a previous copy can be restored. |
| `?save=1&lang=en` | Saved-game state in English. |
| `?save=0&lang=en` | Empty state in English. |

Spanish is the default. ES / EN changes all interface strings, save labels,
dialogue text, notices, document title and translated accessible labels. Coin
formatting follows the selected locale. The game title, personal/place names
and the Latin date remain proper names or inscriptions.

The primary entries are reordered in the DOM, so visual, keyboard and reading
order agree. Disabled actions use native `disabled` buttons. The save record
shows the house, day, coins and port; the empty state explains that the first
page is unwritten.

| Action | Demonstrated behaviour |
| --- | --- |
| Continue | Immediately announces a simulated continuation; no confirmation dialogue. |
| Start, without a save | Opens sample House del Alba, day 1, 500 coins; Continue becomes the first action. |
| Start, with a save | Shows a clear warning with the existing house and progress. Confirming keeps the current sample as the previous copy before starting the new sample. Cancel or Escape leaves it unchanged. |
| Import | Previews the built-in House de Medina example, day 17, 1,320 coins. Confirmation imports that sample and keeps any current game as a previous copy. No file picker or real file reading. |
| Export | Previews the current sample and explains that no file is downloaded. It does not change the save. Disabled when no save exists. |
| Restore previous copy | Previews the copy and asks for confirmation. The current sample, if any, becomes the previous copy, allowing the swap to be reversed. Disabled when no copy exists. |

All mutations are in memory. Reloading returns to the URL's initial scenario;
language selection is transient too unless specified by `lang`. No localStorage,
IndexedDB, cookies, fetches, game imports or real save files are involved.

The native modal dialogue supplies modality and Escape behaviour. The initial
focus is on the cancel action, except for the export preview, which has only a
close action. Closing restores focus to the triggering action where possible.
Results are also written to a polite live region. These accessibility mechanisms
were inspected in source; assistive-technology behaviour is not yet verified.

## Assets and provenance

All paths are relative to `index.html`; existing images are referenced, not
copied or modified. The map is three directories up because it lives at the
repository root; city artwork is two directories up under `web/`.

| Asset | Relative path | Use |
| --- | --- | --- |
| Iberian chart | `../../../assets/map/background.webp` | Cartographic base of the harbour plate |
| Merchant boat | `../../city2d/assets/barco.webp` | Foreground vessel |
| Stone quay | `../../city2d/assets/muelle.webp` | Harbour waterfront |
| Merchant house | `../../city2d/assets/house_rich-1.webp` | Harbour architecture |
| Warehouse | `../../city2d/assets/warehouse-1.webp` | Harbour architecture |
| Chapel | `../../city2d/assets/capilla-1.webp` | Harbour skyline |

The map's attribution in `CREDITS.md` identifies Natural Earth public-domain
data and the project's own CC BY 4.0 styling. City artwork is reused from the
repository. New CSS and inline SVG ornamentation is original to this exploration.
No external artwork or fonts were downloaded. Code follows the repository's MIT
licence; original art and documentation follow CC BY 4.0.

## Verification actually performed

Verification was local and static, without a browser:

- Read the final HTML, CSS, both translation dictionaries and event handlers.
  Traced `save=1` and `save=0` in ES and EN, including DOM order, disabled states,
  save details, immediate continuation and the protected new-game flow.
- Traced the backup override, cancellation, sample import/export, restoration
  and focus-return branches. This is source inspection, not interaction testing.
- Checked all six referenced images with `ls` and `test -f` against their
  resolved repository paths. Inspected the source artwork directly as images.
- Parsed the HTML to check nesting, unique IDs and local SVG/CSS fragment
  references. Checked the inline JavaScript with `node --check`; syntax passed.
- Compared both translation dictionaries: 68 keys each, matching interpolation
  parameters, with every static translation binding and all dialogue keys
  present in both languages.
- Searched the delivered HTML for HTTP(S) addresses, protocol-relative resource
  URLs and CSS imports: none. All imagery uses the six local paths above.
- Inspected responsive rules, text wrapping and reduced-motion handling in
  source. No browser was launched; no screenshots, rendered viewport checks,
  interaction tests, performance measurements or screen-reader tests are claimed.

Only `index.html` and this document were created or updated, both inside
`web/prototypes/title-exploration/`. No commit or push was made.

## Before production

- Connect the actions to the actual save system, validated imports, downloads,
  durable backups and campaign navigation. Revisit copy retention and recovery
  with real persistence requirements.
- Integrate text with the game's localization system and confirm period language,
  dates, house naming and currency conventions.
- Inspect the rendered result at 1400 × 800, intermediate widths, 390 px and
  200% zoom in Chromium, Firefox and Safari. Check sprite alignment, filter
  rendering, contrast, keyboard navigation, modal focus and assistive technology.
- Measure SVG texture and filter costs on modest hardware, then refine detail,
  scale and lighting through visual inspection.
- Move any accepted design into a separate, tested production change. This
  prototype remains self-contained and is not wired into the game.


## Archive status

Historical isolated prototype, not wired into the game. Verification claims above are the original author's record, not a current independent PASS. Current publication checks cover source inspection and JavaScript syntax only; current rendered screenshots and interactions remain pending.
