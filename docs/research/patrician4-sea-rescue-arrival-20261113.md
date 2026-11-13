# P4 sea rescue: a next-port obligation, not hired cargo

Date: 2026-11-13. Inspected main: `bba6320`. Public clean-room note only.
No copied prose, dialogue, portraits, source values, modding material or binary
inspection. No implementation or release scope change.

## Narrow finding

A public P4 walkthrough describes finding shipwreck survivors at sea, learning
their home city after pickup, and disembarking them at the next port visited.
It reports a greater reward for landing them at home than elsewhere. A separate
community guide also describes survivors joining the next city the convoy docks
at, but uses ambiguous crew terminology. The robust common idea is a rescue
carried forward to arrival, not a guaranteed increase in permanent gun crew.

This differs from the P3 tavern traveller already studied: there is no verified
pre-agreed destination/deadline contract here. The first-port rule can make the
route chosen after rescue matter even without a hired passenger's contract.
It also differs from driftwood cargo, treasure recovery and pirate survivors.
No population, labor, reputation, capacity or mortality formula is established.

## Evidence ledger

| Source | Contribution | Limit |
| --- | --- | --- |
| S1 GRYOnline P4 walkthrough, On the water, updated 2019-08-27 | Explicit survivor pickup, disclosed home port, next-port landing and home-versus-other reward distinction. | Editorial guide, not current-build verification or a hidden-state specification. |
| S2 Steam community P4 guide, updated 2023-07-01 | Describes nearby sea opportunities and survivors moving to the next visited city. | Expansion-era context; wording about crew does not establish permanent ship recruitment or city demographic accounting. |
| S3 official base manual | Crew/convoy and navigation context. | No direct survivor lifecycle specification located in the inspected text. |
| S4 official add-on manual | Sea-map and treasure additions; checked its correction section. | Does not independently verify survivor semantics or unchanged behavior between editions. |
| S5 CPUGamer expansion review, 2011-07-12 | Fleet, labor and management context. | Not evidence of rescue outcomes or population changes. |
| S6 community Ship reference | Ship/crew/refit context. | Not proof that survivors occupy cargo or gun-crew slots. |

The specific home-port reward difference rests on S1 alone. No payout amounts,
source event probabilities or cargo/crew tables are imported. S2's crew wording
must not be converted into an instant crew bonus. Capacity treatment, whether
rescue is optional, who receives any reward, alternate landing restrictions,
transfer between ships, convoy ownership, repeated pickup and save/reload
behavior remain unverified. No live P4 playthrough or source pixels were used.

## Actual Almojarife inspection

Read existing traveller, treasure and encounter notes. Searched `rescue`,
`castaway`, `shipwreck`, `survivor`, `náufrag`, `naufrag` and `rescate` in source,
data and tests; then read the actual event and arrival functions. Hits included
ordinary language about surviving saves and a pirate ransom label, neither of
which is a sea-rescue implementation.

- `data/world.json`: current event records include storm, pirates, favorable wind
  and drifting cargo. The wreck-related narrative belongs to floating goods,
  not an identified group of survivors awaiting landing.
- `src/game/events.mjs`: allowed effect keys cover money, cargo loss, delay and
  salvage. Its drift salvage effect pays cash immediately, based on hold size;
  it does not add passenger custody or a later landing obligation.
- `src/game/encounters.mjs`: actual outcome kinds are pirates and storm, with
  hull/cargo/delay effects. Neither inspected outcome applies survivor custody.
- `src/game/encounterdaily.mjs`: seeded encounter identity, pending decisions,
  final reports and prize acquisition already exist. These are useful lifecycle
  patterns, not a persistent rescue-site/embarked-group contract.
- `src/game/game.mjs`, `arrive`: existing arrival processing handles tolls,
  reporting and several local effects. No rescue-disembark branch was found in
  that inspected function. This is not a claim that arrival infrastructure is
  absent or that all extensions were exhaustively audited.
- `src/game/gamesave.mjs`: existing ship/voyage reference sanitation is relevant
  to any later carrier binding. A new group/site record needs explicit support;
  generic JSON retention alone is not a validated save contract.

Unchanged events, automatic-event, salvage, encounter and lifecycle baseline:
30 tests passed, none failed. No synthetic reward test or new implementation was
added. No claim is made that those tests prove future rescue behavior.

## Ranked design options

1. If wanted, begin with one optional rescue group attached to an existing ship,
   retaining its home-city label and resolving at that carrier's next valid port.
   Keep persons separate from saleable cargo and from hired combat crew.
2. Add a clear landing summary before any reward. Home arrival could be one
   original design option, not a copied payout or a promised demographic bonus.
3. Defer persistent sea sites, population transfers and passenger exchanges until
   their rules are decided. The public descriptions do not settle these systems.

A future contract must define unique pickup/group identity, carrier binding,
exactly-once landing and reward, home city validation and repeat-arrival rejection.
Verify save/load before and after pickup, ship sale/capture, convoy reassignment,
rerouting and blocked ports. Do not let a different owned ship arriving elsewhere
complete the rescue. These are proposed safety requirements for our game, not
verified P4 mechanics. UI and visual review would be required for implementation.

## Source URLs

- S1 https://www.gry-online.pl/poradniki/patrician-iv/na-wodzie/zfb346
- S2 https://steamcommunity.com/sharedfiles/filedetails/?id=682751098
- S3 https://download.kalypsomedia.com/manuals/p4_manual-en.pdf
- S4 https://shared.steamstatic.com/store_item_assets/steam/apps/57730/manuals/P4%20Addon_Manual-enUK.pdf
- S5 https://www.cpugamer.com/reviews/patrician-iv-rise-of-a-dynasty-review
- S6 https://patrician4.fandom.com/wiki/Ship
