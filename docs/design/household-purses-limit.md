# Household purses limit discretionary spending (decision 26/10/2026)

Decision owner: delegated by Marco ("2 tu decides", WhatsApp 26/10 12:06, answering the open
#229/#223 question: do household purses limit sales or only measure?). Decided with evidence
from the live human playtest (seed 1983901294, day 103).

## Decision

Household purses LIMIT discretionary (non-food) retail spending and only MEASURE food.

- Every good not classified `food` in `NEED_GROUP` is discretionary. Each day, after food is
  settled exactly as before, every class purse caps what its class can buy of each remaining
  good, in catalogue order. Units the purses cannot pay stay on the shelf.
- Food (grain, fish, meat, salt, olive oil, legumes) is never capped: consumption follows the
  legacy market and the purses keep recording what each class could not pay (`unmet`), until a
  welfare/starvation model exists. The phase-1 note already warned against cutting essential
  food by purse without that model ("study essential-food elasticity separately from
  discretionary luxuries").

## Evidence from the real game (save at day 103, 32 ports)

- Rich purses sit at ZERO in 18 of 32 ports with large `unmet`: Sevilla 360.671 (~10% of the
  rich daily spend), Barcelona 289.602, Palma 124.219, Bilbao 94.435. In small ports the rich
  leave 20-25% of their luxury consumption unpaid. The legacy market let them consume it anyway.
- Poor purses ACCUMULATE (Cádiz +374k, Sevilla +1,35M, Lisboa +1,6M): everyday food is always
  affordable (poor `unmet` ~1%), so measuring food changes nothing today and keeps needs
  telemetry honest.
- The playtest's own automated pepper route (Lisboa→Cádiz, 5 loops, 25 units sold at 200+
  each loop) works precisely because luxury absorption never looks at the purse. Under this
  decision, a port whose rich are spent out keeps the unsold pepper on the shelf, the price
  falls, and the route stops paying: saturation becomes self-correcting.

## Mechanics (src/sim/market.mjs)

`tickMarketCity` processes goods in two passes when the commerce ledger is on. Pass one: food
goods, exactly the legacy path. Then each class budget is yesterday's purse plus today's income
minus its food bill. Pass two: every other good in catalogue order is capped by
`capRetailByPurses` (src/sim/households.mjs): desire shares split the sale by class as before,
each class pays at most its remaining budget, and only whole paid units leave the shelf.
Without a commerce account the tick is byte-identical to before. Settlement and unmet
accounting are unchanged; a cap can never increase consumption.

## Declared test change (one, following the #229 precedent)

test/commerce.test.mjs "recording never changes the economy" asserted the ledger was invisible
to the whole economy. That was the "purses only measure" semantics, which this decision
replaces. The test now asserts what must still hold: food entries and ship trades are identical
with and without the account, and any divergence in discretionary goods is confined to stock
(caps never raise consumption). New coverage in test/purse-limit.test.mjs (5 tests).

## Measured impact (tick-only year, no player)

365-day tick-only run: unsold luxury accumulates where purses exhaust (Sevilla pepper stock 318,
silk 106; Cádiz and Palma rich purses at 0 with ~11k/~126k unmet over the year). Food consumption, AI 20-year gates
(test/ai.test.mjs 7/7) and cash/basis reconciliation identities are unchanged. Wholesale cash
accumulation remains the known phase-1 limitation, not claimed as solved here.

## CI fallout on the v2 head (26/10) — evaluated, all three expected consequences, no regression

1. **citylife OFF golden (cadiz_wine 113 -> 171).** Expected. With purses limiting discretionary
   retail, Cadiz's rich purse (income ~16k/day minus its food bill and earlier catalogue goods)
   leaves ~1 unit/day of wine desire unsold; over the 60-day golden scenario the shelf keeps +58.
   Verified cell-by-cell on the exact scenario: ONLY cadiz_wine moves (cash 1888, grain 100,
   sevilla_grain 297, sevilla_pop 40000, lisboa_beer 269 identical). Golden updated with this note,
   following the 124 -> 113 (fees) and 121 -> 124 (saffron) precedents.
2. **balance gate A@1y NPC worth 459320 vs band [32934, 357228].** Expected. Capped luxury demand
   leaves stock on shelves, prices sag (priceIndex 1.0398 -> 1.0334), NPC arbitrage margins grow:
   y1 worth 277679 -> 459320 (+65%), but the trajectories stay inside the old head's own range
   (old head reaches 684446 by y3; new head reaches 609370 by y2) — faster NPC capital accumulation,
   not runaway inflation. Builder-bot outcome is byte-identical on both heads (cashEnd 2919,
   seed 1 1868), so the builder/local economy is untouched. Band 365 recalibrated with the
   documented rule (tools/sim_npc_worth_bands.mjs, seed 0, window years 1..3: min 281268,
   max 609370 -> [140634, 2437480]); other horizons untouched (their checks still passed on CI).
3. **4 wiki goods tests (pottery/legumes classifications).** Side effect of the v1 NEED_GROUP
   reclassification; reverted. Food vs discretionary now lives in PURSE_UNCAPPED
   (src/sim/households.mjs: grain, fish, meat, salt, olive_oil, legumes), NEED_GROUP untouched,
   wiki tests green again.
