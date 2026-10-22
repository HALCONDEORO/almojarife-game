# Household and wholesale accounts, phase 1

Research base: main b0f0361. This phase is accounting infrastructure, NOT the completed saturation redesign.

## Accounts

Each port has one persistent wholesale purse, inventory basis by good, and one persistent household purse per class. Stored under `market[port].grain.commerce` to preserve existing goods-only iteration and JSON saves. Grain is a required catalogue staple. Existing saves get base prices and accounts at load; new markets open accounts immediately. Opening cash and opening inventory are separate declared capital contributions, each equal to initial inventory at base price. They are never reissued daily or per seller.

Household income is an explicit external daily source: 0.48 / 1.20 / 4.65 per person (poor/middle/rich), from the laboratory. It is NOT a historical wage claim or final calibration. There is no debt or new purse per good. Food is allocated before other goods; proportional integer allocation spends affordable leftovers before luxury. Current fractional wants carry; unmet whole wants do not accumulate. Income minus retail spending equals household cash. Retail spending credits wholesale exactly once.

Ship traders, warehouse administrators and workshop output draw from the same wholesale purse with the same post-unit prices. Cash exhaustion produces partial fills or no sale, retaining unsold cargo/basis. Ship purchases, steward purchases and construction/production materials replenish that purse. Primary production contributes recorded inventory without minting wholesale cash. Fees follow the existing market deal total, not a new extra treasury withdrawal. Existing council fee attribution is unchanged and outside this phase's cash reconciliation scope.

Wholesale cash = opening cash + retail + received from market buyers - paid to sellers.

Inventory basis = opening inventory + local supply value + paid to sellers - consumed basis - basis released to market buyers.

These are bookkeeping identities, not a claim of closed-economy money supply: household income, local production and council fee attribution remain explicit external flows. Old universal goods trickle remains in phase 1. Consequently wholesale cash can grow substantially; this phase does not claim that cash alone bounds silk extraction.

## Scope and tests

D's replacement class basket is included unchanged (meat 0.10/0.28/1.00 per 1000/day). Meat base price is still 25. No import quota, price floor/ceiling, AI privilege or balance-band change.

The old test demanding day-365 and day-730 stocks to be exactly identical used the stateless, no-day rounding API. Persistent class fractions make that an invalid periodicity requirement. Explicitly replaced that ONE test with four checks: world-optional API matches explicit world, finite integral stock, save at 365 then continue exactly matches uninterrupted 730, and cash/inventory reconcile. All numeric clamp/economy thresholds remain untouched.

Baseline free-play run with three current NPCs, Cadiz start: NPC cash plus onboard cargo at base = 283461 at day1825 and 445287 at day3650. This is not full net worth and excludes retained bot shipyard/franchise changes.

## Follow-on acceptance work

- Poor households in the earlier experiment could be priced out of essential grain before budget allocation. Food priority does not solve that. Measure fulfillment relative to price-independent staple wants, per-capita quantities and affordability by class; study essential-food elasticity separately from discretionary luxuries. Do not silently relax the class basket or claim success from lower NPC wealth.
- Calibrate income and opening capital. Current income is explicit research policy. Large accumulated wholesale cash is a limitation, not saturation success.
- Finite imports/local luxury production need their own calibrated phase. The prior 60/30-day quota is NOT included here.
- Full-game money attribution, shocks, spoilage and inventory transfers need extension before claiming a closed accounting model. This phase reconciles the market flows implemented here.
- No UI layout change. Existing UI previews receive partial sales; no visual/UI PASS claimed in this patch. A reason code for an empty wholesale purse is currently internal, with no new UI control.


## Verification, 22 October 2026

Full suite, every test file once in disjoint partitions to stay below the execution time limit: 250 + 217 + 145 + 7 = 619 tests, all PASS. The last partition is the complete AI suite: 20-year 0/6/12 trader clamp gates unchanged. This is a complete suite, not a filtered selection; the commands exclude ai.test.mjs from the three lexically partitioned batches and run it separately.

One producer test was updated to compare all non-iron goods without the new shared accounting metadata, then independently assert unchanged wholesale cash and exact iron inventory basis increase. This preserves its old physical-goods assertion; accounting now must change when primary output is produced.

No double independent PASS or merge has yet occurred. Reviewer must inspect the explicit policy, initial capital and period-test change.
