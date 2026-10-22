# Economy

Skeleton plus the decisions already taken. Existing sources: `docs/design/economy-33-ports.md`, `docs/research/economy-audit.md`, the `balance-*.json` baselines.

## Established (on main)
- Price floor and caps are not changed (project decision, 22 Oct).
- Demand is split by class (poor, middle, rich); see [classes.md](classes.md).

## In review or held (not on main)
- Market saturation redesign, phase 1: accounting infrastructure (wholesale purse per port, household purse per class). Open in PR #229. It does not solve silk and is not the finished redesign.
  - Known consequence (observed, `tools/sim_buildings_economy.mjs` scenario B): a lone cloth workshop in Cadiz is no longer profitable at level 2. Its own sales lower the local cloth price, the weave margin check fails, production stops (54 batches at day 300 against 239 on main), wages and upkeep drain cash, and the building is liquidated by bankruptcy at about day 707 (on main it survives, about 9,000 cash at day 800). This follows the intended saturation. The script's bot is naive: it upgrades on a 2-unit quote and never exits. The script now reports `buildingLost` instead of crashing.
- Class consumption baskets and rations by class (meat dear for the rich): held for the single final calibration.
- Research notes (Drive, not in repo): how other games model saturation and import.

## To fill
Goods table (base price, class weights, source type), imports and finite supply, balance gates (NPC worth bands per horizon).
