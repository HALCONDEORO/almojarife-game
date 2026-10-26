# Rutas y tiempo de navegación

Los barcos navegan por las **97 rutas marítimas** del grafo del mundo (`data/world.json`, `lanes` + `waypoints`): 33 puertos y 48 puntos de paso costeros unidos en tramos, cada uno con su longitud haversine en km (`buildWorld` en `src/sim/world.mjs`). Al ordenar un viaje el juego busca el camino más corto por las rutas (`route`, una búsqueda de Dijkstra) y el barco lo sigue tramo a tramo; con la navegación libre, el punto pulsado se ajusta a la ruta más cercana (`src/game/freenav.mjs`).

- **Distancias desde Cádiz, el puerto de inicio, a todos los puertos**, con los días que necesita cada tipo de barco a su velocidad base, más la lista completa de rutas marítimas: [generated/routes.md](../generated/es/routes.md).
- **Tiempo de navegación**: un viaje de `km` kilómetros tarda `km ÷ km/día` días a la velocidad base del barco (`SHIP_TYPES` en `src/sim/trade.mjs`); el factor de tripulación, el capitán y el viento del tramo multiplican esa velocidad (`src/game/traveltime.mjs`, `playerTravelTicks`). Un día de juego tiene 240 ticks (`TICKS_PER_DAY` en `src/sim/clock.mjs`).
- **Velocidades y precios de los barcos**: [generated/ships-and-weapons.md](../generated/es/ships-and-weapons.md).
- **Qué produce y demanda cada puerto**: [ports.md](ports.md).

Idioma: [English](../routes.md) · español.
