import {resolvePirates,dismissEncounterReport,claimPrize} from '../src/game/encounterdaily.mjs';
import {encountersHtml,encounterDialogHtml} from "../src/view/encounterview.mjs";
import {captainRoster,captainOf,hireCaptain,dismissCaptain} from "../src/game/captains.mjs";
import {CT,assignedCaptainHtml,tavernCaptainsHtml} from "../src/view/captainview.mjs";
import { premises } from "../src/view/premises.mjs";
import { clampWindow } from "../src/view/floating.mjs";
import { CANNON_PRICE, cannonsOf, maxCannons, gunCond, gunRepairCost, crewLimits, crewOf, speedFactor, HIRE_FEE } from "../src/game/crew.mjs";
import { goodIcon } from "./icons.mjs";
import { headingDeg, shipSvg, wakeSvg, pushTrail } from "../src/view/ships.mjs";
import { newCamera, zoomAt, panBy, viewBox, markerScale } from "../src/view/camera.mjs";
import { buildWorld } from "../src/sim/world.mjs";
import { shipPosition } from "../src/sim/position.mjs";
import { serialize as packGame, deserialize as unpackGame, cleanCompany } from "../src/game/gamesave.mjs";
import { DIFFICULTY_IDS } from "../src/game/difficulty.mjs";
import { defaultProfile, cleanProfile, startBonus, crestSvg, portraitSvg, flagSvg, PALETTE, DIVISIONS, CHARGES, SHIELDS, PORTRAITS, BACKGROUNDS, NAMES } from "../src/game/profile.mjs";
import { previewBuy, previewSell, FEE } from "../src/sim/trade.mjs";
import { stockLevel } from "../src/game/stocklevel.mjs";
import { citySceneSvg } from "../src/view/cityscene.mjs";
import { loanCapFor } from "../src/game/rank.mjs";
import { houseHtml, RESPECT_NAMES } from "../src/view/rankview.mjs";
import { repOf, respectOf } from "../src/game/rank.mjs";
import { cityRows } from "../src/view/cityview.mjs";
import { tabForBuilding, portLayout } from "../src/view3d/port3d.mjs";
import { cityPlots } from "../src/view3d/cityplots.mjs";
import { whyText, plotViewState, buildingsRows, plotOffers, buildOffers, upgradeOffer, cityEffects, parseBldAct, buildingLabel } from "../src/view/buildingsview.mjs";
import { buyPlot, startConstruction, buyOffice, hasOffice, OFFICE_PRICE, OFFICE_MIN_RESPECT } from "../src/game/buildings.mjs";
import { voyagesHtml, voyagesTitle } from "../src/view/voyageview.mjs";
import { affordRatio } from "../src/sim/market.mjs";
import { reportsHtml, inboxHtml, LT, badge } from "../src/view/ledgerview.mjs";
import { unread, markAllRead, markRead } from "../src/game/ledger.mjs";
import { yardSceneSvg, shipIconSvg, orderProgress } from "../src/view/yardscene.mjs";
import { atmosphereSvg } from "../src/view/atmosphere.mjs";
import { seasonOf } from "../src/sim/market.mjs";
import { pendingEvent, resolveEvent } from "../src/game/events.mjs";
import { travelEstimate, cityMenu, shipForKey } from "../src/view/nav.mjs";
import { TICKS_PER_HOUR, tickParts, calendarOf } from "../src/sim/clock.mjs"; // TICKS_PER_DAY comes via game.mjs
import { LOAN_RATE, LOAN_MAX } from "../src/game/bank.mjs";
import { buyChart, chartOffers, chartPrice, routeRumorTarget, buyRouteRumor, ROUTE_RUMOR_PRICE } from "../src/game/charts.mjs";
import { warehouseCap, setRoute, setRouteAdv, clearRoute, borrow, repay, feeMul, bankRoom, loansOwed, newGame, advanceDay, advanceTick, TICKS_PER_DAY, doBuy, doSell, doSail, waitUntilArrival, buyCaravel, orderShip, repairShip, repairGuns, buyCannon, hireCrew, dismissCrew, repairPrice, sellShip, shipValue, buyRumor, RUMOR_PRICE, isLive, buyWarehouse, storeGoods, takeGoods, warehouseOf, WAREHOUSE_PRICE, quote, priceHistory, trendPct, bestPorts, netWorth, cargoUsed, SHIP_TYPES, GOAL_CASH, DEADLINE_DAYS, CARAVEL_PRICE, isDiscovered } from "../src/game/game.mjs";
import { stewardOf, setStewardRule, clearStewardRule, setStewardReserve } from "../src/game/steward.mjs";

