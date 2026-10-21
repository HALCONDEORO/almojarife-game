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

## Step 2: the smokehouse becomes a processor

`smokehouse` was a primary producer (free dried_fish). It is now a processor like the workshop:
recipe `smoke` = 2 fish + 1 salt -> 3 dried_fish per batch, bought and sold at the local market,
margin paid to the owner in cash, buildable in any port. Construction cost is unchanged.

Measured (tools/sim_smokehouse_balance.mjs, 8 seeds, 1 year at almeria, A/B vs no building,
upkeep and wages included):

| Output per batch | L1 net/y | L2 net/y | L3 net/y | One-off L1 / L3 |
|---|---|---|---|---|
| 4 (first try) | +10285 | +18673 | +25897 | 1523 / 5903 |
| 3 (shipped) | +5729 | +10800 | +14818 | 1523 / 5903 |

Four outputs paid L1 back in about 55 days, too fast. Three pays back in roughly 100 days at L1
when fish and salt sit near the floor, and the margin falls once inputs must be shipped in.
