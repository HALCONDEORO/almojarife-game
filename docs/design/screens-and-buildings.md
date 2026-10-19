# Screens, saves and city buildings (design draft)

Status: draft, 19 Oct 2026. Original work. Ideas follow genre conventions only; nothing is copied from other games.

## What exists today
Trading loop, map, market table, ships (mission 1 prototype). No menus, no saves, no buildings.

## Screens (in build order)
1. **Title screen**: New game, Continue (only if a save exists), Options, Language (ES/EN).
2. **New game**: company name (default "Mi Casa Mercantil" / "My Trading House"), home port, mode (Free play or Campaign, Act 1). The name appears in the top bar and the end screen.
3. **Game screen** (today's screen) with a pause menu: Resume, Save, Options, Quit to title.
4. **Options**: language, game speed default, sound on/off (sound later), reset.
5. **Port view**: flat 2D scene with clickable buildings (see below).
6. **Campaign shell**: act and mission list, mission briefing, end-of-mission result.
7. **End screen**: win or bankruptcy, net worth, days, a share-free summary.

## Saves
- Browser localStorage, autosave once per game day, 3 manual slots, plus export and import of a JSON file.
- Versioned: `{ version, savedAt, company, seed, state }`. A migration function per version bump; a test corpus of old saves.
- No server, no account, no personal data.

## City buildings (v1 catalogue)
| Building | What it does | Unlock |
|---|---|---|
| Market hall | Buy and sell (today's table) | start |
| Shipyard | Buy a ship, repair, later upgrades | start |
| Warehouse | Store goods in a port, cheaper than a ship | standing rank 2 |
| Customs house | Port duties, standing, the almojarife story | rank 2 |
| Tavern | Rumours: hints on cheap and dear goods, hire a captain | rank 1 |
| Workshop (some ports) | Turns one good into another | rank 3 |
| Council | Orders and seats (M3 and later) | rank 4 |

Rules: every port has the market hall and shipyard; the rest come from per-port data in `data/`, so adding a port is data only. Flat icons, own art, one CREDITS row per file.

## Order and gates
1. Title + new game + company name. 2. Save/load with tests. 3. Shipyard and warehouse in the port view. 4. Options and pause. 5. Campaign shell. 6. Tavern, customs, workshops, council.
All in small PRs with tests; no new spending; ES/EN strings for every screen.
