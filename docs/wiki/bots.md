# Bots (NPC traders)

## Principle
Project design rule: bots play with the same rules as the player. No separate prices, access or purchase rules. Bots buy through the same functions (for example `buy`, `sell`, and in PR #230 `buyWeapon`, `buyGear`) and pay from their own cash.

## Measured
NPC worth gates at 1, 5, 10, 30, 50 and 100 years are in `tools/sim_npc_worth_bands.mjs` and the economy tests. Held PRs are measured against them in one final calibration.

## To fill
What bots know (see `docs/design/bot-private-intel.md`), their plan logic (`src/sim/npcplan.mjs`, `ai.mjs`), and each tunable.
