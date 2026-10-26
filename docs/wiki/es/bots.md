# Bots (comerciantes PNJ)

[Versión en inglés (English version)](../bots.md)

## Principio
Regla de diseño del proyecto: los bots juegan con las mismas reglas que el jugador. Sin precios, accesos ni reglas de compra aparte. Los bots compran por las mismas funciones (por ejemplo `buy`, `sell`, y en la PR #230 `buyWeapon`, `buyGear`) y pagan de su propia caja.

## Medido
Las puertas de patrimonio PNJ a 1, 5, 10, 30, 50 y 100 años están en `tools/sim_npc_worth_bands.mjs` y en los tests de economía. Las PR en espera se miden contra ellas en una única calibración final.

## Por rellenar
Qué saben los bots (ver `docs/design/bot-private-intel.md`), su lógica de planes (`src/sim/npcplan.mjs`, `ai.mjs`) y cada valor ajustable.
