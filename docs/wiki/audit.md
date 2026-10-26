# Documentation audit

Versión en español: [es/audit.md](es/audit.md).

Taken on main b0f0361, 22 Oct 2026. "Fits" is the wiki page that should link to or absorb it.

| Existing document | What it holds | Fits |
|---|---|---|
| docs/DESIGN.md, ROADMAP.md, alpha-scope.md | concept, plan, milestones | rules.md (concept), kept as the plan |
| docs/DECISIONS.md | decision log from 19 Oct | decisions.md (this wiki continues it) |
| docs/PROCESS.md | how work is done, review rules | kept as is |
| docs/BACKLOG.md | ideas and scope notes by time | kept; names of people neutralised in PR #228 |
| docs/COMPETITION.md, research/patrician3-mechanics.md | other games, ideas only | economy.md, bots.md (links) |
| docs/design/economy-33-ports.md, research/economy-audit.md | economy design and audit | economy.md |
| docs/design/balance-*.json, economy-33-ports-sim-*.json, player-baseline*.json | measured baselines | economy.md (observed) |
| docs/design/era-goods-ports.md, fish-chain.md, ironware.md, production-chains-study.md | goods and chains | economy.md |
| docs/design/time-model.md, weekly-settlement.md | calendar and settlement | rules.md |
| docs/design/construction.md, city-builder.md, dock-building.md, home-local-office.md | buildings | rules.md |
| docs/design/missions.md, campaigns/, captains/, encounters/, npc/ | content and systems | rules.md, bots.md |
| docs/design/bot-private-intel.md | what bots may know | bots.md |
| docs/design/glossary.md, i18n.md | ES/EN terms | kept |
| docs/design/screens-and-buildings.md, port3d-art-guide.md, floating-panels-stage1.md | UI and art | out of scope for the wiki (kept as design notes) |
| docs/politica-modelos.md | which models review work | kept |
| docs/guides/ADD-CONTENT.md | how to add content | kept; link from rules.md |

## Gaps
- ~~No single page lists all goods with base price, class demand and source type.~~ Closed: [generated/goods.md](generated/goods.md).
- Several numbers live only in code comments or in PR descriptions.
- Statistic tables that exist by hand today (in design docs) can drift from the code. First generated tables: ships, weapons, classes.
