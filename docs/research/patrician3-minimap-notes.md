# P3 manual 7.4.1: what the mini-map shows and what it can order

13 November 2026. Main inspected: `7989210`.
Clean-room documentary note, own words only. No copied prose, source figures,
assets or excluded material. No change is approved.

## Scope and overlap

Source S1: Patrician III English manual, section 7.4.1 (printed and PDF page 19),
with the mouse-control table on page 18 (7.1). Read page by page.
http://downloads.patrizierforum.net/tippsammlung/Patrician_III_-_Manual_-_PC.pdf
Only S1 is used. Not opened or verified: any running P3 session, other
editorial pages.

Overlap checked. PR 938 uses printed pages 18-19 for the town status icons on
the sea map; this note does not touch those icons. The anchorage-register note
uses 7.3 for the town-entry rule only. The temporary-ship-selection note lists
a GRYOnline page that mentions the minimap as context. Grep of `docs/research`
for mini-map and minimap found only that table row; no note records what the
manual says about the mini-map itself. PRs 930-944 were listed by title; none
concerns it.

## What S1 says

- The mini-map is a small copy of the current town or of the whole trading
  area, with a frame marking the part shown in the main view. Left click
  changes that part (page 19, page 18 table).
- Right click on it can send a selected ship, including to a town to call
  there (an anchored ship opens its trading window); with no ship selected,
  right click on a town where the player has an office opens trading (page 18).
  The text calls it essentially the same function set as the sea map.
- A toggle arrow switches between town view and sea map, so that trade in a
  town and fleet progress can be followed together.
- Blink language: slow blinking marks the selected ships; fast blinking marks
  something happening, such as a ship docking or hit by a storm.
- Symbols: square markers for ships or convoys by owner (own, computer, other
  players, pirates); diamond markers for towns by player status (no office,
  own office, own ship in port, currently in view); a distinct marker for storm.
  Colours and shapes are in the manual's table and are not reproduced here.

## Own source (main 7989210, function bodies read)

- `web/mapcontrols.mjs:2-48`, `installMapControls`: builds a separate small map
  with the same background, a view frame and a ship layer.
- `mapcontrols.mjs:23-24`: a press or drag calls `miniPan` and moves the camera
  through `minimapPoint` and `panTo` (`src/view/camera.mjs:57,59`), keeping the
  zoom. No order is issued; there is no right-click handler in this file.
- `mapcontrols.mjs:36`: the mini-map is hidden when blocked or at the lowest
  zoom, so it appears only after zooming in.
- `mapcontrols.mjs:45`: it draws one identical circle per entry of `g.ships`
  (the player's ships, own list); no colour by owner, no towns, no blinking, no
  storm or event marker, and no distinction for the selected ship.
- `docs/COMO-JUGAR.md:35`: documents click or drag as camera movement that gives no
  navigation order. This is an intentional divergence, not a bug.
- Real grep of `src`, `web` and `test` for `map-minimap` found only this
  module and its styles. Scope: that identifier only; other map overlays were
  not inspected.

## Reading for Almojarife

Own mini-map is a camera aid. S1's version is also a status board and an
order surface. Candidate, not approved: show the selected ship differently
from the others (an accessible shape or outline, not colour alone), and mark
towns where the player has an office. Orders from the mini-map stay out: the
guide states the opposite on purpose, and wrong-destination risk on a tiny
target is real.
Open questions: whether rival and pirate ships may be visible to the player at
all in our rules (visibility policy), whether the town/sea toggle is useful given
the separate city window, and whether event pulses would cost accessibility
(reduced motion is already honoured elsewhere in this module).
Test idea if approved: render the layer for a state with several ships and
one selected, assert the selected one is distinguishable without colour.
