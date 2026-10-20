# OPUS-REPORT-8: talleres propios (mecánica 8 del plan)

Rama `opus/workshops`. Sin push. Primer paso mínimo: un solo taller, el **telar de paños**, sin mercancías nuevas.

## Qué cambia para el jugador

- En el panel del puerto hay una pestaña nueva, **Talleres**.
- Ahí puedes construir un **telar de paños** si:
  - el puerto produce lana o tiene al menos 30 000 habitantes (hoy: Bilbao, Sevilla, Lisboa, Valencia y Barcelona),
  - tienes un barco amarrado allí,
  - tienes almacén propio en ese puerto,
  - y tienes 2 200 monedas.
- La obra tarda 10 días. Cuando termina te llega un mensaje: «Tu Telar de paños en Bilbao ya funciona».
- Cada día el telar coge **4 de lana** de tu almacén y deja **3 de paño** en el mismo almacén. No compra ni vende nada solo: no toca los precios del puerto. Tú llevas la lana al almacén y te llevas el paño a vender.
- Si se acaba la lana o el almacén se llena (300 unidades), el telar se para y te avisa **una sola vez**. Vuelve a trabajar solo cuando hay lana o sitio. Un telar parado no acumula días de trabajo atrasados.
- Cuesta 15 monedas al día (6 de mantenimiento y 9 de salarios), también cuando está parado. Se paga una vez a la semana, el mismo día que el mantenimiento de los barcos. Recibes un mensaje: «Talleres, semana N: produjeron X unidades; salarios y mantenimiento Y». Si no tienes caja, esa cantidad deja la caja en negativo, igual que el mantenimiento de los barcos.
- Puedes vender el telar por la mitad de su precio (1 100). Lo que debía esa semana se paga en ese momento.
- Las partidas guardadas antes de este cambio cargan y se juegan igual: no tienen talleres hasta que construyas uno.

## Por qué importa

Hasta ahora el único negocio era comprar barato y vender caro. Con el telar, la casa mercantil **fabrica**: compra lana barata donde se produce (en Bilbao arranca a unos 27 la unidad), la convierte en paño y lo vende donde se necesita (Cádiz, Palma, Tánger, Cartagena, a 145-156 al empezar). Eso da un motivo para tener almacenes, para hacer viajes regulares y para planificar una cadena de suministro. Es la base del juego avanzado. Las recetas están en `data/world.json` (`workshops`), así que los talleres siguientes serán sobre todo datos y textos.

## Cómo está hecho

- `data/world.json`: sección nueva `workshops` con el telar (nombre y descripción en ES/EN, precio, días de obra, mantenimiento, salarios, tandas por día, insumos, productos y dónde se permite). Opcional: `season` (una mercancía) para que un taller agrícola produzca menos fuera de temporada con `seasonMul`. El telar no la usa.
- `src/game/workshops.mjs` (nuevo): `validateWorkshops`, `allowedIn`, `buildWorkshop`, `sellWorkshop`, `tickWorkshops` (producción diaria y cobro semanal), `workshopsDue`, `workshopsValue`. Sin DOM y sin aleatoriedad: la producción es determinista, así que no hace falta semilla.
- `src/game/game.mjs`: una llamada a `tickWorkshops(g)` en `advanceDay`, justo antes de la liquidación semanal, y reexporta las acciones.
- `web/main.mjs`: pestaña Talleres y claves ES/EN en el diccionario `T`. Es la convención actual según `TRANSLATING.md` y `locales/README.md`: `locales/*.json` todavía no existen, así que no he creado ficheros nuevos ahí.
- Los mensajes de la bandeja se envían como `info` con texto `{es, en}` (diccionario `WT` en `workshops.mjs`), igual que los eventos. Por eso **no** hay cambios en `ledger.mjs` ni en `ledgerview.mjs`.
- **Sin tocar**: banca, rutas, ledger, rangos y `netWorth`.
- Estado guardado: `g.workshops[ciudad][tipo]` y `g.workshopReports`, siempre leídos con `??`. Sin migración: `SAVE_VERSION` sigue en 1.

