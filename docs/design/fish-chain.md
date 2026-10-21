# Fish chain, step 1: fresh fish and the fishery

First link of the production-chains plan: a new trade good **fish** (fresh catch) and a new
primary-producer building, the **fishery**. Step 2 (planned) adds the smokehouse, a processor
turning fish + salt into dried_fish, so the 12 dried-fish towns import fresh fish instead of
conjuring it.

## What changes

- `data/world.json`: new good `fish` (base 13). Fishing towns: malaga, almeria, alicante,
  ibiza, tarragona, santander - deliberately **not** the 12 dried-fish towns, so the chain
  requires shipping fresh fish to the smokehouses. sevilla, valencia and barcelona **need**
  fish as a cheap staple (per-1000 demand: poor 0.6, middle 0.3, rich 0.1 - below dried_fish,
  which is the preserved staple).
- `src/sim/recipes.mjs`, `src/game/buildings.mjs`: `fishery`, a primary producer
  (yield 3/day/level, jobs 4, recipe timber 8 + cloth 2, fee 150, buildDays 3, upkeep 1).
- `web/main.mjs`, `web/icons.mjs`: ES/EN names (Pescado/Fish, Pesca/Fishery) and a flat SVG icon.
- `test/fishchain.test.mjs`: 5 tests (good wiring, chain topology, build rules, production,
  save round-trip). `test/world.test.mjs`: goods count 12 -> 13.
- `tools/sim_fish_balance.mjs`: the measured balance below.

## Measured balance (8 seeds, 1 game year, A/B)

`tools/sim_fish_balance.mjs` at santander (small fishing town, natural inflow about 6-8 fish/day).
Each day a fixed DRAIN of fish leaves the local market (what smokehouses or a fleet would take);
the sim records units actually served, average fish price and the share of days the stock hit zero.

| Drain | Scenario | Served/year | Avg price | Stock-out days | Running cost/year |
|---|---|---|---|---|---|
| 12/day | No fishery | 2785 | 35.7 | 87% | - |
| 12/day | Fishery L1 | 3315 | 34.8 | 84% | 1825 |
| 12/day | Fishery L2 | 3829 | 32.9 | 76% | 3650 |
| 12/day | Fishery L3 | 4298 | 27.4 | 22% | 5475 |
| 30/day | L0 / L1 / L2 / L3 | 2831 / 3375 / 3921 / 4464 | about 38 | 96-97% | same |

How to read it: a primary producer pays no cash, it adds supply. Each level adds about 550
fish/year of served demand and, once drain is within reach of inflow plus yield (12/day at L3),
it cuts the price and the stock-outs. When the drain is far above supply (30/day) the building
still adds units but cannot move the price. An earlier version of this sim bought 30 fish a week
into a ship with a fixed hold, so supply was never the limit and every level looked identical
(plus a NaN at L3, caused by missing building materials in a small port). Both are fixed.

Same pattern as farm, pasture, sawmill and mine: no direct income. Its value is feeding the
smokehouse step (2 fish per batch).

An earlier draft put `fish` in `makes` of the 12 dried-fish towns, which made the fishery fully
redundant (those towns restock their makes goods). Corrected before delivery.

## Verification

- `npm test`: 460/460 PASS.
- Economy gate: `sim_buildings_economy.mjs` 10 years -> `sim_balance_check.mjs` 38/38 PASS,
  3 pre-existing WARNs (workshop upgrade materials, halted-building bot, level-1 cap).

## Step 1b: dried fish and the smokehouse are retired

The 20-good catalogue has one fish good. `dried_fish` is removed: its 12 towns now make `fish`
(base 20, demand poor 0.8 / middle 0.5 / rich 0.2, the old dried-fish numbers, so the staple keeps its
volume), and the smokehouse is removed from the building list. Old saves migrate on load
(`migrateRetired` in `src/game/gamesave.mjs`): market rows, cargo, warehouse stock and cost basis move from
`dried_fish` to `fish` one to one, and smokehouses become fisheries (a fishery yields 3 per batch, the
smokehouse 4, so a converted building is slightly weaker). The six fishery ports are still the ones where
a fishery adds supply that is not already restocked by `makes`.
