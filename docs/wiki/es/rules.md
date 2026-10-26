# Reglas y mecánicas

[Versión en inglés (English version)](../rules.md)

Reglas básicas tal como están en main. Cada afirmación nombra su constante o archivo fuente; las notas de diseño más profundas viven en `docs/DESIGN.md` y `docs/design/`.

## Tiempo y calendario
- El tiempo de juego corre en ticks: 240 por día, 10 por hora (`TICKS_PER_DAY`, `TICKS_PER_HOUR` en `src/sim/clock.mjs`). El día sigue siendo la unidad de cuentas: mercado, mantenimiento, préstamos, liquidación y rangos corren una vez al día cada uno.
- Cada puerto actualiza su mercado a su propia hora del día (`marketSlot` en `src/game/game.mjs`): las actualizaciones se reparten por el día en vez de un solo pulso a medianoche, y las cantidades diarias no cambian.
- El ritmo es una opción de vista, no una regla (`src/view/timepolicy.mjs`): con avance automático un día dura 20 s a 1x y las velocidades son 1/2/4/8; el ritmo manual es 1,5 s por día con 1/2/4.
- Trasfondo histórico: estudio de diseño en `docs/design/time-model.md`.

## Comercio y tasas
- Tasa de mercado del 2 % en cada trato, a cargo de ambas partes (`FEE` en `src/sim/trade.mjs`). Los precios se cierran en céntimos: las compras redondean al alza y las ventas a la baja, así que un viaje de ida y vuelta en el mismo puerto siempre pierde contra la tasa.
- La demanda se reparte por clase social y cada clase deja de comprar por encima de su tolerancia; ver [classes.md](classes.md) y la tabla de mercancías ([generated/es/goods.md](../generated/es/goods.md)).

## Viajes y encuentros
- La duración de un viaje es la distancia de la ruta convertida a ticks por los km/día del barco, un factor de tripulación y un factor de viento por tramo, sembrado, entre 0,8 y 1,2 (código de zarpar en `src/game/game.mjs`). Las llegadas caen en el tick exacto y se muestran con día y hora; el viento se tira al zarpar y no se repite en el mar.
- Los encuentros en el mar se tiran una vez por tick con la misma exposición total por día que antes (`SEA_ENCOUNTER_CHANCE_TICK` en `src/game/encounterdaily.mjs`), así que los viajes largos los ven a horas variadas.

## Liquidación semanal, banco e informes
- El mantenimiento de los barcos se acumula cada día y se paga cada 7 días (`SETTLE_EVERY` en `src/game/ledger.mjs`). La liquidación cobra siempre la factura completa; el descubierto paga un 2 % de interés semanal (`OVERDRAFT_RATE`) y pasados 3.000 de descubierto la casa quiebra (`OVERDRAFT_LIMIT`). El patrimonio descuenta el mantenimiento acumulado aún no pagado.
- El prestamista presta en pasos de 100 hasta la mitad del patrimonio (tope 5.000), al 1 % semanal, con vencimiento a 56 días (`LOAN_STEP`, `LOAN_MAX`, `LOAN_RATE`, `LOAN_TERM_DAYS` en `src/game/bank.mjs`); el dinero prestado no cuenta para la meta. Diseño y fuentes: `docs/design/weekly-settlement.md`.
- Cada liquidación escribe un informe semanal y envía un mensaje; el buzón guarda los últimos 60 mensajes y 52 informes (`MAX_INBOX`, `MAX_REPORTS`).

## Información portuaria: cartas, rumores e informantes
- La taberna vende cartas de navegación: una carta pone en el mapa todos los puertos de una costa, sin precios, por 120 monedas más 70 por puerto de esa costa (`CHART_BASE`, `CHART_PER_PORT`, `COASTS` en `src/game/charts.mjs`; ocho costas cubren cada ciudad exactamente una vez). La taberna ofrece cartas de toda costa que no sea la suya y que aún esconda un puerto desconocido.
- Un rumor de ruta (60, `ROUTE_RUMOR_PRICE` en `src/game/charts.mjs`) revela el puerto desconocido más cercano con datos imprecisos. Un rumor de mercado (40, `RUMOR_PRICE` en `src/game/intel.mjs`) da las existencias de hoy de un puerto conocido con un error de hasta ±25 % (`RUMOR_ERROR`).
- Un informante (150, `CONTACT_PRICE` en `src/game/contacts.mjs`) manda los precios de su puerto cada 7 días (`CONTACT_EVERY`), 4 informes en total (`CONTACT_REPORTS`); máximo 4 informantes a la vez (`CONTACT_MAX`). Los informes son imprecisos (±15 %, `CONTACT_ERROR`) y uno de cada diez sale directamente mal (±45 %, `CONTACT_FALSE_CHANCE`, `CONTACT_FALSE_ERROR`) sin que el buzón diga cuál. Tus propios ojos siempre ganan: un puerto con tu barco o almacén cierra cada día con cifras exactas (`refreshIntel` en `src/game/intel.mjs`).

## Encargos del concejo
- Cada semana un puerto puede publicar un encargo (50 % de probabilidad, `CONTRACT_CHANCE` en `src/game/contracts.mjs`) por una mercancía que le falta (`CONTRACT_SCARCITY_MIN`), con plazo de 30 a 60 días (`CONTRACT_DAYS_MIN`, `CONTRACT_DAYS_SPAN`) y una prima del 20-35 % sobre el valor base al completarlo (`CONTRACT_BONUS_MIN`, `CONTRACT_BONUS_SPAN`).
- Una casa lleva como máximo 3 encargos a la vez (`CONTRACT_MAX_ACTIVE`). Completar uno mueve la reputación +6 y cuenta para el respeto del puerto como una venta de 1.500 monedas (`CONTRACT_REP`, `CONTRACT_RESPECT_COINS`); dejarlo caer mueve la reputación -4 (`CONTRACT_FAIL_REP`).

## Aún por rellenar
Edificios (`docs/design/construction.md`, `dock-building.md`), misiones (`docs/design/missions.md`).
