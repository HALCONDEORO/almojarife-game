# P3: local anchorage register, not the player's fleet list

Research note, 2026-11-13. Clean-room comparison against Almojarife main
`8290a85ac3f9a26dc7d2dc1718734445443ffbb6`. Documentation only.

## Answer and scope

The P3 manual describes the Harbour Master as a town-level overview of the
ships currently at anchor, useful for seeing which traders are present. This
is a different information surface from cycling through one's own ships.
Almojarife already draws AI and owned ships on its sea map and has a searchable
owned-fleet panel. The narrower candidate is a readable local list of present
vessels, not a new fleet simulator and not a claim that rivals are invisible.

Do not implement this note without a separate design decision. It supplies no
P3 prices, balance values, copied interface text, art or implementation details.
Only public manuals, editorial pages, community pages and our source were
consulted. No reverse-engineering source was used.

## Evidence and limits

| Source | Finding used and confidence |
| --- | --- |
| S1, full English P3 manual, section 10.16, printed p.37, PDF p.37: http://downloads.patrizierforum.net/tippsammlung/Patrician_III_-_Manual_-_PC.pdf | Primary documentation for the local overview of all anchored ships. It does not enumerate the columns, retention period, fees or disclosure of another trader's cargo. Those remain unknown. |
| S1, sections 7.3 and 7.4.2.2, printed pp.18 and 20 | Town entry normally depends on having an office or a docked ship there; the sea-view ship counters refer to the player's fleet, with convoys handled separately. These are access and navigation context, not evidence of remote access to the Harbour Master. |
| S2, manual mirror: https://manualmachine.com/gamespc/patrician3/1118526-user-manual/ | Fetched mirror covers town-entry and map-symbol context, but returned content ends before the Harbour Master section. It is not an independent confirmation of that section. |
| S3, GRYOnline interface guide: https://www.gry-online.pl/poradniki/patrician-iii-rise-of-the-hanse/interfejs-gry-cz2/zd36c1 | Editorial description distinguishes owned-ship navigation, competitor-presence map symbols and access to town view. Consistent with a local rather than omniscient interpretation; not a register-column specification. Page shows an update date in 2019. |
| S4, GRYOnline ship-menu guide: https://www.gry-online.pl/poradniki/patrician-iii-rise-of-the-hanse/menu-okretu/z536d8 | Describes the selected owned ship's cargo, crew and condition. It supports separating owned-ship management from the proposed local presence list. It does not prove these details are public for rival ships. Page shows an update date in 2019. |
| S5, community Tavern page: https://patrician3.fandom.com/wiki/Tavern | Describes information purchased from an informer about shortages and other events. This is a different information channel, not support for free remote traffic intelligence. Community account, no live reproduction. |
| S6, GRYOnline review: https://www.gry-online.pl/recenzje/patrician-iii-rise-of-the-hanse-recenzja-gry/zd5d4 | Editorial context checked; not used to infer missing register columns, access rules or simulation effects. |

The core mechanic rests on S1. Neither the mirror nor the contextual pages
counts as independent reproduction of the Harbour Master screen. No running
P3 session was inspected. The manual's broad description is not permission to
invent a complete rival-information panel.

## Current Almojarife, checked on the stated base

| Location | What exists | Boundary |
| --- | --- | --- |
| `src/view/fleet.mjs`, `fleetRows`, `fleetHtml` | Search, state filters and selection over the supplied ships; the rendered fleet passes `g.ships`. Owned rows show cargo use and hull state. | Existing player-fleet management. Do not replace it or relabel all its private fields as public port information. |
| `web/main.mjs`, `drawShips` | Combines `g.ai` ships with `g.ships` for map markers. Owned markers get selection/city-opening handlers. | Rival vessels are already drawn. Map presence is not a textual local anchorage register; this note does not certify the map's information policy. |
| `src/view/worldsystems.mjs`, `worldSystemsHtml` | Optional rival-house section maps across AI houses. | It is not filtered into a list of ships docked at the requested port. A house-name section is not a traffic register. |
| `src/game/privateering.mjs`, `targetsFor` | Selects attackable AI traders on the same sea lane, subject to its rule gates. | An at-sea combat-target query is not a list of peaceful vessels anchored in town. Never reuse its eligibility as the definition of local presence. |
| `src/game/botintel.mjs` | Separates a bot's chart, warehouse and market knowledge from the player's state. | Existing information boundaries must survive any human-readable presence view. This is not a source for other houses' private plans. |

A real grep of `docs/` found Harbour Master references in `docs/DESIGN.md`
and `docs/design/missions.md` as an invented mission character. Those references
do not specify this register. The live open-PR list checked for this round
contained the construction-material wait note, dependency maintenance,
escorted-prize work and modal-focus tests; no local register note was listed.
This is a scoped novelty check, not proof against every historical branch.

## Possible local design, explicitly our proposal

Prefer a derived, read-only presence view over a new traffic simulation.
Candidate inputs already distinguish owned ships, AI ships, port and voyage.
A local row should require a real vessel currently docked at that port, not
merely a matching last-port field while sailing. Exclude destroyed vessels.

Decide the access rule before connecting it to a city button. A discovered
port, a currently accessible town and an exact current intelligence snapshot
are not interchangeable concepts. No source here proves that the P3 register
is available remotely, historically or after the player's last vessel leaves.

Keep the initial public row minimal: vessel identity, owner category and
present port, only where the game already has a reliable identity to show.
Do not manufacture names. Rival cargo, cash, destination, orders, profit and
private intelligence require separate justification. An anchored rival may
be idle, waiting or repairing: presence alone does not prove a completed trade.

This note proposes no arrivals history, berth limit, port fee, job assignment,
interception shortcut or command over another house's vessel. A historical
log would need explicit observation and retention rules rather than silently
reading current world state as if it had always been known.

## Acceptance questions for a later implementation

- Can a mixed local list include owned and AI vessels without turning rival
  rows into selectable player ships or exposing private cargo and orders?
- Does it distinguish docked, departing and at-sea vessels even when `at` still
  names a previous port? What happens on arrival within the current tick?
- Are absent vessels, other ports and destroyed ships excluded without mutating
  navigation, discovery, market snapshots, cash or private bot state?
- Are convoy members represented without double-counting or invented group rows?
- Does access loss produce an unavailable or explicitly stale view instead of
  fresh remote information? Which rule should apply? Not settled here.
- Can the view handle no vessels, missing optional names, localization and
  keyboard access? UI and actual-pixel review are future work, not done here.

## Author verification, not independent review

Existing focused baseline run: `node --test test/fleet.test.mjs
 test/botintel.test.mjs test/privateering.test.mjs` completed with 32 passing
tests and no failures on the stated base. No test was added or modified.
These tests cover adjacent existing behavior, not a register that does not yet
exist. `git diff --check` and clean-base patch application were checked at
handoff. Independent documentary review and implementation approval remain
separate steps. No runtime file, dependency or saved game changes here.
