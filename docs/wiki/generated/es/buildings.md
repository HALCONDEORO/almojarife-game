<!-- Generado por tools/gen_wiki.mjs a partir de las constantes del código. No editar a mano: cambia el código y ejecuta `node tools/gen_wiki.mjs`. -->
# Edificios (generado)

Fuente: `BUILDING_TYPES` y `JOBS_PER_LEVEL` en `src/game/buildings.mjs`, `RECIPES` en `src/sim/recipes.mjs`. Tipo de dato: valores de diseño del juego (supuestos). Los costes son por nivel: materiales, tasa y tiempo de obra se multiplican por el nivel que construyes o mejoras. Los materiales salen primero de tu almacén en la ciudad; lo que falte se importa con IMPORT_MUL = 1.5 sobre el precio base más la tasa (`src/sim/recipes.mjs`). El mantenimiento y los jornales (1 moneda por trabajador y día, `WAGE_PER_WORKER`) se anotan a diario en el libro semanal; un edificio que no puede pagarse se para. † marca un edificio cívico del módulo de vida urbana (puertas de respeto y límites por ciudad, ver [buildings.md](../es/buildings.md)); ‡ exige una población mínima de la ciudad.

| Edificio | Tasa | Días de obra | Mantenimiento/día | Trabajadores/nivel | Materiales por nivel |
| --- | --- | --- | --- | --- | --- |
| Casa | 150 | 8 | 1 | 0 | Madera 8, Ladrillos 8, Paño 2 |
| Taller | 300 | 13 | 3 | 8 | Madera 10, Ladrillos 10, Herrajes 2, Paño 6 |
| Almacén | 250 | 15 | 2 | 3 | Madera 15, Ladrillos 20, Herrajes 1 |
| Granja | 200 | 19 | 2 | 6 | Madera 29, Ladrillos 14, Herrajes 7 |
| Dehesa | 200 | 19 | 2 | 6 | Madera 36, Ladrillos 5, Herrajes 9 |
| Aserradero | 250 | 22 | 2 | 8 | Madera 37, Ladrillos 9, Herrajes 9 |
| Mina | 300 | 26 | 3 | 10 | Madera 42, Ladrillos 13, Herrajes 13 |
| Casa pobre | 100 | 5 | 1 | 0 | Madera 8, Ladrillos 3 |
| Casa acomodada | 150 | 8 | 1 | 0 | Madera 8, Ladrillos 8, Paño 2 |
| Casa rica | 300 | 13 | 2 | 0 | Madera 8, Ladrillos 16, Paño 4 |
| Almazara | 250 | 24 | 2 | 6 | Madera 28, Ladrillos 22, Herrajes 6, Paño 6 |
| Viñedo | 250 | 22 | 2 | 6 | Madera 35, Ladrillos 7, Herrajes 7, Paño 7 |
| Salina | 200 | 20 | 1 | 5 | Madera 35, Ladrillos 13, Herrajes 4 |
| Cervecería | 250 | 28 | 2 | 6 | Madera 43, Ladrillos 27, Herrajes 5 |
| Jabonería | 250 | 22 | 2 | 6 | Madera 32, Ladrillos 16, Herrajes 8 |
| Alfarería | 250 | 25 | 2 | 6 | Madera 37, Ladrillos 18, Herrajes 9 |
| Ladrillería | 250 | 22 | 2 | 6 | Madera 37, Ladrillos 9, Herrajes 9 |
| Espartizal | 200 | 18 | 1 | 5 | Madera 33, Ladrillos 7, Herrajes 7 |
| Ganadería | 250 | 20 | 2 | 6 | Madera 31, Ladrillos 9, Herrajes 9 |
| Armería | 250 | 13 | 2 | 4 | Madera 17, Ladrillos 7, Herrajes 5 |
| Muelle | 150 | 32 | 1 | 0 | Madera 46, Ladrillos 5, Herrajes 5 |
| Pesca | 150 | 16 | 1 | 4 | Madera 23, Ladrillos 5, Herrajes 5, Paño 9 |
| Fragua | 250 | 23 | 2 | 6 | Madera 37, Ladrillos 11, Herrajes 11 |
| Pósito † | 200 | 10 | 1 | 2 | Ladrillos 15, Madera 6, Herrajes 2 |
| Hospital † | 300 | 17 | 3 | 6 | Madera 16, Ladrillos 16, Herrajes 3, Paño 7 |
| Alhóndiga † | 250 | 14 | 2 | 3 | Madera 14, Ladrillos 14, Herrajes 3 |
| Caminos † | 150 | 5 | 1 | 1 | Ladrillos 6, Madera 2, Herrajes 1 |
| Pozo † | 150 | 5 | 1 | 1 | Madera 2, Ladrillos 6, Herrajes 1 |
| Capilla † | 250 | 13 | 2 | 3 | Madera 10, Ladrillos 13, Herrajes 2, Paño 3 |
| Carnicería † | 250 | 14 | 2 | 3 | Madera 14, Ladrillos 14, Herrajes 3 |
| Molino † | 250 | 14 | 2 | 4 | Madera 16, Ladrillos 10, Herrajes 5 |
| Corral de comedias † ‡ | 400 | 22 | 4 | 5 | Madera 25, Ladrillos 17, Herrajes 2, Paño 8 |
