# Economy audit, first pass

20 October 2026. This is not certification of all game formulas or balance.

## Reproduced bugs fixed

1. New warehouse transfers previously moved quantities but left all ship cost behind. Buy10salt for190, store10, withdraw5, sell5: spent was190 although5salt remain stored, profit-105 on revenue85 instead of-10. Transfers now move rounded proportional basis both ways, deleting empty entries. Global basis does not change merely on storage. Two-ship repeated one-unit transfers conserve total basis.
2. Warehouse purchase allowed a remote port despite its docked-ship contract. It now requires a docked owned ship in that city.
3. Selling a foreign ship credited its value and `splice(-1)` deleted the last owned ship. Sale now validates active ownership. Warehouse transfers also reject foreign ships.

## Added tests

Six tests: warehouse accounting/save,19one-unit two-ship transfers, invalid ownership/remote purchases without mutation, all-port/all-good quote and actual/preview roundtrip invariants,730days of deterministic market evolution, and loan cash/debt conservation.

Price tests check monotonicity with stock, rounded0.4x..3x bounds, actual buy/sell equals preview, fees prevent immediate buy/sell profit, and complete sale consumes the full ship basis. Simulation tests check finite integral stocks0..4target and prices, seasonal multiplier0.65..1.35 and deterministic JSON roundtrip.

## Coverage method and limits

Coverage is for a fixed focused set of11existing test files, compared with the same set plus this file. It is NOT whole-suite coverage. A whole-suite instrumented attempt exceeded the execution budget; no complete whole-suite coverage result is claimed. Percentage details are recorded below after the final run. Plain full-suite execution is separate.

Existing tests already cover many prices, demand classes, recipes, loans, upkeep, captain wages, tolls, routes, shipyards, save/load and encounter rules. Remaining work includes a full formula-to-test inventory, broader malformed state checks, economic strategy distributions and regression budgets, and accounting consistency for all historical saves and exceptional cargo losses.

## Compatibility caveat

Old saves may already contain orphan ship basis or warehouse goods with no recorded warehouse basis. This patch preserves source data; it does not invent acquisition costs or retroactively reconstruct those missing records. No historical profit restatement is claimed. A migration needs its own documented policy and tests. New transfers carry basis from this version onward.

## Measured first-pass results

Full ordinary suite on this branch:279/279pass (main baseline273 plus6). Focused instrumented set: game.mjs line83.78%→89.66%, branch81.63%→82.58%; trade.mjs line100%→100%, branch82.43%→85.14%. bank/tolls/market/ledger line coverage was already100% in this focused set and stays100%; that is not proof of correctness of every formula.

396port/good immediate trade roundtrips (33ports ×12goods),730market days,289080stock checks.19one-unit store/withdraw transfers checked accounting conservation. No balance settings changed. These deterministic checks do not measure human win rates or rival behavior.
