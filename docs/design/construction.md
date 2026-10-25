# Construction with timber, bricks and tools (production chains PR 5)

Every building quote now draws **timber, bricks and ironware (the tools)** from the port market, replacing
most of the iron and part of the timber of the old recipes. Cloth stays where it was (house, workshop,
oil mill, vineyard, fishery, office). Ships are unchanged here (esparto rigging came with PR 7).

## Recipes (level 1, quantities scale with the level)

| Building | Timber | Bricks | Ironware | Cloth |
|---|---|---|---|---|
| house | 8 | 8 | 0 | 2 |
| warehouse | 15 | 20 | 1 | 0 |
| workshop | 10 | 10 | 2 | 6 |
| office | 10 | 10 | 1 | 6 |
| farm | 29 | 14 | 7 | 0 |
| pasture | 36 | 5 | 9 | 0 |
| sawmill | 37 | 9 | 9 | 0 |
| mine | 42 | 13 | 13 | 0 |
| oil mill | 28 | 22 | 6 | 6 |
| vineyard | 35 | 7 | 7 | 7 |
| saltworks | 35 | 13 | 4 | 0 |
| fishery | 23 | 5 | 5 | 9 |
| brewery | 43 | 27 | 5 | 0 |
| ironworks | 37 | 11 | 11 | 0 |
| brickworks | 37 | 9 | 9 | 0 |
| esparto field | 33 | 7 | 7 | 0 |
| ranch | 31 | 9 | 9 | 0 |
| dock | 46 | 5 | 5 | 0 |
| pottery | 37 | 18 | 9 | 0 |
| soapworks | 32 | 16 | 8 | 0 |
| armory | 17 | 7 | 5 | 0 |
| posito | 6 | 15 | 2 | 0 |
| hospital | 16 | 16 | 3 | 7 |
| alhondiga | 14 | 14 | 3 | 0 |
| caminos | 2 | 6 | 1 | 0 |
| pozo | 2 | 6 | 1 | 0 |
| capilla | 10 | 13 | 2 | 3 |
| carniceria | 14 | 14 | 3 | 0 |
| molino | 16 | 10 | 5 | 0 |
| corral | 25 | 17 | 2 | 8 |

Fitted so that the median cost over all ports, at the market prices of a game one year old, stays within
+-5% of the old recipe (`tools` run in the PR report: ratio new/old per building). Quantities were rescaled
again in the 2026-10-25 recalibration below; the table above is current.

## Cost before and after (level 1)

| Building | Before at base prices | After at base prices | Median real market cost, after/before |
|---|---|---|---|
| house | 620 | 620 | 0.98 |
| workshop | 1340 | 1310 | 0.96 |
| warehouse | 920 | 890 | 0.99 |
| farm | 490 | 540 | 0.99 |
| pasture | 440 | 450 | 1.00 |
| sawmill | 530 | 480 | 0.97 |
| mine | 820 | 670 | 1.03 |
| oil_mill | 860 | 890 | 0.97 |
| vineyard | 670 | 710 | 1.04 |
| saltworks | 390 | 400 | 1.01 |
| brewery | 440 | 460 | 1.01 |
| brickworks | 440 | 480 | 1.02 |
| esparto_field | 270 | 265 | 0.95 |
| ranch | 440 | 455 | 1.00 |
| dock | 390 | 390 | 1.01 |
| fishery | 380 | 445 | 1.11 |
| ironworks | 630 | 670 | 1.01 |

The office is quoted by its own purchase flow and keeps timber 10, bricks 10, ironware 1, cloth 6 (was timber 16, iron 4, cloth 6).

## Why bricks get citizen demand

Bricks had no citizen demand, and every good trickles back for free to 4x its target stock. Bricks therefore sat
at 4x target and at the price floor (13 against a base of 30) in every port: a brickworks could not earn (the
re-measure in this PR: 0 batches in sevilla and -623/year at level 1 in bilbao) and construction was about 30%
cheaper than designed. Construction alone cannot fix it: a heavy player builds 20 buildings a year, about 100
bricks, against 700 to 5800 bricks a year of free trickle per port. Bricks now have a small citizen demand
(poor 0.2, middle 0.3, rich 0.3 per 1000, repairs and small works), like timber. Re-measured with the same
tool (8 seeds, one year, building net against the one-off cost):

