# P3: temporary ship selection is not convoy membership

Research note, 2026-11-13. Clean-room comparison against Almojarife main
`ece23cf`. Documentation only; no implementation approval.

## Finding

P3's public manual describes selecting several owned ships by adding them with
a modifier key, dragging a selection rectangle, or adding names from the ship
list. This is an interaction state, distinct from the documented convoy system.
Almojarife already selects an individual ship and already forms real convoys.
The narrower candidate is an explicit temporary set for inspection or a later
chosen command, without silently making a convoy or acquiring its escort rules.

The safest first design question is selection for inspection, not batch sailing.
A group command needs its own rules for eligibility, failure and existing
convoys. A selection gesture alone does not define those rules.

No P3 balance figures, copied interface text, slogans, artwork or implementation
were adopted. Research used public documentation, editorial controls guides,
community context and our source, not reverse-engineering material.

## Public evidence and limits

| Source | Finding and qualification |
| --- | --- |
| S1, English P3 manual, sections 7.1 and 7.2, printed/PDF pp.17-18; appendix 17.1, p.62: http://downloads.patrizierforum.net/tippsammlung/Patrician_III_-_Manual_-_PC.pdf | Describes modifier-assisted selection of owned ships, rectangular selection and modifier-assisted selection of names in the list. Empty-background selection clearing is also described. Primary documentary evidence, not a live reproduction. |
| S1, section 9.7, beginning printed/PDF p.30 | Convoy creation is separately documented, with a qualifying lead ship and persistent grouping. Do not infer that every temporary selection automatically creates a convoy or its benefits. |
| S2, FX Spanish manual hosted on Yumpu, controls section, printed p.13: https://www.yumpu.com/es/document/view/36555388/manual-de-juego-fx-interactive | Describes drag-selection of several vessels. It also shows group-number shortcuts, but this note does not adopt saved groups, their persistence or edition equivalence. Hosted manual text is supporting documentation, not an independent play test. |
| S3, DefKey controls listing, updated in 2023: https://defkey.com/patrician-3-shortcuts | Lists modifier selection and rectangular selection, and identifies the game manual as its source. Consistent, but derivative rather than independent confirmation. |
| S4, GRYOnline naval-battle guide: https://www.gry-online.pl/poradniki/patrician-iii-rise-of-the-hanse/bitwy-morskie/zf36ea | Describes selecting all participating owned ships in combat. That is a battle-specific scope, not proof of a world-map batch-order contract. Editorial context, page shows an update date in 2019. |
| S5, GRYOnline interface guide: https://www.gry-online.pl/poradniki/patrician-iii-rise-of-the-hanse/interfejs-gry-cz1/z236b7 | Explains town/map interaction and navigation through the minimap. Context only; it does not establish selection membership, group-order failure handling or convoy creation. Page shows an update date in 2019. |
| S6, Jeuxvideo community discussion: https://www.jeuxvideo.com/forums/1-9240-959119-1-0-1-0-0.htm | A participant describes a modifier click for route waypoints and is unsure of the mouse button; another describes dragging a route. Useful warning that modifiers and dragging have multiple contexts, not evidence for a new selection rule or reliable controls specification. Posts checked are from 2006. |

These sources do not settle whether a mixed P3 selection dispatches atomically,
what happens when a member cannot sail, or which commands apply to a mixed
selection. No P3 session or screen was inspected. No bulk-command guarantee is
claimed, and no controls from another game are used as P3 evidence.

## Current Almojarife on the stated base

| Inspected location | Existing behavior and relevant boundary |
| --- | --- |
| `web/main.mjs`, `sel`, map-marker handlers and fleet-row handlers | Uses a selected ship index. An owned marker selects a ship and opens its city or floating card; a fleet-row button replaces that index. No additive set is represented in these inspected handlers. |
| `src/view/navflow.mjs`, `shipClickAction` | A docked owned ship opens the city; a ship at sea opens its card. Adding a modifier must not accidentally open or dismiss a city while building a selection. |
| `src/view/fleet.mjs`, `fleetRows`, `fleetHtml` | Search and state filters preserve original indices for individual selection. Search results are not an implicit selected set. Filtering rows must not silently select every match. |
| `src/view/fleetloss.mjs`, `fleetSelection` | Bounds a selected index and handles an empty fleet. A future temporary set would need its own cleanup when ships leave the fleet, rather than relying on this scalar clamp. |
| `web/main.mjs`, map pointer handlers | Dragging currently pans; touch has pinch handling and click suppression after a drag. A new selection rectangle would compete with an existing gesture, not fill an unused input. |
| `src/game/convoys.mjs`, `formConvoy`, `convoyOf`, `escortOf` | Convoys have persistent registrations, ship backlinks, formation validation and escort effects while sailing together. Temporary highlighting must not write those fields or grant those effects. |
| `web/main.mjs`, `sailToTarget` | Can sail an existing grouped convoy together when its members are docked together, otherwise uses the selected ship path. This is existing group sailing, not evidence that arbitrary selected ships already support batch commands. |
| `web/main.mjs`, convoy-formation handler | Chooses eligible co-located ships at click time before calling formation. That automatic candidate list is not a user-authored temporary selection. |

A real grep of `docs/` for multiple selection, selection rectangles and related
Spanish/English terms found no study of this interaction. Existing convoy and
battle research remains relevant but does not specify a temporary selected set.
The live open-PR list for this round contained P3 siege, local anchorage register,
Electron maintenance, escorted-prize work and modal-focus tests. None described
this interaction. The separately reserved residential-occupancy work is outside
this note. This is a scoped check, not proof about every historical branch.

## Proposed boundaries, our design questions

- Start with inspection-only selection, retaining a clear primary ship for
  single-ship panels. Decide how the user adds, removes and clears members.
- Use owned vessel identities, not a stale collection of array positions.
  Reconcile selling, sinking and save replacement without selecting a successor
  merely because it occupies the old index.
- Keep selection separate from gameplay state: no sailing, repair, trade,
  grouping, fees, crew movement or intelligence refresh just for selecting.
- Provide a visible alternative in the fleet list. Desktop modifiers alone
  do not supply touch or keyboard access. Do not replace pan/pinch by accident.
- If group sailing is later approved, decide all-or-nothing versus partial
  execution before building the command. Show each rejected member and do not
  imply shared speed, escort or membership unless a real convoy grants it.
- Decide whether selecting a convoy member expands only the inspection set,
  selects just that hull, or focuses its existing convoy. None is established
  by this research; silently changing membership is not an option.

## Verification and remaining work

Author baseline: `node --test test/fleet.test.mjs test/convoys.test.mjs
 test/freenav-convoy.test.mjs test/navflow.test.mjs` passed 25 existing tests,
with no failures. No tests were added or changed. This checks adjacent existing
behavior, not a selection feature that has not been implemented.

Before any later UI work counts as ready, test additive/removal/clear behavior,
non-owned exclusion, selection surviving sorting but not stale identities,
modal keyboard isolation, touch pan/pinch, modifier collisions and empty fleets.
Inspect actual pixels for selection hierarchy, overlap and legibility. None of
that UI work is claimed here. Patch whitespace and clean-base application were
checked at handoff. Independent documentary review remains separate.
