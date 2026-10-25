# Commerce ledger, phase 0: measurement only

Re-author of the household-procurement concept (PR #229, 22/10) on current main. The
original phase-1 made the wholesale purse binding in the same step that introduced it and
shipped red (24/62): the purse capped producer revenue at household demand with no
calibration behind it. This phase 0 keeps the accounting and drops the behavior change:
the market runs exactly as today, and the ledger records what it does.

## What is recorded

One account per port at `market[city].grain.commerce` (same shelf as `grain.needsLedger`;
city iteration stays goods-only). Created by `src/sim/procurement.mjs`:

- `cash` — the wholesale purse. Identity: `cash = openingCapital + retail + received - paid`.
- `inventoryBasis[good]` — book value of the stock on hand: what the purse paid for it.
  Identity: `Σ basis = openingInventory + localSupplyValue + paid - releasedBasis - consumedBasis`.
- Flows: `retail` (household consumption at the day's price), `received` (traders, steward,
  construction buying from the market), `paid` (traders, steward, workshops selling into it),
  `localSupplyValue` (primary production and city trickle: inventory nobody was paid for,
  valued at base), `consumedBasis` / `releasedBasis` (book value leaving the shelf).
- `households` — per-class purses (`src/sim/households.mjs`): daily income per person
  (poor 0.48, middle 1.20, rich 4.65; carried from the 22/10 research policy), attributed
  share of the day's ACTUAL retail spend proportional to each class's desire — an estimate
  with the same honesty rule as needsLedger, never an observed purchase — and `unmet`,
  what a class could not have covered.

Opening capital = stock on hand valued at base. For a new game that is the founding
inventory; for an old save it is whatever stock exists when the save first loads or ticks
under this version (declared approximation: history before the ledger is not invented).

## What it never does

It never limits a trade, never changes a price, a stock or any trader. The purse may go
negative; nothing stops. `test/commerce.test.mjs` pins this: identical ticks, stocks and
trade outcomes with and without the account, and a full sale into a deep-negative purse.

## Declared scope (not instrumented in phase 0)

Materials imported from outside the port (the external part of `quoteUnitsImport`),
council fees and derechos, ship upkeep, wages. Recorded flows: ship purchases/sales
(`trade.buy`/`trade.sell`, covering player and NPC), steward standing orders, workshop
input purchases and output sales, primary production and by-products, construction
materials drawn from the local market, daily production/trickle and household consumption.

## Gate and fixture adjustments

`COMMERCE_LEDGER_ENABLED` (default ON) gates account creation, mirroring
`NEEDS_LEDGER_ENABLED`; recording follows account presence so old saves are consistent
once opened. One existing test was adjusted, not weakened:
`basic-producers.test.mjs` "primary production needs no cash and consumes nothing else"
now strips the telemetry `commerce` field before its JSON comparison, exactly as the
needs-telemetry suite strips `needsLedger`; the economic assertion (no stock/cash side
effects) is unchanged.

## Phase 1 (not in this PR)

A binding purse: producers sell only while the purse can pay, households buy only what
they can afford. That changes the economy and needs its own economic justification,
calibration and review — the step PR #229 skipped.
