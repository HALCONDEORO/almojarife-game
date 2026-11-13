# P4 expansion: land access, depots and wagon trains (clean-room)

13 November 2026. Checked main: `8f9bed5` (through PR873).
Scope: the documented land-trade loop in **Patrician IV: Rise of a Dynasty**,
not the base game's complete transport rules or a historical Iberian transport model.

## Decision in brief

There is a real research gap: an owned land carrier on a separately authorised
road network, with a depot lifecycle and an escort/toll decision. Almojarife
already has sea routes, owned convoys, cargo storage, guards and tolls in other
contexts. It does not need those systems invented again. The useful next design
experiment would be a small mode-aware transport boundary, not another automatic
trading algorithm or a renamed ship with road graphics. This is a proposal only;
no feature, map expansion, spending rule or release scope is approved here.

## Evidence and method

Public documents were searched and the relevant fetched sections read. No game
binary, extracted data, utility chart, modding-internals reference, competitor
code, asset, numerical balance table or copied source wording was used. No
runtime experiment was performed. Documentation establishes intended behavior,
not a patch-specific guarantee. Sources retrieved on the date above:

| Ref | Source and type | Used for / limits |
| --- | --- | --- |
| S1 | Kalypso/Gaming Minds, expansion manual, sections Land trade, Wagon depot, Wagons and wagon trains, Escort mercenaries: https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/57730/manuals/P4%20Addon_Manual-enUK.pdf | Primary description of access, creation, organisation and interception outcomes. Strong documentary evidence, not measured formulas. |
| S2 | Publisher product description on Steam: https://store.steampowered.com/app/57730/Patrician_IV_Rise_of_a_Dynasty/ | Confirms expansion identity, inland trade, road network, rulers and threats. Marketing is not an edge-case specification. |
| S3 | PC Games, contemporary expansion review: https://www.pcgames.de/Patrizier-4-Aufstieg-einer-Dynastie-Spiel-15623/Tests/Patrizier-4-Aufstieg-einer-Dynastie-im-Test-Dieses-Add-on-hat-wirklich-viel-zu-bieten-817931/ | Independent account of access, wagon grouping, automatic routes and hired protection. Not proof of exact probabilities. |
| S4 | Heraclitus, Steam community guide, Wagon Convoys and Trade Screen: https://steamcommunity.com/sharedfiles/filedetails/?id=682751098 | Player-facing route similarity and transfers between storage and carriers. Author explicitly doubts their own identification of all attackers; that speculation is not adopted. |
| S5 | Steam discussion, player reports about the expansion: https://steamcommunity.com/app/57620/discussions/0/666824801254739469/ | An anecdote about inconsistent automatic loading motivates regression tests, not a claim that every version is broken. |
| S6 | Gram.pl, Lukasz Wisniewski, review dated 15 August 2011: https://www.gram.pl/artykul/2011/08/15/patrician-iv-narodziny-dynastii-recenzja.shtml | Independent account of inland-route unlocking and ruler demands in a base-plus-expansion package. No numerical requirements or historical claims adopted. |

These are primary documentation, publisher description, independent reviews and
community accounts. Sources may describe the same intended system and are not
independent gameplay experiments. The exact network, city list, values, source
phrases and progression thresholds are deliberately not reproduced.

## Documented loop, in our own words

### Access is permission on a network, not ordinary route editing

The expansion manual makes rulers responsible for opening road connections.
Relations matter, but a satisfied ruler is not a promise of an immediate offer.
The ruler's jurisdiction and discovery of the destination also constrain which
connection can be offered. The network can connect coastal settlements as well
as give access to inland ones. [S1, corroborated in broad outline by S2/S3/S6]

This separates knowledge of a place, permission to use a connection, and a
carrier's itinerary. It does not prove that every road is bidirectional, that
permission can never be revoked, or that buying territory follows the same
state transition as opening a connection. Those are open questions here.

### Depot, stored wagons and an operating train are distinct stages

The manual describes a wagon depot appearing automatically in cities reachable
by a land route. Wagons are ordered there, then stand near the marketplace.
Creating a train activates transport with animals, a driver and ongoing costs.
Wagons can be grouped, and the train can receive automatic trade instructions
using a workflow analogous to sea convoys. [S1; grouping and automation also S3]

The review's account of construction in coastal towns is narrower than the
manual's description of depots in reachable cities. The manual is the preferred
documentary contract; the review alone does not establish a coast-only rule.
No construction recipe, completion time, carrying capacity, running-cost
schedule or requirement to build roads physically is established by this note.
Opening a route must not silently be translated into an earthworks simulation.

### Protection changes an interception outcome, not a naval battle

The manual associates an unhappy ruler with more road toll demands backed by
armed collectors. Hired mercenaries accompany the train; resisting can lead to
a fight, and losing can increase the toll. It explicitly says a wagon train is
not lost through combat. [S1] The store describes highwaymen more generally;
that does not identify every possible attacker as a ruler's collector. [S2]

The community guide reports no player-managed land combat, and describes hiring
protection through the tavern. [S4] Do not infer a tactical battle screen, naval
capture, sinking, cargo immunity or zero casualties from the train-survival
statement. The manual does not settle all those consequences here. Likewise,
the guide's uncertain claim about relation loss after defending is not promoted
to a rule. Relations, escort strength and toll outcome are qualitative only.

### Interchange matters more than a second price formula

