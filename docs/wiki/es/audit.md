# Auditoría de la documentación

[Versión en inglés (English version)](../audit.md)

Tomada en main b0f0361, 22 oct 2026. «Encaja» es la página de la wiki que debería enlazarlo o absorberlo.

| Documento existente | Qué contiene | Encaja |
|---|---|---|
| docs/DESIGN.md, ROADMAP.md, alpha-scope.md | concepto, plan, hitos | rules.md (concepto), se conserva como el plan |
| docs/DECISIONS.md | registro de decisiones desde el 19 oct | decisions.md (esta wiki lo continúa) |
| docs/PROCESS.md | cómo se trabaja, reglas de revisión | se conserva tal cual |
| docs/BACKLOG.md | ideas y notas de alcance por tiempo | se conserva; nombres de personas neutralizados en la PR #228 |
| docs/COMPETITION.md, research/patrician3-mechanics.md | otros juegos, solo ideas | economy.md, bots.md (enlaces) |
| docs/design/economy-33-ports.md, research/economy-audit.md | diseño y auditoría de la economía | economy.md |
| docs/design/balance-*.json, economy-33-ports-sim-*.json, player-baseline*.json | bases medidas | economy.md (observado) |
| docs/design/era-goods-ports.md, fish-chain.md, ironware.md, production-chains-study.md | mercancías y cadenas | economy.md |
| docs/design/time-model.md, weekly-settlement.md | calendario y liquidación | rules.md |
| docs/design/construction.md, city-builder.md, dock-building.md, home-local-office.md | edificios | rules.md |
| docs/design/missions.md, campaigns/, captains/, encounters/, npc/ | contenido y sistemas | rules.md, bots.md |
| docs/design/bot-private-intel.md | qué pueden saber los bots | bots.md |
| docs/design/glossary.md, i18n.md | términos ES/EN | se conservan |
| docs/design/screens-and-buildings.md, port3d-art-guide.md, floating-panels-stage1.md | IU y arte | fuera del alcance de la wiki (se conservan como notas de diseño) |
| docs/politica-modelos.md | qué modelos revisan el trabajo | se conserva |
| docs/guides/ADD-CONTENT.md | cómo añadir contenido | se conserva; enlace desde rules.md |

## Lagunas
- ~~Ninguna página única lista todas las mercancías con precio base, demanda por clase y tipo de fuente.~~ Cerrada: [generated/es/goods.md](../generated/es/goods.md).
- Varios números viven solo en comentarios del código o en descripciones de PR.
- Las tablas de estadísticas escritas a mano hoy (en documentos de diseño) pueden desviarse del código. Primeras tablas generadas: barcos, armas, clases.
