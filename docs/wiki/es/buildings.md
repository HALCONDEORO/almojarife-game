# Edificios y construcción

Cada puerto ofrece parcelas; para construir en un puerto que no es el de origen primero compras una **oficina comercial** allí (`OFFICE_PRICE` = 750 monedas, y el puerto debe conocerte: `OFFICE_MIN_RESPECT` = 20 de respeto, `src/game/buildings.mjs`). El precio de la parcela escala con la población de la ciudad y con el área y el uso sugerido del solar (`plotPrice`).

- **Tabla completa de los 32 tipos de edificio** (tasa, días de obra, mantenimiento, trabajadores y materiales por nivel): [generated/buildings.md](../generated/es/buildings.md).
- **Por nivel**: materiales, tasa y tiempo de obra se multiplican por el nivel (presupuesto de `startConstruction`). Los materiales salen primero de tu almacén en la ciudad; lo que falte se importa con `IMPORT_MUL` = 1.5 sobre el precio base más la tasa (`src/sim/recipes.mjs`).
- **Costes corrientes**: mantenimiento más jornales (`WAGE_PER_WORKER` = 1 moneda por trabajador y día, `JOBS_PER_LEVEL`) se anotan a diario en el libro semanal; un edificio que no puede pagarse se para hasta que lo reanudes.
- **Edificios cívicos** (pósito, hospital, alhóndiga, caminos, pozo, capilla, carnicería, molino, corral de comedias) son del módulo de vida urbana y solo se ofrecen con esa bandera activa. Las obras cívicas nuevas exigen posición en el puerto (`CIVIC_MIN_RESPECT` = 20, o `CIVIC_BIG_RESPECT` = 100 para hospital, alhóndiga y corral) y la mayoría tienen límite por ciudad (un pósito, alhóndiga, carnicería, molino o corral; hasta dos hospitales y capillas; pozos y caminos sin límite). El corral de comedias además necesita una ciudad de al menos 15.000 personas (`minPop`).
- **Casas por clase**: las casas pobres, acomodadas y ricas alojan vecinos de su clase, que compran según la cesta de su clase (ver [classes.md](classes.md)).

Idioma: [English](../buildings.md) · español.
