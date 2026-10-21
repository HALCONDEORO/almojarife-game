# Ironware and the ironworks (chains study, step 3)

Part of docs/design/production-chains-study.md (15 goods, 12 production buildings). Adds one good
and one processor building, both inside the cap.

## What changes

- Good `ironware` (base 110). Made in bilbao and barcelona (iron-working towns, sources in the study,
  section 8). Needed in sevilla, lisboa, valencia, malaga, cadiz and argel. Demand per 1000
  citizens per day: poor 0.1, middle 0.3, rich 0.2.
- Building `ironworks`, a processor like the workshop: recipe `forge` = 2 iron + 1 timber -> 2
  ironware per batch, bought and sold at the local market, margin to the owner, buildable in any
  port. Build cost timber 14 + iron 4, fee 250, 4 build days, upkeep 2, 6 jobs, 3 levels.
- ES/EN names (Herrajes / Ironware, Fragua / Ironworks), a flat SVG icon, tests in
  `test/ironware.test.mjs`, the measurement in `tools/sim_ironware_balance.mjs`.

## Measured balance (8 seeds, 1 game year, A/B vs no building, wages and upkeep included)

`CITY=<port> node tools/sim_ironware_balance.mjs`

| Port | L1 net/y | L2 net/y | L3 net/y | One-off L1 / L3 |
|---|---|---|---|---|
| lisboa (needs iron, buys ironware) | +10256 | +18021 | +24100 | 1857 / 7498 |
| sevilla | +8325 | +14142 | +17390 | 1983 / 8357 |
| bilbao (makes iron, timber and ironware) | +445 | +901 | +1249 | 1296 / 4026 |
| barcelona (makes iron and ironware) | -2888 | -5760 | -8688 | 1567 / 5755 |

Reading: where ironware is dear and the inputs are not, a level-1 ironworks repays in about 70-90
days; in a port that already makes the good, the margin is gone (bilbao near zero, barcelona idles:
0 batches, only upkeep and wages are lost). Siting matters, as for every processor.

## Verification

Full test suite and the 1-100 year economy gate are in the PR description.
