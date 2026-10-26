<!-- Generado por tools/gen_wiki.mjs a partir de las constantes del código. No editar a mano: cambia el código y ejecuta `node tools/gen_wiki.mjs`. -->
# Barcos y armas (generado)

Fuente: `SHIP_TYPES`, `FEE` en `src/sim/trade.mjs`; `WEAPON_TYPES`, `MAX_CANNONS` en `src/game/crew.mjs`. Tipo de dato: valores de diseño del juego (supuestos), no historia observada.

## Barcos

| Barco | Bodega | km/día | Mantenimiento/día | Precio | Días de construcción | Huecos de armas |
| --- | --- | --- | --- | --- | --- | --- |
| Barca | 25 | 100 | 1 | 900 | 8 | 1 |
| Coca | 60 | 90 | 2 | 2200 | 14 | 3 |
| Carabela | 40 | 140 | 3 | 3000 | 12 | 4 |
| Nao | 110 | 80 | 5 | 5200 | 25 | 8 |

Tasa de mercado en cada trato, a cargo de ambas partes: 2%.

## Armas de barco

| Arma | Precio | Potencia | Mantenimiento/día |
| --- | --- | --- | --- |
| Balista | 90 | 6 | 0.3 |
| Catapulta | 130 | 8 | 0.4 |
| Cañón | 150 | 10 | 0.5 |
| Bombarda | 300 | 16 | 0.8 |
