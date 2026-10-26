# Buildings and construction

Each port offers plots; to build in a port other than home you first buy a **trading office** there (`OFFICE_PRICE` = 750 coins, and the port must know you: `OFFICE_MIN_RESPECT` = 20 respect, `src/game/buildings.mjs`). A plot's price scales with the city's population and the plot's area and suggested type (`plotPrice`).

- **Full table of the 32 building types** (fee, build days, upkeep, workers and materials per level): [generated/buildings.md](generated/buildings.md).
- **Per level**: materials, fee and build time all multiply by the level (`startConstruction` quote). Materials come from your warehouse in the city first; what the port lacks is imported at `IMPORT_MUL` = 1.5 over base price plus fee (`src/sim/recipes.mjs`).
- **Running costs**: upkeep plus wages (`WAGE_PER_WORKER` = 1 coin per worker per day, `JOBS_PER_LEVEL`) accrue daily into the weekly book; a building that cannot be paid halts until you restart it.
- **Civic buildings** (pósito, hospital, alhóndiga, caminos, pozo, capilla, carnicería, molino, corral de comedias) belong to the city-life module and are only offered while that flag is on. New civic works need standing in the port (`CIVIC_MIN_RESPECT` = 20, or `CIVIC_BIG_RESPECT` = 100 for hospital, alhóndiga and corral) and most are limited per city (one pósito, alhóndiga, carnicería, molino or corral; up to two hospitals and capillas; wells and caminos unlimited). The corral de comedias also needs a city of at least 15,000 people (`minPop`).
- **Houses by class**: poor, comfortable and rich houses shelter residents of their own class, who buy by their class basket (see [classes.md](classes.md)).

Language: [español](es/buildings.md) · English.
