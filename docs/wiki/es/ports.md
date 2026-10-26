# Puertos

El mapa tiene **33 puertos** (`data/world.json`, array `cities`), agrupados en ocho costas (`COASTS` en `src/game/charts.mjs`). Cada puerto tiene población, un conjunto de mercancías que produce y otro que demanda; de ahí salen sus precios y el panel de mercados (ver [economy.md](economy.md) y [generated/goods.md](generated/goods.md)).

- **Tabla completa de puertos** (costa, reino al inicio de 1480, población, producción y demanda, desde los datos del juego): [generated/ports.md](generated/ports.md).
- **Reinos y tenencias**: `data/realms.json` registra qué reino controla cada puerto y cuándo cambió de manos, cada una con su fuente; el juego lo lee con `realmOf` (`src/game/marque.mjs`) para banderas, avisos de escudos y objetivos de las patentes de corso.
- **Puertos fluviales** (⚓ en la tabla): Sevilla, Lisboa, Bilbao y Tetuán están río arriba; el mapa los marca con el indicador de río en los datos de ciudad.
- **Descubrimiento**: al inicio solo conoces tu puerto de origen. Navegar cerca de una costa, comprar su carta de navegación y oír rumores revelan puertos; la sección de información portuaria de [rules.md](rules.md#información-portuaria-cartas-rumores-e-informantes) detalla cartas, rumores e informantes.
- **Poblaciones**: la tabla muestra la población al inicio de 1480 (`pop`); `pop1500` guarda la cifra histórica en torno a 1500 con su fuente bibliográfica en `docs/port-sources.md`. La población escala el tamaño del mercado de cada puerto.

Idioma: [English](../ports.md) · español.