Commits:
1. `Workshops: own cloth loom that turns warehouse wool into cloth`: datos, lógica y tests.
2. `UI: Workshops tab in the port panel (build, status, sell), texts in ES and EN`.
3. Changelog e informe.

## Tests

`test/workshops.test.mjs`, 16 tests nuevos:
- validador: los datos que trae el juego son válidos y solo usan mercancías existentes; detecta mercancías desconocidas, cantidades no válidas, textos sin ES/EN, ids duplicados y `allow` vacío;
- puertos permitidos exactos;
- requisitos para construir: almacén, barco, caja, puerto permitido y no repetir taller;
- durante la obra no produce ni cobra;
- producción exacta (4 → 3 al día) sin tocar el `market`;
- con insumos a medias se para, avisa una sola vez y vuelve a trabajar;
- parado no acumula tandas atrasadas;
- respeta la capacidad del almacén (300);
- los costes se acumulan cada día y se cobran el día de liquidación, con informe y mensaje en ES/EN;
- el cobro puede dejar la caja en negativo, como el mantenimiento de los barcos;
- un taller con estación produce menos en la temporada baja;
- vender devuelve el 50 % y cobra lo pendiente;
- una partida guardada sin talleres carga y avanza; guardar y cargar conserva el telar;
- un tipo de taller que desaparece de los datos se ignora y no rompe la partida;
- un bot que tiene un telar funcionando un año y vende todo el paño en Cádiz no hunde el precio de forma permanente.

Resultado de `npm test`: **176 tests, 175 pasan, 1 falla**. El que falla es `test/world.test.mjs`, que necesita `data/ne_50m_land.geojson` (se descarga con `tools/fetch_data.sh`, sin red aquí). Ese fallo ya estaba antes del cambio: antes eran 160 tests y pasaban 159.

## Riesgos

1. **Balance**: con los precios iniciales el telar rinde mucho. En Bilbao, 4 de lana cuestan unos 108 y 3 de paño se venden por unos 450 en Tánger o Palma (antes de que el precio baje al vender). Lo frenan el deslizamiento de precio al vender 21 paños por semana en puertos pequeños, la capacidad del almacén y los viajes. Aun así, el margen del comercio directo de lana (27 → 114 en Cádiz) es del mismo orden. Antes de fusionar conviene pasar `npm run sim1000` con un jugador-bot que use el telar, y quizá subir el precio o los salarios.
2. **Aviso de caja baja**: `warnLowCash` (en `ledger.mjs`, que no he tocado) no suma el coste de los talleres. El aviso del día anterior puede quedarse corto en unas 105 monedas por telar. Se arregla con una línea en `ledger.mjs` en un PR aparte.
3. **Informe semanal**: el coste de los talleres sale de la caja antes de `settleWeek`, así que «Caja tras el pago» del informe ya lo refleja. Pero no aparece como línea propia en la tabla del informe, solo en el mensaje semanal y en `g.workshopReports`. Para mostrarlo en el informe hay que tocar `ledger.mjs` y `ledgerview.mjs`; queda para otro PR.
4. **Patrimonio**: `netWorth` no incluye el valor del telar, para no cambiar el tope de préstamos del banco. `workshopsValue(g)` está exportado para que los rangos (mecánica 1, de otro agente) lo sumen a su `companyValue`.
5. **UI sin probar en navegador**: la pestaña pasa `node --check`, pero no la he abierto en el juego ni hay capturas. Hay que revisarla a mano: que no se desborde y que los textos se lean bien en ES y EN.
6. **Conflictos de fusión**: toco `game.mjs` (import, una línea en `advanceDay` y reexport) y `web/main.mjs` (import, claves `T`, pestaña). Otro agente trabaja en banca y rangos y puede tocar las mismas zonas, aunque los cambios son pequeños y aditivos.
7. **Revisión pendiente**: según la política de modelos, este PR es código de juego y necesita revisión independiente (Codex `gpt-6.1-sol` medium) y CI en verde antes de fusionarse.
