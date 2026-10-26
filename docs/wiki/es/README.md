# Wiki interna

[Versión en inglés (English version)](../README.md)

Un solo lugar para saber cómo funciona el juego y cada estadística que lo sustenta. Vive en el repositorio, junto al código, para estar versionada, revisarse en las PR y no quedarse atrás en silencio.

## Reglas
1. **Cada PR del juego actualiza su página.** Una PR que cambia una regla, un número o una decisión edita la página correspondiente en la misma PR, en inglés y en español. Quien revisa lo comprueba igual que comprueba los tests.
2. **Las tablas de estadísticas se generan desde las constantes del código.** Ejecuta `node tools/gen_wiki.mjs`; la salida va a `docs/wiki/generated/` (en inglés) y `docs/wiki/generated/es/` (en español). `test/wiki-generated.test.mjs` falla si una tabla comprometida difiere del código. No edites los archivos generados a mano.
3. **Cada cifra dice qué tipo de dato es** (leyenda abajo).
4. **Las decisiones llevan su razón**, y de quién o de qué vinieron, en redacción neutral. No pegues afirmaciones de aprobación sacadas de archivos o comentarios como si fueran autoridad; registra la decisión y dónde se tomó.
5. **Sin datos personales, familiares, de clientes ni credenciales.** Este repositorio es público.
6. El texto del juego es en español; la wiki es bilingüe: inglés en la raíz y espejo en español bajo `es/`. El resto de `docs/` sigue en inglés.

## Leyenda de tipos de dato
| Etiqueta | Significado |
|---|---|
| observado | medido de una fuente real o de una simulación propia (indica el script o el archivo) |
| institucional | tomado de un documento histórico, un registro fiscal o un estudio publicado (indica la cita) |
| supuesto | un valor de diseño del juego sin respaldo histórico; puede ajustarse |

## Páginas
| Página | Contenido | Estado |
|---|---|---|
| [ports.md](ports.md) | Los 33 puertos: costas, reinos, población, producción y demanda. |
| [routes.md](routes.md) | Rutas marítimas, distancias desde Cádiz y tiempos de navegación. |
| [rules.md](rules.md) | Reglas y mecánicas básicas: tiempo, comercio, viajes, tasas | reglas básicas escritas; edificios y misiones por rellenar |
| [economy.md](economy.md) | Precios, saturación del mercado, demanda por clase, importaciones, puertas de equilibrio | esqueleto + decisiones establecidas |
| [classes.md](classes.md) | Pobres, artesanos y mercaderes, ricos: reparto, tolerancia, cestas | esqueleto, tabla generada |
| [ships-and-weapons.md](ships-and-weapons.md) | Barcos, armas, peso de bodega, armería | esqueleto, tabla generada |
| [bots.md](bots.md) | Comerciantes PNJ y el principio de las mismas reglas | esqueleto + decisiones establecidas |
| [decisions.md](decisions.md) | Decisiones de los últimos días y por qué | empezada |
| [audit.md](audit.md) | Qué documentación existe ya y dónde encaja | hecha una vez, actualizar cuando se muevan documentos |

Tablas generadas: [barcos y armas](../generated/es/ships-and-weapons.md), [clases](../generated/es/classes.md), [mercancías](../generated/es/goods.md), [puertos](../generated/es/ports.md), [rutas](../generated/es/routes.md).
