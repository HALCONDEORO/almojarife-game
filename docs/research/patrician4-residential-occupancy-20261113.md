# P4 residential occupancy: people are not a construction counter

Research date: 13 November 2026. Almojarife main inspected: `ece23cf`.
Clean-room documentation only. No rent, migration, class or reputation change
is approved. No competitor figures, source prose, images or formulas adopted.

## Scope and prior coverage

`docs/design/house-classes.md` already specifies buildable class houses and
explicitly defers class rent to a separate economy review. The P3 plot-layout
and linkage notes already distinguish our residents from newcomer room and
cover migration, mood and class demand. The P4 church and port-patrol notes
already discuss lasting reputation support from continuing conditions.
This note does not rediscover those features or reopen the deferred rent task.

The narrower question is what counts as an occupied residence in the public
P4 material, versus the building-derived population in our current code.
A building, room available for newcomers, actual tenants and an owner's
continuing reputation support are separate concepts. That distinction is useful
before attaching future benefits to house ownership, even without rental income.

Real searches covered `docs`, `src`, `test` and the open PR list. The open
registry/siege notes and naval-order/chain-ratio reservations are different work.
Search terms included house, housing, resident, tenant, occupancy, rent, alquiler,
inquilino, `houseResidents`, `housingRoom`, `houseClassPop` and `repOf`.

## Read sources and limits

| Ref | Public source | Claim used and confidence boundary |
| --- | --- | --- |
| S1 | Publisher P4 manual, printed pages 13, 26 and 37: https://download.kalypsomedia.com/manuals/p4_manual-en.pdf | Primary documentation, PDF text read page by page: working households need housing; classes inhabit separate houses; lack of housing in a population segment limits city growth and workers; city information distinguishes houses and tenants. Tenant presence in owned houses supports local reputation for as long as that condition persists. No tenant-allocation algorithm or support formula is documented here. |
| S2 | P4 wiki, House: https://patrician4.fandom.com/wiki/House | Community stub: per-house tenant count; owner versus competitor information; owned-house tenant breakdown by class; class designation can change automatically with growth/shrinkage. The occupancy-dependent upkeep, optimal occupancy and visual thresholds are unverified community details, not tuning input. |
| S3 | P4 wiki, Burghers: https://patrician4.fandom.com/wiki/Burghers | Community account distinguishes resident households from transient beggars and separates housing by class. Same wiki as S2, not independent corroboration. Class-share and rent tables not adopted. |
| S4 | P4 wiki, Counting house, Balance Tab: https://patrician4.fandom.com/wiki/Counting_house | Community description lists houses, workers and tenants as distinct owner totals alongside financial history. No proof of per-building tenant assignment or migration timing. |
| S5 | Heraclitus, Steam P4 guide, City Info, Counting House and Architect: https://steamcommunity.com/sharedfiles/filedetails/?id=682751098 | Player guide describes city housing occupancy, owner tenant totals and income from inhabited houses. Supports occupancy as a displayed state distinct from buildings. Not an executed observation or balance proof. |
| S6 | GRYOnline, production buildings guide, updated August 2019: https://www.gry-online.pl/poradniki/patrician-iv/budynki-produkcji/zdb32f | Published guide describes houses becoming more elaborate with wealth and accommodating wealthier residents. This supports change over time, but not every upgrade/downgrade condition stated by S2. |
| S7 | GRYOnline guide introduction: https://www.gry-online.pl/poradniki/patrician-iv/ | Editorial provenance: the guide says it covers a particular base-game version at normal difficulty. Not another independent housing observation. |

The add-on manual was also checked for an explicit housing correction:
https://shared.steamstatic.com/store_item_assets/steam/apps/57730/manuals/P4%20Addon_Manual-enUK.pdf .
No correction of these housing claims was found in that document's text; this
is not proof that every patch preserves the same rules. The rental tables and
source occupancy targets remain outside scope.

## Findings with source boundaries

### Built shelter and tenants are different readings