| Port | L1 net/year | L1 one-off | L3 net/year | L3 one-off |
|---|---|---|---|---|
| bilbao (timber 11) | +4197 | 1264 | +8860 | 3842 |
| sevilla (timber 38, bricks glut) | -2888 (0 batches) | 1727 | -8688 | 6684 |

Same siting rule as ironware: the brickworks pays where timber is cheap, and idles where it is not.
The earlier `DRAIN=1` figure (+24776 at level 1, 18 days payback) zeroes the bricks stock every day. That is a
bound, not a forecast; real demand gives about a four month payback in bilbao.

## Can a player build?

`tools/sim_construction_access.mjs`: for every port and building, quote level 1 at day 0 and after a year (8
seeds, quiet market). Before this PR: workshop and warehouse were blocked in 6% of ports at day 0 (warehouse 6% at
year 1 too), all by missing timber, and 32 and 16 port-building quotes failed at day 0 and year 1. After: 100% of
ports can build every building at day 0 and at year 1. Level 3 needs three times the materials: the old recipes
already blocked 12 to 15 of 33 ports at level 3 (timber); the new ones block the same or fewer, by building.

## Bots

The AI traders only buy, sell and sail through the same `buy`/`sell`/`sail` functions as the player (same fee,
same stock limit). They never build or produce, so construction has no bot shortcut. Known differences not
covered here: port tolls, crew wages, warehouses, loans, events (tracked in other PRs).

## Recalibration of build times and material quantities (2026-10-25)

Owner direction: every building went up too fast; long works are fine because trading, and everything
else, carries on in parallel while the city builds. Times now come from the work content of each recipe:
days = ceil(total material units / 3) + ceil(fee / 100), with dock x 1.5 for over-water work. Material
quantities are rescaled inside each recipe (same goods, same proportions) so the level-1 cost lands in an
affordability band anchored on the caravel (3000, the first major investment a player saves for): houses,
wells and roads stay cheap, industry sits at roughly 60-110% of a caravel, civic works in between. Fees,
commerce and ship recipes are unchanged; the office keeps its own purchase flow, and house/caminos/pozo
recipes were already in band and did not move. Upkeep and wages accrue only while a building is active,
so longer works add no hidden running costs.

| Building | Days L1 | Cost L1 at base prices |
|---|---|---|
| house | 8 | 770 |
| workshop | 13 | 1610 |
| warehouse | 15 | 1335 |
| farm | 19 | 2115 |
| pasture | 19 | 2240 |
| sawmill | 22 | 2435 |
| mine | 26 | 3170 |
| oil_mill | 24 | 2810 |
| vineyard | 22 | 2735 |
| saltworks | 20 | 1905 |
| brewery | 28 | 2685 |
| soapworks | 22 | 2410 |
| pottery | 25 | 2705 |
| brickworks | 22 | 2435 |
| esparto_field | 18 | 2005 |
| ranch | 20 | 2285 |
| armory | 13 | 1435 |
| dock | 32 | 2000 |
| fishery | 16 | 2235 |
| ironworks | 23 | 2715 |
| posito | 10 | 1020 |
| hospital | 17 | 2140 |
| alhondiga | 14 | 1350 |
| caminos | 5 | 490 |
| pozo | 5 | 490 |
| capilla | 13 | 1380 |
| carniceria | 14 | 1350 |
| molino | 14 | 1500 |
| corral | 22 | 2475 |

Payback was checked as a secondary metric, not a target: at cadiz base-reference margins the new costs
pay back in roughly 45-239 days of active operation, with the mine and ironworks intentionally the long
investments. Scaling purely by payback was rejected: it produced absurd prices (a pasture costing more
than a ship) because low-margin primaries would need punitive price tags.

Sim evidence (`tools/sim_buildings_economy.mjs 365`, before/after): scenario A (no player) unchanged;
scenario B (bot builds a workshop) still reaches level 2 in year one with full staffing and no halts -
production starts later (290 -> 266 units) and cash trough improves (1097 -> 1163) because wages start
later; scenario C (poor bot, saltworks) no longer passes the affordability gate (cost 705 -> 2443), so
the bot keeps its cash (+64 instead of -1219): the gate now does its job, and the wage-halt mechanics
themselves are unchanged and covered by the plague/city-life suites.
