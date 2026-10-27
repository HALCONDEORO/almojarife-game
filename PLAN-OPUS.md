> Historical source snapshot from 20 October 2026. Superseded architecture, counts, tests and workflow claims below are preserved for comparison, not current release evidence or instructions. See docs/CURRENT-STATE.md for the current release checkpoint.

# PLAN-OPUS: hacia la profundidad de un juego de comercio hanseático

Rama: `opus/patrician-mechanics` · Fecha: 2026-10-20 · Fase 1 (análisis, sin implementar)

Reglas que sigue todo el plan: solo mecánicas **inspiradas** en el género. Nada de código, texto, nombres de edificios/ciudades, tablas de números ni arte del juego original. Todo con nuestro mundo ibérico/mediterráneo, nuestros nombres y nuestros números. Sin red, sin secretos, sin dependencias nuevas.

---

## 1. Estado actual del juego

### Arquitectura
- **JS puro con módulos ES**, sin build ni dependencias (three.js vendorizado solo para el prototipo 3D). `index.html` / `web/main.mjs` (366 líneas: UI, diccionario `T` ES/EN en línea, render por strings HTML).
- **Lógica sin DOM y testeable**:
  - `src/sim/`: mundo y grafo de rutas (`world.mjs`, Dijkstra sobre carriles), mercado (`market.mjs`: precio = base·(target/stock)^0.6, limitado a 0.4x–3x; producción, goteo local, consumo y estaciones), barcos y comercio (`trade.mjs`: 4 tipos de barco, impacto de precio unidad a unidad, comisión del 2 %), IA (`ai.mjs`: 3 comerciantes rivales codiciosos por beneficio/día), validador de datos.
  - `src/game/`: estado de partida y acciones (`game.mjs`), contabilidad semanal y bandeja de mensajes (`ledger.mjs`), banco (`bank.mjs`), rutas automáticas (`routes.mjs`), eventos en el mar dirigidos por datos (`events.mjs`), información de mercado y rumores (`intel.mjs`), perfil (escudo, retrato, origen), guardado versionado (`gamesave.mjs`).
  - `src/view/`: escenas dibujadas en código (ciudad, astillero, barcos, atmósfera), vista de informes/mensajes (`ledgerview.mjs`, con su propio diccionario `LT`).
- **Datos** en `data/world.json`: 9 puertos (Cádiz, Sevilla, Lisboa, Valencia, Barcelona, Palma, Bilbao, Tánger, Cartagena) con `pop`, `makes`, `needs`, `river`; 12 mercancías con precio base; waypoints y carriles; 4 eventos de mar con elecciones (`storm`, `pirates`, `fair_wind`, `drifting_cargo`).

### Bucle de juego (ya hecho)
- Meta: 50 000 monedas en 365 días (préstamos no cuentan). Arranque con 2 000 y una coca.
- Mercado vivo con oferta/demanda, estaciones (cosechas y capturas), historial de 30 días y tendencia de 7 días, vista previa de compra/venta, base de coste y beneficio.
- Información imperfecta: solo ves precios donde tienes barco o almacén; resto, último dato visto o rumor de pago (±25 %).
- Astillero: encargar 4 clases con plazo, desgaste del casco, reparar, vender barco. Sin límite de flota.
- Almacenes (1 por puerto, 300 u.). Ayudante «mejor puerto» para la bodega.
- Liquidación semanal: mantenimiento acumulado, informe semanal, beneficio por mercancía, aviso de caja baja, descubierto (2 %/semana, quiebra por debajo de −3 000), préstamos (1 %/semana, plazo 56 días, tope = ½ patrimonio, máx. 5 000).
- Rutas automáticas A↔B con mercancía de ida y de vuelta.
- Eventos de mar opcionales (`eventsOn`) con elecciones y resultados ponderados, semilla determinista.
- Presentación: mapa con carta náutica, sprites propios, escena de puerto, astillero ilustrado, tema pergamino, prototipo 3D, ES/EN.

