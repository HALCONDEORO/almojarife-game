# Construction with timber, bricks and tools (production chains PR 5)

Every building quote now draws **timber, bricks and ironware (the tools)** from the port market, replacing
most of the iron and part of the timber of the old recipes. Cloth stays where it was (house, workshop,
oil mill, vineyard, fishery, office). Ships are unchanged here (esparto rigging came with PR 7).

## Recipes (level 1, quantities scale with the level)

| Building | Timber | Bricks | Ironware | Cloth |
|---|---|---|---|---|
| house | 8 | 8 | 0 | 2 |
| warehouse | 12 | 16 | 1 | 0 |
| workshop | 10 | 10 | 2 | 6 |
| office | 10 | 10 | 1 | 6 |
| farm | 8 | 4 | 2 | 0 |
| pasture | 8 | 1 | 2 | 0 |
| sawmill | 8 | 2 | 2 | 0 |
| mine | 10 | 3 | 3 | 0 |
| oil mill | 10 | 8 | 2 | 2 |
| vineyard | 10 | 2 | 2 | 2 |
| saltworks | 8 | 3 | 1 | 0 |
| fishery | 5 | 1 | 1 | 2 |
| brewery | 8 | 5 | 1 | 0 |
| ironworks | 10 | 3 | 3 | 0 |
| brickworks | 8 | 2 | 2 | 0 |
| esparto field | 5 | 1 | 1 | 0 |
| ranch | 7 | 2 | 2 | 0 |
| dock | 10 | 1 | 1 | 0 |

Fitted so that the median cost over all ports, at the market prices of a game one year old, stays within
+-5% of the old recipe (`tools` run in the PR report: ratio new/old per building).

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
