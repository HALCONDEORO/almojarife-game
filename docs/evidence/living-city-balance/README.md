# Living-city activation: paired policy outcomes

Measured on the #638 base, 28 October 2026. The eight living-city flags are explicitly false for OFF and default true for ON. All other game options match. No engine formulas changed. These policies are limited deterministic probes, not a promise that every player or starting port wins.

| Policy and horizon | OFF | ON |
| --- | --- | --- |
| Legacy ratio-only trader, Cadiz, 365 days | Wins day 361, net worth 52,625.24 | Loses at deadline day 365, net worth 43,022.09; no bankruptcy |
| Preview-based trader, Cadiz/Sevilla/Lisboa, 365 days | 3/3 wins, 0 bankruptcies, median cash 50,904, median end day 41 | 3/3 wins, 0 bankruptcies, median cash 50,993, median end day 37 |
| Random-destination trader, same ports and horizon | 2/3 wins, 0 bankruptcies, median cash 52,334, median end day 220 | 2/3 wins, 0 bankruptcies, median cash 51,107, median end day 202 |
| Current reserve-aware builder, Casablanca, 700 days, seed 0 | Cash 9,726, 0 bankruptcies, workshop retained, 0 halt events | Cash 10,027, 0 bankruptcies, workshop retained, 0 halt events |
| Current reserve-aware builder, same, seed 1 | Cash 8,969, 0 bankruptcies, workshop retained, 0 halt events | Cash 9,742, 0 bankruptcies, workshop retained, 0 halt events |
| Poor saltworks builder, 700 days, seed 0/1 | Cash -1,119, first halt day 36, still halted | Same |
| Free-play idle, 700 days | Cash 600, runs to day 700, 0 bankruptcies | Same |
| Legacy unsafe builder from plague regression, 700 days, seed 1 | Cash 8,860.86, no bankruptcy, workshop retained | Cash 0, one bankruptcy, workshop seized |

The no-player scenario A, NPC wealth and year-one market metrics are included in the building JSON reports. The current builder does not win the 50,000 campaign goal at day 365 in either mode; its purpose is long-running business survival. Trader policies do exercise the actual win condition.

## Declared changes to regression tests

- The legacy ratio-only trader no longer asserts a win in the new default economy. Its test now asserts the paired OFF win and ON deadline loss, nonnegative cash and no bankruptcy. A separate preview-based trader test asserts a real win with ON.
- The plague regression retains its no-bankruptcy and workshop-retention assertions but now uses the current Balance builder policy: upgrades must preserve the existing 1,200-coin reserve after construction cost, and a level-3 workshop continues to restock. The old test bot spent its reserve on upgrades and stopped restocking at level 3. Its observed failure remains declared above.
- The pre-module golden explicitly disables all eight city flags. Inbox and pardon unit fixtures disable the arrival identity notice instead of counting it as an action message.
- `sim_growth_paired.mjs` now supplies `cityGrowth:false` for its OFF side. Omitting it would silently run ON after this activation.

## Reproduction

`SIM_FLAGS` is a JSON object of newGame options in `tools/sim_player.mjs` and `tools/sim_buildings_economy.mjs`.

Use `node tools/sim_player.mjs 3` and `node tools/sim_buildings_economy.mjs 700 1` for ON. For OFF, set all eight city flags false in SIM_FLAGS. Raw reports are alongside this file. The legacy trader is covered in `test/game.test.mjs`; the current builder is covered in `test/plague.test.mjs`.

Growth alone reproduces both legacy-policy changes. Seasons alone preserves the old trader win. Activating existing growth changes demand, stock and price trajectories, so unchanged formulas do not mean unchanged balance. No global balance-equivalence claim is made. Independent review and green CI/Balance are still required.