const T = {
  es: { play: "▶ Navegar", pause: "⏸ Pausa", speed: "Velocidad", day: "Día", cash: "Monedas", goal: "Meta", ships: "Barcos", new: "Nueva partida", cont: "Continuar", resume: "Seguir jugando", saveNow: "Guardar ahora", quit: "Salir al título", lang2: "Idioma", speedDef: "Velocidad", paused: "Juego en pausa", tabMarket: "Mercado", tabYard: "Astillero", tabStore: "Almacén", warehouse: "Almacén", yardInfo: "Encarga barcos (se entregan tras el plazo; sin límite de flota: el mantenimiento diario es el freno), repara el casco o vende.", order: "Encargar {type} ({p}, {d} días, carga {c})", repair: "Reparar casco {h}% ({p})", sellShip: "Vender barco ({p})", orders: "En construcción", ready: "{type} en {city}, listo el día {day} ({pct}%)", yardEmpty: "Grada libre", orderShort: "Encargar ({p})", yc: "Carga {c} · {d} días · mantenimiento {u}/día", buyWh: "Comprar almacén ({p})", whInfo: "Guarda bienes en este puerto (hasta 300 unidades).", whEmpty: "Vacío", store: "Guardar", take: "Sacar", admTitle: "Administrador del almacén", admInfo: "Órdenes permanentes: compra cuando el precio baje del tope (hasta el stock indicado) y vende cuando suba del suelo (guardando lo que digas). Actúa una vez al día y nunca gasta tu reserva. El tope y el suelo se comparan con el precio de mercado, sin tasa (la tasa del puerto se suma al comprar y se resta al vender).", admRule: "compra ≤ {b} hasta {n} · vende ≥ {v} guardando {k}", admNoRules: "Sin órdenes todavía.", admGood: "Bien", admBuy: "Precio tope compra (mercado, sin tasa)", admTo: "Stock objetivo", admSell: "Precio suelo venta (mercado, sin tasa)", admKeep: "Guardar", admSet: "Guardar orden", admClear: "Quitar", admReserve: "Reserva de monedas", admReserveSet: "Fijar reserva", admErr: "Revisa la orden: el tope de compra debe quedar por debajo del suelo de venta y el objetivo dentro de la capacidad.", start: "Empezar", company: "Nombre de tu casa mercantil", defCo: "Mi Casa Mercantil", tagline: "Comercio marítimo en la costa ibérica, siglos XV-XVI", menu: "Menú", saved: "Partida guardada", noSave: "No hay partida guardada", exportS: "Exportar", importS: "Importar", badSave: "Ese archivo no es una partida válida", create: "Crea tu casa mercantil", character: "Tu nombre", portrait: "Retrato", crest: "Escudo", shield: "Forma", division: "División", charge: "Emblema", c1: "Color principal", c2: "Color secundario", home: "Puerto de origen", background: "Origen", back: "Atrás", sh: { heater: "Clásico", round: "Redondo" }, dv: { plain: "Liso", pale: "Partido", fess: "Cortado", chevron: "Cheurón", cross: "Cruz" }, ch: { star: "Estrella", tower: "Torre", ship: "Nave", anchor: "Ancla", sun: "Sol", wheat: "Trigo" }, bgInfo: { merchant: "+300 monedas", seafarer: "Barcos 15% más baratos de mantener", scholar: "+150 monedas y 5% menos de mantenimiento" },
    hint0: "Misión 1: gana {goal} monedas en {days} días. Compra barato donde un bien abunda, vende caro donde falta. Clic en un puerto para elegir destino y clic derecho para zarpar.",
    hintSea: "Tu barco está en el mar. Espera para llegar.", good: "Bien", price: "Precio", stock: "Stock", hold: "Bodega", holdValue: "Valor de la bodega aquí (aprox.)", cheap: "Barato: buen momento para comprar", dear: "Caro: buen momento para vender", lvl: { scarce: "Escaso", short: "Justo", normal: "Normal", plenty: "Abundante" }, lvlInfo: { scarce: "Escaso: buen momento para vender", short: "Justo: queda poco", normal: "Normal", plenty: "Abundante: buen momento para comprar" },
    difficulty: "Dificultad", diffName: { easy: "Fácil", normal: "Normal", hard: "Difícil" }, diffInfo: "Se elige al empezar la partida y no cambia después. Fácil: más monedas y menos gastos. Difícil: menos monedas y más gastos.",
    hud3d: "Arrastra para mirar, rueda para acercar, haz clic en un edificio para abrirlo.",
    tabCity: "Ciudad", tabBuildings: "Edificios", bldInfo: "Tus parcelas y edificios en este puerto. Las casas suman vecinos (más demanda), el taller teje lana en paño al precio del mercado local y el almacén amplía tu depósito en 300 por nivel.", bldNone: "Aún no tienes parcelas en este puerto.", bldFree: "Parcelas libres", bldLoading: "Midiendo parcelas…", bldPlotsErr: "No se pudo medir el plano de parcelas de este puerto; inténtalo de nuevo al volver a entrar.", bldPlot: "Parcela", bldHType: "Edificio", bldHFx: "Efecto", bldHUp: "Mantenimiento", bldTypes: { house: "Casa", workshop: "Taller", warehouse: "Almacén", farm: "Granja", pasture: "Dehesa", sawmill: "Aserradero", mine: "Mina", oil_mill: "Almazara", vineyard: "Viñedo", saltworks: "Salina", smokehouse: "Fumadero" }, bldState: { plot: "solar", construction: "en obras", active: "activo" }, bldReady: "listo el día {d} ({p}%)", bldUpkeep: "mantenimiento {u}/día", bldFxW: "{r} lotes/día · margen ahora {m}/lote · {n} producidos", bldFxH: "+{n} habitantes", bldFxS: "+{n} de depósito", bldBuy: "Comprar ({p})", bldBuild: "Construir", bldUpgrade: "Mejorar a nivel {l} ({p})", bldMax: "nivel máximo", bldConfirm: "Confirmar", bldCancel: "Cancelar", bldCost: "Coste {c} (materiales {m} + mano de obra {f}) · {d} días · mantenimiento {u}/día", bldFree3d: "{n} solares libres en este puerto: haz clic en uno en la vista 3D para comprarlo", bldNeedOffice: "Para construir en este puerto necesitas una oficina comercial propia: cómprala en la pestaña Oficina.", bldPick2d: "Elige una parcela tuya para construir o mejorar, o compra un solar libre.", officeBuy: "Comprar oficina comercial ({p})", officeReq: "Requisitos para la oficina: {p} monedas y respeto mínimo Conocido en este puerto (ahora: {r}, {n} puntos). Se construye con dinero, respeto y oficina.", officeOwned: "Tienes una oficina comercial en este puerto.", bldFxP: "{r} lotes/día · {n} producidos", bldWhy: { "good not producible in this city": "esta ciudad no produce ese bien", "office required": "necesitas una oficina comercial en este puerto", "respect required": "necesitas más respeto en este puerto" }, bldPopLine: "Población efectiva: {p} habitantes (+{b} por tus casas)", bldHint: "Tus parcelas y edificios llevan su nombre en la vista 3D: haz clic en uno para abrirlo y construir o mejorar.", townTypes: { inn: "Posada", smithy: "Herrería", chapel: "Capilla" }, townDesc: { inn: "La posada del barrio del muelle: comida caliente, vino y camas para marineros de paso. Aún no ofrece servicios.", smithy: "El taller del herrero: aperos, clavos y reparaciones de metal para el puerto. Aún no ofrece servicios.", chapel: "La capilla del barrio alto, donde los vecinos se encomiendan antes de zarpar. Aún no ofrece servicios." }, cityInfo: "Los habitantes se reparten en clases. Cada clase compra cosas distintas y deja de comprar lo que le sale demasiado caro: los pobres viven de grano y pescado, los artesanos y mercaderes compran paño, vino y aceite, y los ricos piden seda, pimienta y azúcar.", clsPoor: "Pobres", clsMiddle: "Artesanos y mercaderes", clsRich: "Ricos", cityBuys: "Compran sobre todo", cityOut: "Sin dinero para", cityCitizens: "habitantes", buy: "Comprar", sell: "Vender", sellAll: "Todo", seasons: { winter: "Invierno", spring: "Primavera", summer: "Verano", autumn: "Otoño" }, months: ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"], target: "Destino", sailGo: "Zarpar", ctxSail: "Zarpar a {city} ({d})", ctxSelect: "Elegir {city} como destino", hint: "Clic: elegir · Clic derecho o pulsación larga: menú · Arrastrar: mover · Rueda: zoom · Espacio: pausa · Intro: zarpar · 1-9: barco", daysLbl: "días", eta: "llegada: día {d}, {h}:00", view3d: "Vista 3D (experimental)", close: "Cerrar", bestLbl: "Mejor puerto según lo que sabes", noInfo: "No conoces los precios de otros puertos. Visita uno, ten almacén o pregunta en la taberna.", tabTavern: "Taberna", tabRoute: "Ruta", routeInfo: "Ruta automática: el barco compra en este puerto, vende en el destino y vuelve solo, una y otra vez. Usa las reglas normales de precios y gastos.", routeTo: "Destino", routeOut: "Comprar aquí", routeBack: "Comprar allí (vuelta)", routeNoBack: "Nada: vuelve vacío", routeSet: "Fijar ruta", routeCancel: "Cancelar ruta", routeNow: "Ruta activa: {a} ⇄ {b}, lleva {out}{back}. Viajes completados: {n}.", routeNone: "Este barco no tiene ruta.", routeBackTxt: " y trae {g}", routeAdv: "Ruta avanzada", routeAdvInfo: "Varias paradas en orden: en cada una el barco vende y luego compra lo que marques, y solo si el precio llega al límite. El freno de caja guarda siempre ese mínimo de monedas.", routeStop: "Parada {n}", routeBuyIf: "Comprar", routeSellIf: "Vender", routeAny: "—", routeBuyW: "compra", routeSellW: "vende", routeNoBuy: "sin compras", routeNoSell: "sin ventas", routeIfLe: "si ≤ {p}", routeIfGe: "si ≥ {p}", routeMinCash: "Freno de caja", routeAddStop: "Añadir parada", routeDelStop: "Quitar", routeSetAdv: "Fijar ruta avanzada", routeNow2: "Ruta activa ({n} paradas) · Vueltas: {l} · Freno de caja: {m}", tabBank: "Banco", crewTitle: "Tripulación", crewMin: "mínimo", crewOpt: "óptima", crewMax: "máxima", crewShort: "Faltan marineros: con menos del mínimo el barco no zarpa.", crewSpeed: "Velocidad: {s} % (menos que la óptima va más lento; completa, algo más rápido y con más defensa).", crewHire: "Contratar {n} ({p})", crewDismiss: "Despedir {n}", cannonBuy: "Comprar cañón ({p}) · {n}/{m}", gunRepair: "Reparar armamento {c}% ({p})", gunNone: "Sin cañones", tabHouse: "Casa", bankInfo: "El prestamista del puerto. Solo puedes pedir dinero si tienes un barco amarrado aquí. Interés: {r} % a la semana sobre lo que debes. Máximo: la mitad de tu patrimonio (tope {m}). Si un préstamo vence, el banco lo cobra de tu caja aunque la deje en negativo. El dinero prestado no cuenta para la meta.", bankRoom: "Puedes pedir hasta", bankOwed: "Debes al banco", bankNone: "No tienes préstamos.", bankTake: "Pedir {a}", bankLoan: "Préstamo del día {d}: debes {l}, vence el día {u}", bankRepay: "Devolver todo", bankRepay100: "Devolver 100", tavernInfo: "Entre jarras y humo, marineros y mercaderes cuentan lo que saben de otros puertos. Un trago y una moneda compran un rumor: viejo y con algo de exageración.", tavernNone: "Aquí ya lo sabes todo: tienes barco o almacén en todos los puertos.", rumorBtn: "Pagar una ronda por un rumor ({p})", rumorPick: "Puerto", ageNow: "hoy", ageDays: "hace {n} d", rumorTag: "rumor, impreciso", chartTitle: "Cartas de navegación", chartInfo: "Una carta pone toda una costa en tu mapa, sin revelar precios.", chartNames: { luz: "Costa de la Luz", portugal: "Costa portuguesa", cantabrico: "Costa Cantábrica", levante: "Levante y Cataluña", baleares: "Baleares", rif: "El Rif", marruecos: "Marruecos atlántico", berberia: "Berbería oriental" }, chartBuy: "Carta: {c} ({p})", routeRumorBtn: "Pagar por un rumor de ruta ({p})", routeRumorInfo: "Revela el puerto desconocido más cercano, con datos imprecisos.", bestRow: "{city}: ≈ {r} monedas ({p} de ganancia), {d} días", trend7: "Cambio en 7 días", dealBuy: "Compras {q}: {c} (media {a}, precio pasa a {n})", dealSell: "Vendes {q}: {c} (media {a}, precio pasa a {n})", profit: "ganancia", loss: "pérdida", capCash: "limitado por tus monedas", capStock: "limitado por el stock", capRoom: "limitado por la bodega", qtyLbl: "Cantidad", sailTo: "Zarpar a", days: "días", wait: "Esperar 1 día", arrive: "Esperar llegada",    caravel: "Comprar carabela ({p})", at: "En", sea: "En el mar hacia", win: "¡Victoria! Alcanzaste la meta.", lose: "Se acabó el tiempo. Patrimonio final:", bankrupt: "Quiebra: la deuda pasó del límite. Patrimonio final:",    cap: "Carga", log: { warehouse: "Día {day}: compras un almacén en {city}", arrive: "Día {day}: el barco {ship} llega a {city}", buy: "Día {day}: compras {qty} {good} por {sum}", sell: "Día {day}: vendes {qty} {good} por {sum}", sail: "Día {day}: el barco {ship} zarpa a {city} (≈ {hours} h)", caravel: "Día {day}: compras una carabela en {city}", ordered: "Día {day}: encargas un barco en {city}", built: "Día {day}: tu barco {ship} está listo en {city}", discovered: "Día {day}: descubres el puerto de {city}" }, goods: { grain: "Trigo", dried_fish: "Pescado seco", salt: "Sal", wool: "Lana", iron: "Hierro", timber: "Madera", cloth: "Paño", olive_oil: "Aceite", wine: "Vino", silk: "Seda", sugar: "Azúcar", pepper: "Pimienta" },    types: { barca: "Barca", cog: "Coca", caravel: "Carabela", nao: "Nao" } },  en: { play: "▶ Sail", pause: "⏸ Pause", speed: "Speed", day: "Day", cash: "Coins", goal: "Goal", ships: "Ships", new: "New game", cont: "Continue", resume: "Resume", saveNow: "Save now", quit: "Quit to title", lang2: "Language", speedDef: "Speed", paused: "Game paused", tabMarket: "Market", tabYard: "Shipyard", tabStore: "Warehouse", warehouse: "Stored", yardInfo: "Order ships (delivered after the build time; no fleet limit: daily upkeep is the brake), repair the hull or sell.", order: "Order {type} ({p}, {d} days, cargo {c})", repair: "Repair hull {h}% ({p})", sellShip: "Sell ship ({p})", orders: "Under construction", ready: "{type} at {city}, ready day {day} ({pct}%)", yardEmpty: "Slipway free", orderShort: "Order ({p})", yc: "Cargo {c} · {d} days · upkeep {u}/day", buyWh: "Buy warehouse ({p})", whInfo: "Store goods in this port (up to 300 units).", whEmpty: "Empty", store: "Store", take: "Take", admTitle: "Warehouse steward", admInfo: "Standing orders: buy when the price drops to your cap (up to the stock target) and sell when it rises to your floor (keeping what you say). Acts once a day and never spends your reserve. The cap and the floor compare against the market price, before the port fee (added when buying, subtracted when selling).", admRule: "buy ≤ {b} up to {n} · sell ≥ {v} keeping {k}", admNoRules: "No standing orders yet.", admGood: "Good", admBuy: "Max buy price (market, before fee)", admTo: "Stock target", admSell: "Min sell price (market, before fee)", admKeep: "Keep", admSet: "Save order", admClear: "Remove", admReserve: "Coin reserve", admReserveSet: "Set reserve", admErr: "Check the order: the buy cap must stay below the sell floor and the target within capacity.", start: "Start", company: "Name of your trading house", defCo: "My Trading House", tagline: "Sea trading on the Iberian coast, 15th-16th century", menu: "Menu", saved: "Game saved", noSave: "No saved game", exportS: "Export", importS: "Import", badSave: "That file is not a valid save", create: "Create your trading house", character: "Your name", portrait: "Portrait", crest: "Coat of arms", shield: "Shape", division: "Division", charge: "Emblem", c1: "Main colour", c2: "Second colour", home: "Home port", background: "Background", back: "Back", sh: { heater: "Classic", round: "Round" }, dv: { plain: "Plain", pale: "Split", fess: "Cut", chevron: "Chevron", cross: "Cross" }, ch: { star: "Star", tower: "Tower", ship: "Ship", anchor: "Anchor", sun: "Sun", wheat: "Wheat" }, bgInfo: { merchant: "+300 coins", seafarer: "Ships cost 15% less to keep", scholar: "+150 coins and 5% lower upkeep" },
    hint0: "Mission 1: earn {goal} coins in {days} days. Buy cheap where a good is plentiful, sell dear where it is scarce. Click a port to choose a destination, right-click to sail.",
    hintSea: "Your ship is at sea. Wait to arrive.", good: "Good", price: "Price", stock: "Stock", hold: "Hold", holdValue: "Hold value here (approx.)", cheap: "Cheap: good time to buy", dear: "Dear: good time to sell", lvl: { scarce: "Scarce", short: "Short", normal: "Normal", plenty: "Plenty" }, lvlInfo: { scarce: "Scarce: good time to sell", short: "Short: not much left", normal: "Normal", plenty: "Plenty: good time to buy" },
    difficulty: "Difficulty", diffName: { easy: "Easy", normal: "Normal", hard: "Hard" }, diffInfo: "Chosen when the game starts and fixed afterwards. Easy: more coins and lower costs. Hard: fewer coins and higher costs.",
    hud3d: "Drag to look around, wheel to zoom, click a building to open it.",
    tabCity: "City", tabBuildings: "Buildings", bldInfo: "Your plots and buildings in this port. Houses add citizens (more demand), the workshop weaves wool into cloth at local market prices and the warehouse adds 300 storage per level.", bldNone: "You own no plots in this port yet.", bldFree: "Free plots", bldLoading: "Surveying plots…", bldPlotsErr: "Could not survey this port's plot plan; try reopening the tab.", bldPlot: "Plot", bldHType: "Building", bldHFx: "Effect", bldHUp: "Upkeep", bldTypes: { house: "House", workshop: "Workshop", warehouse: "Warehouse", farm: "Farm", pasture: "Pasture", sawmill: "Sawmill", mine: "Mine", oil_mill: "Oil mill", vineyard: "Vineyard", saltworks: "Saltworks", smokehouse: "Smokehouse" }, bldState: { plot: "empty plot", construction: "under construction", active: "active" }, bldReady: "ready day {d} ({p}%)", bldUpkeep: "upkeep {u}/day", bldFxW: "{r} batches/day · margin now {m}/batch · {n} produced", bldFxH: "+{n} citizens", bldFxS: "+{n} storage", bldBuy: "Buy ({p})", bldBuild: "Build", bldUpgrade: "Upgrade to level {l} ({p})", bldMax: "max level", bldConfirm: "Confirm", bldCancel: "Cancel", bldCost: "Cost {c} (materials {m} + labour {f}) · {d} days · upkeep {u}/day", bldFree3d: "{n} free plots in this port: click one in the 3D view to buy it", bldNeedOffice: "To build in this port you need your own trading office: buy one in the Office tab.", bldPick2d: "Pick one of your plots to build or upgrade, or buy a free plot.", officeBuy: "Buy a trading office ({p})", officeReq: "Office requirements: {p} coins and at least Known respect in this port (now: {r}, {n} points). Building takes money, respect and an office.", officeOwned: "You own a trading office in this port.", bldFxP: "{r} batches/day · {n} produced", bldWhy: { "good not producible in this city": "this city does not produce that good", "office required": "you need a trading office in this port", "respect required": "you need more respect in this port" }, bldPopLine: "Effective population: {p} citizens (+{b} from your houses)", bldHint: "Your plots and buildings carry their name in the 3D view: click one to open it and build or upgrade.", townTypes: { inn: "Inn", smithy: "Smithy", chapel: "Chapel" }, townDesc: { inn: "The quayside inn: hot food, wine and beds for passing sailors. No services yet.", smithy: "The smith's workshop: tools, nails and metal repairs for the port. No services yet.", chapel: "The upper-quarter chapel, where neighbours pray before sailing. No services yet." }, cityInfo: "Citizens are split into classes. Each class buys different things and stops buying what is too dear for it: the poor live on grain and fish, craftsmen and merchants buy cloth, wine and oil, and the rich ask for silk, pepper and sugar.", clsPoor: "Poor", clsMiddle: "Craftsmen and merchants", clsRich: "Rich", cityBuys: "Mostly buy", cityOut: "Cannot afford", cityCitizens: "citizens", buy: "Buy", sell: "Sell", sellAll: "All", seasons: { winter: "Winter", spring: "Spring", summer: "Summer", autumn: "Autumn" }, months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], target: "Destination", sailGo: "Sail", ctxSail: "Sail to {city} ({d})", ctxSelect: "Choose {city} as destination", hint: "Click: choose · Right-click or long press: menu · Drag: pan · Wheel: zoom · Space: pause · Enter: sail · 1-9: ship", daysLbl: "days", eta: "arrives: day {d}, {h}:00", view3d: "3D view (experimental)", close: "Close", bestLbl: "Best port from what you know", noInfo: "You do not know other ports' prices. Visit one, own a warehouse or ask at the tavern.", tabTavern: "Tavern", tabRoute: "Route", routeInfo: "Automatic route: the ship buys at this port, sells at the destination and comes back by itself, again and again. Normal price and cost rules apply.", routeTo: "Destination", routeOut: "Buy here", routeBack: "Buy there (return)", routeNoBack: "Nothing: returns empty", routeSet: "Set route", routeCancel: "Cancel route", routeNow: "Active route: {a} ⇄ {b}, carries {out}{back}. Trips completed: {n}.", routeNone: "This ship has no route.", routeBackTxt: " and brings back {g}", routeAdv: "Advanced route", routeAdvInfo: "Several stops in order: at each one the ship sells then buys what you mark, only when the price meets the limit. The cash brake always keeps that many coins.", routeStop: "Stop {n}", routeBuyIf: "Buy", routeSellIf: "Sell", routeAny: "—", routeBuyW: "buys", routeSellW: "sells", routeNoBuy: "no buys", routeNoSell: "no sells", routeIfLe: "if ≤ {p}", routeIfGe: "if ≥ {p}", routeMinCash: "Cash brake", routeAddStop: "Add stop", routeDelStop: "Remove", routeSetAdv: "Set advanced route", routeNow2: "Active route ({n} stops) · Runs: {l} · Cash brake: {m}", tabBank: "Bank", crewTitle: "Crew", crewMin: "minimum", crewOpt: "optimal", crewMax: "maximum", crewShort: "Short of sailors: below the minimum the ship will not sail.", crewSpeed: "Speed: {s}% (below the optimal crew it is slower; a full crew is a bit faster with more defence).", crewHire: "Hire {n} ({p})", crewDismiss: "Dismiss {n}", cannonBuy: "Buy a cannon ({p}) · {n}/{m}", gunRepair: "Repair armament {c}% ({p})", gunNone: "No cannons", tabHouse: "House", bankInfo: "The port moneylender. You can only borrow while one of your ships is docked here. Interest: {r}% a week on what you owe. Limit: half of your net worth (cap {m}). When a loan falls due the bank takes it from your cash even if that makes it negative. Borrowed money does not count towards the goal.", bankRoom: "You can borrow up to", bankOwed: "You owe the bank", bankNone: "You have no loans.", bankTake: "Borrow {a}", bankLoan: "Loan from day {d}: you owe {l}, due day {u}", bankRepay: "Pay back all", bankRepay100: "Pay back 100", tavernInfo: "Between mugs and smoke, sailors and merchants tell what they know of other ports. A drink and a coin buy a rumour: old, and a little exaggerated.", tavernNone: "You already know it all: you have a ship or warehouse in every port.", rumorBtn: "Buy a round for a rumour ({p})", rumorPick: "Port", ageNow: "today", ageDays: "{n} d ago", rumorTag: "rumour, inexact", chartTitle: "Navigation charts", chartInfo: "A chart puts a whole coast on your map, without revealing prices.", chartNames: { luz: "Costa de la Luz", portugal: "Portuguese coast", cantabrico: "Cantabrian coast", levante: "Levante & Catalonia", baleares: "Balearics", rif: "The Rif", marruecos: "Atlantic Morocco", berberia: "Eastern Barbary" }, chartBuy: "Chart: {c} ({p})", routeRumorBtn: "Buy a route rumour ({p})", routeRumorInfo: "Reveals the nearest unknown port, with inexact figures.", bestRow: "{city}: ≈ {r} coins ({p} profit), {d} days", trend7: "Change over 7 days", dealBuy: "Buy {q}: {c} (avg {a}, price moves to {n})", dealSell: "Sell {q}: {c} (avg {a}, price moves to {n})", profit: "profit", loss: "loss", capCash: "limited by your coins", capStock: "limited by stock", capRoom: "limited by hold space", qtyLbl: "Quantity", sailTo: "Sail to", days: "days", wait: "Wait 1 day", arrive: "Wait for arrival",    caravel: "Buy a caravel ({p})", at: "At", sea: "At sea to", win: "Victory! You reached the goal.", lose: "Time is up. Final net worth:", bankrupt: "Bankrupt: your debt passed the limit. Final net worth:",    cap: "Cargo", log: { warehouse: "Day {day}: you buy a warehouse in {city}", arrive: "Day {day}: ship {ship} arrives at {city}", buy: "Day {day}: you buy {qty} {good} for {sum}", sell: "Day {day}: you sell {qty} {good} for {sum}", sail: "Day {day}: ship {ship} sails to {city} (≈ {hours} h)", caravel: "Day {day}: you buy a caravel at {city}", discovered: "Day {day}: you discover the port of {city}" }, goods: { grain: "Grain", dried_fish: "Dried fish", salt: "Salt", wool: "Wool", iron: "Iron", timber: "Timber", cloth: "Cloth", olive_oil: "Olive oil", wine: "Wine", silk: "Silk", sugar: "Sugar", pepper: "Pepper" },    types: { barca: "Barque", cog: "Cog", caravel: "Caravel", nao: "Nao" } },};
