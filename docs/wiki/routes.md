# Routes and sailing time

Ships sail along the **97 sea lanes** of the world graph (`data/world.json`, `lanes` + `waypoints`): 33 ports and 48 coastal waypoints joined into legs, each with its haversine length in km (`buildWorld` in `src/sim/world.mjs`). When you order a voyage the game finds the shortest path over the lanes (`route`, a Dijkstra search) and the ship follows it leg by leg; with free navigation a clicked point snaps onto the nearest lane (`src/game/freenav.mjs`).

- **Distances from Cádiz, the start port, to every port**, with the days each ship type needs at its base speed, plus the full list of sea lanes: [generated/routes.md](generated/routes.md).
- **Sailing time**: a voyage of `km` kilometres takes `km ÷ km/day` days at the ship's base speed (`SHIP_TYPES` in `src/sim/trade.mjs`); the crew factor, the captain and the leg's wind multiply that speed (`src/game/traveltime.mjs`, `playerTravelTicks`). A game day has 240 ticks (`TICKS_PER_DAY` in `src/sim/clock.mjs`).
- **Ship speeds and prices**: [generated/ships-and-weapons.md](generated/ships-and-weapons.md).
- **What each port produces and demands**: [ports.md](ports.md).

Language: [español](es/routes.md) · English.