The guide describes one trade interface handling market transactions and
transfers among storage, ships and wagons. [S4] That supports using a common
commercial boundary while preserving the difference between a sale to a market
and a movement of owned stock. It does not establish automatic transshipment,
reservation priority, or what happens when two carriers demand the same stock.
The isolated report of loading problems [S5] is a reason to test these contracts,
not to reproduce an alleged exploit or assume a universal source-game defect.

## Delta against actual Almojarife main

Prior P3 notes mention road-building missions and civic roads; those are not
this owned-carrier loop. PR856-873 cover other P3 chapters and public-convoy
service. Existing P4 ammunition and route-UI notes do not specify land carriers.
Road-looking city scenery is also not a transport network.

| Existing source | Verified behavior / precise missing boundary |
| --- | --- |
| `src/sim/world.mjs` | Builds one untyped adjacency from `world.lanes`; `route` finds paths on that graph. There is no road-mode or ruler-permission edge filter. Adding roads directly to `lanes` would make them eligible to the existing route finder. |
| `src/game/game.mjs`, `src/sim/trade.mjs` | `doSail` uses ship movement, wind, crew/captain and hull factors. Daily travel advances ships. This is working maritime transport, not a reusable land carrier merely because it has endpoints. |
| `src/game/routes.mjs` | Automatic routes iterate `g.ships`, invoke buy/sell/sail operations, and pause when a ship belongs to an owned convoy. Generic-looking stop rules do not mean group routes or wagon trains already work. |
| `src/game/convoys.mjs` | Owned groups reference ship IDs, sail together and derive escort support from companion armament. A wagon train with hired road escorts needs a different ownership and protection contract; naval convoy support already exists. |
| `src/game/game.mjs` storage operations, `src/game/whlock.mjs` | Ship/warehouse transfers and book-cost movement already exist, with warehouse locks on loading. Reuse their economic invariants rather than making depot loading a new source of goods or profit. |
| `src/game/tolls.mjs`, `src/game/whwatch.mjs` | Dock tolls and warehouse watch already exist. They are not a relationship-sensitive road interception or a travelling mercenary roster. |
| `src/sim/market.mjs` | Local supply already abstracts small-boat and overland trade. This note does not claim the economy lacks all land supply; the gap is player-owned, traceable land carriage. Do not remove the abstraction without an economic migration decision. |
| `src/game/gamesave.mjs` | Save sanitization and ID remapping explicitly handle ships, voyages and convoy references. New transport state needs its own validation and reference policy; generic serialization is not sufficient. |

## Ranked design proposal, not source-game facts

1. **First: a transport contract experiment.** Keep road and sea reachability
   separate, including permission checks at departure. Use synthetic fixtures,
   not imported city networks. Define a land carrier's identity, location,
   capacity, cargo ownership and travel state without inserting it into
   `g.ships` or giving it a hull. Existing omitted/disabled behavior stays
   unchanged. No map expansion is needed for the initial contract tests.
2. **Then: depot and interchange.** Define stored wagon versus active train and
   how creation, grouping, dismissal and costs affect ownership. Transfer via
   the existing warehouse accounting boundary where practical. Reuse price and
   cash-brake semantics, but do not run a train through `processRoutes` until
   the group-operation contract exists. No implicit sale during transshipment.
3. **Only after that: permission and protection UI.** Show the blocked edge and
   reason, ongoing commitments and what an escort can and cannot prevent.
   Resolve a road interception once through its own seeded report. Do not call
   the naval sinking/capture resolver by default. An own-design non-destruction
   rule is a choice to approve, not proof that cargo or personnel must survive.

This is medium-to-large system work if implemented as a whole. A documentation
note is not a small implementation promise. Own tuning, historically supported
Iberian routes and jurisdictions, AI parity, asset names and any map/campaign
expansion need separate decisions. Territorial purchase as permanent protection,
reported by S3, is outside this proposed first slice and remains unverified here
as a universal runtime outcome. No automatic payment policy is selected.

### Acceptance contracts for a future experiment

- A ship cannot take a road shortcut; a land carrier cannot use a sea lane.
  Unknown endpoints, absent permission and unavailable paths reject without
  cargo, cash, route-index or ID-counter mutation.
- Route-permission changes invalidate any cached reachability. Define before
  implementation whether an already departed train completes or stops safely;
  never strand it by silently deleting its current location or cargo.
- A wagon belongs to at most one train. Formation, disbanding, repeated commands
  and stale selections cannot duplicate membership or an upkeep commitment.
- At an interchange, quantities and book cost are conserved across ship,
  warehouse and train. Capacity, co-location and warehouse locks apply. Transfers
  do not move market stock, produce sales revenue or earn trade reputation.
- Competing load requests use explicit ordering or reservations. An automatic
  route cannot load the same stock twice or unload/reload forever without an
  explainable wait state. Refusal is logged without advancing an unfinished stop.
- Escort recruitment and wages are explicit. A replayed interception cannot
  debit a second toll or apply a second loss. Save/load preserves its pending
  decision and report, including carrier and escort identity.
- Missing new fields preserve old sea-only saves and seeded outcomes. Malformed
  references reject or repair according to a declared policy, not by turning a
  wagon into a ship or reusing a live ID. Equal fixtures use the same rules for
  bots and players; enabling bot land expansion is a separate scope decision.

No implementation or new tests are included. Existing source-game probabilities,
route counts, capacities, costs and formulas remain intentionally outside the
note. Current patch-specific behavior and historical suitability remain open.