let lang = localStorage.getItem("lang") || (navigator.language?.toLowerCase().startsWith("es") ? "es" : "en"), t = T[lang], g, sel = 0;
const $ = (id) => document.getElementById(id), fmt = (n) => Math.round(n).toLocaleString(lang);
const world = buildWorld(await (await fetch("../data/world.json")).json());
const nodes = Object.values(world.nodes);
const lons = nodes.map((n) => n.lon), lats = nodes.map((n) => n.lat);
const [x0, x1, y0, y1] = [Math.min(...lons) - 1, Math.max(...lons) + 1, Math.min(...lats) - 1, Math.max(...lats) + 1];
const sc = 800 / (x1 - x0), VH = Math.round((y1 - y0) * sc * 1.25);
$("map").setAttribute("viewBox", `0 0 800 ${VH}`);
// Pan and zoom: the wheel zooms at the cursor, dragging pans, two fingers pinch, double click resets.
let target = null, lp = 0; // destination chosen on the map; long-press timer
const cam = newCamera(800, VH), mapEl = $("map");
const applyCam = () => { mapEl.setAttribute("viewBox", viewBox(cam).join(" ")); scaleMarkers(); };
function scaleMarkers() {
  const k = markerScale(cam.zoom);
  mapEl.querySelectorAll("[data-mx]").forEach((el) => el.setAttribute("transform", `translate(${el.dataset.mx} ${el.dataset.my}) scale(${k})`));
  mapEl.querySelectorAll("#static line").forEach((el) => el.setAttribute("stroke-width", 1.5 * k));
}
const frac = (e) => { const r = mapEl.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]; };
mapEl.style.touchAction = "none";
mapEl.addEventListener("wheel", (e) => { e.preventDefault(); zoomAt(cam, e.deltaY < 0 ? 1.25 : 0.8, ...frac(e)); applyCam(); }, { passive: false });
mapEl.addEventListener("dblclick", () => { cam.zoom = 1; cam.x = cam.y = 0; applyCam(); });
const ptrs = new Map(); let moved = 0, pinch = 0;
mapEl.addEventListener("pointerdown", (e) => { ptrs.set(e.pointerId, [e.clientX, e.clientY]); moved = 0; pinch = 0; });
mapEl.addEventListener("pointermove", (e) => {
  const prev = ptrs.get(e.pointerId); if (!prev) return;
  const r = mapEl.getBoundingClientRect();
  if (ptrs.size === 2) {
    ptrs.set(e.pointerId, [e.clientX, e.clientY]);
    const [a, b] = [...ptrs.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]);
    if (pinch) { zoomAt(cam, d / pinch, ((a[0] + b[0]) / 2 - r.left) / r.width, ((a[1] + b[1]) / 2 - r.top) / r.height); applyCam(); }
    pinch = d; moved = 99; return;
  }
  const dx = e.clientX - prev[0], dy = e.clientY - prev[1]; moved += Math.abs(dx) + Math.abs(dy);
  if (moved > 6) { panBy(cam, dx / r.width, dy / r.height); applyCam(); ptrs.set(e.pointerId, [e.clientX, e.clientY]); }
});
const endPtr = (e) => { ptrs.delete(e.pointerId); pinch = 0; };
mapEl.addEventListener("pointerup", endPtr); mapEl.addEventListener("pointercancel", endPtr);
// a drag must not count as a click on a port
mapEl.addEventListener("click", (e) => { if (moved > 6) { e.stopPropagation(); e.preventDefault(); moved = 0; } }, true);
const X = (lon) => (lon - x0) * sc, Y = (lat) => (y1 - lat) * sc * 1.25;
const cityName = (id) => world.nodes[id]?.name ?? id; // an unknown id shows as the id, it never throws

document.documentElement.lang = lang;
// Moving ships. The view only reads sim state; the sim advances on the daily tick below.
// `progress` is how much of the current day has elapsed (0 to 1). It is kept across pause,
// resume and speed changes, so ships never move backwards or jump.
let playing = false, speed = 1, progress = 0, lastFrame = 0, tickAcc = 0;
const MS_PER_DAY = 1500, MS_PER_TICK = MS_PER_DAY / TICKS_PER_DAY;
const hoursOf = (ticks) => Math.max(1, Math.round(ticks / TICKS_PER_HOUR)); // whole hours, for estimates and ETAs
const etaText = (tick) => { const p = tickParts(tick); return t.eta.replace("{d}", p.day).replace("{h}", String(p.hour).padStart(2, "0")); };
const trails = {}; // view only: recent screen positions per ship, for the wake
function drawShips() {
  const layer = $("shipsLayer"); if (!layer) return;
  const all = [...g.ai.map((a) => ({ sh: a.ship, mine: false, id: "ai" + a.ship.id })), ...g.ships.map((sh, i) => ({ sh, mine: true, sel: i === sel, id: "p" + sh.id }))];
  let h = "", wakes = "";
  for (const { sh, mine, sel: isSel, id } of all) {
    const f = tickAcc / MS_PER_TICK; // fraction of the current tick, for smooth drawing
    const p = shipPosition(world, sh, f), pt = { x: X(p.lon), y: Y(p.lat) };
    let ang = 0;
    if (sh.voyage) {
      const q = shipPosition(world, sh, Math.min(1, f + 0.08)), qb = shipPosition(world, sh, Math.max(0, f - 0.08));
      ang = headingDeg({ x: X(qb.lon), y: Y(qb.lat) }, { x: X(q.lon), y: Y(q.lat) }) ?? 0;
      wakes += wakeSvg(pushTrail(trails, id, pt));
    } else delete trails[id];
    h += `<g data-mx="${pt.x}" data-my="${pt.y}">${shipSvg(sh.type, { mine, heading: ang })}${mine ? `<text x="9" y="-8" font-size="11" fill="${isSel ? "#a00" : "#300"}">${sh.id}</text>` : ""}</g>`;
  }
  layer.innerHTML = `<g class="wakes" pointer-events="none">${wakes}</g>` + h; scaleMarkers();
}
function stepTicks(n) {
  for (let i = 0; i < n; i++) {
    const dayBefore = g.day, before = g.ships.map((x) => !!x.voyage);
    advanceTick(g);
    if (g.day !== dayBefore) autosave();
    if (g.pending || g.encounterReport) playing = false;
    if (g.ships.some((x, j) => before[j] && !x.voyage)) playing = false; // pause when your ship arrives
  }
  render();
}
function frame(now) {
  const dt = lastFrame ? Math.min(250, now - lastFrame) : 0; lastFrame = now;
  if (playing && !g.over) {
    tickAcc += dt * speed;
    const n = Math.floor(tickAcc / MS_PER_TICK);
    if (n) { tickAcc -= n * MS_PER_TICK; stepTicks(n); }
    progress = (g.tick % TICKS_PER_DAY + tickAcc / MS_PER_TICK) / TICKS_PER_DAY; // view only: how much of the current day has elapsed
  }
  drawShips();
  requestAnimationFrame(frame);
}
function spark(a, col) {
  if (a.length < 2) return "";
  const lo = Math.min(...a), hi = Math.max(...a), w = 48, h = 14, span = Math.max(1, hi - lo);
  const pts = a.map((v, i) => `${(i / (a.length - 1) * w).toFixed(1)},${(h - (v - lo) / span * h).toFixed(1)}`).join(" ");
  return `<svg class="spark" width="${w}" height="${h + 2}" viewBox="0 -1 ${w} ${h + 2}"><polyline fill="none" stroke="${col === "inherit" ? "#654" : col}" stroke-width="1.2" points="${pts}"/></svg> `;
}
let tab = "market"; const qtys = {}; // per-good quantity chosen in the market table
let bldAction = null, bldError = null; const plotsCache = {}; // armed Buildings-tab action; seeded layout plots per city (async)
function ensurePlots(city) { if (plotsCache[city] && plotsCache[city] !== "error") return; plotsCache[city] = "loading"; cityPlots(city, world.nodes[city]?.pop ?? 8000).then((l) => { plotsCache[city] = l.plots; if ((tab === "buildings" || tab === "plot") && ship().at === city) render(); }).catch(() => { plotsCache[city] = "error"; if ((tab === "buildings" || tab === "plot") && ship().at === city) render(); }); }
const SAVE_KEY = "almojarife.save.v1";
let company = "";
function autosave() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(packGame(g, company))); } catch {} }
function loadSaved() { try { const raw = localStorage.getItem(SAVE_KEY); if (!raw) return null; return unpackGame(JSON.parse(raw), world); } catch { return null; } }
const cityIds = world.cities.map((c) => c.id), cityIdSet = new Set(cityIds);
const routeDrafts = {}; // advanced-route editor drafts, per ship id
const newRouteDraft = (at, ids) => ({ minCash: "", stops: [{ city: ids[0] ?? at, buyGood: "", buyMax: "", sellGood: "", sellMin: "" }] });
function start(prof, save = true) {
  const p = cleanProfile({ ...prof, company: prof?.company || T[lang].defCo }, cityIds);
  g = newGame(world, p.home, { ...startBonus(p), profile: p, events: true }); sel = 0; company = p.company; if (save) autosave(); render();
}
function ship() { return g.ships[sel] ?? g.ships[0]; }
function act(fn) {
  const day = g.day; fn();
  if (g.day !== day) { progress = 0; tickAcc = 0; } // wait buttons advance whole days
  autosave(); render();
}

