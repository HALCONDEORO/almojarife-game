> Historical source snapshot from 20 October 2026. Superseded architecture, counts, tests and workflow claims below are preserved for comparison, not current release evidence or instructions. See docs/CURRENT-STATE.md for the current release checkpoint.

# OPUS-REPORT-3: sucesos de ciudad (hambruna, epidemia, feria)

Rama `opus/city-events`. Mecánica 3 de `PLAN-OPUS.md`. Sin push.

## Qué cambia para el jugador

- De vez en cuando le pasa algo a un puerto durante unos días o semanas:
  - **Hambruna** (20–30 días): la ciudad come mucho más grano y produce mucho menos. El grano se encarece mucho allí y también sube algo el pescado seco.
  - **Epidemia** (15–24 días): la ciudad produce casi la mitad de todo y compra mucho menos. Lo que fabrica sube de precio y lo que necesita baja: mal sitio para vender.
  - **Feria** (7–11 días, solo en ciudades grandes: Sevilla, Lisboa, Valencia, Barcelona): se venden muchos más paños, seda y vino, así que sus precios suben.
- **Solo te enteras si estás allí**: un barco atracado o un almacén en ese puerto, o un rumor comprado en la taberna después de que empezara el suceso. Entonces recibes un mensaje en la bandeja y una línea en el diario. Si no, lo descubres al llegar. Cuando termina un suceso del que sabías, también te avisan.
- En el mapa, las ciudades con un suceso que conoces llevan un punto dorado, y el texto emergente dice qué pasa y cuántos días quedan. En el panel del puerto sale un recuadro con el mismo aviso.
- Los rivales (IA) comercian en el mismo mercado, así que también aprovechan los precios.
- Solo pasa en partidas con eventos (`eventsOn`; el juego web siempre las crea así). Cada semana, cada puerto tiene un 3 % de probabilidad. Como mucho hay un suceso por puerto y dos a la vez en el mapa, y cada puerto descansa 35 días después de uno. Sale de media unos 11 sucesos al año.

## Por qué importa

Hoy el mercado cambia con las estaciones y es fácil de prever. Estos sucesos son oportunidades cortas y locales que hay que **ver a tiempo y aprovechar**: llevar grano a una ciudad con hambruna, vino a una feria, no vender en una ciudad con epidemia. Además da valor a lo que ya existe en el juego: los almacenes y los rumores se convierten en una forma de vigilar puertos, y los barcos repartidos por el mapa te informan.

## Cómo está hecho

- `src/game/cityevents.mjs` (nuevo): validador, tirada semanal con semilla (`seeded("cev:"+semana+ciudad+g.seed)`), modificadores de mercado, cuándo se entera el jugador, mensajes y etiquetas. No usa el DOM.
- `src/sim/market.mjs`: `tickMarket(market, day, mods?)` acepta un parámetro opcional al final, `{ciudad: {mercancía: {make, use}}}`, que multiplica la producción y el consumo. Sin él, el resultado es el mismo de antes, número a número; lo comprueba un test.
- `src/game/game.mjs`: tres líneas en `advanceDay`: cerrar y tirar sucesos antes de mover el mercado, pasar los modificadores a `tickMarket` y, después de `refreshIntel`, avisar de los sucesos que el jugador acaba de descubrir.
- `data/world.json`: nueva lista `cityEvents` (id, peso, días [mín, máx], `minPop` opcional, `mods`). Los números son nuestros.
- `locales/es.json` y `locales/en.json` (nuevos): nombre, texto de inicio y de fin de cada suceso, más las etiquetas «quedan N días». Los textos son nuestros.
- `web/main.mjs`: carga los dos ficheros de `locales/`, pinta el punto en el mapa y el aviso en el panel del puerto.
- No toqué banca, rutas, ledger ni `ledgerview.mjs`. Los mensajes usan el tipo `info`, que ya existe, con el texto en los dos idiomas (`txt: {es, en}`), y `post()` de ledger sin cambiarlo.
- Compatibilidad: el estado nuevo es `g.cityEvents` (lista de `{id, city, start, end, seen, closed}`), y siempre se lee con `?? []`. Las partidas v1 cargan y siguen sin migración. `SAVE_VERSION` no cambia.

## Tests

`npm test`: **174 tests, pasan 173**. El que falla es `test/world.test.mjs`, porque no está `data/ne_50m_land.geojson` (se descarga con `tools/fetch_data.sh`). Es el fallo local de siempre y no tiene que ver con este cambio.

