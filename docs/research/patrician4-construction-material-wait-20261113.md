# P4 construction awaiting market supply versus Almojarife procurement

Date: 2026-11-13. Base inspected: `8290a85`. Clean-room documentary note.
No source values, quotations, slogans, assets, extracted data or excluded modding
sources. Docs only; no implementation, balance or release change approved.

## Answer and correction to the starting hypothesis

The P4 base manual describes placing and paying for a building, followed by
collection of required materials from the market. If supply is unavailable, the
architect waits before construction begins. An official update notice separately
adds a missing-material icon and explanatory tooltip. The narrow lesson is that
an accepted order waiting for supplies is not the same state as active work.

Actual Almojarife code does not simply reject construction when a local market
is empty. It uses unlocked warehouse stock first, then local market supply and
imported shortfall at an additional cost. Its existing paid queue waits for a
city construction crew, not for materials. The initial hypothesis of a missing
material-wait state must therefore not become a claim that our implementation
cannot build under shortage or lacks a queue.

This is a deliberate policy comparison, not evidence either game is incorrect.
Do not remove imports or add a second queue under the guise of a bug fix.

## Evidence and edition limits

| Source | Finding | Limit |
| --- | --- | --- |
| S1 official base manual, Businesses and Buildings, PDF/printed page 20 | Paid/placed construction draws materials from the city market and waits before work if they are unavailable. | Does not specify partial reservations, price locks, refunds or cancellation. |
| S2 official update notice, dated 2010-12-17 | Adds a material-shortage icon with tooltip details. | Does not specify the complete state machine or identify an exact current build. |
| S3 Steam community guide, architect section | Materials must be on the city market, not in private storage or a convoy; shortages hold up work. | Guide wording is less precise about waiting-to-start versus halting mid-work. Do not infer a second mid-build consumption model. |
| S4 Steam purchasing discussion, opened 2013-06-23 | Replies report that private warehouse materials must be sold to the city for the architect to use them, and supply after ordering can allow work to begin. | Player evidence, not proof of atomic reservation or every edition's behavior. |
| S5 community production reference | Context for construction requirements and production facilities. | Its table does not establish shortage timing; values are not imported. |
| S6 official add-on manual, correction section | Checked for changes that would alter the construction claim. | No explicit correction located there; silence does not prove identical behavior across all releases. |

The primary evidence is the documented base-manual waiting-before-start rule.
No live P4 playthrough, building completion sequence or patch-specific experiment
was performed. Whether payment is final, materials are reserved piecemeal, prices
are recalculated, other builders compete for reserved supplies, or cancellation
is possible remains unverified. Do not invent any of those mechanics.

## Actual code reads and bounded findings

Searched `quoteConstruction`, `startConstruction`, `materials`, `queued`,
`construction`, `fromStore`, `imported`, then read function bodies and tests:

- `src/game/buildings.mjs`, `quoteConstruction`: checks eligibility and the owned
  plot, calculates warehouse contribution excluding locked goods, and quotes the
  remaining units through `quoteUnitsImport`. The quote is not itself an order.
- `src/sim/recipes.mjs`, `quoteUnitsImport` / `consumeUnitsImport`: local supply
  and external shortfall are handled separately; imported units do not enter city
  market stock. Thus a locally empty shelf does not itself create waiting work.
- `startConstruction`: re-quotes, checks cash, procures required units, removes
  warehouse materials and charges the order before creating work state. Rejected
  unaffordable work does not create an accepted-material-wait obligation.
- `cityActiveConstruction`, `cityQueue`, `constructionEstimate`, `tickBuildings`:
  accepted work is active or waits behind the city crew, then starts when that
  crew is free. The inspected queue start does not recheck market materials.
  That is consistent with procurement at ordering, not a missing supply retry.
- `src/view/buildingsview.mjs`: already projects imported quantities and renders
  an import indication. Existing queued-state presentation distinguishes waiting
  for the crew from active work. No claim of absent shortage/cost information
  across the entire UI is made; no actual pixels were inspected here.
- Existing `construction-warehouse` tests exercise private material use, paid
  imported shortage, stale-quote repricing and rejection without partial stock
  consumption. Queue tests exercise the separate crew wait. Unchanged focused
  construction/warehouse/queue/import baseline: 16 tests passed, none failed.

This note adds no new runtime experiment or test. Baseline results do not prove
P4 behavior, all construction pathways, future cancellation or complete save
migration. Shipbuilding/public-project differences were not exhaustively audited.

## Ranked design options and questions

1. Preserve current procurement and explain warehouse, local and imported inputs
   together with the fact that crew waiting begins after materials are paid for.
   This can address planning confusion without changing economic rules.
2. If a future design wants supply-bound construction, define a separate accepted
   but not-yet-procured state. Decide payment, reservations, repricing, partial
   supply, notifications and cancellation before changing the queue.
3. Defer an all-city material competition model. A wait icon alone does not justify
   new stock allocation, AI priority or perpetual retry mechanics.

Any future supply-bound state needs conserved money/materials, a stable order ID,
exactly-once start, repeat-tick/load safety, clear blocked reason and a cancellation
contract. Check stock arriving after order, other consumers taking it, locked
private stock, insufficient cash after repricing and empty market with imports
allowed. Keep crew wait and supply wait distinct. These are proposed acceptance
questions for our game, not recovered P4 internals or current implementation work.

## Source URLs

- S1 https://download.kalypsomedia.com/manuals/p4_manual-en.pdf
- S2 https://store.steampowered.com/oldnews/4807?l=german
- S3 https://steamcommunity.com/sharedfiles/filedetails/?id=682751098
- S4 https://steamcommunity.com/app/57730/discussions/0/846956740716465556/
- S5 https://patrician4.fandom.com/wiki/Production_Facilities
- S6 https://shared.steamstatic.com/store_item_assets/steam/apps/57730/manuals/P4%20Addon_Manual-enUK.pdf