The manual distinguishes houses from their inhabitants and links housing to
worker availability and growth. The Steam guide and wiki separately describe
occupancy and owner tenant totals. Together they support treating occupancy
as more than the number of houses erected. They do not establish a complete
queue for assigning migrants, workers or households to particular buildings.
[S1-S5]

### Ongoing support is not a one-time construction reward

The manual lists tenants in owned houses among the local reputation conditions
that endure only while the condition remains true. This is primary-document
support for a continuing relationship, not a claim independently reproduced in
the game. It does not specify whether the reputation read is immediate, when
it refreshes, whether all classes weigh alike, or what happens at sale. [S1]

### Changing class is not the same as adding a building level

The community House page describes automatic class designation and both upward
and downward changes. The published guide supports houses changing with growing
wealth, but does not establish the full reverse process. Exact triggers and
per-building transitions remain questions. Neither source authorizes replacing
our explicit buildable house classes or silently converting an owned house.
[S2, S6]

## Actual current-main comparison

| Inspected code | Existing behavior | Bounded difference |
| --- | --- | --- |
| `src/game/buildings.mjs`, `tickBuildings`, `houseResidents`, `houseClassPop` | Construction completion activates the building; residents then derive directly from active type and level. Typed residents contribute explicit class demand. Halting does not evict them. | These readers do not consult a separate per-building tenant count or vacancy state. This is a deliberate resident abstraction, not missing population. |
| `housingRoom`, `src/game/citylife.mjs`, `citylifeDay` | Active, maintained house levels supply additional room; positive weekly migration is bounded by that room and city-level extra population. Existing neighbours are not removed merely because room falls. | City-level arrivals are not a per-house occupancy ledger. Room is additional to derived residents, not a denominator from which to invent an occupancy percentage. |
| `src/game/buildings.mjs`, `freeLabor` | Labor availability includes base population, derived house residents and city-level extra population. | Do not import P4 household/worker ratios into this established convention. |
| `src/game/game.mjs`, daily market setup; `src/sim/market.mjs`, `cityDemandBy` | Typed house residents enter the existing market population and class-demand calculation. | A later tenant model must replace the relevant derived contribution, not add tenants on top of the same residents. |
| `src/game/rank.mjs`, `repOf`; `src/game/memory.mjs`, `memoryRep`; `src/game/reputation.mjs` | City respect and trade reputation already exist, including stored sale respect and a bounded optional grain-memory offset. | These inspected reputation readers do not derive ongoing support from current tenants. This is not absence of reputation, nor a recommendation to add another meter. |
| `tickBuildings`, civic `invest` path | Public-works investment can award respect on completion. | A completion award is not the manual's continuing tenant condition. Houses are not reclassified here as civic investments. |

`house-classes.md` remains authoritative for the chosen explicit classes and
rent exclusion. No rent subsystem is proposed by this comparison.

## Own-design questions, not implementation instructions

- Would a per-house vacancy reading improve decisions enough to justify changing
  the current resident abstraction, or should the UI simply explain the existing
  residents/additional-room distinction?
- If ongoing housing support were selected later, should it follow actual tenant
  presence rather than property count, and how should sale or crisis affect it?
  Source material does not provide our formula or permission to change respect.
- Any occupancy design must reconcile one population across market demand,
  labor, migration, save/load and loss/halting. Retain the existing no-eviction
  rule unless a separately approved design changes it.
- Test a vacant building, occupied building, halted building and sold building
  separately before connecting occupancy to money or reputation. Avoid phantom
  residents, duplicate demand and retroactive loss of neighbours on old saves.

## Verification

Author baseline: `node --test test/house-classes.test.mjs
test/housing-residents-room.test.mjs test/citylife.test.mjs
test/citylife-rules.test.mjs`: 37 passed, none failed on the pinned main.
These test existing class demand, residents/room, save round trips and city life;
they do not test P4, new occupancy state, rental balance or a reputation change.
No runtime files changed, no competitor executable run and no visual/UI claim.
