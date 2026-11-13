# Tippsammlung 9.2.1.2-9.2.2: the compilation's described street rules and block diagrams

13 November 2026. Main inspected: `7989210`.
Clean-room documentary note. Own words only; no copied text, tables, source
distances or counts, assets or excluded material. No change is approved.

## Scope and prior coverage

Source: German Tippsammlung 2010, printed pages 177-182, read page by page
(text layer plus rendered page images for 179-182, whose content is mostly
diagrams). Public URL: http://downloads.patrizierforum.net/tippsammlung/Tippsammlung_2010.pdf
Community account, no runtime reproduction here. The printed compilation was
produced by the Patrizier-II-Forum, so the exact equivalence of its rules with
Patrician III is not established by this note; the rules below are the
compilation's described rules, not a verified P3 contract.

`patrician3-tippsammlung-plotlayout-notes.md` is a partial reading and lists
9.2.1.2, 9.2.1.3 and 9.2.2 as unread. This note covers exactly those. Grep of
`docs/research` for "parallel street" and "access street" found only that
previous note as partial coverage (its unread-section list); no other
elaboration was found.
Open PRs 930-943 were listed by title; none concerns plot layout.

## What the pages say

- 177 (9.2.1.2): the planning office connects each new building or street to
  the existing network, sometimes with a bent link and sometimes a short alley
  for houses. The connection is skipped when the site is far enough from the
  network, with a different threshold for workshops and houses, or when it sits
  inside a closed ring of buildings. Page 177 also ends 9.2.1.1 with a rule
  about cross streets: they form only when the gap is wide enough, so a gap too
  narrow suppresses them, and build order matters for houses.
- 178 (9.2.1.3): parallel streets form only when placing workshops, never
  houses. When the office recognizes a particular pattern of existing buildings
  and a free workshop site, it lays streets that support compact blocks.
  The area between them becomes a special plot reserved for a workshop that
  fills it entirely; houses and partial workshops are impossible there, and no further
  street is laid through it. The pattern depends on direction, and the
  detection reach differs by direction: longer when building up or left,
  contact-only when building down or right.
- 179: diagrams give the distances beyond which no formation happens, and
  remark that the up/left case hurts most when building beyond an already
  built street side.
- 180: prevention options: remove a workshop of the front and
  re-add it later, or alternatively fill the required free workshop site with houses on both
  sides (so the office cannot pick the other site) and demolish them after.
  9.2.2 then says these rules can be used intentionally, to surround a
  build area with streets.
- 181-182: diagrams under the headings for blocks of workshops of increasing
  size. The pages carry no running text. Visible captions mention a cross
  street above or to the right, parallel streets with a reserved special plot,
  an access street, a further reserved workshop site, and a side street
  prevented by an alley. Their exact placements are not transcribed here.
  The heading of the last block type is on page 182; its diagram is on page 183,
  which was not assessed.

## Own source

- `src/view3d/cityplots.mjs:5-15` (`cityPlots`) reads: plots and paths come from
  a seeded generator, deterministically per city id. Types
  come from list position and coordinates.
- `src/view/urbanlayout.mjs:10-36` reads: each lot is centred in its own cell
  between streets drawn on a regular grid, with a plaza and service strip
  separate from the grid.
- `src/game/buildings.mjs:174-190` (`buyPlot`) and `253-275` (`startConstruction`)
  read: neither function consults neighbouring plots, distance to a street, or
  build order. Purchase checks office, ownership, cash or permit.
- Real grep of `src` and `web` for street, parallel, access road, adjacency,
  touch and gap returned layout drawing code and unrelated functional hits; among the relevant
  matches no placement-driven street reservation was found. Scope: those terms
  in those directories only.

## Reading for Almojarife

The compilation's described street rules are hidden, direction-dependent and irreversible, and the
tricks to avoid them (spacer buildings, temporary houses, demolition) are
exploits of that automation. Almojarife has none of it: plots are fixed, so
build order and neighbours cannot create a street or parcel trap (this says
nothing about other order-dependent effects). No gap and no patch proposed.
If player-driven layout is ever chosen, requirements from this reading: a
placement preview that shows every street or reserved plot it would cause,
no order-dependent irreversible effect, and symmetric treatment of directions.

## Open questions

- Exact distances and block diagrams were not transcribed; anyone relying on
  them must read the pages again.
- Whether the last block diagram adds anything beyond the earlier ones.
- Whether a reserved special plot would suit any current building type; not
  evaluated.
