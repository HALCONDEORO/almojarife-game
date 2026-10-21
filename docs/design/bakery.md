# Bakery: bread and a grain-to-bread processor

Third production chain: a new trade good **bread** (base 30) and a **bakery**, a processor like
the workshop and the smokehouse. Recipe `bake` = 3 grain -> 3 bread per batch, bought and sold at
the local market, margin paid to the owner, buildable in any port. Cost: timber 12 + iron 2,
fee 200, 3 build days, upkeep 1, 5 jobs, 3 levels.

## What changes

- `data/world.json`: good `bread` (base 30). Made by valencia and oran (the two big grain
  towns). Needed by sevilla, lisboa and barcelona. Demand per 1000 citizens: poor 0.5, middle 0.5,
  rich 0.3.
- `src/sim/recipes.mjs`, `src/game/buildings.mjs`: recipe, producer row, building row, jobs.
- `web/main.mjs`, `web/icons.mjs`: ES/EN names (Pan/Bread, Panadería/Bakery) and a flat SVG icon.
- `test/bakery.test.mjs` (4 tests), `test/world.test.mjs` (goods 13 -> 14),
  `tools/sim_bakery_balance.mjs`.

## Measured balance (8 seeds, 1 game year, A/B vs no building, upkeep and wages included)

`CITY=<port> node tools/sim_bakery_balance.mjs`

| Port | L1 net/y | L2 net/y | L3 net/y | One-off L1 / L3 |
|---|---|---|---|---|
| sevilla (needs bread, big) | +4747 | +7964 | +9212 | 1640 / 6253 |
| barcelona (needs bread and grain) | -12 | -1791 | -4485 | 1389 / 4668 |
| valencia (makes bread and grain) | -1797 | -3588 | -5307 | 1591 / 6010 |

The market decides. A bakery pays where bread is dear and grain is not: in a port that already
makes bread, the batch margin is gone and the building idles near zero or loses upkeep. Sevilla
repays level 1 in about 130 days. The chain makes siting matter, and players who build a bakery
in a grain-and-bread town lose money; that is intended, the same as any processor.

## Verification

`npm test` and the 1-100 year economy gate are in the PR description.
