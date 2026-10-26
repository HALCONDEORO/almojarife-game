<!-- Generado por tools/gen_wiki.mjs a partir de las constantes del código. No editar a mano: cambia el código y ejecuta `node tools/gen_wiki.mjs`. -->
# Puertos (generado)

Fuente: `cities` en `data/world.json` (33 puertos con su población al inicio de 1480; `pop1500` guarda la cifra histórica con su fuente en `docs/port-sources.md`), `COASTS` en `src/game/charts.mjs`, tenencias de `data/realms.json` leídas en el año de inicio con `realmOf` (`src/game/marque.mjs`, `START_YEAR` en `src/sim/clock.mjs`). Tipo de dato: institucional para tenencias y poblaciones históricas (cada fila lleva su fuente en los archivos de datos); lo demás es diseño del juego (supuesto). ⚓ marca un puerto fluvial.

Un puerto empieza desconocido salvo que sea el de origen; navegar, las cartas y los rumores lo revelan (ver [rules.md](rules.md#información-portuaria-cartas-rumores-e-informantes)).

| Puerto | Costa | Reino (1480) | Pob. inicial | Produce | Necesita |
| --- | --- | --- | --- | --- | --- |
| Cádiz | Costa de la Luz | Castilla | 12000 | Sal, Pescado, Cuero | Lana, Paño, Herrajes, Cerveza, Jabón |
| Huelva | Costa de la Luz | Castilla | 3000 | Vino, Pescado | Paño, Madera, Jabón |
| Sevilla ⚓ | Costa de la Luz | Castilla | 40000 | Aceite, Vino, Carne, Cuero, Jabón | Hierro, Madera, Seda, Pescado, Herrajes, Cerveza, Esparto, Azafrán |
| Málaga | Costa de la Luz | Emirato de Granada | 15000 | Vino, Seda, Pescado | Trigo, Lana, Herrajes, Cerveza, Jabón |
| Almería | Costa de la Luz | — | 8000 | Seda, Sal, Pescado, Esparto | Trigo, Hierro, Jabón |
| Lisboa ⚓ | Costa portuguesa | Portugal | 50000 | Azúcar, Pescado, Pimienta, Cuero | Trigo, Hierro, Herrajes, Cerveza, Esparto, Carne, Jabón |
| Setúbal | Costa portuguesa | Portugal | 6000 | Sal, Pescado | Lana, Hierro, Jabón |
| Faro | Costa portuguesa | Portugal | 4000 | Pescado, Sal | Paño, Hierro, Jabón |
| Oporto | Costa portuguesa | Portugal | 14000 | Vino, Paño, Cuero | Trigo, Sal, Cerveza, Jabón |
| Vigo | Costa Cantábrica | Castilla | 5000 | Pescado, Madera | Paño, Aceite, Jabón |
| La Coruña | Costa Cantábrica | Castilla | 3000 | Pescado, Madera | Vino, Sal, Jabón |
| Santander | Costa Cantábrica | Castilla | 2500 | Hierro, Lana, Pescado | Vino, Sal, Jabón |
| Bilbao ⚓ | Costa Cantábrica | Castilla | 9000 | Hierro, Lana, Madera, Herrajes | Trigo, Vino, Aceite, Azúcar, Sal, Jabón |
| San Sebastián | Costa Cantábrica | Castilla | 3000 | Hierro, Pescado | Vino, Paño, Jabón |
| Cartagena | Levante y Cataluña | Castilla | 6000 | Sal, Pescado, Esparto, Jabón | Trigo, Vino, Paño |
| Alicante | Levante y Cataluña | Corona de Aragón | 3000 | Sal, Vino, Pescado, Azafrán | Lana, Madera, Jabón |
| Valencia | Levante y Cataluña | Corona de Aragón | 30000 | Trigo, Seda, Azafrán | Madera, Lana, Pescado, Herrajes, Cerveza, Carne, Cuero, Jabón |
| Tarragona | Levante y Cataluña | Corona de Aragón | 4000 | Vino, Aceite, Pescado | Lana, Hierro, Jabón |
| Barcelona | Levante y Cataluña | Corona de Aragón | 35000 | Paño, Hierro, Herrajes | Trigo, Sal, Pimienta, Pescado, Azúcar, Cerveza, Esparto, Cuero, Jabón, Azafrán |
| Palma | Baleares | Corona de Aragón | 12000 | Sal, Aceite | Trigo, Paño, Pimienta, Cerveza, Jabón |
| Ibiza | Baleares | Corona de Aragón | 2500 | Sal, Pescado | Trigo, Paño, Jabón |
| Tánger | El Rif | — | 10000 | Sal, Azúcar | Paño, Hierro, Cerveza, Jabón |
| Ceuta | El Rif | Portugal | 2500 | Pescado, Sal | Trigo, Paño, Jabón |
| Tetuán ⚓ | El Rif | — | 8000 | Aceite, Seda | Hierro, Paño, Jabón |
| Arcila | El Rif | — | 2000 | Pescado | Lana, Hierro, Jabón |
| Larache | El Rif | — | 3000 | Trigo, Madera | Paño, Sal, Jabón |
| Rabat | Marruecos atlántico | — | 3000 | Lana, Trigo | Hierro, Vino, Jabón |
| Casablanca | Marruecos atlántico | — | 2000 | Trigo, Lana | Paño, Azúcar, Jabón |
| Mazagán | Marruecos atlántico | — | 2500 | Trigo, Aceite | Paño, Hierro, Jabón |
| Melilla | Berbería oriental | — | 1500 | Sal | Paño, Vino, Jabón |
| Orán | Berbería oriental | Reino de Tlemecén | 8000 | Lana, Trigo | Hierro, Paño, Jabón |
| Mostaganem | Berbería oriental | — | 4000 | Trigo, Pescado | Paño, Madera, Jabón |
| Argel | Berbería oriental | — | 15000 | Aceite, Lana | Madera, Hierro, Herrajes, Cerveza, Jabón |