Nuevos:
- `test/marketmods.test.mjs` (2): sin modificadores, con `null`, `{}` o con multiplicadores a 1, el mercado sale igual que antes. Los modificadores solo tocan la ciudad y la mercancía que nombran.
- `test/cityevents.test.mjs` (13):
  - los sucesos incluidos pasan el validador con textos ES/EN, y el validador detecta días, mercancías, modificadores o ids malos y textos que faltan;
  - con la misma semilla salen los mismos sucesos, y con otra salen otros;
  - el ritmo es razonable, nunca hay más de 2 a la vez ni 2 en el mismo puerto, y solo empiezan en días de tirada;
  - cada suceso termina exactamente el día que toca;
  - sin eventos no hay sucesos;
  - durante una hambruna el precio del grano sube más de 1,5× y, tras el fin, vuelve a ±10 % (90 días simulados);
  - la feria vacía los paños y la epidemia frena la producción en una partida real;
  - el jugador solo recibe el aviso si tiene barco, almacén o rumor, y una sola vez;
  - el fin se avisa solo si el jugador conocía el suceso;
  - las etiquetas salen bien en los dos idiomas;
  - una partida guardada sin `cityEvents` carga y se juega, y un suceso en curso sobrevive a guardar y cargar;
  - un suceso que ya no está en los datos no rompe nada.
- Balance (comprobación a mano, 30 partidas de 365 días): con sucesos, la caja mediana de la IA es 170 700 frente a 152 500 sin ellos, y ningún rival se arruina.

## Riesgos y diferencias con el plan

- **Me aparté del plan en la epidemia**: el plan pedía también +1 % de comisión y un día de cuarentena al atracar. No lo hice, porque habría que tocar `trade.mjs` (comisión), el atraque y las rutas automáticas, que no debía tocar. Hoy la epidemia solo cambia el mercado (producción ×0,55, consumo ×0,65). Se puede añadir con la mecánica 2, cuando exista la comisión por ciudad.
- **Me aparté del plan en la feria**: el plan multiplicaba el objetivo (`target`). Yo multiplico el consumo, para no cambiar `target` en el mercado guardado ni el cálculo de `price()`. El precio sube a medida que baja el stock, no de golpe el primer día.
- Sin reputación extra por abastecer una hambruna: la mecánica 2 todavía no existe.
- Durante el calentamiento inicial de 60 días no hay sucesos: la partida empieza sin ninguno.
- `g.seed` sigue sin asignarse en `newGame`, como ya señalaba el plan. Todas las partidas nuevas tienen la misma secuencia de sucesos hasta que se arregle aparte.
- Las partidas v1 guardadas con `eventsOn: true` empezarán a tener sucesos al actualizar. Es un cambio de balance pequeño y avisado en `CHANGELOG.md`.
- Los textos de sucesos están en `locales/*.json`, pero el resto de la interfaz sigue en `T` y `LT`. Si falla la carga de `locales/` (por ejemplo, abriendo el fichero sin servidor), la página no arranca, igual que pasa ya con `world.json`. Sin textos cargados, la lógica muestra el id del suceso en lugar de fallar.
- No he probado la interfaz en un navegador: solo pasé `node --check` y los tests. Faltan capturas en ES.

## Arreglos tras la revisión de Codex

- (MEDIO) Comprar un rumor ahora avisa del suceso en el acto: `buyRumor` de `src/game/game.mjs` (el que usa la taberna) llama a `noticeCityEvents`. Antes el aviso llegaba al día siguiente, y si comprabas el rumor el último día no recibías ni el aviso de inicio ni el de fin. El test usa la misma llamada que el botón, sin llamar al aviso a mano, y hay un test nuevo para el último día.
- (BAJO) `TRANSLATING.md` y `locales/README.md` explican que los textos de sucesos están en `locales/es.json` y `locales/en.json`, con sus claves y huecos, y que el resto sigue en `T`.

## Commits

No pude hacer los commits. Git no tiene identidad configurada en esta máquina, y no tenía permiso ni para `git config` ni para pasar el autor por variables de entorno. Los cambios están en el árbol de trabajo. `src/sim/market.mjs` y `test/marketmods.test.mjs` ya están en el área de preparación (`git add`) como primer commit. Secuencia propuesta, en commits pequeños:

1. `Market: optional production/consumption modifiers per city and good in tickMarket`: `src/sim/market.mjs`, `test/marketmods.test.mjs`.
2. `City events: famine, epidemic and fair (data, ES/EN texts, daily hook, tests)`: `src/game/cityevents.mjs`, `src/game/game.mjs`, `data/world.json`, `locales/es.json`, `locales/en.json`, `test/cityevents.test.mjs`. Van juntos porque los tests necesitan el enganche en `advanceDay`.
3. `UI: city event marker on the map and notice in the port panel`: `web/main.mjs`, `CHANGELOG.md`.
4. `Report for mechanic 3`: `OPUS-REPORT-3.md`.