### Tests y CI
- `npm test` = `node --test test/*.test.mjs`: **156 tests en 28 archivos**. En local pasan 155; falla `test/world.test.mjs` solo porque necesita `data/ne_50m_land.geojson`, que se descarga con `tools/fetch_data.sh` (red). En CI pasa.
- CI (`.github/workflows/ci.yml`): Node 20, `fetch_data.sh`, `npm test`. Sin linter. El validador de `world.json` corre dentro de los tests.
- Herramienta de balance: `npm run sim1000` (`tools/sim_1000y.mjs`).

### Guardado y compatibilidad (clave para todo el plan)
- `gamesave.mjs`: `{ version: 1, savedAt, company, state }`, donde `state` es el objeto de partida **sin** `world` (el mundo se recarga de `world.json`). `MIGRATIONS = {}` todavía vacío. Clave de localStorage `almojarife.save.v1`.
- El código ya sigue la convención de campos opcionales con valor por defecto (`g.loans ?? []`, `g.accrued ??= …`, `ship.hull ?? 100`). **Un campo nuevo y aditivo no necesita migración** si se lee siempre con `??`.
- Hace falta migración (subir a `SAVE_VERSION = 2`) cuando: cambia el significado de un campo existente, o se añade una **mercancía nueva** (el `market` guardado no tendría la entrada y `price()` rompería).
- Cambios en `world.json` (nuevos campos de ciudad, eventos) se aplican solos a partidas viejas porque el mundo no se guarda.

### Hallazgos menores detectados durante la lectura
- `g.seed` nunca se asigna en `newGame`; eventos y rumores usan `g.seed ?? 0`, así que todas las partidas comparten la secuencia de eventos. Conviene fijar una semilla al crear partida (aditivo, compatible).
- `resolveEvent` limita el efecto de caja a `Math.max(0, …)`, incoherente con el descubierto ya existente (un pago de piratas nunca deja la caja negativa).
- Mensajes con dos diccionarios (`T` en `main.mjs` y `LT` en `ledgerview.mjs`); cada mecánica nueva debe añadir claves en ambos idiomas en el sitio correcto.

### Ya hecho y excluido de este plan
Préstamos, descubierto, informe de beneficio por mercancía, rutas automáticas.

---

## 2. Las 8 mecánicas candidatas, por impacto/riesgo

| # | Mecánica | Impacto | Riesgo | Tamaño | Depende de |
|---|---|---|---|---|---|
| 1 | Rangos y títulos del gremio por patrimonio | Alto | Bajo | S | — |
| 2 | Reputación por ciudad | Alto | Bajo-medio | M | — |
| 3 | Sucesos de ciudad: hambruna, epidemia, feria | Alto | Bajo-medio | M | — |
| 4 | Encargos del concejo (contratos con plazo) | Muy alto | Medio | M | 2 (opcional 3) |
| 5 | Aranceles por puerto y privilegios | Medio | Bajo-medio | S-M | 2 |
| 6 | Tripulación y artillería (líneas semanales) | Medio | Medio | M | — |
| 7 | Piratería por zonas con riesgo visible y escolta | Alto | Medio-alto | M-L | 6 |
| 8 | Talleres propios (cadenas de producción) | Muy alto | Alto | L | almacenes (hecho) |

Orden de trabajo propuesto: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8. Cada una es un PR pequeño con tests, textos ES/EN y capturas en ES, como pide `docs/BACKLOG.md`.

---

### 1. Rangos y títulos del gremio por patrimonio

**Por qué**: hoy el jugador solo tiene «caja vs 50 000». Una escalera de rangos da objetivos intermedios y sensación de carrera (pilar del género). Es lo primero de la lista del dueño tras las rutas.