function render() {
  document.getElementById('sea-modal')?.remove();
  if(g.pending?.event==='sea-pirates'||g.encounterReport){
   playing=false;const modal=document.createElement('div');modal.id='sea-modal';modal.innerHTML=encounterDialogHtml(g,lang);document.body.appendChild(modal);
   modal.querySelectorAll('[data-sea]').forEach(b=>b.onclick=()=>act(()=>resolvePirates(g,b.dataset.sea)));
   modal.querySelector('[data-sea-close]')?.addEventListener('click',()=>act(()=>dismissEncounterReport(g)));
   modal.querySelectorAll('[data-sea-claim]').forEach(b=>b.onclick=()=>act(()=>claimPrize(g,b.dataset.seaClaim==='keep')));
   modal.querySelector('button')?.focus();
  }

  t = T[lang]; const s = ship();
  const pr = g.profile, co = $("co"); co.textContent = "";
  if (pr) { const box = document.createElement("span"); box.innerHTML = crestSvg(pr.crest, 22, "top"); co.append(box, ` ${pr.company}`); if (pr.character) { const sm = document.createElement("small"); sm.textContent = ` (${pr.character})`; co.append(sm); } }
  else if (company) co.textContent = `· ${company}`;
  const cal = calendarOf(g.day), dayFrac = ((g.tick % TICKS_PER_DAY) + tickAcc / MS_PER_TICK) / TICKS_PER_DAY; // exact even paused or just loaded
  const mins = Math.floor(dayFrac * 24 * 60), hh = String(Math.floor(mins / 60)).padStart(2, "0"), mm = String(mins % 60).padStart(2, "0");
  $("day").textContent = `${cal.day} ${t.months[cal.month]} ${cal.year}, ${hh}:${mm} · ${t.day} ${g.day}/${DEADLINE_DAYS} · ${t.seasons[seasonOf(g.day)]}`;
  $("todbar").firstElementChild.style.width = `${Math.round(dayFrac * 100)}%`; // the bar filling is the time-passing indicator
  $("cash").textContent = `${t.cash}: ${fmt(g.cash)}`; $("cash").style.color = g.cash < 0 ? "#b3261e" : "";
  $("rep").textContent = LT[lang].reports; $("msg").textContent = badge(LT[lang].messages, unread(g));
  $("goal").textContent = `${t.goal}: ${fmt(GOAL_CASH)}`;
  $("ships").textContent = `${t.ships}: ${g.ships.length}`;
  $("play").textContent = playing ? t.pause : t.play; $("spd").textContent = `${t.speed} ${speed}x`;
  $("new").textContent = t.menu; $("lang").textContent = lang === "es" ? "EN" : "ES";
  $("hint").textContent = g.over === "win" ? t.win : g.over === "lose" ? `${g.overReason === "bankrupt" ? t.bankrupt : t.lose} ${fmt(netWorth(g))}` :
    s.voyage ? t.hintSea : t.hint0.replace("{goal}", fmt(GOAL_CASH)).replace("{days}", DEADLINE_DAYS);
  // map
  let m = "";
  const hiddenPort = (id) => cityIdSet.has(id) && !isDiscovered(g, id); // fog of war: only discovered ports and their sea lanes show
  for (const [a, b] of world.lanes) { if (hiddenPort(a) || hiddenPort(b)) continue; m += `<line x1="${X(world.nodes[a].lon)}" y1="${Y(world.nodes[a].lat)}" x2="${X(world.nodes[b].lon)}" y2="${Y(world.nodes[b].lat)}" stroke="#7a9bb0" stroke-width="1.5" stroke-dasharray="4 3"/>`; }
  const est = target && !s.voyage ? travelEstimate(world, s, target) : null;
  if (est?.ok) {
    const pts = est.path.map((id) => `${X(world.nodes[id].lon)},${Y(world.nodes[id].lat)}`).join(" "), last = world.nodes[target];
    m += `<polyline points="${pts}" fill="none" stroke="#c0392b" stroke-width="3" stroke-dasharray="7 5" vector-effect="non-scaling-stroke" pointer-events="none"/><text x="${X(last.lon) + 10}" y="${Y(last.lat) + 20}" font-size="13" fill="#7b241c" font-weight="bold" pointer-events="none" class="eta">≈ ${hoursOf(est.ticks)} h</text>`;
  }
  for (const c of world.cities) {
    if (!isDiscovered(g, c.id)) continue; // fog of war
    const e = !s.voyage ? travelEstimate(world, s, c.id) : null, tip = c.name + (e?.ok ? ` - ≈ ${hoursOf(e.ticks)} h, ${e.km} km` : "");
    m += `<g class="city" data-c="${c.id}" data-mx="${X(c.lon)}" data-my="${Y(c.lat)}"><title>${tip}</title><circle cx="0" cy="0" r="${c.id === target ? 10 : 7}" fill="${c.id === s.at ? "#2a7" : "#7a3b1c"}" stroke="${c.id === target ? "#c0392b" : "none"}" stroke-width="3"/><text x="10" y="4" font-size="14">${c.name}</text></g>`;
  }
  $("map").innerHTML = `<image href="../assets/map/background.webp" x="0" y="0" width="800" height="${VH}" preserveAspectRatio="none" pointer-events="none"/><g id="static">${m}</g>${atmosphereSvg(800, VH, g.day, !matchMedia("(prefers-reduced-motion: reduce)").matches)}<g id="shipsLayer" pointer-events="none"></g>`;
  drawShips(); scaleMarkers();
  $("map").querySelectorAll("g.city").forEach((el) => {
    el.onclick = () => { target = el.dataset.c; closeMenu(); render(); };
    el.oncontextmenu = (ev) => { ev.preventDefault(); openMenu(el.dataset.c, ev.clientX, ev.clientY); };
    el.onpointerdown = (ev) => { if (ev.pointerType === "touch") { const x = ev.clientX, y = ev.clientY; lp = setTimeout(() => { if (moved < 6) { openMenu(el.dataset.c, x, y); moved = 99; } }, 550); } };
    el.onpointerup = el.onpointerleave = () => clearTimeout(lp);
  });
  const logLine = (l) => l.key === "event" ? `${t.day} ${l.day}: ${l.txt?.[lang] ?? ""}` : t.log[l.key].replace(/\{(\w+)\}/g, (_, k) => k === "city" ? cityName(l.city) : k === "good" ? t.goods[l.good] : l[k]);
  $("log").innerHTML = g.log.map((l) => `<div>${logLine(l)}</div>`).join("");
  // panel
  let h = "";
  const pe = pendingEvent(g);
  if (pe) { playing = false; h += `<div class="event"><b>${pe.title[lang]}</b><p>${pe.text[lang]}</p>` + pe.choices.map((c) => `<button data-ev="${c.id}">${c.label[lang]}</button>`).join(" ") + `</div>`; }
  h += g.ships.map((sh, i) => `<button data-sel="${i}" ${i === sel ? "disabled" : ""}>${t.types[sh.type]} ${sh.id}</button>`).join("");
  h += ` <b>${t.types[s.type]} ${s.id}</b>: ${s.voyage ? `${t.sea} ${cityName(s.voyage.to)} (${etaText(g.tick + s.voyage.ticksLeft)})` : `${t.at} ${cityName(s.at)}`} - ${t.cap} ${cargoUsed(s)}/${SHIP_TYPES[s.type].capacity}<br>`;
  h += assignedCaptainHtml(s,lang);
  if (!s.voyage && !g.over) {
    const hv = Object.keys(s.cargo).reduce((a, gd) => a + (s.cargo[gd] ?? 0) * quote(g, s.at, gd), 0);
    h += `<div title="${t.holdValue}">${t.holdValue}: ≈ ${fmt(Math.round(hv))}</div>`;
    const nd = world.nodes[s.at];
    h += `<div class="scenebox">${citySceneSvg({ id: s.at, pop: nd.pop ?? 8000, warehouse: !!warehouseOf(g, s.at), shipyard: true, ships: g.ships.filter((x) => x.at === s.at && !x.voyage).length, day: g.day, tod: 0.35 + progress * 0.4 })}</div>`;
    h += `<div><button data-3d="1">${t.view3d}</button></div>`;
    const bp = bestPorts(g, s).slice(0, 3);
    if (bp.length) h += `<div class="best"><b>${t.bestLbl}</b>` + bp.map((r) => `<div><button data-pick="${r.city}">${t.target}</button> ${t.bestRow.replace("{city}", cityName(r.city)).replace("{r}", fmt(r.revenue)).replace("{p}", (r.profit >= 0 ? "+" : "") + fmt(r.profit)).replace("{d}", r.days)} <small>(${r.age === 0 ? t.ageNow : t.ageDays.replace("{n}", r.age)}${r.exact ? "" : ", " + t.rumorTag})</small></div>`).join("") + `</div>`;
    if (!bp.length && Object.keys(s.cargo).length) h += `<div class="best"><i>${t.noInfo}</i></div>`;
    const wh = warehouseOf(g, s.at);
    h += `<div class="tabs">` + [["market", t.tabMarket], ["city", t.tabCity], ["buildings", t.bldBuild], ["yard", t.tabYard], ["tavern", t.tabTavern], ["route", t.tabRoute], ["bank", t.tabBank], ["house", premises(g,s.at,lang).label], ["store", t.tabStore]].map(([k, l]) => `<button data-tab="${k}" ${tab === k ? "disabled" : ""}>${l}</button>`).join("") + `</div>`;    const bldCard = () => { // armed buy/build/upgrade action: quote card with confirm/cancel
      if (!bldAction) return "";
      const layA = plotsCache[s.at];
      let card = "", canPay = false;
      if (bldAction.kind === "buy") { const o = plotOffers(world, g, s.at, Array.isArray(layA) ? layA : []).find((x) => x.id === bldAction.plotId); if (o) { card = `<b>${t.bldBuy.replace("{p}", fmt(o.price))}</b> ${o.id} <small>${t.bldTypes[o.type] ?? o.type} · ${o.w}×${o.d}</small>`; canPay = g.cash >= o.price; } }
      else if (bldAction.kind === "build") { const o = buildOffers(g, s.at, bldAction.plotId).find((x) => x.type === bldAction.type); if (o?.ok) { card = `<b>${t.bldTypes[bldAction.type]}</b> ${bldAction.plotId}<br><small>${t.bldCost.replace("{c}", fmt(o.cost)).replace("{m}", fmt(o.materials)).replace("{f}", fmt(o.fee)).replace("{d}", o.days).replace("{u}", o.upkeep)}</small>`; canPay = o.affordable; } else if (o) { card = `<b>${t.bldTypes[bldAction.type]}</b> ${bldAction.plotId}<br><small style="color:#a11">${whyText(t, o.reason)}</small>`; } }
      else if (bldAction.kind === "upgrade") { const o = upgradeOffer(g, s.at, bldAction.plotId); if (o?.ok) { card = `<b>${t.bldTypes[o.type]}</b> ${bldAction.plotId}<br><small>${t.bldCost.replace("{c}", fmt(o.cost)).replace("{m}", fmt(o.materials)).replace("{f}", fmt(o.fee)).replace("{d}", o.days).replace("{u}", o.upkeep)}</small>`; canPay = o.affordable; } }
      return card ? `<div class="card">${card}<br><button data-bldconf="1" ${canPay ? "" : "disabled"}>${t.bldConfirm}</button> <button data-bldcancel="1">${t.bldCancel}</button>${canPay ? "" : ` <small>${t.capCash}</small>`}${bldError ? ` <small style="color:#a11">${bldError}</small>` : ""}</div>` : "";
    };
    const bldFx = (r) => { // one line: what this building does or when it is ready
      if (r.state === "construction") return `${t.bldState.construction} ${r.nextLevel} · ${t.bldReady.replace("{d}", r.readyDay).replace("{p}", Math.round(r.progress * 100))}`;
      if (r.state === "active") {
        if (r.type === "workshop") return t.bldFxW.replace("{r}", r.rate).replace("{m}", r.margin === null ? "—" : fmt(r.margin)).replace("{n}", fmt(r.produced));
        if (r.rate !== undefined) return t.bldFxP.replace("{r}", r.rate).replace("{n}", fmt(r.produced)); // primary producers: rate and units, no margin
        if (r.type === "house") return t.bldFxH.replace("{n}", fmt(r.popBonus));
        if (r.type === "warehouse") return t.bldFxS.replace("{n}", fmt(r.capBonus));
      }
      return "-";
    };
    if (tab === "market") {
      h += `<table><tr><th>${t.good}</th><th>${t.price}</th><th>${t.stock}</th><th>${t.hold}</th><th></th></tr>`;
      for (const gd of Object.keys(world.goods)) {
        const have = s.cargo[gd] ?? 0, stored = wh?.goods?.[gd] ?? 0, q = Math.max(1, Math.min(qtys[gd] ?? 10, 999)), pb = previewBuy(world, g.market, s, g.cash, gd, q, FEE * feeMul(g, s.at)), ps = previewSell(world, g.market, s, gd, q, FEE * feeMul(g, s.at));
        const p = quote(g, s.at, gd), base = world.goods[gd].base, col = p < base * 0.9 ? "#161" : p > base * 1.2 ? "#a11" : "inherit", tag = p < base * 0.9 ? "▼" : p > base * 1.2 ? "▲" : "";
        h += `<tr><td>${goodIcon(gd)}${t.goods[gd]}</td><td style="color:${col}" title="${tag === "" ? "" : tag === "▼" ? t.cheap : t.dear}">${spark(priceHistory(g, s.at, gd), col)}${tag} ${p}${(() => { const tp = trendPct(g, s.at, gd); return tp === null || tp === 0 ? "" : ` <small class="tr" title="${t.trend7}">${tp > 0 ? "+" : ""}${tp}%</small>`; })()}</td><td>${g.market[s.at][gd].stock} ${(() => { const lv = stockLevel(g.market[s.at][gd]); const cl = { scarce: "#b3261e", short: "#b26a00", normal: "#6b6355", plenty: "#1e7a34" }[lv]; return `<small style="color:${cl}" title="${t.lvlInfo[lv]}">${t.lvl[lv]}</small>`; })()}</td><td>${have}${stored ? ` <small title="${t.warehouse}">+${stored}</small>` : ""}</td>` +
          `<td class="qty"><button data-q="${gd}:-1" aria-label="-1">−</button><b>${q}</b><button data-q="${gd}:1" aria-label="+1">+</button><button data-q="${gd}:10">10</button><button data-q="${gd}:max">Max</button></td></tr>` +
          `<tr class="deal"><td colspan="5"><button data-b="${gd}:${q}" ${pb.qty ? "" : "disabled"}>${t.buy} ${q}</button> <button data-s="${gd}:${q}" ${ps.qty ? "" : "disabled"}>${t.sell} ${q}</button> <button data-s="${gd}:all" ${have ? "" : "disabled"}>${t.sell} ${t.sellAll}</button> <br><small>${pb.qty ? t.dealBuy.replace("{q}", pb.qty).replace("{c}", fmt(pb.cost)).replace("{a}", pb.avg).replace("{n}", pb.next) + (pb.limit ? " - " + t[pb.limit === "cash" ? "capCash" : pb.limit === "stock" ? "capStock" : "capRoom"] : "") : ""}${ps.qty ? " | " + t.dealSell.replace("{q}", ps.qty).replace("{c}", fmt(ps.revenue)).replace("{a}", ps.avg).replace("{n}", ps.next) + (ps.hasBasis ? ` (${Math.abs(ps.profit)} ${ps.profit >= 0 ? t.profit : t.loss})` : "") : ""}</small></td></tr>`;
      }
      h += `</table>`;
    } else if (tab === "route") {
      const rt = s.route, gn = (k) => t.goods[k] ?? k, others = world.cities.filter((c) => c.id !== s.at && isDiscovered(g, c.id));
      h += `<p>${t.routeInfo}</p>`;
      const stopLine = (st) => {
        const b = st.buy.map((x) => `${t.routeBuyW} ${gn(x.good)}${x.maxPrice != null ? " " + t.routeIfLe.replace("{p}", x.maxPrice) : ""}`).join(", ") || t.routeNoBuy;
        const v = st.sell.map((x) => `${t.routeSellW} ${gn(x.good)}${x.minPrice != null ? " " + t.routeIfGe.replace("{p}", x.minPrice) : ""}`).join(", ") || t.routeNoSell;
        return `${cityName(st.city)}: ${b} · ${v}`;
      };
      if (rt?.v === 2) {
        h += `<div class="card">${t.routeNow2.replace("{n}", rt.stops.length).replace("{l}", rt.legs).replace("{m}", rt.minCash)}<br>` +
          rt.stops.map((st, i) => `${i + 1}. ${stopLine(st)}`).join("<br>") +
          `<br><button id="rt-cancel">${t.routeCancel}</button></div>`;
      } else {
  
      }
      const goods = Object.keys(world.goods);
      const d = (routeDrafts[s.id] ??= newRouteDraft(s.at, others.map((c) => c.id)));
      h += `<p><b>${t.routeAdv}</b></p><p>${t.routeAdvInfo}</p>`;
      d.stops.forEach((st, i) => {
        const cityOpts = others.map((c) => `<option value="${c.id}" ${st.city === c.id ? "selected" : ""}>${cityName(c.id)}</option>`).join("");
        const goodOpts = (sel) => `<option value="">${t.routeAny}</option>` + goods.map((k) => `<option value="${k}" ${sel === k ? "selected" : ""}>${gn(k)}</option>`).join("");
        h += `<div class="rumor">${t.routeStop.replace("{n}", i + 1)}: <select id="rts-city-${i}">${cityOpts}</select> ${t.routeBuyIf}: <select id="rts-bg-${i}">${goodOpts(st.buyGood)}</select> <input id="rts-bp-${i}" type="number" min="0" step="1" size="5" placeholder="≤" value="${st.buyMax}"> ${t.routeSellIf}: <select id="rts-sg-${i}">${goodOpts(st.sellGood)}</select> <input id="rts-sp-${i}" type="number" min="0" step="1" size="5" placeholder="≥" value="${st.sellMin}"> <button id="rts-del-${i}">${t.routeDelStop}</button></div>`;
      });
      h += `<div class="rumor"><button id="rts-add">${t.routeAddStop}</button> ${t.routeMinCash}: <input id="rts-mincash" type="number" min="0" step="1" size="6" value="${d.minCash}"> <button id="rts-set2">${t.routeSetAdv}</button></div>`;
      h += rt ? `<div class="card">${t.routeNow.replace("{a}", cityName(rt.a)).replace("{b}", cityName(rt.b)).replace("{out}", gn(rt.out)).replace("{back}", rt.back ? t.routeBackTxt.replace("{g}", gn(rt.back)) : "").replace("{n}", rt.legs)}<br><button id="rt-cancel">${t.routeCancel}</button></div>` : `<p><i>${t.routeNone}</i></p>`;
      h += `<div class="rumor">${t.routeTo}: <select id="rt-to">${others.map((c) => `<option value="${c.id}">${cityName(c.id)}</option>`).join("")}</select> ${t.routeOut}: <select id="rt-out">${goods.map((k) => `<option value="${k}">${gn(k)}</option>`).join("")}</select> ${t.routeBack}: <select id="rt-back"><option value="">${t.routeNoBack}</option>${goods.map((k) => `<option value="${k}">${gn(k)}</option>`).join("")}</select> <button id="rt-set">${t.routeSet}</button></div>`;
    } else if (tab === "city") {
      const nd2 = world.nodes[s.at], pop2 = nd2.pop ?? 8000, ks = Object.keys(world.goods), ent = g.market[s.at];
      const rows = cityRows(pop2, ks, (k) => affordRatio(ent[k], world.goods[k].base)), cn = { poor: t.clsPoor, middle: t.clsMiddle, rich: t.clsRich };
      { const eff = cityEffects(g, s.at); if (eff.popBonus) h += `<p><b>${t.bldPopLine.replace("{p}", fmt(eff.pop + eff.popBonus)).replace("{b}", fmt(eff.popBonus))}</b></p>`; }
      h += `<p>${t.cityInfo}</p><div class="cityclasses">` + rows.map((r) => `<div class="card"><b>${cn[r.cls]}</b>: ${fmt(r.count)} ${t.cityCitizens} (${r.pct} %)<br>${t.cityBuys}: ${r.top.map((x) => goodIcon(x.good) + t.goods[x.good]).join(", ") || "-"}` + (r.priced_out.length ? `<br><i>${t.cityOut}: ${r.priced_out.map((k) => t.goods[k]).join(", ")}</i>` : "") + `</div>`).join("") + `</div>`;
    } else if (tab === "buildings") {
      ensurePlots(s.at);
      if (bldAction && !bldAction.plotId.startsWith(s.at + ":")) { bldAction = null; bldError = null; } // sailed away with an armed action
      const eff = cityEffects(g, s.at);
      h += `<p>${t.bldInfo}</p>` + (eff.popBonus ? `<p><b>${t.bldPopLine.replace("{p}", fmt(eff.pop + eff.popBonus)).replace("{b}", fmt(eff.popBonus))}</b></p>` : "");
      h += bldCard();
      const own = buildingsRows(g, s.at);
      if (!hasOffice(g, s.at)) h += `<p><i>${t.bldNeedOffice}</i></p>`; // building is office-gated
      else {
        h += `<p><i>${$("v3d") ? t.bldHint : t.bldPick2d}</i></p>`;
        if (own.length) h += `<p>` + own.map((r) => `<button data-bldact="sel|${r.plotId}">${buildingLabel(t, r)}</button>`).join(" ") + `</p>`; // also the no-WebGL path to build/upgrade
        const lay = plotsCache[s.at];
        if (lay === "error") h += `<p><i style="color:#a11">${t.bldPlotsErr}</i></p>`;
        else if (!Array.isArray(lay)) h += `<p><i>${t.bldLoading}</i></p>`;
        else {
          const offers = plotOffers(world, g, s.at, lay);
          if ($("v3d")) { if (offers.length) h += `<p><i>${t.bldFree3d.replace("{n}", offers.length)}</i></p>`; }
          else h += offers.length ? `<p><b>${t.bldFree}</b></p><div class="yardcards">` + offers.map((o) => `<div class="card"><b>${o.id}</b> <small>${t.bldTypes[o.type] ?? o.type} · ${o.w}×${o.d}</small><br><button data-bldact="buy|${o.id}" ${g.cash < o.price ? "disabled" : ""}>${t.bldBuy.replace("{p}", fmt(o.price))}</button></div>`).join("") + `</div>` : "";
        }
      }
    } else if (tab === "plot") { // one building or plot, opened by clicking it in the 3D view
      ensurePlots(s.at); // a 3D click can land here before the Construir tab ever loaded the plots
      if (bldAction && (bldAction.plotId !== bldSelPlot || !bldAction.plotId.startsWith(s.at + ":"))) { bldAction = null; bldError = null; } // plot switched: never confirm on the old plot
      const r = buildingsRows(g, s.at).find((x) => x.plotId === bldSelPlot);
      if (!r) { // a free plot ("solar") clicked in the 3D view: show its buy offer
        const pv = plotViewState(plotsCache, world, g, s.at, bldSelPlot), o = pv.kind === "offer" ? pv.offer : null;
        if (pv.kind === "loading") h += `<p><i>${t.bldLoading}</i></p>`;
        else if (pv.kind === "error") h += `<p><i style="color:#a11">${t.bldPlotsErr}</i></p>`;
        else if (o && hasOffice(g, s.at)) { h += `<h3>${t.bldState.plot} <small>${o.id}</small></h3><p>${t.bldTypes[o.type] ?? o.type} · ${o.w}×${o.d}</p>`; h += bldCard(); h += `<p><button data-bldact="buy|${o.id}" ${g.cash < o.price ? "disabled" : ""}>${t.bldBuy.replace("{p}", fmt(o.price))}</button></p>`; }
        else h += `<p><i>${o ? t.bldNeedOffice : t.bldNone}</i></p>`;
      }
      else {
        h += `<h3>${buildingLabel(t, r)} <small>${r.plotId}</small></h3><p>${bldFx(r)}${r.upkeep ? ` · ${t.bldUpkeep.replace("{u}", r.upkeep)}` : ""}</p>`;
        h += bldCard();
        const up = r.state === "active" ? upgradeOffer(g, s.at, r.plotId) : null;
        if (up) h += up.ok ? `<p><button data-bldact="upgrade|${r.plotId}|${r.type}" ${up.affordable ? "" : "disabled"}>${t.bldUpgrade.replace("{l}", up.level).replace("{p}", fmt(up.cost))}</button></p>` : `<p><small>${up.reason === "max level" ? t.bldMax : up.reason}</small></p>`;
        if (r.state === "plot") h += `<p>` + buildOffers(g, s.at, r.plotId).filter((o) => o.ok).map((o) => `<button data-bldact="build|${r.plotId}|${o.type}">${t.bldTypes[o.type] ?? o.type}</button>`).join(" ") + `</p>`; // only types this city's resources allow
      }
    } else if (tab === "town") { // a typed town building clicked in the 3D view: read-only card, no services yet
      h += t.townTypes[townSel] ? `<h3>${t.townTypes[townSel]}</h3><p>${t.townDesc[townSel]}</p>` : `<p><i>${t.bldNone}</i></p>`;
    } else if (tab === "house") {
      const pr = premises(g,s.at,lang);
      h += `<h3>${pr.label}: ${cityName(s.at)}</h3><p>${pr.info}</p>`;
      h += houseHtml(g, lang, netWorth(g), fmt, cityName, LOAN_MAX);
      if (!pr.isHome && !hasOffice(g, s.at)) { const rp = repOf(g, s.at); h += `<p><i>${t.officeReq.replace("{p}", fmt(OFFICE_PRICE)).replace("{r}", RESPECT_NAMES[lang][respectOf(g, s.at).id]).replace("{n}", Math.floor(rp))}</i></p>` + `<p><button data-bldact="office|buy" ${g.cash < OFFICE_PRICE || rp < OFFICE_MIN_RESPECT ? "disabled" : ""}>${t.officeBuy.replace("{p}", fmt(OFFICE_PRICE))}</button></p>`; }
      else if (!pr.isHome) h += `<p><i>${t.officeOwned}</i></p>`;
      if(!pr.isHome) h += `<p>${warehouseOf(g,s.at) ? (lang==="es"?"Almacén propio disponible en este puerto.":"You own a warehouse in this port.") : (lang==="es"?"No tienes almacén en este puerto.":"You have no warehouse in this port.")}</p><button data-local-store>${t.tabStore}</button><button data-local-reports>${LT[lang].reports}</button>`;
    } else if (tab === "bank") {
      const room = bankRoom(g), amts = [100, 500, 1000, 5000].filter((a) => a <= room);
      h += `<p>${t.bankInfo.replace("{r}", Math.round(LOAN_RATE * 100)).replace("{m}", fmt(loanCapFor(g, LOAN_MAX)))}</p><p>${t.bankRoom}: <b>${fmt(room)}</b> · ${t.bankOwed}: <b>${fmt(loansOwed(g))}</b></p>`;
      h += amts.map((a) => `<button data-loan="${a}">${t.bankTake.replace("{a}", fmt(a))}</button>`).join(" ");
      const ls = g.loans ?? [];
      h += ls.length ? ls.map((l) => `<div class="card">${t.bankLoan.replace("{d}", l.taken).replace("{l}", fmt(l.left)).replace("{u}", l.due)}<br><button data-repay="${l.id}:all" ${g.cash > 0 ? "" : "disabled"}>${t.bankRepay}</button> <button data-repay="${l.id}:100" ${g.cash >= 100 ? "" : "disabled"}>${t.bankRepay100}</button></div>`).join("") : `<p><i>${t.bankNone}</i></p>`;
    } else if (tab === "tavern") {
      h += tavernCaptainsHtml(g,s,lang);
      const unk = world.cities.filter((c) => !isLive(g, c.id));
      h += `<p>${t.tavernInfo}</p>` + (unk.length ? `<div class="rumor">${t.rumorPick}: <select id="rum">${unk.map((c) => `<option value="${c.id}">${cityName(c.id)}${g.intel?.[c.id] ? ` (${g.day - g.intel[c.id].day} d)` : ""}</option>`).join("")}</select> <button id="rumbtn" ${g.cash >= RUMOR_PRICE ? "" : "disabled"}>${t.rumorBtn.replace("{p}", RUMOR_PRICE)}</button></div>` : `<p><i>${t.tavernNone}</i></p>`);
      { const offers = chartOffers(g, s.at);
        if (offers.length) h += `<div class="rumor"><b>${t.chartTitle}</b> <small>${t.chartInfo}</small><br>` + offers.map((k) => `<button data-chart="${k}" ${g.cash < chartPrice(k) ? "disabled" : ""}>${t.chartBuy.replace("{c}", t.chartNames[k]).replace("{p}", fmt(chartPrice(k)))}</button>`).join(" ") + `</div>`;
        if (routeRumorTarget(g, s.at)) h += `<div class="rumor"><button id="rrumbtn" ${g.cash < ROUTE_RUMOR_PRICE ? "disabled" : ""}>${t.routeRumorBtn.replace("{p}", ROUTE_RUMOR_PRICE)}</button> <small>${t.routeRumorInfo}</small></div>`; }
      { const L = crewLimits(s), c = crewOf(s), sp = speedFactor(s);
        h += `<div class="rumor"><b>${t.crewTitle}</b>: ${c} (${t.crewMin} ${L.min} · ${t.crewOpt} ${L.opt} · ${t.crewMax} ${L.max})<br>${c < L.min ? `<b>${t.crewShort}</b>` : t.crewSpeed.replace("{s}", Math.round(sp * 100))}<br>` +
          [1, 5].map((n) => `<button data-hire="${n}" ${s.voyage || c >= L.max || g.cash < n * HIRE_FEE ? "disabled" : ""}>${t.crewHire.replace("{n}", n).replace("{p}", fmt(n * HIRE_FEE))}</button>`).join(" ") + " " +
          [1, 5].map((n) => `<button data-dismiss="${n}" ${s.voyage || c <= 0 ? "disabled" : ""}>${t.crewDismiss.replace("{n}", n)}</button>`).join(" ") + `</div>`; }
    } else if (tab === "yard") {
      h += `<p>${t.yardInfo}</p><div class="scenebox">${yardSceneSvg({ orders: (g.orders ?? []).filter((o) => o.at === s.at), day: g.day, tod: 0.35 + progress * 0.4, emptyLabel: t.yardEmpty })}</div>`;
      h += `<div class="yardcards">` + Object.entries(SHIP_TYPES).map(([k, v]) => `<div class="card yc">${shipIconSvg(k)}<b>${t.types[k]}</b><small>${t.yc.replace("{c}", v.capacity).replace("{d}", v.buildDays).replace("{u}", v.upkeepPerDay)}</small><button data-order="${k}" ${g.cash < v.price ? "disabled" : ""}>${t.orderShort.replace("{p}", fmt(v.price))}</button></div>`).join("") + `</div>`;
      h += `<div><button data-repair="1" ${repairPrice(g, s) <= 0 || g.cash < repairPrice(g, s) ? "disabled" : ""}>${t.repair.replace("{h}", Math.round(s.hull ?? 100)).replace("{p}", fmt(repairPrice(g, s)))}</button> <button data-gunrepair="1" ${gunRepairCost(s) <= 0 || s.voyage || g.cash < gunRepairCost(s) ? "disabled" : ""}>${cannonsOf(s) ? t.gunRepair.replace("{c}", Math.round(gunCond(s))).replace("{p}", fmt(gunRepairCost(s))) : t.gunNone}</button> <button data-cannon="1" ${s.voyage || cannonsOf(s) >= maxCannons(s) || g.cash < CANNON_PRICE ? "disabled" : ""}>${t.cannonBuy.replace("{p}", fmt(CANNON_PRICE)).replace("{n}", cannonsOf(s)).replace("{m}", maxCannons(s))}</button> <button data-sellship="1" ${g.ships.length <= 1 || cargoUsed(s) > 0 ? "disabled" : ""}>${t.sellShip.replace("{p}", fmt(shipValue(s)))}</button></div>`;
      if (g.orders?.length) h += `<div><b>${t.orders}</b>` + g.orders.map((o) => `<div>${t.ready.replace("{type}", t.types[o.type]).replace("{city}", cityName(o.at)).replace("{day}", o.readyDay).replace("{pct}", Math.round(orderProgress(o, g.day) * 100))}</div>`).join("") + `</div>`;
    } else {
      if (!wh) h += `<p>${t.whInfo}</p><button data-wh="1" ${g.cash < WAREHOUSE_PRICE ? "disabled" : ""}>${t.buyWh.replace("{p}", fmt(WAREHOUSE_PRICE))}</button>`;
      else {
        h += `<table><tr><th>${t.good}</th><th>${t.hold}</th><th>${t.warehouse}</th><th></th></tr>`;
        for (const gd of Object.keys(world.goods)) {
          const inHold = s.cargo[gd] ?? 0, inWh = wh.goods[gd] ?? 0; if (!inHold && !inWh) continue;
          h += `<tr><td>${goodIcon(gd)}${t.goods[gd]}</td><td>${inHold}</td><td>${inWh}</td><td><button data-st="${gd}" ${inHold ? "" : "disabled"}>${t.store}</button><button data-tk="${gd}" ${inWh ? "" : "disabled"}>${t.take}</button></td></tr>`;
        }
        h += `</table>${Object.keys(wh.goods).length || Object.keys(s.cargo).length ? "" : `<p>${t.whEmpty}</p>`}`;
        const adm = stewardOf(g, s.at), admRules = Object.entries(adm?.rules ?? {});
        h += `<h4>${t.admTitle}</h4><p><small>${t.admInfo}</small></p>`;
        h += admRules.length ? `<table>` + admRules.map(([gd, r]) => `<tr><td>${goodIcon(gd)}${t.goods[gd]}</td><td><small>${t.admRule.replace("{b}", r.buyBelow || "-").replace("{n}", r.buyTo || "-").replace("{v}", r.sellAbove || "-").replace("{k}", r.sellKeep || 0)}</small></td><td><button data-admclr="${gd}">${t.admClear}</button></td></tr>`).join("") + `</table>` : `<p><i>${t.admNoRules}</i></p>`;
        h += `<div class="rumor"><select id="adm-good">${Object.keys(world.goods).map((k) => `<option value="${k}">${t.goods[k]}</option>`).join("")}</select> <input id="adm-buy" type="number" min="0" placeholder="${t.admBuy}" size="6"> <input id="adm-to" type="number" min="0" placeholder="${t.admTo}" size="4"> <input id="adm-sell" type="number" min="0" placeholder="${t.admSell}" size="6"> <input id="adm-keep" type="number" min="0" placeholder="${t.admKeep}" size="4"> <button id="adm-set">${t.admSet}</button> <small id="adm-msg" style="color:#a11"></small></div>`;
        h += `<div class="rumor">${t.admReserve}: <input id="adm-res" type="number" min="0" value="${adm?.reserve ?? 0}" size="6"> <button id="adm-resset">${t.admReserveSet}</button></div>`;
      }
    }
    { const te = target ? travelEstimate(world, s, target) : null;
      h += `<div class="dest"><b>${t.target}:</b> ` + (te?.ok ? `${cityName(target)} - ≈ ${hoursOf(te.ticks)} h, ${te.km} km <button data-go="1">${t.sailGo} (↵)</button>` : `<i>${t.hint}</i>`) + `</div>`; }
  }
  if (!g.over) h += `<div><button data-wait="1">${t.wait}</button>${s.voyage ? `<button data-arrive="1">${t.arrive}</button>` : ""}</div>`;
  $("panel").innerHTML = h;
  const P = $("panel");
  P.querySelectorAll("[data-ev]").forEach((e) => e.onclick = () => act(() => resolveEvent(g, e.dataset.ev)));
  P.querySelectorAll("[data-sel]").forEach((e) => e.onclick = () => { sel = +e.dataset.sel; render(); });
  P.querySelectorAll("[data-q]").forEach((e) => e.onclick = () => {
    const [gd, v] = e.dataset.q.split(":"), cur = qtys[gd] ?? 10;
    qtys[gd] = v === "max" ? Math.max(1, previewBuy(world, g.market, s, g.cash, gd, 9999, FEE * feeMul(g, s.at)).qty) : v === "10" ? 10 : Math.max(1, cur + +v);
    render();
  });
  P.querySelectorAll("[data-b]").forEach((e) => e.onclick = () => { const [gd, q] = e.dataset.b.split(":"); act(() => doBuy(g, s, gd, +q)); });
  P.querySelectorAll("[data-s]").forEach((e) => e.onclick = () => { const [gd, v] = e.dataset.s.split(":"); act(() => doSell(g, s, gd, v === "all" ? s.cargo[gd] ?? 0 : +v)); });
  P.querySelectorAll("[data-captain-review]").forEach(b=>b.onclick=()=>{
    const c=captainRoster(g,s.at).find(x=>x.id===b.dataset.captainReview);if(!c)return;
    const el=$("title"),t=CT[lang],was=playing;playing=false;el.hidden=false;
    el.innerHTML=`<div class="box"><h2>${t.confirm}</h2><p>${t.fee}: ${c.fee} · ${c.wage} ${t.day} (${c.wage*7}/${lang==="es"?"semana":"week"})</p><p>${t.info}</p><p>${t.navigation}: +${c.navigation*4}% ${lang==="es"?"velocidad":"speed"}</p><button id="cap-confirm">${t.confirm}</button><button id="cap-cancel">${t.cancel}</button><p id="cap-msg"></p></div>`;
    el.querySelector("h2").textContent=t.confirm+": "+c.name+" → "+(T[lang].types[s.type]??s.type)+" "+s.id;
    $("cap-cancel").onclick=()=>{el.hidden=true;playing=was;render();};
    $("cap-confirm").onclick=()=>{const r=hireCaptain(g,s,c.id);if(!r.ok){$("cap-msg").textContent=t.failed;return;}el.hidden=true;playing=was;autosave();render();};
  });
  P.querySelector("[data-captain-dismiss]")?.addEventListener("click",()=>{
    const c=captainOf(s);if(!c)return;const el=$("title"),t=CT[lang],was=playing;playing=false;el.hidden=false;
    el.innerHTML=`<div class="box"><h2 id="cap-heading"></h2><p>${t.dismissInfo}</p><button id="cap-confirm">${t.dismissConfirm}</button><button id="cap-cancel">${t.cancel}</button><p id="cap-msg"></p></div>`;
    $("cap-heading").textContent=t.dismissConfirm+": "+c.name;
    $("cap-cancel").onclick=()=>{el.hidden=true;playing=was;render();};
    $("cap-confirm").onclick=()=>{if(s.captain?.id!==c.id){$("cap-msg").textContent=t.failed;return;}const r=dismissCaptain(g,s);if(!r.ok){$("cap-msg").textContent=t.failed;return;}el.hidden=true;playing=was;autosave();render();};
  });
  const rb = P.querySelector("#rumbtn"); if (rb) rb.onclick = () => act(() => buyRumor(g, P.querySelector("#rum").value, s.at));
  P.querySelectorAll("[data-chart]").forEach((e) => e.onclick = () => act(() => buyChart(g, e.dataset.chart, s.at)));
  const rrb = P.querySelector("#rrumbtn"); if (rrb) rrb.onclick = () => act(() => buyRouteRumor(g, s.at));
  P.querySelector("[data-local-store]")?.addEventListener("click",()=>{if($("v3d"))openCityPanel("store");else{tab="store";render();}});
  P.querySelector("[data-local-reports]")?.addEventListener("click",()=>showLedger("rep"));
  P.querySelectorAll("[data-3d]").forEach((e) => e.onclick = () => open3d(s));
  P.querySelectorAll("[data-pick]").forEach((e) => e.onclick = () => { target = e.dataset.pick; render(); });
  P.querySelectorAll("[data-go]").forEach((e) => e.onclick = () => sailToTarget());
  P.querySelectorAll("[data-tab]").forEach((e) => e.onclick = () => { tab = e.dataset.tab; bldAction = null; bldError = null; bldSelPlot = null; townSel = null; render(); const title=$("v3d")?.querySelector(".city-window-title"); if(title)title.textContent=e.textContent; });
  P.querySelectorAll("[data-bldact]").forEach((e) => e.onclick = () => {
    if (e.dataset.bldact.startsWith("sel|")) { bldSelPlot = e.dataset.bldact.slice(4); bldAction = null; bldError = null; if ($("v3d")) openCityPanel("plot"); else { tab = "plot"; render(); } return; }
    if (e.dataset.bldact === "office|buy") { act(() => buyOffice(g, s.at)); return; }
    bldAction = parseBldAct(e.dataset.bldact); bldError = null; render();
  });
  P.querySelector("[data-bldcancel]")?.addEventListener("click", () => { bldAction = null; bldError = null; render(); });
  P.querySelector("[data-bldconf]")?.addEventListener("click", () => { const a0 = bldAction; if (!a0) return;
    let r = null;
    act(() => {
      if (a0.kind === "buy") { const p = (Array.isArray(plotsCache[s.at]) ? plotsCache[s.at] : []).find((x) => x.id === a0.plotId); r = p ? buyPlot(g, s.at, p) : { ok: false, reason: "bad plot" }; }
      else r = startConstruction(g, s.at, a0.plotId, a0.type);
    });
    if (r && !r.ok) { bldError = r.reason ?? "error"; render(); return; } // keep the card armed and say why
    bldAction = null; bldError = null; render(); });
  if ($("rt-set")) $("rt-set").onclick = () => act(() => setRoute(g, s, s.at, $("rt-to").value, $("rt-out").value, $("rt-back").value));
  if ($("rt-cancel")) $("rt-cancel").onclick = () => act(() => clearRoute(s));
  if ($("rts-add")) { // advanced-route editor
    const d = routeDrafts[s.id], ids = world.cities.filter((c) => c.id !== s.at).map((c) => c.id);
    d.stops.forEach((st, i) => {
      $("rts-city-" + i).onchange = (e) => { st.city = e.target.value; };
      $("rts-bg-" + i).onchange = (e) => { st.buyGood = e.target.value; };
      $("rts-sg-" + i).onchange = (e) => { st.sellGood = e.target.value; };
      $("rts-bp-" + i).oninput = (e) => { st.buyMax = e.target.value; };
      $("rts-sp-" + i).oninput = (e) => { st.sellMin = e.target.value; };
      $("rts-del-" + i).onclick = () => act(() => { d.stops.splice(i, 1); });
    });
    $("rts-mincash").oninput = (e) => { d.minCash = e.target.value; };
    $("rts-add").onclick = () => act(() => { d.stops.push({ city: ids[0] ?? s.at, buyGood: "", buyMax: "", sellGood: "", sellMin: "" }); });
    $("rts-set2").onclick = () => act(() => {
      const num = (v) => (v === "" || v == null || !Number.isFinite(+v) ? null : Math.max(0, Math.floor(+v)));
      const stops = d.stops.filter((st) => st.city).map((st) => ({
        city: st.city,
        buy: st.buyGood ? [{ good: st.buyGood, ...(num(st.buyMax) != null ? { maxPrice: num(st.buyMax) } : {}) }] : [],
        sell: st.sellGood ? [{ good: st.sellGood, ...(num(st.sellMin) != null ? { minPrice: num(st.sellMin) } : {}) }] : [],
      }));
      if (setRouteAdv(g, s, stops, { minCash: num(d.minCash) ?? 0 }).ok) delete routeDrafts[s.id];
    });
  }
  P.querySelectorAll("[data-loan]").forEach((e) => e.onclick = () => act(() => borrow(g, s.at, +e.dataset.loan)));
  P.querySelectorAll("[data-repay]").forEach((e) => e.onclick = () => act(() => { const [id, v] = e.dataset.repay.split(":"); repay(g, +id, v === "all" ? 1e9 : +v); }));
  P.querySelectorAll("[data-wh]").forEach((e) => e.onclick = () => act(() => buyWarehouse(g, s.at)));
  P.querySelectorAll("[data-st]").forEach((e) => e.onclick = () => act(() => storeGoods(g, s, e.dataset.st, s.cargo[e.dataset.st] ?? 0)));
  P.querySelectorAll("[data-tk]").forEach((e) => e.onclick = () => act(() => takeGoods(g, s, e.dataset.tk, 9999)));
  P.querySelectorAll("[data-admclr]").forEach((e) => e.onclick = () => act(() => clearStewardRule(g, s.at, e.dataset.admclr)));
  P.querySelector("#adm-set")?.addEventListener("click", () => { const num = (id) => { const el = $(id); return el && el.value !== "" ? Number(el.value) : 0; };
    const r = setStewardRule(g, s.at, $("adm-good").value, { buyBelow: num("adm-buy"), buyTo: num("adm-to"), sellAbove: num("adm-sell"), sellKeep: num("adm-keep") }, warehouseCap(g, s.at));
    if (!r.ok) { $("adm-msg").textContent = t.admErr; return; } act(() => {}); });
  P.querySelector("#adm-resset")?.addEventListener("click", () => act(() => setStewardReserve(g, s.at, Number($("adm-res").value) || 0)));
  P.querySelectorAll("[data-order]").forEach((e) => e.onclick = () => act(() => orderShip(g, e.dataset.order, s.at)));
  P.querySelectorAll("[data-gunrepair]").forEach((e) => e.onclick = () => act(() => repairGuns(g, s)));
  P.querySelectorAll("[data-hire]").forEach((e) => e.onclick = () => act(() => hireCrew(g, s, Number(e.dataset.hire))));
  P.querySelectorAll("[data-dismiss]").forEach((e) => e.onclick = () => act(() => dismissCrew(g, s, Number(e.dataset.dismiss))));
  P.querySelectorAll("[data-cannon]").forEach((e) => e.onclick = () => act(() => buyCannon(g, s)));
  P.querySelectorAll("[data-repair]").forEach((e) => e.onclick = () => act(() => repairShip(g, s)));
  P.querySelectorAll("[data-sellship]").forEach((e) => e.onclick = () => act(() => { const r = sellShip(g, s); if (r.ok) sel = 0; }));
  P.querySelectorAll("[data-caravel]").forEach((e) => e.onclick = () => act(() => { const r = buyCaravel(g, s.at); if (r.ok) sel = g.ships.length - 1; }));
  P.querySelectorAll("[data-wait]").forEach((e) => e.onclick = () => act(() => advanceDay(g)));
  P.querySelectorAll("[data-arrive]").forEach((e) => e.onclick = () => act(() => waitUntilArrival(g, s)));
}

