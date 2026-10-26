<!-- Generado por tools/gen_wiki.mjs a partir de las constantes del código. No editar a mano: cambia el código y ejecuta `node tools/gen_wiki.mjs`. -->
# Estaciones y ritmo del mercado (generado)

Fuente: `SEASON_PEAK`, `SEASON_AMPLITUDE`, `seasonMul`, `SEASONS`, `seasonOf`, `DEMAND_SCALE`, `NEEDS_MUL`, `MAKES_MUL` en `src/sim/market.mjs`. Tipo de dato: valores de diseño del juego (supuestos).

## Estaciones de producción

Una mercancía de la lista produce `1 + SEASON_AMPLITUDE x cos(2 pi x (día - pico) / 365)` veces su tasa normal (`seasonMul`): 1.35x el día del pico, 0.65x medio año después, 1,0 de media anual. Una mercancía que no está en la lista produce al mismo ritmo todo el año (`seasonMul` devuelve 1). El día 0 es el 1 de enero.

| Mercancía | Día pico del año | Fecha del pico |
| --- | --- | --- |
| Trigo | 225 | 14 de agosto |
| Vino | 270 | 28 de septiembre |
| Aceite | 330 | 27 de noviembre |
| Azúcar | 100 | 11 de abril |
| Pimienta | 150 | 31 de mayo |
| Lana | 150 | 31 de mayo |
| Pescado | 110 | 21 de abril |
| Sal | 200 | 20 de julio |

## Estaciones del calendario

`seasonOf(día)` asigna el día a winter, spring, summer, autumn (`SEASONS`), trimestres con un desfase de 11 días: el día 0 (1 de enero) es winter, y el invierno vuelve a empezar el día 354 (hacia el 21 de diciembre).

## Ritmo de la demanda diaria

Cada día una ciudad quiere `DEMAND_SCALE` (3) veces la tasa por 1000 vecinos de la [tabla de mercancías](goods.md) para cada mercancía, por `NEEDS_MUL` (3) si la necesita, por `MAKES_MUL` (0.3) si la produce ella misma (oferta local, sin flete). Los vecinos compran por clase y dejan de comprar por encima de su tolerancia ([tabla de clases](classes.md)).