**Diseño**
- Seis rangos con nombres propios de la época ibérica (originales nuestros): `buhonero` → `tratante` → `mercader` → `naviero` → `cónsul de mar` → `almojarife` (el título del juego como cima, ya previsto en `docs/research`).
- Umbral por **valor de la compañía** (ver abajo): p. ej. 0 / 4 000 / 9 000 / 18 000 / 32 000 / 50 000. Valores propios, ajustables con `sim1000`.
- Se añade el valor de los barcos (`shipValue`) y almacenes al cálculo de patrimonio **solo para rango** (`companyValue(g)`), sin tocar `netWorth` usado por el banco (evita cambiar el tope de préstamos de partidas en curso).
- El rango **nunca baja** (histéresis): se guarda el máximo alcanzado. Evita castigo y oscilaciones.
- Ventajas pequeñas y no acumulativas en bola de nieve: −5 % en reparaciones por rango, +500 de tope de préstamo por rango a partir de `naviero` (respetando `LOAN_MAX` ampliado de forma explícita), y desbloqueo de cosas futuras (p. ej. encargos de mayor valor en #4, privilegios en #5).
- Mensaje en bandeja al subir de rango y línea en el informe semanal.

**Archivos**: nuevo `src/game/ranks.mjs` (tabla, `companyValue`, `rankOf`, `checkRank`); `src/game/game.mjs` (llamar `checkRank` en `advanceDay`, descuento en `repairCost`); `src/game/bank.mjs` (parámetro de tope extra en `loanRoom`); `src/view/ledgerview.mjs` (texto del mensaje `rankUp`); `web/main.mjs` (título junto al nombre de la casa, claves `T`).

**Tests**: `test/ranks.test.mjs`: umbrales y orden; rango no baja al perder dinero; `companyValue` cuenta barcos y almacenes; un único mensaje por subida; descuento de reparación; tope de préstamo nunca supera el máximo definido.

**Compatibilidad**: aditivo (`g.rank ??= 0`). Partidas viejas calculan el rango en el primer día. Sin migración.

---

### 2. Reputación por ciudad

**Por qué**: es el eje que conecta comercio, contratos, aranceles y política. Hoy las ciudades son mercados intercambiables.

**Diseño**
- `g.rep[cityId]` de −100 a +100, empieza en 0 (en el puerto de origen +10).
- **Sube** al vender en una ciudad mercancías que ella `needs` mientras están caras (precio > base), proporcional a las unidades; también por encargos cumplidos (#4) y por abastecer durante una hambruna (#3).
- **Baja** al comprar casi todo el stock de un básico (`grain`, `dried_fish`, `salt`, `timber`) dejándolo por debajo de ½ del objetivo, y por encargos fallidos.
- Decae despacio hacia 0 en cada liquidación semanal (memoria larga, como en el género, pero no eterna).
- Efecto inicial pequeño y legible: la comisión del puerto pasa de 2 % a 1,5 % (rep ≥ 50) o 2,5 % (rep ≤ −50). Se muestra en el panel del puerto con una palabra («apreciado», «neutral», «mal visto»).
- La IA no tiene reputación (no hace falta todavía).

**Archivos**: nuevo `src/game/reputation.mjs` (`repOf`, `addRep`, `decayRep`, `feeFor(g, city)`); `src/sim/trade.mjs` (`buy`/`sell`/`preview*` aceptan una comisión opcional, por defecto `FEE`: la IA y la sim no cambian); `src/game/game.mjs` (`doBuy`/`doSell` pasan la comisión y llaman a `addRep`); `src/game/ledger.mjs` (decaimiento en `settleWeek`); `web/main.mjs` (indicador en el panel); `ledgerview.mjs`.

**Tests**: `test/reputation.test.mjs`: vender un `needs` caro sube; vender barato no; vaciar un básico baja; límites ±100; decaimiento; la comisión cambia el coste exacto de `buy`; `buy` sin comisión explícita da el mismo resultado que hoy (regresión de `trade.test.mjs`).

**Compatibilidad**: aditivo (`g.rep ??= {}`). La firma de `buy/sell` se amplía con parámetro opcional al final: llamadas existentes intactas. Sin migración.

---

### 3. Sucesos de ciudad: hambruna, epidemia y feria

**Por qué**: el mercado actual es estacional pero previsible. Sucesos locales y cortos crean oportunidades que el jugador debe detectar (encaja con la información imperfecta ya hecha: solo te enteras si estás o pagas rumor).

**Diseño**
- Sucesos en datos, nueva lista `world.cityEvents` en `world.json` con id, peso, duración (días), textos ES/EN y **modificadores de mercado** por mercancía: multiplicador de consumo, de producción o de objetivo (`target`).
  - `famine` (hambruna): consumo de `grain` ×2,5 y producción de `grain` ×0,3 durante 20–30 días.
  - `epidemic` (epidemia): consumo general ×0,6 (menos gente), comisión +1 %, barcos que atracan pierden un día (cuarentena); 15–25 días.
  - `fair` (feria): objetivo de `cloth`, `silk`, `wine` ×1,8 (demanda), 7–10 días.
- Probabilidad baja por ciudad y semana, máximo un suceso por ciudad y dos activos en todo el mapa. Semilla determinista (`seeded("cev:"+semana+ciudad+g.seed)`).
- Aviso: mensaje en bandeja **solo** si la ciudad es «conocida» (barco/almacén presente) o al comprar un rumor; si no, el jugador lo descubre al llegar. Así se aprovecha `intel.mjs`.
- Abastecer una ciudad en hambruna da reputación extra (#2), si ya existe.
- Las mismas reglas se aplican durante el calentamiento y a la IA (entra en `tickMarket`), así que los rivales también reaccionan.

**Archivos**: nuevo `src/game/cityevents.mjs` (`rollCityEvents`, `activeMods(g, city, good)`, `validateCityEvents`); `src/sim/market.mjs` (`tickMarket(market, day, mods?)` con modificadores opcionales); `src/game/game.mjs` (tirada semanal y paso de modificadores); `src/sim/validate.mjs` o `test/validate.test.mjs` (validar la lista); `data/world.json`; `web/main.mjs` (icono en el mapa sobre la ciudad afectada si es conocida); `ledgerview.mjs`.

**Tests**: `test/cityevents.test.mjs`: validador (ids, pesos, textos ES/EN, mercancías existentes); determinismo con la misma semilla; caducidad exacta; durante una hambruna el precio de `grain` sube y vuelve tras el fin (sim de 60 días); topes de simultaneidad; sin modificadores `tickMarket` da lo mismo que hoy (regresión); balance con `sim1000` sin quiebras masivas de la IA.

**Compatibilidad**: aditivo (`g.cityEvents ??= []`). Partidas viejas sin la lista funcionan; la lista en `world.json` vale para todas. Activar solo si `g.eventsOn` (coherente con los eventos de mar) o con nuevo flag; documentar. Sin migración.

---

### 4. Encargos del concejo (contratos con plazo)

**Por qué**: la mecánica con más impacto en el medio juego: da metas concretas («lleva 40 de hierro a Valencia antes del día 120»), recompensa la planificación y alimenta la reputación. Está en las «diez ideas» del dueño (#2).

**Diseño**
- Tablón por puerto, visible en una pestaña nueva **Concejo** del panel del puerto cuando tienes barco atracado.
- Generación desde el estado real del mercado: se elige una mercancía que la ciudad `needs` (o que está cara, o afectada por un suceso #3). Cantidad proporcional a `pop`, plazo = días de viaje desde el productor más cercano × 2 + margen.
- Recompensa: precio de mercado esperado × cantidad × (1,25–1,5) + reputación; penalización por fallar: multa pequeña (10 % de la recompensa, puede ir a descubierto, como el resto del juego) y −reputación.
- Máx. 3 encargos aceptados a la vez; el tablón se renueva cada semana; los encargos grandes exigen rango (#1) o reputación (#2).
- Entrega: botón «Entregar» cuando hay barco atracado o almacén con la mercancía. Las unidades salen de la bodega/almacén **sin pasar por el mercado** (no mueve precios ni cuenta como venta en `weekTrade`; se registra como línea propia «encargos» en el informe semanal).
- Mensajes: aceptado, a 7 días del plazo, cumplido, fallido.

**Archivos**: nuevo `src/game/contracts.mjs` (`offersFor`, `accept`, `deliver`, `processContracts`); `src/game/game.mjs` (llamada diaria, reexportar acciones); `src/game/ledger.mjs` (línea «encargos» en el informe); `src/view/ledgerview.mjs`; `web/main.mjs` (pestaña Concejo, claves `T`).

**Tests**: `test/contracts.test.mjs`: oferta determinista por semilla y semana; la mercancía siempre es necesaria/cara en la ciudad; plazo alcanzable con el barco más lento; aceptar respeta el máximo; entrega parcial y total; vencimiento aplica multa y reputación una sola vez; entregar no altera el `market`; partidas sin `contracts` no fallan.

**Compatibilidad**: aditivo (`g.contracts ??= { offers:{}, active:[] }`). Sin migración.

---

### 5. Aranceles por puerto y privilegios

**Por qué**: diferencia los puertos (uno barato para descargar, otro caro pero con demanda), da uso a la reputación y prepara el «almojarifazgo» (el impuesto aduanero que da nombre al juego, buena identidad propia).

**Diseño**
- Campo opcional `toll` por ciudad en `world.json` (p. ej. 0–4 %), aplicado **solo a la venta** por encima de la comisión. Ciudades sin campo: 0 (comportamiento actual).
- Privilegio de comercio por ciudad: se compra una vez (precio según `pop`) si reputación ≥ 30 y rango ≥ `mercader`; quita el arancel de esa ciudad. Se pierde si la reputación cae por debajo de −30.
- Se muestra en la vista previa de venta y en «mejor puerto» (beneficio neto real).
- La IA paga el arancel (justo y simple), sin privilegios.

**Archivos**: `data/world.json` (campo `toll`); `src/sim/validate.mjs` (0 ≤ toll ≤ 0,1); `src/sim/trade.mjs` (el parámetro de comisión de #2 pasa a ser `{buyFee, sellFee}`); `src/sim/ai.mjs` (usar el arancel en `bestPlan`); `src/game/reputation.mjs` o nuevo `src/game/privileges.mjs`; `src/game/game.mjs` (`bestPorts`, `doSell`); `web/main.mjs`.

**Tests**: validador del campo; venta con arancel da el ingreso exacto; privilegio exige requisitos y elimina el arancel; se pierde con mala reputación; `bestPorts` ordena por neto; IA con arancel sigue rentable en `ai.test.mjs`; con todos los `toll` a 0 los resultados son idénticos a hoy.

**Compatibilidad**: aditivo (`g.privileges ??= {}`); el arancel vive en `world.json`. **Riesgo de balance** para partidas en curso (ingresos algo menores al actualizar): avisar en CHANGELOG; aranceles bajos. Sin migración.

---

### 6. Tripulación y artillería (líneas semanales)

**Por qué**: hoy un barco solo cuesta mantenimiento fijo. Tripulación y cañones crean decisiones de equipamiento (carga vs seguridad) y son la base de la piratería (#7). Está pedido por el dueño (21:23) y en la lista de liquidación semanal.

**Diseño**
- Por clase de barco (en `SHIP_TYPES`, luego a datos): `crewMin`, `crewMax`, `gunSlots`.
- `ship.crew` (marineros) y `ship.guns` (piezas). Salario semanal por marinero; cada cañón ocupa 3 de carga y tiene mantenimiento semanal. Contratación en el puerto (pestaña Astillero o futura taberna) con coste de enganche.
- Por debajo de `crewMin` el barco no zarpa; entre min y max la velocidad sube un poco (máx. +10 %).
- Liquidación: el informe muestra líneas separadas «salarios» y «artillería» por barco (ampliando `accrueDay`/`settleWeek`).
- Sin efecto en combate todavía, solo en eventos existentes: `pirates/fight` usa las probabilidades actuales, pero con cañones mejora el resultado (las probabilidades del evento se ajustan por cañones con una regla simple y probada).

**Archivos**: `src/sim/trade.mjs` (campos de clase, `effectiveCapacity`, velocidad con tripulación, `sail` exige tripulación mínima); `src/game/ledger.mjs` (acumulación de salarios y artillería, líneas del informe); `src/game/game.mjs` (`hireCrew`, `buyGuns`, `sellGuns`; `orderShip` entrega con tripulación mínima); `src/game/events.mjs` (modificador por cañones); `src/game/routes.mjs` (rutas compran hasta la capacidad efectiva); `src/view/ledgerview.mjs`; `src/view/yardscene.mjs` (opcional); `web/main.mjs`.

**Tests**: no zarpa sin tripulación mínima; capacidad efectiva baja con cañones; salarios aparecen en la liquidación con el total correcto; la velocidad con más tripulación; el evento de piratas con cañones tiene mejor resultado esperado; regresión de rutas y de `ledger.test.mjs`.

**Compatibilidad**: **riesgo medio**. Barcos guardados no tienen `crew` y con la regla nueva no podrían zarpar (barcos a medio viaje, rutas activas). Solución: subir `SAVE_VERSION` a 2 con la primera migración real: `MIGRATIONS[1]` asigna `crew = crewMin` y `guns = 0` a cada barco y devuelve `version: 2`. Además leer siempre `ship.crew ?? crewMin` como red de seguridad. Test de migración v1→v2 con una partida v1 congelada como fixture en `test/fixtures/save-v1.json`.

---

### 7. Piratería por zonas con riesgo visible y escolta

**Por qué**: el riesgo en el mar es parte central del género, pero el evento `pirates` actual es azar puro por día. El dueño pidió explícitamente «mostrar el riesgo antes de zarpar y que los cañones lo reduzcan».

**Diseño**
- Campo opcional `risk` (0–1) en waypoints de `world.json` (p. ej. estrecho de Gibraltar y costa norteafricana más altos, Cantábrico medio, interior de la costa levantina bajo). Valores propios.
- Riesgo de un viaje = combinación de los `risk` de los nodos de `voyage.path`, ponderada por días. Se muestra al planificar (menú contextual, vista previa de ruta): «Riesgo: bajo/medio/alto».
- La probabilidad diaria del evento `pirates` pasa a depender del tramo actual (posición ya calculable con `src/sim/position.mjs`) en vez de ser plana; el resto de eventos sigue igual.
- Reducción del riesgo: cañones (#6) y **convoy**: barcos propios que salen el mismo día del mismo puerto al mismo destino viajan juntos (`voyage.convoy = id`); el evento afecta al convoy y la defensa suma los cañones de todos.
- Estación: el riesgo sube en verano (temporada de corso), usando `seasonOf`.
- Las rutas automáticas registran asaltos en sus mensajes; opción «evitar riesgo alto» en la ruta (no zarpa si el riesgo > umbral).

**Archivos**: `data/world.json` (`risk` en waypoints); `src/sim/validate.mjs`; nuevo `src/game/piracy.mjs` (`voyageRisk`, `dailyPirateChance`, agrupación de convoyes); `src/game/events.mjs` (probabilidad por evento según contexto, efecto sobre todo el convoy); `src/sim/trade.mjs` (`sail` acepta `convoy`); `src/game/routes.mjs`; `src/view/nav.mjs` y `web/main.mjs` (riesgo en la vista previa).

**Tests**: `voyageRisk` monótono con la ruta; la tasa observada de piratas en 10 000 días simulados crece con el riesgo y baja con cañones (test estadístico con semilla fija y tolerancia); convoy aplica un solo evento a todos sus barcos; sin `risk` en datos el comportamiento es el actual; rutas con «evitar riesgo alto» no zarpan.

**Compatibilidad**: datos nuevos aditivos; `voyage.convoy` opcional (viajes guardados sin él = barco solo). Depende de la migración de #6. Riesgo principal de **sensación de injusticia**: comunicar siempre el riesgo antes y en el mensaje del evento.

---

### 8. Talleres propios (cadenas de producción)

**Por qué**: en el género, la producción propia es el motor del juego avanzado; sin ella, el techo es el comercio puro. Mayor impacto a largo plazo, pero la pieza más grande y con más riesgo de balance; por eso va al final y empieza mínima.

**Diseño (primer PR, mínimo)**
- Recetas en datos: nueva sección `world.workshops` con tipos originales y nombres propios en ES/EN, usando **solo mercancías existentes** para no tocar el `market`:
  - `telar` (telar de paños): 4 `wool` → 3 `cloth` por día; permitido en puertos que `makes` `wool` o con `pop` ≥ 30 000.
  - Con las 12 mercancías actuales no hay otra transformación creíble (no hay materias primas intermedias), así que el primer PR trae **un único taller** (telar) más la infraestructura genérica. Los demás talleres (salazón, tonelería, ferrería…) llegan con la capa de bienes procesados.
- Requiere almacén propio en el puerto (ya existe): el taller toma insumos del almacén y deja la producción allí. Si faltan insumos, para y avisa una vez.
- Coste de compra, mantenimiento semanal y salario de obreros como líneas del informe semanal; la producción baja en invierno para talleres agrícolas (reutilizar `seasonMul`).
- Cuenta en el patrimonio (valor de reventa) y en el rango (#1).
- Fase posterior (otro PR, con migración): segunda capa de bienes procesados (p. ej. herramientas, jabón, toneles) y ~20 mercancías, como pide `parity-gap.md` §C.

**Archivos**: `data/world.json` (`workshops`); `src/sim/validate.mjs` (recetas con mercancías existentes, cantidades positivas, puertos permitidos); nuevo `src/game/workshops.mjs` (`buildWorkshop`, `tickWorkshops`, `workshopCosts`); `src/game/game.mjs` (tick diario, `netWorth`/`companyValue`); `src/game/ledger.mjs` (líneas del informe); `src/view/cityscene.mjs` (dibujar el taller, opcional); `src/view/ledgerview.mjs`; `web/main.mjs` (pestaña Talleres en el panel del puerto).

**Tests**: validador de recetas; producción exacta con insumos completos y parciales; respeta capacidad del almacén (300); parada y un solo aviso sin insumos; costes en la liquidación; estación; patrimonio incluye el taller; `sim1000` con jugador-bot que construye un telar no rompe la economía (el precio de `cloth` en la ciudad no se hunde por debajo de 0,4x de forma permanente).

**Compatibilidad**: primer PR aditivo (`g.workshops ??= {}`), sin migración. La fase de nuevas mercancías **sí** necesita migración (`MIGRATIONS[n]` que crea las entradas de mercado nuevas con `makeMarket` para esos bienes) y tests con fixture de partida antigua.

---

## 3. Reservas (no entran en las 8, por orden)
- **Factor/administrador de almacén**: órdenes de compra/venta con precio límite ejecutadas a diario sin barco (oficina comercial del género). Alto impacto tardío; natural tras #5.
- **Población dinámica y clases sociales**: `pop` que crece/decrece con el abastecimiento; cambia `target`/`rate`. Muy profundo pero toca el núcleo del mercado y el balance de la IA.
- **Órdenes permanentes de compra/venta por puerto** (BACKLOG §1).
- **Navegación libre por el mapa**: bloqueada hasta tener máscara de costa (BACKLOG #8).
- **Rivales con personalidad** y **subastas**.

## 4. Principios para la fase 2
1. Un PR por mecánica, con tests, textos ES/EN, entrada en `CHANGELOG.md` y actualización de `docs/BACKLOG.md` y `docs/research/parity-gap.md`.
2. Lógica nueva en `src/game/*.mjs` sin DOM; la UI en `web/main.mjs` solo llama funciones puras.
3. Todo campo nuevo del estado se lee con `??` y valor por defecto; si cambia el significado de algo existente, migración + fixture de partida v1.
4. Parámetros nuevos de funciones del sim, opcionales y al final, para que la IA, el calentamiento y los tests existentes no cambien.
5. Aleatoriedad solo con `seeded(...)` y `g.seed` (y fijar `g.seed` en `newGame` en el primer PR).
6. Balance revisado con `npm run sim1000` antes de cada merge.
