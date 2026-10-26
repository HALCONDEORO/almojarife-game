# Economy

Versión en español: [es/economy.md](es/economy.md).

Skeleton plus the decisions already taken. Existing sources: `docs/design/economy-33-ports.md`, `docs/research/economy-audit.md`, the `balance-*.json` baselines.

## Established (on main)
- Price floor and caps are not changed (project decision, 22 Oct).
- Demand is split by class (poor, middle, rich); see [classes.md](classes.md).

## In review or held (not on main)
- Market saturation redesign, phase 1: accounting infrastructure (wholesale purse per port, household purse per class). Open in PR #229. It does not solve silk and is not the finished redesign.
- Class consumption baskets and rations by class (meat dear for the rich): held for the single final calibration.
- Research notes (Drive, not in repo): how other games model saturation and import.

## To fill
Goods table: [generated/goods.md](generated/goods.md). To fill: imports and finite supply, balance gates (NPC worth bands per horizon).
