# P3 ship upgrading and renaming: the documented shipyard growth path behind our fixed ship types

13 November 2026. Main inspected: `7989210`.
Clean-room research only: no copied source prose, balance values, excluded
modding material or executable inspection. No implementation approved.

## Narrow finding and existing coverage

The P3 manual's ship chapter documents a shipyard service beyond building
and repair: a ship can be upgraded at the yard, gaining strength and more
weapon slots while giving up hold space, a fixed small number of times per
ship, with the weapons themselves bought separately from the smith; and
the yard will rename any ship moored in port.

Existing coverage is not reclaimed: the naval-order-cancellation note owns
the manual's building and repair sections on the same printed page (repair
interruption, order withdrawal, no construction cancellation), the
crew-morale note owns crew and mutiny, the mounted-weapon-loss and
excess-crew-capacity notes own their weapon and crew edges, the fx-guide
note owns hull wear, the public-convoy note owns convoys, and
`patrician3-mechanics.md` already records the documented shipyard
experience track (busier yards building faster and better) that the
manual states inside the building and order-list sections the
naval-order-cancellation note covered. No note
takes the upgrading or renaming sections as primary; ship upgrades appear
only as our own backlog wish in the parity gap.

## Evidence and dependencies

| Ref | Public source read | Contribution and limit |
| --- | --- | --- |
| S1 | P3 manual, Upgrading your Ship and Changing a Ship's Name sections of the ship chapter (printed page 28): http://downloads.patrizierforum.net/tippsammlung/Patrician_III_-_Manual_-_PC.pdf | Full public PDF text inspected. Primary documentation: upgrading strengthens a ship and adds weapon slots while reducing hold space; the manual's own worked example has a fully armed small ship lose most of its carrying capacity once upgraded; each ship can be upgraded only a fixed small number of times; the yard does the work but weapons are bought separately from the weapon smith. Renaming is a yard service for any ship moored in port. No costs, slot counts or strength values are given. |
| S2 | GRYOnline game guide, ship construction, repair and upgrade page, updated 2019: https://www.gry-online.pl/poradniki/patrician-iii-rise-of-the-hanse/budowa-naprawa-i-rozbudowa-okretow/z236d5 | Polish walkthrough. Tracks the manual point by point: upgrading improves seaworthiness and adds cannon slots at the cost of cargo room, each ship a fixed small number of times, cannons bought separately; renaming a moored ship; and a yard that keeps working building faster and better - which the manual itself documents on the same page inside its building and order-list sections. Documentary overlap inside the same source family, not independent confirmation. |

## Main inspection

Real grep and reading across the ship and yard modules found the tradeoff's
direction already built per weapon, the upgrade path absent, and renaming
present in a different place:

- `src/sim/armament.mjs:5-11`: every mounted weapon occupies a slot and
  takes hold space by its weight, and per-type weapon caps are fixed
  (`MAX_CANNONS`, `src/sim/armament.mjs:12`, with the `maxCannons` lookup
  at `src/sim/armament.mjs:20`). The documented combat-versus-cargo
  tradeoff is already expressed piece by piece; what has no located
  counterpart is a yard service that raises the cap itself.
- `src/sim/trade.mjs:31-32`: effective hold is the type's fixed capacity
  minus the weight of weapons and gear, and the type table
  (`src/sim/trade.mjs:10-15`) gives each type fixed capacity, speed,
  upkeep, price and build time. In the ship and yard modules inspected
  (trade, armament, armory and the repair functions at
  `src/game/game.mjs:212-233`) no hull-strength or slot-raising upgrade
  was located: a ship keeps its type's numbers for life. Absence scoped
  to those modules.
- Renaming exists, but not as a yard service: the fleet view offers a
  free-form rename (`src/view/fleet.mjs:18`, form in
  `src/view/shipnameform.mjs:3-5`) with no port or anchoring condition in
  the inspected code.

No test execution or visual audit accompanies these source readings.

## Own design option and acceptance questions

The documented record here is mostly a question, not a build request. If
selected later, the smallest faithful slice would not add P3-style upgrade
tiers: our per-weapon weight already lets a player trade cargo for combat
piece by piece, which is the same decision at finer grain. What the record
adds is the irreversible, yard-bound version - committing a ship to a
combat role - and whether that commitment has a place is an owner call,
not a research conclusion. Renaming needs nothing: ours is already more
convenient than the documented yard visit. The documented shipyard
experience track belongs to the building sections' existing coverage and
is already recorded in `patrician3-mechanics.md`; if it were ever wanted
it would be a yard-level track, not a property of any ship.

Any future change in this area should prove: flag-off games byte-identical;
a committed upgrade, if added, cannot be undone silently by remounting
weapons; capacity, weapon caps and crew limits stay consistent across the
fleet view, the yard quote and every battle helper; and save/load
round-trips without drift. Decide first: whether irreversible ship
commitments fit the game's direction at all, and whether the yard should
ever gain a memory of past work.

## Open questions

- Does a P3 upgrade change anything beyond slots and hold - speed,
  upkeep, crew needs? The manual names strength and slots only.
- Does the documented shipyard experience affect repairs as well as
  builds? The documented passages speak of building; untested for the
  repair list.
- Does upgrading interact with the repair queue as a third order kind,
  or is it instant? The manual does not say.
