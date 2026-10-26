# Ports

The map holds **33 ports** (`data/world.json`, `cities` array), grouped into eight coasts (`COASTS` in `src/game/charts.mjs`). Each port has a population, a set of goods it produces and a set it demands; those drive its prices and the markets panel (see [economy.md](economy.md) and [generated/goods.md](generated/goods.md)).

- **Full table of ports** (coast, realm at the 1480 start, population, production and demand, from the game data): [generated/ports.md](generated/ports.md).
- **Realms and holdings**: `data/realms.json` records which realm holds each port and when it changed hands, each with its source; the game reads it with `realmOf` (`src/game/marque.mjs`) to draw flags, coat-of-arms notices and letters of marque targets.
- **River ports** (⚓ in the table): Sevilla, Lisboa, Bilbao and Tetuán sit upriver; the map marks them with the river flag in the city data.
- **Discovery**: only your home port is known at the start. Sailing near a coast, buying its chart and hearing rumours reveal ports; the port information section of [rules.md](rules.md#port-information-charts-rumours-and-informants) details charts, rumours and informants.
- **Populations**: the table shows the population at the 1480 start (`pop`); `pop1500` keeps the historical figure around 1500 with its bibliographic source in `docs/port-sources.md`. Population scales the size of each port's market.

Language: [español](es/ports.md) · English.
