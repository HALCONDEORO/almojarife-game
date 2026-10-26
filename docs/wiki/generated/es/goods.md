<!-- Generado por tools/gen_wiki.mjs a partir de las constantes del código. No editar a mano: cambia el código y ejecuta `node tools/gen_wiki.mjs`. -->
# Mercancías (generado)

Fuente: `goods` en `data/world.json` (precios base), `PER_1000` y `OPTIONAL_PER_1000` en `src/sim/classes.mjs` (demanda), `NEED_GROUP` en `src/sim/needs.mjs` (grupo), `src/sim/optional_goods.mjs` (mercancías opcionales). Tipo de dato: valores de diseño del juego (supuestos), salvo las tasas con fuente anotadas en esos archivos.

Demanda: unidades compradas por cada 1000 vecinos al día al precio base. Por encima del precio base cada clase compra menos, hasta cero en su tolerancia ([tabla de clases](classes.md)).

| Mercancía | Precio base | Grupo | Pobres | Artesanos y mercaderes | Ricos |
| --- | --- | --- | --- | --- | --- |
| Trigo | 22 | Alimento | 1.3 | 1.1 | 0.7 |
| Pescado | 20 | Alimento | 0.8 | 0.5 | 0.2 |
| Sal | 40 | Alimento | 0.4 | 0.4 | 0.3 |
| Cerveza | 40 | Bebida | 0.3 | 0.3 | 0.1 |
| Lana | 60 | Materiales | 0.2 | 0.4 | 0.3 |
| Hierro | 70 | Materiales | 0.1 | 0.25 | 0.25 |
| Herrajes | 110 | Materiales | 0.1 | 0.3 | 0.2 |
| Madera | 25 | Materiales | 0.2 | 0.3 | 0.3 |
| Ladrillos | 30 | Materiales | 0.2 | 0.3 | 0.3 |
| Paño | 90 | Ropa | 0.05 | 0.4 | 0.9 |
| Aceite | 50 | Alimento | 0.25 | 0.5 | 0.8 |
| Jabón | 60 | Hogar | 0.02 | 0.05 | 0.08 |
| Vino | 45 | Bebida | 0.15 | 0.6 | 1.4 |
| Seda | 220 | Lujo | 0 | 0.1 | 2.5 |
| Azúcar | 110 | Lujo | 0.05 | 0.3 | 1.5 |
| Pimienta | 200 | Lujo | 0 | 0.25 | 2 |
| Azafrán | 210 | Lujo | 0 | 0.15 | 1.5 |
| Esparto | 30 | Materiales | 0.1 | 0.2 | 0.1 |
| Carne | 25 | Alimento | 0.1 | 0.3 | 0.5 |
| Cuero | 50 | Ropa | 0.05 | 0.2 | 0.4 |
| Cerámica † | 40 | Otros | 0.1 | 0.3 | 0.4 |
| Legumbres † | 20 | Otros | 0.45 | 0.3 | 0.1 |

† Mercancía opcional: solo entra en el mundo cuando su bandera está activa (activa por defecto; `src/sim/optional_goods.mjs`).