function sailToTarget() { if (!target) return; const to = target; act(() => doSail(g, ship(), to)); target = null; render(); }
function closeCityWindow() {
  const d=$("v3d"); if (!d) return;
  const w=d.querySelector(".city-window"); if(w){w.hidden=true;d.querySelector("[data-open-panel]")?.focus();}
}
function close3d() {
  const d=$("v3d"); if(!d)return;
  const p=$("panel"), home=$("panel-home"); if(p&&home)home.appendChild(p);
  d.remove();document.body.classList.remove("in-city-3d"); document.querySelector("[data-3d]")?.focus();
}
let bldSelPlot=null, townSel=null;
function openCityPanel(tb) {
  const d=$("v3d");if(!d)return;tab=tb;render();
  const w=d.querySelector(".city-window");w.hidden=false;
  d.querySelector(".city-window-title").textContent=({market:t.tabMarket,yard:t.tabYard,tavern:t.tabTavern,bank:t.tabBank,city:t.tabCity,buildings:t.bldBuild,route:t.tabRoute,house:premises(g,ship().at,lang).label,store:t.tabStore,plot:(()=>{const r=buildingsRows(g,ship().at).find((x)=>x.plotId===bldSelPlot);return r?buildingLabel(t,r):t.tabBuildings;})(),town:t.townTypes[townSel]??t.tabCity})[tb]||t.tabCity;
  d.querySelector("[data-close-panel]").focus();
}
function open3d(s0) {
  if($("v3d")||s0.voyage)return;
  const nd = world.nodes[s0.at], q = new URLSearchParams({ city: s0.at, pop: nd.pop ?? 8000, ships: g.ships.filter((x) => x.at === s0.at && !x.voyage).length || 1, wh: warehouseOf(g, s0.at) ? "1" : "0", tod: String(0.35 + progress * 0.4), hud: t.hud3d, names: JSON.stringify({ market: t.tabMarket, tavern: t.tabTavern, shipyard: t.tabYard, bank: t.tabBank, ...(warehouseOf(g, s0.at) ? { warehouse: t.tabStore } : {}) }), tnames: JSON.stringify(Object.fromEntries(portLayout(s0.at, nd.pop ?? 8000).houses.filter((h) => h.type !== "house").map((h) => ["town:" + h.type, t.townTypes[h.type] ?? h.type]))), bld: JSON.stringify(g.buildings?.[s0.at] ?? {}), tick: String(g.tick), labels: JSON.stringify(Object.fromEntries(buildingsRows(g, s0.at).map((r) => [r.plotId, buildingLabel(t, r)]))), pnames: JSON.stringify(Object.fromEntries(buildingsRows(g, s0.at).map((r) => [r.plotId, (r.type ? (t.bldTypes[r.type] ?? r.type) + (r.state === "construction" ? ` ${r.nextLevel}` : r.level ? ` ${r.level}` : "") : t.bldState.plot) + " · " + (r.state === "construction" ? t.bldReady.replace("{d}", r.readyDay).replace("{p}", Math.round(r.progress * 100)) : (t.bldState[r.state] ?? r.state))]))) });
  const d=document.createElement("div");d.id="v3d";
  d.innerHTML=`<iframe src="proto3d/index.html?${q}" title="${t.tabCity} 3D"></iframe><nav class="city-controls" aria-label="${t.tabCity}"><button data-open-panel>${t.tabMarket}</button><button data-city-tab="yard">${t.tabYard}</button><button data-city-tab="tavern">${t.tabTavern}</button><button data-city-tab="bank">${t.tabBank}</button><button data-city-tab="buildings">${t.bldBuild}</button><button data-city-tab="store">${t.tabStore}</button><button data-city-tab="house">${premises(g,s0.at,lang).label}</button><button data-city-ships>${lang==="es"?"Barcos":"Ships"}</button><button data-city-reports>${LT[lang].reports}</button><button data-city-menu>${lang==="es"?"Menú":"Menu"}</button><button data-map>${lang==="es"?"Volver al mapa":"Back to map"}</button></nav><section class="city-window pwin" role="dialog" aria-label="${t.tabCity}" hidden><div class="city-window-handle pwin-handle" tabindex="0" role="button" aria-label="${lang==="es"?"Mover ventana con las flechas":"Move window with arrow keys"}"><span class="city-window-title pwin-title"></span><button class="pwin-close" data-close-panel>${t.close} (Esc)</button></div><div class="city-panel-host pwin-body"></div></section>`;  document.body.appendChild(d);document.body.classList.add("in-city-3d"); d.querySelector(".city-panel-host").appendChild($("panel"));
  d.querySelector("[data-map]").onclick=close3d;
  d.querySelector("[data-city-ships]").onclick=()=>openCityPanel("route");
  d.querySelector("[data-city-reports]").onclick=()=>showLedger("rep");
  d.querySelector("[data-city-menu]").onclick=showMenu;
  d.querySelector("[data-close-panel]").onclick=closeCityWindow;
  d.querySelector("[data-open-panel]").onclick=()=>openCityPanel("market");
  d.querySelectorAll("[data-city-tab]").forEach(b=>b.onclick=()=>openCityPanel(b.dataset.cityTab));
  const handle=d.querySelector(".city-window-handle"),win=d.querySelector(".city-window");let drag=null;
  const move=(x,y)=>{const p=clampWindow(x,y,win.offsetWidth,win.offsetHeight,innerWidth,innerHeight-70);win.style.left=p.left+"px";win.style.top=p.top+"px";win.style.right="auto";};
  handle.onpointerdown=e=>{if(e.target.closest("button"))return;drag=[e.clientX-win.offsetLeft,e.clientY-win.offsetTop];handle.setPointerCapture(e.pointerId);};
  handle.onpointermove=e=>{if(drag)move(e.clientX-drag[0],e.clientY-drag[1]);};
  handle.onpointerup=handle.onpointercancel=()=>drag=null;
  handle.onkeydown=e=>{if(e.target!==handle)return;const keys={ArrowLeft:[-20,0],ArrowRight:[20,0],ArrowUp:[0,-20],ArrowDown:[0,20]};const v=keys[e.key];if(v){e.preventDefault();e.stopPropagation();move(win.offsetLeft+v[0],win.offsetTop+v[1]);}};
  d.querySelector("[data-open-panel]").focus();
}
addEventListener("message",e=>{
  const d=$("v3d");
  if(!d||e.origin!==location.origin||e.source!==d.querySelector("iframe").contentWindow)return;
  if(e.data?.kind==="plot"){if(bldSelPlot!==e.data.id){bldAction=null;bldError=null;}bldSelPlot=e.data.id;openCityPanel("plot");return;} // switching plots drops an armed action so confirm cannot hit the old plot
  if(e.data?.kind!=="building")return;
  if(String(e.data.id).startsWith("town:")){townSel=e.data.id.slice(5);openCityPanel("town");return;}
  const tb=tabForBuilding(e.data.id);if(tb)openCityPanel(tb);
});
function closeMenu() { document.getElementById("ctx")?.remove(); }
function openMenu(city, x, y) {
  closeMenu(); target = city; const s0 = ship(), items = cityMenu(world, s0, city), est = travelEstimate(world, s0, city);
  const d = document.createElement("div"); d.id = "ctx"; d.setAttribute("role", "menu"); d.style.cssText = `left:${Math.min(x, innerWidth - 230)}px;top:${Math.min(y, innerHeight - 90)}px`;
  d.innerHTML = items.map((it) => `<button role="menuitem" data-m="${it.id}" ${it.enabled ? "" : "disabled"}>${(it.id === "sail" ? t.ctxSail.replace("{d}", est.ok ? "≈ " + hoursOf(est.ticks) + " h" : "-") : t.ctxSelect).replace("{city}", cityName(city))}</button>`).join("");
  document.body.appendChild(d);
  d.querySelectorAll("button").forEach((b) => b.onclick = () => { closeMenu(); if (b.dataset.m === "sail") sailToTarget(); else render(); });
  render();
}
document.addEventListener("pointerdown", (e) => { if (!e.target.closest?.("#ctx")) closeMenu(); });
document.addEventListener("keydown", (e) => {
  if (e.target.closest?.("select,input,textarea") || e.ctrlKey || e.metaKey || e.altKey) return;
  if ($("title") && !$("title").hidden) return;
  if (e.key === "Escape" && $("v3d")) { e.preventDefault(); const w=$("v3d").querySelector(".city-window"); if(!w.hidden)closeCityWindow();else close3d();return; }
  if($("v3d"))return;
  if (e.key === "Escape") { closeMenu(); target = null; render(); }
  else if (e.key === "Enter" && target) { e.preventDefault(); sailToTarget(); }
  else if (e.key === " ") { e.preventDefault(); playing = !playing; render(); }
  else { const i = shipForKey(g, e.key); if (i !== null) { sel = i; target = null; render(); } }
});
$("play").onclick = () => { playing = !playing; render(); };
$("spd").onclick = () => { speed = speed === 1 ? 2 : speed === 2 ? 4 : 1; render(); };
$("new").onclick = () => showMenu();
function showLedger(kind) {
  const el = $("title"), wasPlaying = playing; playing = false;
  const body = () => kind === "rep" ? reportsHtml(g, lang, fmt, (k) => T[lang].goods[k] ?? k) + `<h3>${voyagesTitle(lang)}</h3>` + voyagesHtml(g, lang, fmt, cityName) + encountersHtml(g,lang) : inboxHtml(g, lang, fmt, cityName, (k) => T[lang].goods[k] ?? k);
  const draw = () => { el.innerHTML = `<div class="box wide">${body()}<p><button id="l-close">${LT[lang].close}</button></p></div>`; el.hidden = false;
    $("l-close").onclick = () => { el.hidden = true; playing = wasPlaying; autosave(); render(); };
    if ($("l-all")) $("l-all").onclick = () => { markAllRead(g); draw(); };
    el.querySelectorAll("[data-msg]").forEach((e) => e.onclick = () => { markRead(g, Number(e.dataset.msg)); draw(); }); };
  draw();
}
$("rep").onclick = () => showLedger("rep");
$("msg").onclick = () => showLedger("msg");
$("lang").onclick = () => { lang = lang === "es" ? "en" : "es"; localStorage.setItem("lang", lang); render(); };
function showMenu() {
  t = T[lang]; const el = $("title"), wasPlaying = playing; playing = false;
  el.innerHTML = `<div class="box"><h2>${t.paused}</h2><p><button id="m-res">${t.resume}</button></p><p><button id="m-save">${t.saveNow}</button> <span id="m-msg"></span></p>` +
    `<p>${t.lang2}: <button id="m-lang">${lang === "es" ? "EN" : "ES"}</button> ${t.speedDef}: <button id="m-spd">${speed}x</button></p><p><button id="m-quit">${t.quit}</button></p></div>`;
  el.hidden = false;
  const close = () => { el.hidden = true; playing = wasPlaying; render(); };
  $("m-res").onclick = close;
  $("m-save").onclick = () => { autosave(); $("m-msg").textContent = t.saved; };
  $("m-lang").onclick = () => { lang = lang === "es" ? "en" : "es"; localStorage.setItem("lang", lang); document.documentElement.lang = lang; showMenu(); };
  $("m-spd").onclick = () => { speed = speed === 1 ? 2 : speed === 2 ? 4 : 1; $("m-spd").textContent = speed + "x"; };
  $("m-quit").onclick = () => { autosave(); playing = false; close3d(); showTitle(); };
}
document.addEventListener("keydown", (e) => { if (e.defaultPrevented) return; if (e.key === "Escape") { const el = $("title"); if (el.hidden) showMenu(); else if ($("m-res")) $("m-res").click(); else if ($("l-close")) $("l-close").click(); else if($("cap-cancel"))$("cap-cancel").click(); } });
function showCreate(name) {
  t = T[lang]; const el = $("title"), pf = defaultProfile(name || t.defCo), swatch = (key) => PALETTE.map((c) => `<button class="sw ${pf.crest[key] === c ? "on" : ""}" data-k="${key}" data-v="${c}" style="background:${c}" aria-label="${c}"></button>`).join("");
  const opt = (list, cur, label, key) => list.map((v) => `<option value="${v}" ${v === cur ? "selected" : ""}>${label(v)}</option>`).join("");
  const draw = () => {
    el.innerHTML = `<div class="box wide"><h2>${t.create}</h2><div class="cols"><div>` +
      `<label>${t.company}<br><input id="p-co" maxlength="30"></label><label>${t.character}<br><input id="p-ch" maxlength="30"></label>` +
      `<div>${t.portrait}</div><div class="ports">${Array.from({ length: PORTRAITS }, (_, i) => `<button class="pt ${pf.portrait === i ? "on" : ""}" data-p="${i}">${portraitSvg(i, pf.crest.c1, 48)}</button>`).join("")}</div>` +
      `<label>${t.home}<br><select id="p-home">${opt(cityIds, pf.home, (id) => cityName(id))}</select></label>` +
      `<label>${t.difficulty}<br><select id="p-df">${opt(DIFFICULTY_IDS, pf.difficulty, (d) => t.diffName[d])}</select></label><small>${t.diffInfo}</small>` +
      `<label>${t.background}<br><select id="p-bg">${opt(Object.keys(BACKGROUNDS), pf.background, (b) => NAMES[lang][b])}</select></label><small>${t.bgInfo[pf.background]}</small></div>` +
      `<div><div>${t.crest}</div><div class="prev">${crestSvg(pf.crest, 96, "prev")}${portraitSvg(pf.portrait, pf.crest.c1, 96)}</div>` +
      `<label>${t.shield} <select id="p-sh">${opt(SHIELDS, pf.crest.shield, (v) => t.sh[v])}</select></label> <label>${t.division} <select id="p-dv">${opt(DIVISIONS, pf.crest.division, (v) => t.dv[v])}</select></label> <label>${t.charge} <select id="p-cg">${opt(CHARGES, pf.crest.charge, (v) => t.ch[v])}</select></label>` +
      `<div>${t.c1}</div><div>${swatch("c1")}</div><div>${t.c2}</div><div>${swatch("c2")}</div></div></div>` +
      `<p><button id="p-back">${t.back}</button> <button id="p-go">${t.start}</button></p></div>`;
    $("p-co").value = pf.company; $("p-ch").value = pf.character; // set as values, never parsed as HTML
    const read = () => { pf.company = $("p-co").value; pf.character = $("p-ch").value; };
    el.querySelectorAll(".pt").forEach((b) => b.onclick = () => { read(); pf.portrait = +b.dataset.p; draw(); });
    el.querySelectorAll(".sw").forEach((b) => b.onclick = () => { read(); pf.crest[b.dataset.k] = b.dataset.v; draw(); });
    for (const [id, set] of [["p-home", (v) => pf.home = v], ["p-bg", (v) => pf.background = v], ["p-df", (v) => pf.difficulty = v], ["p-sh", (v) => pf.crest.shield = v], ["p-dv", (v) => pf.crest.division = v], ["p-cg", (v) => pf.crest.charge = v]]) $(id).onchange = (e) => { read(); set(e.target.value); draw(); };
    $("p-back").onclick = () => showTitle();
    $("p-go").onclick = () => { read(); playing = false; progress = 0; tickAcc = 0; start(pf); el.hidden = true; if(!ship().voyage)open3d(ship()); };
  };
  draw();
}
function showTitle() {
  t = T[lang]; const saved = loadSaved(), el = $("title");
  el.innerHTML = `<div class="box"><h1>El Almojarife</h1><p>${t.tagline}</p>` +
    `<label>${t.company}<br><input id="co-in" maxlength="30" value="${t.defCo}"></label><br>` +
    `<button id="t-start">${t.start}</button> <button id="t-cont" ${saved ? "" : "disabled"} title="${saved ? "" : t.noSave}">${t.cont}</button> ` +
    `<button id="t-exp" ${saved ? "" : "disabled"}>${t.exportS}</button> <button id="t-imp">${t.importS}</button> <button id="t-lang">${lang === "es" ? "EN" : "ES"}</button>` +
    `<input type="file" id="t-file" accept="application/json,.json" hidden><div id="t-msg"></div></div>`;
  el.hidden = false;
  $("t-start").onclick = () => showCreate($("co-in").value);
  $("t-cont").onclick = () => { if (!saved) return; g = saved.g; company = saved.company; sel = 0; playing = false; progress = 0; tickAcc = 0; render(); el.hidden = true; if(!ship().voyage)open3d(ship()); };
  $("t-lang").onclick = () => { lang = lang === "es" ? "en" : "es"; localStorage.setItem("lang", lang); document.documentElement.lang = lang; showTitle(); };
  $("t-exp").onclick = () => { const blob = new Blob([localStorage.getItem(SAVE_KEY)], { type: "application/json" }), a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "almojarife-save.json"; a.click(); URL.revokeObjectURL(a.href); };
  $("t-imp").onclick = () => $("t-file").click();
  $("t-file").onchange = async (e) => {
    const f = e.target.files[0]; if(!f)return;
    let r; try { r = unpackGame(JSON.parse(await f.text()), world); } catch { $("t-msg").textContent = t.badSave; return; }
    g = r.g; company = r.company; sel = 0; playing = false; progress = 0; tickAcc = 0; autosave(); render(); el.hidden = true;
    try { if(!ship().voyage)open3d(ship()); } catch { close3d(); render(); } // A scene failure is not an invalid imported save.
  };
}
start(null, false); // background game behind the title screen; it never overwrites a save
showTitle();
requestAnimationFrame(frame);

// Keep keyboard actions within the encounter window, including when another key handler exists.
document.addEventListener('keydown',e=>{
 const modal=document.getElementById('sea-modal');if(!modal)return;
 e.stopImmediatePropagation();
 const buttons=[...modal.querySelectorAll('button')];
 if(e.key==='Tab'){e.preventDefault();const i=buttons.indexOf(document.activeElement);buttons[(i+(e.shiftKey?-1:1)+buttons.length)%buttons.length]?.focus();}
 else if(e.key==='Escape')e.preventDefault();
},true);
