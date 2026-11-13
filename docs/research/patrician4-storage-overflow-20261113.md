# P4 warehouse overflow: a soft limit is a financial commitment

13 November 2026. Public-document, clean-room research only.
Code comparison base: `d8d6a82b13ff6b784370af99ac0b827386c4d7ce`.
No runtime, data or balance changes accompany this note.

## Scope and recommendation

P4 documents extra rented storage when owned space is exceeded. The useful
lesson for Almojarife is to distinguish owned capacity, stock and any ongoing
cost rather than silently turn a hard cap into a bill. Keep our current policy
unchanged. A future rental experiment needs an explicit design decision and
cost/undo rules; this note neither approves nor implements one.

The existing `patrician3-tippsammlung-towns3-notes.md` already warns about P3
rented storage and floating warehouses. This is a narrower P4 comparison of the
capacity/cost contract and what our current admission paths actually do. It is
not another administrator-trading study and does not cover land logistics.

## What the public sources establish

### Owned capacity need not be the admission limit

The publisher's P4 manual, printed/PDF page 15, contrasts finite convoy cargo
space with counting-house storage that can expand through rented space [S1].
It explicitly warns that this extra space is costly. It does not provide a
rental formula, charging boundary, approval dialog or insolvency behavior.

The independent GRYOnline guide describes automatic extra rental rather than
trade or production stopping when owned storage is exhausted [S2]. The
community wiki independently describes used stock above owned capacity as the
trigger for automatic rented storage [S3]. These support the documented soft
limit; they are not a measurement of all admission paths in a running build.

### Storage has distinct stock and cost views

The guide describes owned warehouse count, maintenance, owned space and space
required by current goods in the storage view [S2]. The wiki describes a
separate balance view and warehouse view [S3]. Our design inference is that
capacity utilization and ongoing costs should be legible together. Neither
source establishes the precise rental accounting period or a net-profit formula.

The wiki also reports extra vulnerability of rented goods [S3]. That is a
community claim, not confirmed by the manual passage used here. Do not turn it
into a theft probability or assert that our watch system implements it.

### Building versus renting is not a settled universal strategy

A first-person P4 play report discusses rental fees reducing the return on
holding a temporary glut, and the opportunity cost of building more storage
[S4]. It is useful evidence of a player-facing decision, not proof that one
option always wins. A later community reply says renting is cheaper [S6],
without a game/version-specific calculation. That conflicts with the guide's
simple advice to build instead. Neither claim settles a break-even threshold.

A general tips page also describes overflow costs and storage protection [S5].
It supplies no independent runtime experiment; use it only as corroboration,
not as the authority for numerical values or optimal strategy. No capacities,
prices, rates, guard counts or balance tables from these sources are imported.

## Actual Almojarife delta, checked in function bodies

| Current code | Verified behavior and limit of the check |
|---|---|
| `src/game/game.mjs`, `warehouseCap`, `storeGoods` | Capacity is base space plus building bonus. A manual deposit clamps to remaining room and existing cargo. When nothing fits it returns failure; excess remains aboard. No rental is created in this function. |
| `src/game/steward.mjs`, `setStewardRule`, `stewardTick` | Rule configuration can reject a target above the supplied cap. Purchase processing computes remaining aggregate space and bounds purchases by it. This is not a soft rental allowance. Existing sale/reserve logic is separate and is not changed here. |
| `src/game/almoneda.mjs`, goods-lot award branch | Checks aggregate stock plus the lot against capacity before deducting cash or adding the lot. A full warehouse rejects the award instead of renting space. |
| `src/game/buildings.mjs`, `warehouseCapBonus`, `activeLevels` | Capacity bonus comes from active warehouse-building levels. This is an existing expansion path; it is not rented inventory. Construction costs/upkeep already exist, so 'storage is free' would be wrong. |
| `web/main.mjs`, warehouse tab | Displays used, capacity and free space. The store button is enabled based on cargo presence, not remaining warehouse space, so the command remains responsible for clamping/rejection. No dedicated rental-use/cost readout appears in this inspected tab. |
| `src/game/whwatch.mjs` | Warehouse guards and wages exist. The existence of security spending does not prove rented-storage risk or a rental subsystem. |

These are bounded entry-point checks, not a proof that every possible inventory
mutation in the repository obeys a global capacity invariant. Save loading,
scripted rewards and all production paths have not been exhaustively audited
for over-capacity states. A stored state above capacity should not be assumed
to mean a rental contract exists.

## Own proposals, ranked and not approved implementation

1. Small UI experiment under the existing hard-cap policy: preview how much of a
   requested manual deposit fits and explain when the warehouse is full. Use the
   same authoritative command result; do not discard excess cargo or charge rent.
   Test empty, nearly full and full warehouses, construction-expanded capacity,
   repeated clicks and aggregate stock across goods.
2. If design later wants soft limits, first specify who may create a rental,
   which inflows qualify, quote/consent behavior, billing time, rounding,
   affordability, cancellation and what happens after space becomes available.
   Persist liabilities explicitly and test reload/replay and boundary crossings.
   This is a new economy/accounting policy, not a Web-only enhancement.
3. Before comparing renting with construction, measure independently designed
   costs over declared horizons and stock patterns. Include maintenance,
   security and capital opportunity cost separately. Do not encode a source's
   advice as a required winning strategy.

## Open questions and evidence limits

- P4 rental price curve, rounding, billing timing and capacity-loss behavior:
  not verified by these sources or by runtime observation.
- Whether all P4 automatic inflows use identical overflow handling: open.
- Whether our full warehouse should disable Store or offer a partial preview:
  product question; no current behavior is declared a bug solely from P4 parity.
- All checked Almojarife tests are baseline tests, not proof of a new mechanism.
  No historical P4 executable was run, inspected, decompiled or extracted.
- Only original prose and source references are added. No screenshots, game
  assets, game data tables, exact competitor balance parameters or copied slogans
  are included in the repository.

## Sources read

- S1. Publisher, P4 base manual, printed/PDF page 15, trade-window storage
  description. Primary documentation, strongest evidence for the documented
  capacity distinction: https://download.kalypsomedia.com/manuals/p4_manual-en.pdf
- S2. GRYOnline, "Patrician 4: Kantor", page says updated 27 August 2019,
  storage subsection. Independent guide, not a measured pricing study:
  https://www.gry-online.pl/poradniki/patrician-iv/kantor/zab332
- S3. Patrician 4 community wiki, Counting house, Warehouse and Balance tabs.
  Community documentation; risk claim remains unverified by S1:
  https://patrician4.fandom.com/wiki/Counting_house
- S4. Dan B. Scott, "Contango in Patrician 4", page publication metadata
  13 November 2021. First-person play report; stockpiling/rental opportunity
  cost discussion, not a general profitability proof:
  https://danbscott.ghost.io/contango-in-patrician-4/
- S5. Cheatbook, Patrician IV tips, overflow section. General secondary tips,
  undated on the fetched page; no independent experiment identified:
  https://www.cheatbook.de/files/patrician4.htm
- S6. Reddit r/patrician, "Extra Warehouse storege cost", question July 2024,
  reply August 2024. Version-unspecified anecdote, not P4 mechanical authority:
  https://www.reddit.com/r/patrician/comments/1dwn578/extra_warehouse_storege_cost/
