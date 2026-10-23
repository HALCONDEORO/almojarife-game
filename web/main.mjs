import { enabled as ui2dEnabled, inbox2dHtml, hall2dHtml, reports2dHtml } from "../src/view/ui2d.mjs";
import { logHtml } from "../src/view/logview.mjs";
import { warehouseHeader2d, bankHeader2d, store2dWrap, store2dWindowClass } from "../src/view/ui2d_store.mjs";
import { enabled as city2dEnabled } from "../src/view/city2d.mjs";
import { voyageCardHtml } from "../src/view/voyagecard.mjs";
import { fleetHtml } from "../src/view/fleet.mjs";
import { dayDurationMs, nextTimeSpeed, arrivalNeedsDecision } from "../src/view/timepolicy.mjs";
import {HISTORICAL_MAPS_ENABLED,mapModeControls,historicalLayer,mapLabelPlacement} from "../src/view/historicalmap.mjs";
import { needsHtml } from "../src/view/needsview.mjs";
import {resolvePirates,dismissEncounterReport,claimPrize} from '../src/game/encounterdaily.mjs';
import {encountersHtml,encounterDialogHtml} from "../src/view/encounterview.mjs";
import {captainRoster,captainOf,hireCaptain,dismissCaptain} from "../src/game/captains.mjs";
import {CT,assignedCaptainHtml,tavernCaptainsHtml} from "../src/view/captainview.mjs";
import { shipWindowHtml } from "../src/view/shipwindow.mjs";
import { premises } from "../src/view/premises.mjs";
import { clampWindow } from "../src/view/floating.mjs";
import { createMenuGuard } from "../src/view/menuguard.mjs";
import { CANNON_PRICE, cannonsOf, maxCannons, gunCond, gunRepairCost, crewLimits, crewOf, speedFactor, HIRE_FEE, WEAPON_TYPES, weaponsOf, weaponCount, weaponPower, buyGear } from "../src/game/crew.mjs";
import { goodIcon } from "./icons.mjs";
import { lonjaEnabled, lonjaHtml } from "../src/view/lonjaview.mjs";
import { missionView, campaignEvent } from "../src/game/campaigns.mjs";
import { shipClickAction, portClickAction } from "../src/view/navflow.mjs";
import { MISSION as MISSION_HOOKS, DAILY_HOOKS } from "../src/game/game.mjs";
import { installMarqueDaily, PIRACY_DAILY_ENABLED } from "../src/game/marqueday.mjs";
import { headingDeg, shipSvg, wakeSvg, pushTrail } from "../src/view/ships.mjs";
import { newCamera, zoomAt, panBy, viewBox, markerScale, portHitRadius, labelFontSize, contentFraction, contentScale } from "../src/view/camera.mjs";
import { buildWorld } from "../src/sim/world.mjs";
import { shipPosition } from "../src/sim/position.mjs";
import { serialize as packGame, deserialize as unpackGame, cleanCompany } from "../src/game/gamesave.mjs";
import { DIFFICULTY_IDS } from "../src/game/difficulty.mjs";
import { defaultProfile, cleanProfile, startBonus, crestSvg, portraitSvg, flagSvg, PALETTE, DIVISIONS, CHARGES, SHIELDS, PORTRAITS, BACKGROUNDS, NAMES } from "../src/game/profile.mjs";
import { previewBuy, previewSell, FEE } from "../src/sim/trade.mjs";
import { stockLevel } from "../src/game/stocklevel.mjs";
import { citySceneSvg } from "../src/view/cityscene.mjs";
import { BACKUP_KEY, TMP_KEY, restoreRotate, saveFileName } from "./savefile.mjs";
import { loanCapFor } from "../src/game/rank.mjs";
import { houseHtml, RESPECT_NAMES } from "../src/view/rankview.mjs";
import { repOf, respectOf } from "../src/game/rank.mjs";
import { cityRows } from "../src/view/cityview.mjs";
import { tabForBuilding, portLayout } from "../src/view3d/port3d.mjs";
import { cityPlots } from "../src/view3d/cityplots.mjs";
import { whyText, plotViewState, buildingsRows, plotOffers, buildOffers, upgradeOffer, cityEffects, parseBldAct, buildingLabel } from "../src/view/buildingsview.mjs";
import { hallView } from "../src/view/townhallview.mjs";
import { buyPlot, startConstruction, buyOffice, hasOffice, OFFICE_PRICE, OFFICE_MIN_RESPECT, restartBuilding } from "../src/game/buildings.mjs";
import { quoteWalls, startWalls, wallsLevel, wallsKeptLevel, WALL_POP, WALL_MAX_LEVEL, WALL_UPKEEP, WALL_BUILD_DAYS } from "../src/game/walls.mjs";
import { voyagesHtml, voyagesTitle } from "../src/view/voyageview.mjs";
import { affordRatio } from "../src/sim/market.mjs";
import { reportsHtml, inboxHtml, chronicleHtml, LT, badge } from "../src/view/ledgerview.mjs";
import { unread, markAllRead, markRead } from "../src/game/ledger.mjs";
import { yardSceneSvg, shipIconSvg, orderProgress } from "../src/view/yardscene.mjs";
import { atmosphereSvg } from "../src/view/atmosphere.mjs";
import { seasonOf } from "../src/sim/market.mjs";
import { pendingEvent, resolveEvent } from "../src/game/events.mjs";
import { travelEstimate, cityMenu, shipForKey } from "../src/view/nav.mjs";
import { doGoTo } from "../src/game/game.mjs";
import { contactsOf, hireContact, fireContact, CONTACT_PRICE, CONTACT_MAX } from "../src/game/contacts.mjs";
import { TICKS_PER_HOUR, tickParts, calendarOf, LEGACY_START_YEAR } from "../src/sim/clock.mjs"; // TICKS_PER_DAY comes via game.mjs
import { LOAN_RATE, LOAN_MAX } from "../src/game/bank.mjs";
import { termsFor } from "../src/game/payrep.mjs";
import { buyChart, chartOffers, chartPrice, routeRumorTarget, buyRouteRumor, ROUTE_RUMOR_PRICE } from "../src/game/charts.mjs";
import { warehouseCap, setRoute, setRouteAdv, clearRoute, borrow, repay, feeMul, bankRoom, loansOwed, newGame, advanceDay, advanceTick, TICKS_PER_DAY, doBuy, doSell, doSail, waitUntilArrival, buyCaravel, orderShip, repairShip, repairGuns, buyCannon, buyWeapon, hireCrew, dismissCrew, repairPrice, sellShip, shipValue, buyRumor, RUMOR_PRICE, formConvoy, leaveConvoy, sailConvoy, convoyOf, isLive, buyWarehouse, storeGoods, takeGoods, warehouseOf, WAREHOUSE_PRICE, quote, priceHistory, trendPct, bestPorts, netWorth, cargoUsed, SHIP_TYPES, GOAL_CASH, DEADLINE_DAYS, CARAVEL_PRICE, isDiscovered } from "../src/game/game.mjs";
import { stewardOf, setStewardRule, clearStewardRule, setStewardReserve } from "../src/game/steward.mjs";
import { alertsOf, setPriceAlert, clearPriceAlert } from "../src/game/alerts.mjs";
import { offerOf, activeContracts, acceptContract, CONTRACT_MAX_ACTIVE } from "../src/game/contracts.mjs";

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
let mapMode = "geographic";
const historicalRealms = HISTORICAL_MAPS_ENABLED ? await fetch("../data/realms.json").then(r => r.ok ? r.json() : null).catch(() => null) : null;
const historicalLeagues = HISTORICAL_MAPS_ENABLED ? await fetch("../data/leagues.json").then(r=>r.ok?r.json():null).catch(()=>null) : null;
const T = {
  es: { play: "▶ Reanudar", pause: "⏸ Pausa", pauseArrive: "⏸ {ship} ha llegado a {city} · tiempo en pausa", speed: "Velocidad", day: "Día", cash: "Monedas", goal: "Meta", ships: "Barcos", new: "Nueva partida", cont: "Continuar", resume: "Seguir jugando", saveNow: "Guardar ahora", quit: "Salir al título", lang2: "Idioma", speedDef: "Velocidad", paused: "Juego en pausa", alTitle: "Alertas de precio", alInfo: "Marca un precio en este puerto y el buzón te avisa el día que el mercado lo cruce (avisos de una sola vez). Útil para saber cuándo volver.", alBelow: "baje de", alAbove: "suba de", alSet: "Crear alerta", alNone: "Sin alertas en este puerto.", alElse: "Tienes {n} alerta(s) en otros puertos.", alPrice: "precio", alErr: "Revisa la alerta: precio en números y un máximo de 8.", tabMarket: "Mercado", tabYard: "Astillero", tabStore: "Almacén", tabLonja: "Lonja", warehouse: "Almacén", yardInfo: "Encarga barcos (se entregan tras el plazo; sin límite de flota: el mantenimiento diario es el freno), repara el casco o vende.", order: "Encargar {type} ({p}, {d} días, carga {c})", repair: "Reparar casco {h}% ({p})", sellShip: "Vender barco ({p})", orders: "En construcción", ready: "{type} en {city}, listo el día {day} ({pct}%)", yardEmpty: "Grada libre", orderShort: "Encargar ({p})", yc: "Carga {c} · {d} días · mantenimiento {u}/día", buyWh: "Comprar almacén ({p})", whInfo: "Guarda bienes en este puerto (hasta 300 unidades).", whEmpty: "Vacío", store: "Guardar", take: "Sacar", admTitle: "Administrador del almacén", admInfo: "Órdenes permanentes: compra cuando el precio baje del tope (hasta el stock indicado) y vende cuando suba del suelo (guardando lo que digas). Actúa una vez al día y nunca gasta tu reserva. El tope y el suelo se comparan con el precio de mercado, sin tasa (la tasa del puerto se suma al comprar y se resta al vender).", admRule: "compra ≤ {b} hasta {n} · vende ≥ {v} guardando {k}", admNoRules: "Sin órdenes todavía.", admGood: "Bien", admBuy: "Precio tope compra (mercado, sin tasa)", admTo: "Stock objetivo", admSell: "Precio suelo venta (mercado, sin tasa)", admKeep: "Guardar", admSet: "Guardar orden", admClear: "Quitar", admReserve: "Reserva de monedas", admReserveSet: "Fijar reserva", admErr: "Revisa la orden: el tope de compra debe quedar por debajo del suelo de venta y el objetivo dentro de la capacidad.", start: "Empezar", company: "Nombre de tu casa mercantil", defCo: "Mi Casa Mercantil", tagline: "Comercio marítimo en la costa ibérica, siglos XV-XVI", menu: "Menú", saved: "Partida guardada", noSave: "No hay partida guardada", exportS: "Exportar", importS: "Importar", badSave: "Ese archivo no es una partida válida", restB: "Restaurar copia previa", restInfo: "Vuelve a la partida que había antes de la última importación", restDone: "Copia anterior restaurada.", errB: "No se pudo guardar la copia de seguridad: importación cancelada.", restConfirm: "¿Restaurar la copia previa? La partida actual pasará a ser la copia de seguridad (puedes deshacer restaurando otra vez).", expDone: "Copia descargada.", create: "Crea tu casa mercantil", character: "Tu nombre", portrait: "Retrato", crest: "Escudo", shield: "Forma", division: "División", charge: "Emblema", c1: "Color principal", c2: "Color secundario", home: "Puerto de origen", background: "Origen", back: "Atrás", sh: { heater: "Clásico", round: "Redondo" }, dv: { plain: "Liso", pale: "Partido", fess: "Cortado", chevron: "Cheurón", cross: "Cruz" }, ch: { star: "Estrella", tower: "Torre", ship: "Nave", anchor: "Ancla", sun: "Sol", wheat: "Trigo" }, bgInfo: { merchant: "+300 monedas", seafarer: "Barcos 15% más baratos de mantener", scholar: "+150 monedas y 5% menos de mantenimiento" },
    hint0: "Misión 1: gana {goal} monedas en {days} días. Compra barato donde un bien abunda, vende caro donde falta. Clic en un puerto para elegir destino y clic derecho para zarpar.",
    hintSea: "Tu barco está en el mar. Espera para llegar.", good: "Bien", price: "Precio", stock: "Stock", hold: "Bodega", holdValue: "Valor de la bodega aquí (aprox.)", cheap: "Barato: buen momento para comprar", dear: "Caro: buen momento para vender", lvl: { scarce: "Escaso", short: "Justo", normal: "Normal", plenty: "Abundante" }, lvlInfo: { scarce: "Escaso: buen momento para vender", short: "Justo: queda poco", normal: "Normal", plenty: "Abundante: buen momento para comprar" },
    seedLine: "Semilla de la partida: {s} (la misma semilla repite viento, piratas y sucesos)", difficulty: "Dificultad", diffName: { easy: "Fácil", normal: "Normal", hard: "Difícil" }, diffInfo: "Se elige al empezar la partida y no cambia después. Fácil: más monedas y menos gastos. Difícil: menos monedas y más gastos.",
    hud3d: "Arrastra para mirar, rueda para acercar, haz clic en un edificio para abrirlo.",
    openSea: "mar abierto", anchored: "al pairo", navNoSea: "Ahí no hay mar navegable.", navCannot: "Ese barco no puede cambiar de rumbo ahora.", freeNavLbl: "Navegación libre (experimental)", freeNavInfo: "Con la navegación libre mandas el barco con clic derecho a puertos y a puntos de las rutas navegables, y puedes fondear al pairo.", tabCity: "Ciudad", tabBuildings: "Edificios", bldInfo: "Tus parcelas y edificios en este puerto. Las casas suman vecinos (más demanda), el taller teje lana en paño al precio del mercado local y el almacén amplía tu depósito en 300 por nivel.", bldNone: "Aún no tienes parcelas en este puerto.", bldFree: "Parcelas libres", bldLoading: "Midiendo parcelas…", bldPlotsErr: "No se pudo medir el plano de parcelas de este puerto; inténtalo de nuevo al volver a entrar.", bldPlot: "Parcela", bldHType: "Edificio", bldHFx: "Efecto", bldHUp: "Mantenimiento", bldTypes: { house: "Casa", workshop: "Taller", warehouse: "Almacén", farm: "Granja", pasture: "Dehesa", sawmill: "Aserradero", mine: "Mina", oil_mill: "Almazara", vineyard: "Viñedo", saltworks: "Salina", brewery: "Cervecería", brickworks: "Ladrillería", esparto_field: "Espartizal", ranch: "Ganadería", dock: "Muelle", armory: "Armería", ironworks: "Fragua", fishery: "Pesca", soapworks: "Jabonería", pottery: "Alfarería", posito: "Pósito", hospital: "Hospital", alhondiga: "Alhóndiga", caminos: "Caminos", pozo: "Pozo", capilla: "Capilla" }, bldState: { plot: "solar", construction: "en obras", active: "activo", halted: "parado", fire: "incendio" }, bldReady: "listo el día {d} ({p}%)", bldUpkeep: "mantenimiento {u}/día", bldFxW: "{r} lotes/día · margen ahora {m}/lote · {n} producidos", bldFxH: "+{n} habitantes", bldFxS: "+{n} de depósito", bldFxD: "-{n}% de peaje para tus barcos", bldBuy: "Comprar ({p})", bldBuild: "Construir", bldUpgrade: "Mejorar a nivel {l} ({p})", bldMax: "nivel máximo", bldConfirm: "Confirmar", bldCancel: "Cancelar", bldCost: "Coste {c} (materiales {m} + mano de obra {f}) · {d} días · mantenimiento {u}/día", bldFree3d: "{n} solares libres en este puerto: haz clic en uno en la vista 3D para comprarlo", bldNeedOffice: "Para construir en este puerto necesitas una oficina comercial propia: cómprala en la pestaña Oficina.", bldPick2d: "Elige una parcela tuya para construir o mejorar, o compra un solar libre.", wallTitle: "Murallas", wallInfo: "Las murallas rodean el puerto: cada nivel mantenido suma {p} habitantes efectivos. El hospital y la capilla solo se levantan dentro de una muralla de nivel 1.", wallLevel: "nivel {l} de {m}", wallNone: "Sin muralla", wallUnkept: "Sin guardia por impago: el impulso de la ciudad está suspendido.", wallBuild: "Obras de muralla · nivel {l} ({p})", officeBuy: "Comprar oficina comercial ({p})", officeReq: "Requisitos para la oficina: {p} monedas y respeto mínimo Conocido en este puerto (ahora: {r}, {n} puntos). Se construye con dinero, respeto y oficina.", officeOwned: "Tienes una oficina comercial en este puerto.", bldFxP: "{r} lotes/día · {n} producidos", bldWhy: { "good not producible in this city": "esta ciudad no produce ese bien", "office required": "necesitas una oficina comercial en este puerto", "respect required": "necesitas más respeto en este puerto", "missing materials": "faltan materiales en el mercado de este puerto", "walls required": "necesita muralla de nivel 1 en este puerto", "already building": "ya hay obras en curso" }, bldPopLine: "Población efectiva: {p} habitantes (+{b} por tus casas)", bldJobsLine: "Empleo: {j} puestos · {f} habitantes libres en el puerto · dotación {s}%", chartTitle: "Cartas de navegación", chartInfo: "Una carta pone toda una costa en tu mapa, sin revelar precios.", chartNames: { luz: "Costa de la Luz", portugal: "Costa portuguesa", cantabrico: "Costa Cantábrica", levante: "Levante y Cataluña", baleares: "Baleares", rif: "El Rif", marruecos: "Marruecos atlántico", berberia: "Berbería oriental" }, chartBuy: "Carta: {c} ({p})", routeRumorBtn: "Pagar por un rumor de ruta ({p})", routeRumorInfo: "Revela el puerto desconocido más cercano, con datos imprecisos.", bldJobsShort: "Faltan manos: la producción del puerto rinde al {s}% hasta que haya más habitantes.", bldJobsW: "{j} trabajadores", bldWagesW: "salarios {w}/día", bldHaltedNote: "Parado: no había caja para pagar mantenimiento y salarios. No produce ni acumula gastos hasta que lo reactives.", bldFireNote: "Incendio: cerrado hasta que el fuego se dé por domado. No produce ni acumula gastos.", bldRestart: "Reactivar", bldHint: "Tus parcelas y edificios llevan su nombre en la vista 3D: haz clic en uno para abrirlo y construir o mejorar.", townTypes: { inn: "Posada", smithy: "Herrería", chapel: "Capilla" }, townDesc: { inn: "La posada del barrio del muelle: comida caliente, vino y camas para marineros de paso. Aún no ofrece servicios.", smithy: "El taller del herrero: aperos, clavos y reparaciones de metal para el puerto. Aún no ofrece servicios.", chapel: "La capilla del barrio alto, donde los vecinos se encomiendan antes de zarpar. Aún no ofrece servicios." }, townNone: "Este edificio aún no ofrece servicios.", cityInfo: "Los habitantes se reparten en clases. Cada clase compra cosas distintas y deja de comprar lo que le sale demasiado caro: los pobres viven de grano y pescado, los artesanos y mercaderes compran paño, vino y aceite, y los ricos piden seda, pimienta y azúcar.", ctTitle: "Encargo del concejo", ctInfo: "El concejo de este puerto pide una mercancía que le falta y paga una prima al que la traiga a tiempo. Vender esa mercancía aquí cuenta para el encargo.", ctOffer: "Piden {q} de {g} antes del día {d}. Prima al completar: {r}.", ctAccept: "Aceptar encargo", ctActive: "En curso: {g} {n}/{q}, entrega antes del día {d}.", ctNone: "El concejo no tiene encargos abiertos esta semana.", ctFull: "Ya llevas {n} encargos: cumple o deja caer uno antes de aceptar otro.", clsPoor: "Pobres", clsMiddle: "Artesanos y mercaderes", clsRich: "Ricos", cityBuys: "Compran sobre todo", cityOut: "Sin dinero para", cityCitizens: "habitantes", buy: "Comprar", sell: "Vender", sellAll: "Todo", seasons: { winter: "Invierno", spring: "Primavera", summer: "Verano", autumn: "Otoño" }, months: ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"], target: "Destino", sailGo: "Zarpar", ctxSail: "Zarpar a {city} ({d})", ctxSelect: "Elegir {city} como destino", hint: "Clic: elegir · Clic derecho o pulsación larga: menú · Arrastrar: mover · Rueda: zoom · Espacio: pausa · Intro: zarpar · 1-9: barco", daysLbl: "días", eta: "llegada: día {d}, {h}:00", view3d: "Vista 3D (experimental)", close: "Cerrar", bestLbl: "Mejor puerto según lo que sabes", noInfo: "No conoces los precios de otros puertos. Visita uno, ten almacén o pregunta en la taberna.", tabTavern: "Taberna", tabRoute: "Ruta", routeInfo: "Ruta automática: el barco compra en este puerto, vende en el destino y vuelve solo, una y otra vez. Usa las reglas normales de precios y gastos.", routeTo: "Destino", routeOut: "Comprar aquí", routeBack: "Comprar allí (vuelta)", routeNoBack: "Nada: vuelve vacío", routeSet: "Fijar ruta", routeCancel: "Cancelar ruta", routeNow: "Ruta activa: {a} ⇄ {b}, lleva {out}{back}. Viajes completados: {n}.", routeNone: "Este barco no tiene ruta.", routeBackTxt: " y trae {g}", routeAdv: "Ruta avanzada", routeAdvInfo: "Varias paradas en orden: en cada una el barco vende y luego compra lo que marques, y solo si el precio llega al límite. El freno de caja guarda siempre ese mínimo de monedas.", routeStop: "Parada {n}", routeBuyIf: "Comprar", routeSellIf: "Vender", routeAny: "—", routeBuyW: "compra", routeSellW: "vende", routeNoBuy: "sin compras", routeNoSell: "sin ventas", routeIfLe: "si ≤ {p}", routeIfGe: "si ≥ {p}", routeMinCash: "Freno de caja", routeAddStop: "Añadir parada", routeDelStop: "Quitar", routeSetAdv: "Fijar ruta avanzada", routeNow2: "Ruta activa ({n} paradas) · Vueltas: {l} · Freno de caja: {m}", tabBank: "Banco", crewTitle: "Tripulación", crewMin: "mínimo", crewOpt: "óptima", crewMax: "máxima", crewShort: "Faltan marineros: con menos del mínimo el barco no zarpa.", crewSpeed: "Velocidad: {s} % (menos que la óptima va más lento; completa, algo más rápido y con más defensa).", crewHire: "Contratar {n} ({p})", crewDismiss: "Despedir {n}", cannonBuy: "Comprar cañón ({p}) · {n}/{m}", gunRepair: "Reparar armamento {c}% ({p})", gunNone: "Sin cañones", weaponBuy: "{w} ({p})", weaponInfo: "Armamento {n}/{m}: cada pieza suma potencia frente a piratas, pesa mantenimiento diario y se desgasta en el mar.", weaponList: "{w}", weaponNames: { ballista: "Balista", catapult: "Catapulta", cannon: "Cañón", bombard: "Bombarda" }, weaponPowerLbl: "potencia {p}", tabHouse: "Casa", bankInfo: "El prestamista del puerto. Solo puedes pedir dinero si tienes un barco amarrado aquí. Interés: {r} % a la semana sobre lo que debes. Máximo: la mitad de tu patrimonio (tope {m}). Si un préstamo vence, el banco lo cobra de tu caja aunque la deje en negativo. El dinero prestado no cuenta para la meta.", bankRoom: "Puedes pedir hasta", bankOwed: "Debes al banco", bankNone: "No tienes préstamos.", bankTake: "Pedir {a}", bankLoan: "Préstamo del día {d}: debes {l}, vence el día {u}", bankRepay: "Devolver todo", bankRepay100: "Devolver 100", ctaTitle: "Informantes", ctaInfo: "Un informante local te manda los precios de su puerto cada 7 días durante un mes: imprecisos, y a veces mal informado. Donde tienes barco o almacén siempre mandan tus propios ojos.", ctaHire: "Contratar informante aquí ({p})", ctaActive: "{city}: informa cada 7 días (quedan {n} d)", ctaMax: "Máximo {n} informantes.", tavernInfo: "Entre jarras y humo, marineros y mercaderes cuentan lo que saben de otros puertos. Un trago y una moneda compran un rumor: viejo y con algo de exageración.", tavernNone: "Aquí ya lo sabes todo: tienes barco o almacén en todos los puertos.", rumorBtn: "Pagar una ronda por un rumor ({p})", rumorPick: "Puerto", rumorOk: "Apuntado: {city}, hoy. Lo que te cuentan es un rumor, impreciso.", rumorErrKnown: "Ese puerto ya lo ves con tus propios ojos: tienes barco o almacén allí.", rumorErrCash: "No te llega para la ronda ({price}).", ageNow: "hoy", ageDays: "hace {n} d", rumorTag: "rumor, impreciso", bestRow: "{city}: ≈ {r} monedas ({p} de ganancia), {d} días", trend7: "Cambio en 7 días", dealBuy: "Compras {q}: {c} (media {a}, precio pasa a {n})", dealSell: "Vendes {q}: {c} (media {a}, precio pasa a {n})", profit: "ganancia", loss: "pérdida", capCash: "limitado por tus monedas", capStock: "limitado por el stock", capRoom: "limitado por la bodega", qtyLbl: "Cantidad", sailTo: "Zarpar a", days: "días", wait: "Esperar 1 día", arrive: "Esperar llegada",    caravel: "Comprar carabela ({p})", at: "En", sea: "En el mar hacia", win: "¡Victoria! Alcanzaste la meta.", lose: "Se acabó el tiempo. Patrimonio final:", bankrupt: "Quiebra: la deuda pasó del límite. Patrimonio final:",    cap: "Carga", log: { warehouse: "Día {day}: compras un almacén en {city}", arrive: "Día {day}: el barco {ship} llega a {city}", buy: "Día {day}: compras {qty} {good} por {sum}", sell: "Día {day}: vendes {qty} {good} por {sum}", sail: "Día {day}: el barco {ship} zarpa a {city} (≈ {hours} h)", caravel: "Día {day}: compras una carabela en {city}", ordered: "Día {day}: encargas un barco en {city}", built: "Día {day}: tu barco {ship} está listo en {city}", discovered: "Día {day}: descubres el puerto de {city}", rumor: "Día {day}: pagas una ronda ({price}) en la taberna de {at}: te cuentan cómo anda el mercado de {city}. Rumor, impreciso." }, goods: { grain: "Trigo", fish: "Pescado", salt: "Sal", wool: "Lana", iron: "Hierro", ironware: "Herrajes", timber: "Madera", cloth: "Paño", olive_oil: "Aceite", wine: "Vino", silk: "Seda", sugar: "Azúcar", pepper: "Pimienta", beer: "Cerveza", bricks: "Ladrillos", esparto: "Esparto", meat: "Carne", pottery: "Cerámica", legumes: "Legumbres", kid_meat: "Cabrito", leather: "Cuero", soap: "Jabón" },    types: { barca: "Barca", cog: "Coca", caravel: "Carabela", nao: "Nao" }, tabHall: "Ayuntamiento", hallInfo: "El concejo gobierna el puerto: nombra al alcalde, vela por el muelle y fija los derechos que paga quien comercia.", hallMayor: "Alcalde", hallRegs: "Regidor", hallStand: "Trato del concejo contigo: {r} ({n} puntos de respeto). El respeto de un puerto crece con lo que vendes en él.", hallDerechos: "Derechos del concejo", hallFee: "Almojarifazgo: el {p} % de lo que compres y vendas en este mercado", hallToll: "Portazgo al atracar: la capacidad del barco entre {d} (tu descuento por respeto: {x} %)", hallNote: "El concejo se reúne en sala capitular y sus acuerdos se pregonan en la plaza.", hallCaja: "Caja del concejo: {c} monedas", hallLevies: "Nivel de tasas: sisa {s} · portazgo {p} (0 = lo normal; subidas y bajadas las vota el concejo)", hallNext: "Próximo cabildo: día {d}", cvIn: "Convoy: {name} · {n} barcos. Si zarpan juntos, la escolta suma el armamento de todo el grupo contra los piratas.", cvForm: "Formar convoy aquí ({n} barcos)", cvLeave: "Salir del convoy", cvSailNote: "Zarpan juntos al ritmo del más lento." },  en: { play: "▶ Resume", pause: "⏸ Pause", pauseArrive: "⏸ {ship} has arrived at {city} · time paused", speed: "Speed", day: "Day", cash: "Coins", goal: "Goal", ships: "Ships", new: "New game", cont: "Continue", resume: "Resume", saveNow: "Save now", quit: "Quit to title", lang2: "Language", speedDef: "Speed", paused: "Game paused", alTitle: "Price alerts", alInfo: "Mark a price in this port and a messenger lets you know the day the market crosses it (one-shot notices). Handy to know when to come back.", alBelow: "falls below", alAbove: "rises above", alSet: "Set alert", alNone: "No alerts in this port.", alElse: "You have {n} alert(s) in other ports.", alPrice: "price", alErr: "Check the alert: a numeric price and at most 8.", tabMarket: "Market", tabYard: "Shipyard", tabStore: "Warehouse", tabLonja: "Exchange", warehouse: "Stored", yardInfo: "Order ships (delivered after the build time; no fleet limit: daily upkeep is the brake), repair the hull or sell.", order: "Order {type} ({p}, {d} days, cargo {c})", repair: "Repair hull {h}% ({p})", sellShip: "Sell ship ({p})", orders: "Under construction", ready: "{type} at {city}, ready day {day} ({pct}%)", yardEmpty: "Slipway free", orderShort: "Order ({p})", yc: "Cargo {c} · {d} days · upkeep {u}/day", buyWh: "Buy warehouse ({p})", whInfo: "Store goods in this port (up to 300 units).", whEmpty: "Empty", store: "Store", take: "Take", admTitle: "Warehouse steward", admInfo: "Standing orders: buy when the price drops to your cap (up to the stock target) and sell when it rises to your floor (keeping what you say). Acts once a day and never spends your reserve. The cap and the floor compare against the market price, before the port fee (added when buying, subtracted when selling).", admRule: "buy ≤ {b} up to {n} · sell ≥ {v} keeping {k}", admNoRules: "No standing orders yet.", admGood: "Good", admBuy: "Max buy price (market, before fee)", admTo: "Stock target", admSell: "Min sell price (market, before fee)", admKeep: "Keep", admSet: "Save order", admClear: "Remove", admReserve: "Coin reserve", admReserveSet: "Set reserve", admErr: "Check the order: the buy cap must stay below the sell floor and the target within capacity.", start: "Start", company: "Name of your trading house", defCo: "My Trading House", tagline: "Sea trading on the Iberian coast, 15th-16th century", menu: "Menu", saved: "Game saved", noSave: "No saved game", exportS: "Export", importS: "Import", badSave: "That file is not a valid save", restB: "Restore previous backup", restInfo: "Goes back to the save kept before the last import", restDone: "Previous backup restored.", errB: "Could not keep the safety backup: import cancelled.", restConfirm: "Restore the previous backup? The current save becomes the safety copy (restore again to undo).", expDone: "Copy downloaded.", create: "Create your trading house", character: "Your name", portrait: "Portrait", crest: "Coat of arms", shield: "Shape", division: "Division", charge: "Emblem", c1: "Main colour", c2: "Second colour", home: "Home port", background: "Background", back: "Back", sh: { heater: "Classic", round: "Round" }, dv: { plain: "Plain", pale: "Split", fess: "Cut", chevron: "Chevron", cross: "Cross" }, ch: { star: "Star", tower: "Tower", ship: "Ship", anchor: "Anchor", sun: "Sun", wheat: "Wheat" }, bgInfo: { merchant: "+300 coins", seafarer: "Ships cost 15% less to keep", scholar: "+150 coins and 5% lower upkeep" },
    hint0: "Mission 1: earn {goal} coins in {days} days. Buy cheap where a good is plentiful, sell dear where it is scarce. Click a port to choose a destination, right-click to sail.",
    hintSea: "Your ship is at sea. Wait to arrive.", good: "Good", price: "Price", stock: "Stock", hold: "Hold", holdValue: "Hold value here (approx.)", cheap: "Cheap: good time to buy", dear: "Dear: good time to sell", lvl: { scarce: "Scarce", short: "Short", normal: "Normal", plenty: "Plenty" }, lvlInfo: { scarce: "Scarce: good time to sell", short: "Short: not much left", normal: "Normal", plenty: "Plenty: good time to buy" },
    seedLine: "Game seed: {s} (the same seed repeats wind, pirates and events)", difficulty: "Difficulty", diffName: { easy: "Easy", normal: "Normal", hard: "Hard" }, diffInfo: "Chosen when the game starts and fixed afterwards. Easy: more coins and lower costs. Hard: fewer coins and higher costs.",
    hud3d: "Drag to look around, wheel to zoom, click a building to open it.",
    openSea: "open sea", anchored: "holding position", navNoSea: "No navigable sea there.", navCannot: "That ship cannot change course now.", freeNavLbl: "Free navigation (experimental)", freeNavInfo: "With free navigation you send the ship with a right click to ports and points along the navigable routes, and can anchor offshore.", tabCity: "City", tabBuildings: "Buildings", bldInfo: "Your plots and buildings in this port. Houses add citizens (more demand), the workshop weaves wool into cloth at local market prices and the warehouse adds 300 storage per level.", bldNone: "You own no plots in this port yet.", bldFree: "Free plots", bldLoading: "Surveying plots…", bldPlotsErr: "Could not survey this port's plot plan; try reopening the tab.", bldPlot: "Plot", bldHType: "Building", bldHFx: "Effect", bldHUp: "Upkeep", bldTypes: { house: "House", workshop: "Workshop", warehouse: "Warehouse", farm: "Farm", pasture: "Pasture", sawmill: "Sawmill", mine: "Mine", oil_mill: "Oil mill", vineyard: "Vineyard", saltworks: "Saltworks", brewery: "Brewery", brickworks: "Brickworks", esparto_field: "Esparto field", ranch: "Ranch", dock: "Dock", armory: "Armory", ironworks: "Ironworks", fishery: "Fishery", soapworks: "Soapworks", pottery: "Pottery", posito: "Granary", hospital: "Hospital", alhondiga: "Corn exchange", caminos: "Streets", pozo: "Well", capilla: "Chapel" }, bldState: { plot: "empty plot", construction: "under construction", active: "active", halted: "halted", fire: "fire" }, bldReady: "ready day {d} ({p}%)", bldUpkeep: "upkeep {u}/day", bldFxW: "{r} batches/day · margin now {m}/batch · {n} produced", bldFxH: "+{n} citizens", bldFxS: "+{n} storage", bldFxD: "-{n}% toll for your ships", bldBuy: "Buy ({p})", bldBuild: "Build", bldUpgrade: "Upgrade to level {l} ({p})", bldMax: "max level", bldConfirm: "Confirm", bldCancel: "Cancel", bldCost: "Cost {c} (materials {m} + labour {f}) · {d} days · upkeep {u}/day", bldFree3d: "{n} free plots in this port: click one in the 3D view to buy it", bldNeedOffice: "To build in this port you need your own trading office: buy one in the Office tab.", bldPick2d: "Pick one of your plots to build or upgrade, or buy a free plot.", wallTitle: "Walls", wallInfo: "Walls ring the port: each kept level adds {p} effective citizens. The hospital and the chapel only stand inside level-1 walls.", wallLevel: "level {l} of {m}", wallNone: "No walls", wallUnkept: "Watch unpaid: the city growth bonus is suspended.", wallBuild: "Wall works · level {l} ({p})", officeBuy: "Buy a trading office ({p})", officeReq: "Office requirements: {p} coins and at least Known respect in this port (now: {r}, {n} points). Building takes money, respect and an office.", officeOwned: "You own a trading office in this port.", bldFxP: "{r} batches/day · {n} produced", bldWhy: { "good not producible in this city": "this city does not produce that good", "office required": "you need a trading office in this port", "respect required": "you need more respect in this port", "missing materials": "not enough building materials in this port's market", "walls required": "requires level-1 walls in this port", "already building": "works already under way" }, bldPopLine: "Effective population: {p} citizens (+{b} from your houses)", bldJobsLine: "Jobs: {j} positions · {f} citizens free to hire in this port · staffing {s}%", chartTitle: "Navigation charts", chartInfo: "A chart puts a whole coast on your map, without revealing prices.", chartNames: { luz: "Costa de la Luz", portugal: "Portuguese coast", cantabrico: "Cantabrian coast", levante: "Levante & Catalonia", baleares: "Balearics", rif: "The Rif", marruecos: "Atlantic Morocco", berberia: "Eastern Barbary" }, chartBuy: "Chart: {c} ({p})", routeRumorBtn: "Buy a route rumour ({p})", routeRumorInfo: "Reveals the nearest unknown port, with inexact figures.", bldJobsShort: "Short of hands: the port's production runs at {s}% until more citizens move in.", bldJobsW: "{j} workers", bldWagesW: "wages {w}/day", bldHaltedNote: "Halted: there was no cash for upkeep and wages. It produces nothing and accrues no costs until you restart it.", bldFireNote: "Fire: closed until the fire is declared out. It produces nothing and accrues no costs.", bldRestart: "Restart", bldHint: "Your plots and buildings carry their name in the 3D view: click one to open it and build or upgrade.", townTypes: { inn: "Inn", smithy: "Smithy", chapel: "Chapel" }, townDesc: { inn: "The quayside inn: hot food, wine and beds for passing sailors. No services yet.", smithy: "The smith's workshop: tools, nails and metal repairs for the port. No services yet.", chapel: "The upper-quarter chapel, where neighbours pray before sailing. No services yet." }, townNone: "This building offers no services yet.", cityInfo: "Citizens are split into classes. Each class buys different things and stops buying what is too dear for it: the poor live on grain and fish, craftsmen and merchants buy cloth, wine and oil, and the rich ask for silk, pepper and sugar.", ctTitle: "Town-council contract", ctInfo: "This port's council asks for a good it lacks and pays a premium to whoever brings it in time. Selling that good here counts towards the contract.", ctOffer: "They want {q} of {g} before day {d}. Premium on completion: {r}.", ctAccept: "Accept contract", ctActive: "Under way: {g} {n}/{q}, deliver before day {d}.", ctNone: "The council has no open contracts this week.", ctFull: "You already carry {n} contracts: finish or drop one before taking another.", clsPoor: "Poor", clsMiddle: "Craftsmen and merchants", clsRich: "Rich", cityBuys: "Mostly buy", cityOut: "Cannot afford", cityCitizens: "citizens", buy: "Buy", sell: "Sell", sellAll: "All", seasons: { winter: "Winter", spring: "Spring", summer: "Summer", autumn: "Autumn" }, months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], target: "Destination", sailGo: "Sail", ctxSail: "Sail to {city} ({d})", ctxSelect: "Choose {city} as destination", hint: "Click: choose · Right-click or long press: menu · Drag: pan · Wheel: zoom · Space: pause · Enter: sail · 1-9: ship", daysLbl: "days", eta: "arrives: day {d}, {h}:00", view3d: "3D view (experimental)", close: "Close", bestLbl: "Best port from what you know", noInfo: "You do not know other ports' prices. Visit one, own a warehouse or ask at the tavern.", tabTavern: "Tavern", tabRoute: "Route", routeInfo: "Automatic route: the ship buys at this port, sells at the destination and comes back by itself, again and again. Normal price and cost rules apply.", routeTo: "Destination", routeOut: "Buy here", routeBack: "Buy there (return)", routeNoBack: "Nothing: returns empty", routeSet: "Set route", routeCancel: "Cancel route", routeNow: "Active route: {a} ⇄ {b}, carries {out}{back}. Trips completed: {n}.", routeNone: "This ship has no route.", routeBackTxt: " and brings back {g}", routeAdv: "Advanced route", routeAdvInfo: "Several stops in order: at each one the ship sells then buys what you mark, only when the price meets the limit. The cash brake always keeps that many coins.", routeStop: "Stop {n}", routeBuyIf: "Buy", routeSellIf: "Sell", routeAny: "—", routeBuyW: "buys", routeSellW: "sells", routeNoBuy: "no buys", routeNoSell: "no sells", routeIfLe: "if ≤ {p}", routeIfGe: "if ≥ {p}", routeMinCash: "Cash brake", routeAddStop: "Add stop", routeDelStop: "Remove", routeSetAdv: "Set advanced route", routeNow2: "Active route ({n} stops) · Runs: {l} · Cash brake: {m}", tabBank: "Bank", crewTitle: "Crew", crewMin: "minimum", crewOpt: "optimal", crewMax: "maximum", crewShort: "Short of sailors: below the minimum the ship will not sail.", crewSpeed: "Speed: {s}% (below the optimal crew it is slower; a full crew is a bit faster with more defence).", crewHire: "Hire {n} ({p})", crewDismiss: "Dismiss {n}", cannonBuy: "Buy a cannon ({p}) · {n}/{m}", gunRepair: "Repair armament {c}% ({p})", gunNone: "No cannons", weaponBuy: "{w} ({p})", weaponInfo: "Armament {n}/{m}: each piece adds power against pirates, costs daily upkeep and wears at sea.", weaponList: "{w}", weaponNames: { ballista: "Ballista", catapult: "Catapult", cannon: "Cannon", bombard: "Bombard" }, weaponPowerLbl: "power {p}", tabHouse: "House", bankInfo: "The port moneylender. You can only borrow while one of your ships is docked here. Interest: {r}% a week on what you owe. Limit: half of your net worth (cap {m}). When a loan falls due the bank takes it from your cash even if that makes it negative. Borrowed money does not count towards the goal.", bankRoom: "You can borrow up to", bankOwed: "You owe the bank", bankNone: "You have no loans.", bankTake: "Borrow {a}", bankLoan: "Loan from day {d}: you owe {l}, due day {u}", bankRepay: "Pay back all", bankRepay100: "Pay back 100", ctaTitle: "Contacts", ctaInfo: "A local contact sends you his port's prices every 7 days for a month: inexact, and sometimes misinformed. Where you keep a ship or a warehouse, your own eyes always win.", ctaHire: "Hire a contact here ({p})", ctaActive: "{city}: reports every 7 days ({n} d left)", ctaMax: "At most {n} contacts.", tavernInfo: "Between mugs and smoke, sailors and merchants tell what they know of other ports. A drink and a coin buy a rumour: old, and a little exaggerated.", tavernNone: "You already know it all: you have a ship or warehouse in every port.", rumorBtn: "Buy a round for a rumour ({p})", rumorPick: "Port", rumorOk: "Noted: {city}, today. What you hear is a rumour, inexact.", rumorErrKnown: "You already see that port first-hand: you keep a ship or warehouse there.", rumorErrCash: "You cannot cover the round ({price}).", ageNow: "today", ageDays: "{n} d ago", rumorTag: "rumour, inexact", bestRow: "{city}: ≈ {r} coins ({p} profit), {d} days", trend7: "Change over 7 days", dealBuy: "Buy {q}: {c} (avg {a}, price moves to {n})", dealSell: "Sell {q}: {c} (avg {a}, price moves to {n})", profit: "profit", loss: "loss", capCash: "limited by your coins", capStock: "limited by stock", capRoom: "limited by hold space", qtyLbl: "Quantity", sailTo: "Sail to", days: "days", wait: "Wait 1 day", arrive: "Wait for arrival",    caravel: "Buy a caravel ({p})", at: "At", sea: "At sea to", win: "Victory! You reached the goal.", lose: "Time is up. Final net worth:", bankrupt: "Bankrupt: your debt passed the limit. Final net worth:",    cap: "Cargo", log: { warehouse: "Day {day}: you buy a warehouse in {city}", arrive: "Day {day}: ship {ship} arrives at {city}", buy: "Day {day}: you buy {qty} {good} for {sum}", sell: "Day {day}: you sell {qty} {good} for {sum}", sail: "Day {day}: ship {ship} sails to {city} (≈ {hours} h)", caravel: "Day {day}: you buy a caravel at {city}", ordered: "Day {day}: you order a ship in {city}", built: "Day {day}: your ship {ship} is ready in {city}", discovered: "Day {day}: you discover the port of {city}", rumor: "Day {day}: you buy a round ({price}) at the {at} tavern: you hear how the {city} market is doing. Rumour, inexact." }, goods: { grain: "Grain", fish: "Fish", salt: "Salt", wool: "Wool", iron: "Iron", ironware: "Ironware", timber: "Timber", cloth: "Cloth", olive_oil: "Olive oil", wine: "Wine", silk: "Silk", sugar: "Sugar", pepper: "Pepper", beer: "Beer", bricks: "Bricks", esparto: "Esparto", meat: "Meat", pottery: "Pottery", legumes: "Legumes", kid_meat: "Kid", leather: "Leather", soap: "Soap" }, tabHall: "Town hall", hallInfo: "The council governs the port: it names the mayor, watches over the quay and sets the duties every trader pays.", hallMayor: "Mayor", hallRegs: "Councillor", hallStand: "How the council regards you: {r} ({n} respect points). A port's respect grows with what you sell there.", hallDerechos: "Council duties", hallFee: "Almojarifazgo: {p} % of what you buy and sell in this market", hallToll: "Toll on docking: the ship's capacity divided by {d} (your respect discount: {x} %)", hallNote: "The council meets in its chapter house and proclaims its rulings in the square.", hallCaja: "Council chest: {c} coins", hallLevies: "Tax levels: sisa {s} · toll {p} (0 = normal; the council votes raises and cuts)", hallNext: "Next council meeting: day {d}", cvIn: "Convoy: {name} · {n} ships. Sailing together, the escort adds the whole group's armament against pirates.", cvForm: "Form convoy here ({n} ships)", cvLeave: "Leave convoy", cvSailNote: "They sail together at the pace of the slowest.",types: { barca: "Barque", cog: "Cog", caravel: "Caravel", nao: "Nao" } },};
let lang = localStorage.getItem("lang") || (navigator.language?.toLowerCase().startsWith("es") ? "es" : "en"), t = T[lang], g, sel = 0;
const $ = (id) => document.getElementById(id), fmt = (n) => Math.round(n).toLocaleString(lang);
const world = buildWorld(await (await fetch("../data/world.json")).json());
if (PIRACY_DAILY_ENABLED) { const [rl, pc] = await Promise.all([fetch("../data/realms.json").then(r => r.ok ? r.json() : null).catch(() => null), fetch("../data/peaces.json").then(r => r.ok ? r.json() : null).catch(() => null)]); if (rl && pc) installMarqueDaily(DAILY_HOOKS, rl, pc); }
const nodes = Object.values(world.nodes);
const lons = nodes.map((n) => n.lon), lats = nodes.map((n) => n.lat);
const [x0, x1, y0, y1] = [Math.min(...lons) - 1, Math.max(...lons) + 1, Math.min(...lats) - 1, Math.max(...lats) + 1];
const sc = 800 / (x1 - x0), VH = Math.round((y1 - y0) * sc * 1.25);
$("map").setAttribute("viewBox", `0 0 800 ${VH}`);
// Pan and zoom: the wheel zooms at the cursor, dragging pans, two fingers pinch, double click resets.
let target = null, lp = 0; // destination chosen on the map; long-press timer
const cam = newCamera(800, VH), mapEl = $("map");
const applyCam = () => { mapEl.setAttribute("viewBox", viewBox(cam).join(" ")); scaleMarkers(); if(HISTORICAL_MAPS_ENABLED && mapMode==="trade")render(); };
function scaleMarkers() {
  const k = markerScale(cam.zoom);
  mapEl.querySelectorAll("[data-mx]").forEach((el) => el.setAttribute("transform", `translate(${el.dataset.mx} ${el.dataset.my}) scale(${k})`));
  mapEl.querySelectorAll("#static line").forEach((el) => el.setAttribute("stroke-width", 1.5 * k));
  const fs = labelFontSize(cam.zoom).toFixed(2); // names stay readable from full chart to close zoom
  mapEl.querySelectorAll("g.city text").forEach((el) => el.setAttribute("font-size", fs));
}
// Cursor fractions of the VIEWED MAP CONTENT, not the raw viewport: with preserveAspectRatio
// meet the map is letterboxed inside a wider/shorter pane, and anchoring zoom to the viewport
// fractions drags the map away from the cursor.
const frac = (e) => contentFraction(mapEl.getBoundingClientRect(), viewBox(cam), e.clientX, e.clientY);
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
    if (pinch) { zoomAt(cam, d / pinch, ...contentFraction(r, viewBox(cam), (a[0] + b[0]) / 2, (a[1] + b[1]) / 2)); applyCam(); }
    pinch = d; moved = 99; return;
  }
  const dx = e.clientX - prev[0], dy = e.clientY - prev[1]; moved += Math.abs(dx) + Math.abs(dy);
  if (moved > 6) { const vb = viewBox(cam), s = contentScale(r, vb); panBy(cam, dx / (vb[2] * s), dy / (vb[3] * s)); applyCam(); ptrs.set(e.pointerId, [e.clientX, e.clientY]); }
});
const endPtr = (e) => { ptrs.delete(e.pointerId); pinch = 0; };
mapEl.addEventListener("pointerup", endPtr); mapEl.addEventListener("pointercancel", endPtr);
// a drag must not count as a click on a port
mapEl.addEventListener("click", (e) => { if (moved > 6) { e.stopPropagation(); e.preventDefault(); moved = 0; } }, true);
const X = (lon) => (lon - x0) * sc, Y = (lat) => (y1 - lat) * sc * 1.25;
// Click targets never straddle two ports: each marker's hit radius is capped at half the
// distance to its nearest neighbour (dense clusters like Ceuta/Tetuan stay unambiguous).
const cityPx = new Map(world.cities.map((c) => [c.id, { x: X(c.lon), y: Y(c.lat) }]));
const hitR = (id) => { const a = cityPx.get(id); let best = Infinity; for (const [oid, b] of cityPx) { if (oid !== id) best = Math.min(best, Math.hypot(a.x - b.x, a.y - b.y)); } return portHitRadius(best); };
const cityName = (id) => (typeof id === "string" && id.startsWith("pt:") ? t.openSea : (world.nodes[id]?.name ?? id)); // an unknown id shows as the id, it never throws

document.documentElement.lang = lang;
// Moving ships. The view only reads sim state; the sim advances on the daily tick below.
// `progress` is how much of the current day has elapsed (0 to 1). It is kept across pause,
// resume and speed changes, so ships never move backwards or jump.
let playing = false, speed = 1, progress = 0, lastFrame = 0, tickAcc = 0;
let automaticTime = localStorage.getItem('automatic-time') !== 'false';
let planningResume = false, manualPause = false;
// Why the clock last stopped on its own: {ship id, city id} of the arrival that paused it. Shown next to the
// play button so a freeze never reads as a bug; cleared on resume, on sailing and on new/load.
let pauseNote = null;
const toggleClock = () => { playing = !playing; manualPause = !playing; planningResume = false; if (playing) pauseNote = null; render(); };
const tickDurationMs = () => dayDurationMs(automaticTime) / TICKS_PER_DAY;
const hoursOf = (ticks) => Math.max(1, Math.round(ticks / TICKS_PER_HOUR)); // whole hours, for estimates and ETAs
const etaText = (tick) => { const p = tickParts(tick); return t.eta.replace("{d}", p.day).replace("{h}", String(p.hour).padStart(2, "0")); };
const etaPlain = (tick) => { const p = tickParts(tick); return `${lang === "es" ? "día" : "day"} ${p.day}, ${String(p.hour).padStart(2, "0")}:00`; };
const trails = {}; // view only: recent screen positions per ship, for the wake
const shipEls = new Map(); // keyed ship markers, preserved across frames: rebuilding them every rAF destroyed the pressed element before mouseup, so a real click on a ship icon never fired
function drawShips() {
  const layer = $("shipsLayer"); if (!layer) return;
  const all = [...g.ai.map((a) => ({ sh: a.ship, mine: false, id: "ai" + a.ship.id })), ...g.ships.map((sh, i) => ({ sh, mine: true, sel: i === sel, id: "p" + sh.id }))];
  // Wakes are decoration (pointer-events:none, nothing clickable): cheap to rebuild every frame.
  let wakesEl = layer.firstElementChild;
  if (!wakesEl || !wakesEl.classList.contains("wakes")) { wakesEl = document.createElementNS("http://www.w3.org/2000/svg", "g"); wakesEl.setAttribute("class", "wakes"); wakesEl.setAttribute("pointer-events", "none"); layer.prepend(wakesEl); }
  let wakes = "";
  const seen = new Set();
  for (const { sh, mine, sel: isSel, id } of all) {
    const f = tickAcc / tickDurationMs(); // fraction of the current tick, for smooth drawing
    const p = shipPosition(world, sh, f), pt = { x: X(p.lon), y: Y(p.lat) };
    let ang = 0;
    if (sh.voyage) {
      const q = shipPosition(world, sh, Math.min(1, f + 0.08)), qb = shipPosition(world, sh, Math.max(0, f - 0.08));
      ang = headingDeg({ x: X(qb.lon), y: Y(qb.lat) }, { x: X(q.lon), y: Y(q.lat) }) ?? 0;
      wakes += wakeSvg(pushTrail(trails, id, pt));
    } else delete trails[id];
    seen.add(id);
    let el = shipEls.get(id);
    if (el && el.parentNode !== layer) layer.appendChild(el); // render() rebuilt the map: re-attach the preserved element, keeping its identity and listeners (recreating it here would re-break real clicks)
    const hullBand = (sh.hull ?? 100) >= 70 ? 2 : (sh.hull ?? 100) >= 30 ? 1 : 0; // icon content bands: position and heading are attributes, not content
    const ckey = `${sh.type}|${mine}|${mine ? g.ships.indexOf(sh) : ""}|${sh.id}|${isSel}|${weaponCount(sh)}|${gunCond(sh) < 50 ? 0 : 1}|${hullBand}`;
    if (el && el._ckey !== ckey) { el.remove(); shipEls.delete(id); el = null; }
    if (!el) {
      el = document.createElementNS("http://www.w3.org/2000/svg", "g");
      el._ckey = ckey;
      if (mine) { el.setAttribute("data-ship", g.ships.indexOf(sh)); el.style.cursor = "pointer"; el.setAttribute("pointer-events", "all"); }
      el.innerHTML = `${shipSvg(sh.type, { mine, heading: 0, weapons: weaponCount(sh), maxGuns: maxCannons(sh), gun: gunCond(sh), hull: sh.hull ?? 100 })}${mine ? `<text x="9" y="-8" font-size="11" fill="${isSel ? "#a00" : "#300"}">${sh.id}</text>` : ""}`;
      if (mine) {
        el.onclick = () => {
          const a = shipClickAction(g, +el.dataset.ship); // docked: enter the city; at sea: select + floating card
          if (a.kind === "city") { sel = a.ship; open3d(g.ships[a.ship]); return; }
          if (a.kind === "card") { sel = a.ship; if (!shipWin) shipWin = { tab: "cargo" }; render(); }
        };
        // The icon is hittable now, so right-clicks must keep behaving as if it were not there:
        // docked (covering its port's dot) -> that port's own handler; at sea -> pass the click
        // through to whatever is underneath (another port's menu, open sea, freeNav, ...).
        el.oncontextmenu = (ev) => {
          const s2 = g.ships[+el.dataset.ship];
          if (s2 && !s2.voyage) {
            const ce = mapEl.querySelector(`g.city[data-c="${s2.at}"]`);
            if (ce && ce.oncontextmenu) { ce.oncontextmenu(ev); return; }
          }
          // At sea: if the icon covers a port, that port's own handler takes the
          // click exactly as if the port itself were right-clicked (direct call,
          // no synthetic event). Open sea keeps the pre-fix behavior untouched.
          // ALL markers are hidden for one hit test: hiding only this one and
          // restoring before dispatch let an overlapping owned ship (convoy)
          // re-find the first and recurse until stack overflow.
          const hidden = [];
          for (const m of shipEls.values()) if (m.style.pointerEvents !== "none") { m.style.pointerEvents = "none"; hidden.push(m); }
          const under = document.elementFromPoint(ev.clientX, ev.clientY);
          for (const m of hidden) m.style.pointerEvents = "";
          const ce = under && (under.closest?.("g.city") || null);
          if (ce && ce.oncontextmenu) ce.oncontextmenu(ev);
        };
      }
      shipEls.set(id, el);
      layer.appendChild(el);
    }
    el.dataset.mx = pt.x; el.dataset.my = pt.y;
    const rot = el.firstElementChild; if (rot) rot.setAttribute("transform", `rotate(${ang}) scale(1.7)`);
  }
  for (const [id, el] of shipEls) if (!seen.has(id)) { el.remove(); shipEls.delete(id); }
  wakesEl.innerHTML = wakes; scaleMarkers();
}
function stepTicks(n) {
  for (let i = 0; i < n; i++) {
    const dayBefore = g.day, before = g.ships.map((x) => !!x.voyage);
    advanceTick(g);
    if (g.day !== dayBefore) autosave();
    if (g.pending || g.encounterReport) playing = false;
    const arrivedAt = g.ships.findIndex((x, j) => before[j] && !x.voyage && arrivalNeedsDecision(x, automaticTime));
    if (arrivedAt >= 0) { playing = false; // pause when your ship arrives
      pauseNote = { ship: g.ships[arrivedAt].id, city: g.ships[arrivedAt].at };
      if (!g.pending && !g.encounterReport && !g.over) { sel = arrivedAt; open3d(g.ships[arrivedAt]); } } // docking opens the city, P3-style
    // Stop this frame at the decision tick, not after the rest of its queued ticks.
    if (g.pending || g.encounterReport || arrivedAt >= 0 || g.over) break;
  }
  render();
}
function frame(now) {
  const dt = lastFrame ? Math.min(250, now - lastFrame) : 0; lastFrame = now;
  if (playing && !g.over) {
    tickAcc += dt * speed;
    const n = Math.floor(tickAcc / tickDurationMs());
    if (n) { tickAcc -= n * tickDurationMs(); stepTicks(n); }
    progress = (g.tick % TICKS_PER_DAY + tickAcc / tickDurationMs()) / TICKS_PER_DAY; // view only: how much of the current day has elapsed
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
let fleetFilter="all",fleetSearch="";
let tab = "market"; const qtys = {}; let rumorNote = null; // transient tavern feedback for the round-for-a-rumour button // per-good quantity chosen in the market table
let shipWin = null; // open ship window { tab }: always shows the selected ship (docs/design/ship-window.md)
let bldAction = null, bldError = null; const plotsCache = {}; // armed Buildings-tab action; seeded layout plots per city (async)
function ensurePlots(city) { if (plotsCache[city] && plotsCache[city] !== "error") return; plotsCache[city] = "loading"; cityPlots(city, world.nodes[city]?.pop ?? 8000).then((l) => { plotsCache[city] = l.plots; if ((tab === "buildings" || tab === "plot") && ship().at === city) render(); }).catch(() => { plotsCache[city] = "error"; if ((tab === "buildings" || tab === "plot") && ship().at === city) render(); }); }
const SAVE_KEY = "almojarife.save.v1";
let company = "";
let inTitle = true; // boot lands on the title screen over a throwaway background game
function autosave() { try { if (inTitle) return; localStorage.setItem(SAVE_KEY, JSON.stringify(packGame(g, company))); } catch {} }
function loadSaved() { try { const raw = localStorage.getItem(SAVE_KEY); if (!raw) return null; return unpackGame(JSON.parse(raw), world); } catch { return null; } }
function getBackup() { try { return localStorage.getItem(BACKUP_KEY); } catch { return null; } }
function exportSave(raw = localStorage.getItem(SAVE_KEY), day = loadSaved()?.g?.day) { if (!raw) return; const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([raw], { type: "application/json" })); a.download = saveFileName(day); a.click(); URL.revokeObjectURL(a.href); }
const cityIds = world.cities.map((c) => c.id), cityIdSet = new Set(cityIds);
const routeDrafts = {}; // advanced-route editor drafts, per ship id
const newRouteDraft = (at, ids) => ({ minCash: "", stops: [{ city: ids[0] ?? at, buyGood: "", buyMax: "", sellGood: "", sellMin: "" }] });
function start(prof, save = true, opts = {}) {
  const p = cleanProfile({ ...prof, company: prof?.company || T[lang].defCo }, cityIds);
  g = newGame(world, p.home, { ...startBonus(p), ...opts, profile: p, events: true, seed: crypto.getRandomValues(new Uint32Array(1))[0] }); sel = 0; pauseNote = null; company = p.company; if (save) autosave(); render(); if (prof && !ship().voyage) open3d(ship()); // city opens for a real new game, not for the background boot game
}
function ship() { return g.ships[sel] ?? g.ships[0]; }
function act(fn) {
  const day = g.day, voyagesBefore = g.ships.map(s => !!s.voyage), routesBefore = g.ships.map(s => s.route);
  fn();
  const newOrder = g.ships.some((s, i) => (!voyagesBefore[i] && s.voyage) || (s.route && s.route !== routesBefore[i]));
  if (newOrder) pauseNote = null; // a fresh departure or route order always retires the arrival note
  if (newOrder && automaticTime) { manualPause = false; if ($("v3d")) planningResume = true; else playing = true; } // new orders resume the clock only when automatic time is enabled
  if (g.day !== day) { progress = 0; tickAcc = 0; } // wait buttons advance whole days
  autosave(); render();
}

function activeMissionLine() {
  const missions = missionView(g, lang, MISSION_HOOKS).filter((m) => !m.done && !m.failed);
  return missions.length ? "⚑ " + missions.map((m) => `${m.title}: ${m.stepLabel}${m.progress ? " (" + m.progress + ")" : ""}${m.daysLeft !== null ? " · " + (lang === "es" ? "quedan" : "left") + " " + m.daysLeft + " " + (lang === "es" ? "días" : "days") : ""}`).join(" · ") : null;
}
// City-view echo of the map hint's mission line: scene line while the panel is closed,
// a strip in the panel handle while it is open. Same state, no progression change.
function syncMissionEcho() {
  const d = $("v3d"); if (!d) return;
  const line = activeMissionLine(), open = !d.querySelector(".city-window")?.hidden;
  const cm = $("city-mission");
  if (cm) {
    cm.textContent = line ?? ""; cm.hidden = !line || open;
    // The 2D city has its own toolbar (nav) at the top of the iframe: dock the line 6px below
    // whatever height the toolbar actually occupies (it can wrap). proto3d has no nav: CSS top stays.
    let top = "";
    try { const fr = d.querySelector("iframe"), nav = fr?.contentDocument?.querySelector("nav");
      if (fr && nav) top = (fr.getBoundingClientRect().top + nav.getBoundingClientRect().bottom + 6 - d.getBoundingClientRect().top) + "px";
    } catch { /* cross-document read unavailable: keep stylesheet top */ }
    cm.style.top = top;
  }
  const hm = $("handle-mission"); if (hm) { hm.textContent = line ?? ""; hm.title = line ?? ""; hm.hidden = !line; }
}
function render() {
  $("voyage-card").innerHTML=voyageCardHtml(ship(),{lang,cityName,eta:s=>etaPlain(g.tick+s.voyage.ticksLeft),cargo:{used:cargoUsed(ship()),cap:SHIP_TYPES[ship().type].capacity}});
  $("fleet").querySelector('summary').textContent=`${lang==='en'?'Fleet':'Flota'} (${g.ships.length})`;
  $("fleet-body").innerHTML=fleetHtml(g,sel,{lang,filter:fleetFilter,search:fleetSearch,cityName,types:T[lang].types});
  $("fleet-filter").onchange=e=>{fleetFilter=e.target.value;render();};
  $("fleet-search").oninput=e=>{const pos=e.target.selectionStart;fleetSearch=e.target.value;render();const input=$("fleet-search");input.focus();input.setSelectionRange(pos,pos);};
  $("fleet-body").querySelectorAll('[data-fleet-ship]').forEach(button=>button.onclick=()=>{sel=Number(button.dataset.fleetShip);target=null;shipWin={tab:'data'};render();});
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
  const cal = calendarOf(g.day, g.startYear ?? LEGACY_START_YEAR), dayFrac = ((g.tick % TICKS_PER_DAY) + tickAcc / tickDurationMs()) / TICKS_PER_DAY; // exact even paused or just loaded
  const mins = Math.floor(dayFrac * 24 * 60), hh = String(Math.floor(mins / 60)).padStart(2, "0"), mm = String(mins % 60).padStart(2, "0");
  $("day").textContent = `${cal.day} ${t.months[cal.month]} ${cal.year}, ${hh}:${mm} · ${t.day} ${g.day}/${DEADLINE_DAYS} · ${t.seasons[seasonOf(g.day)]}`;
  $("todbar").firstElementChild.style.width = `${Math.round(dayFrac * 100)}%`; // the bar filling is the time-passing indicator
  $("cash").textContent = `${t.cash}: ${fmt(g.cash)}`; $("cash").style.color = g.cash < 0 ? "#b3261e" : "";
  $("rep").textContent = LT[lang].reports; $("msg").textContent = badge(LT[lang].messages, unread(g));
  $("goal").textContent = `${t.goal}: ${fmt(GOAL_CASH)}`;
  $("ships").textContent = `${t.ships}: ${g.ships.length}`;
  $("play").textContent = playing ? t.pause : t.play; $("spd").textContent = `${t.speed} ${speed}x`;
  { const pn = $("pausenote"); if (pn) { const ps = !playing && pauseNote && !g.pending && !g.encounterReport && !g.over ? g.ships.find((x) => x.id === pauseNote.ship) : null;
    pn.textContent = ps ? t.pauseArrive.replace("{ship}", ps.name ?? `${T[lang].types[ps.type] ?? ps.type} ${ps.id}`).replace("{city}", cityName(pauseNote.city)) : ""; } }
  $("new").textContent = t.menu; { const fl = lang === "es" ? "Pantalla completa" : "Fullscreen"; $("fs").title = fl; $("fs").setAttribute("aria-label", fl); } $("lang").textContent = lang === "es" ? "EN" : "ES";
  const missionLine = activeMissionLine();
  syncMissionEcho();
  $("hint").textContent = g.over === "win" ? t.win : g.over === "lose" ? `${g.overReason === "bankrupt" ? t.bankrupt : t.lose} ${fmt(netWorth(g))}` :
    s.voyage ? t.hintSea : (missionLine ?? t.hint0.replace("{goal}", fmt(GOAL_CASH)).replace("{days}", DEADLINE_DAYS));
  // map: historical views are player-facing information, never internal metrics.
  if (HISTORICAL_MAPS_ENABLED) {
    let tools = $("historical-map-tools");
    if (!tools) { tools = document.createElement("div"); tools.id = "historical-map-tools"; $("mapleft").append(tools); }
    const wasOpen = tools.querySelector("details")?.open ?? false;
    tools.innerHTML = mapModeControls({enabled:true,mode:mapMode,lang});
    tools.querySelector("details").open = wasOpen;
    $("map-mode").onchange = ev => { mapMode = ev.target.value; render(); };
  }
  let m = "";
  const hiddenPort = (id) => cityIdSet.has(id) && !isDiscovered(g, id); // fog of war: only discovered ports and their sea lanes show
  for (const [a, b] of world.lanes) { if (hiddenPort(a) || hiddenPort(b)) continue; m += `<line x1="${X(world.nodes[a].lon)}" y1="${Y(world.nodes[a].lat)}" x2="${X(world.nodes[b].lon)}" y2="${Y(world.nodes[b].lat)}" stroke="#7a9bb0" stroke-width="1.5" stroke-dasharray="4 3"/>`; }
  if (s.voyage?.path?.length) { // selected ship under way: its route in red with live ETA (P3 select-ship)
    const cur = shipPosition(world, s, tickAcc / tickDurationMs());
    const nd = (id) => s.voyage.pts?.[id] ?? world.nodes[id], ids = s.voyage.path.filter((id) => nd(id));
    const pts = [`${X(cur.lon)},${Y(cur.lat)}`, ...ids.map((id) => `${X(nd(id).lon)},${Y(nd(id).lat)}`)].join(" ");
    const last = ids.at(-1);
    if (last) m += `<polyline points="${pts}" fill="none" stroke="#c0392b" stroke-width="3" stroke-dasharray="7 5" vector-effect="non-scaling-stroke" pointer-events="none"/><text x="${X(nd(last).lon) + 10}" y="${Y(nd(last).lat) + 20}" font-size="13" fill="#7b241c" font-weight="bold" pointer-events="none" class="eta">${cityName(s.voyage.to)} · ${s.voyage.anchored ? t.anchored : etaText(g.tick + s.voyage.ticksLeft)}</text>`;
  }
  const est = target && !s.voyage ? travelEstimate(world, s, target) : null;
  if (est?.ok) {
    const pts = est.path.map((id) => `${X(world.nodes[id].lon)},${Y(world.nodes[id].lat)}`).join(" "), last = world.nodes[target];
    m += `<polyline points="${pts}" fill="none" stroke="#c0392b" stroke-width="3" stroke-dasharray="7 5" vector-effect="non-scaling-stroke" pointer-events="none"/><text x="${X(last.lon) + 10}" y="${Y(last.lat) + 20}" font-size="13" fill="#7b241c" font-weight="bold" pointer-events="none" class="eta">≈ ${hoursOf(est.ticks)} h</text>`;
  }
  for (const c of world.cities) {
    if (!isDiscovered(g, c.id)) continue; // fog of war
    const e = !s.voyage ? travelEstimate(world, s, c.id) : null, tip = c.name + (e?.ok ? ` - ≈ ${hoursOf(e.ticks)} h, ${e.km} km` : "");
    const label = HISTORICAL_MAPS_ENABLED ? mapLabelPlacement(c.id) : {x:10,y:4,anchor:"start"};
    m += `<g class="city" data-c="${c.id}" data-mx="${X(c.lon)}" data-my="${Y(c.lat)}"><title>${tip}</title><circle cx="0" cy="0" r="${hitR(c.id)}" fill="none" pointer-events="all"/><circle cx="0" cy="0" r="${c.id === target ? 10 : 7}" fill="${c.id === s.at ? "#2a7" : "#7a3b1c"}" stroke="${c.id === target ? "#c0392b" : "none"}" stroke-width="3" pointer-events="none"/>${HISTORICAL_MAPS_ENABLED ? `<path d="M0 0 L${label.x} ${label.y-4}" fill="none" stroke="#654d31" stroke-width=".7" pointer-events="none"/>` : ""}<text x="${label.x}" y="${label.y}" text-anchor="${label.anchor}" font-size="14" style="cursor:pointer">${c.name}</text></g>`;
  }
  const historical = historicalLayer({mode:mapMode,enabled:HISTORICAL_MAPS_ENABLED,ports:world.cities.filter(c=>isDiscovered(g,c.id)),year:cal.year,data:historicalRealms,leagues:historicalLeagues,x:X,y:Y,lang,goodName:id=>t.goods[id]??id,bounds:{width:800,height:VH},zoom:cam.zoom});
  if (HISTORICAL_MAPS_ENABLED) {
    let key = $("historical-map-key");
    if (!key) { key=document.createElement("div");key.id="historical-map-key";key.style.cssText="font-size:14px;padding:6px;line-height:1.5";$("mapleft").append(key); }
    key.innerHTML=historical.legend;
  }
  m += historical.svg;
  { // rebuild the map around the ships layer instead of replacing it: removing the layer mid-gesture cancels the browser's click dispatch on ship icons
    const map = $("map"), shipsKeep = $("shipsLayer");
    for (const ch of [...map.childNodes]) if (ch !== shipsKeep) ch.remove();
    map.insertAdjacentHTML("afterbegin", `<image href="../assets/map/background.webp" x="0" y="0" width="800" height="${VH}" preserveAspectRatio="none" pointer-events="none"/><g id="static">${m}</g>${atmosphereSvg(800, VH, g.day, !matchMedia("(prefers-reduced-motion: reduce)").matches)}`);
    if (!shipsKeep) map.insertAdjacentHTML("beforeend", `<g id="shipsLayer" pointer-events="none"></g>`);
  }
  drawShips(); scaleMarkers();
  $("map").querySelectorAll("g.city").forEach((el) => {
    el.onclick = () => {
      const a = portClickAction(g, el.dataset.c); // own ship docked there -> enter the city; else destination
      if (a.kind === "city") { sel = a.ship; closeMenu(); open3d(g.ships[a.ship]); return; }
      target = a.city; closeMenu(); render();
    };
    el.oncontextmenu = (ev) => { ev.preventDefault(); openMenu(el.dataset.c, ev.clientX, ev.clientY); };
    el.onpointerdown = (ev) => { if (ev.pointerType === "touch") { const x = ev.clientX, y = ev.clientY; lp = setTimeout(() => { if (moved < 6) { openMenu(el.dataset.c, x, y); moved = 99; } }, 550); } };
    el.onpointerup = el.onpointerleave = () => clearTimeout(lp);
  });
  $("log").innerHTML = logHtml(g.log,t,lang,cityName);
  // panel: in navigation mode the map stands alone (P3); the panel only pops up for a pending
  // event. In the city view it carries the port services inside the city window.
  let h = "";
  const pe = pendingEvent(g), inCity = !!document.getElementById("v3d");
  if(inCity&&city2dEnabled(location.search))$("v3d").querySelector("iframe").contentWindow.postMessage({kind:"city2d-state",walls:wallsLevel(g,s.at),city:s.at,buildings:g.buildings?.[s.at]??{},tick:g.tick,labels:Object.fromEntries(buildingsRows(g,s.at).map(r=>[r.plotId,buildingLabel(t,r)]))},location.origin);
  document.body.classList.toggle("has-event", !!pe && !inCity);
  if (pe) { playing = false; h += `<div class="event"><b>${pe.title[lang]}</b><p>${pe.text[lang]}</p>` + pe.choices.map((c) => `<button data-ev="${c.id}">${c.label[lang]}</button>`).join(" ") + `</div>`; }
  if (inCity || pe) {
  h += g.ships.map((sh, i) => `<button data-sel="${i}" ${i === sel ? "disabled" : ""}>${t.types[sh.type]} ${sh.id}</button>`).join("");
  h += ` <b>${t.types[s.type]} ${s.id}</b>: ${s.voyage ? `${t.sea} ${cityName(s.voyage.to)} (${s.voyage.anchored ? t.anchored : etaText(g.tick + s.voyage.ticksLeft)})` : `${t.at} ${cityName(s.at)}`} - ${t.cap} ${cargoUsed(s)}/${SHIP_TYPES[s.type].capacity}<br>`;
  h += assignedCaptainHtml(s,lang);
  if (!s.voyage && !g.over) {
    const hv = Object.keys(s.cargo).reduce((a, gd) => a + (s.cargo[gd] ?? 0) * quote(g, s.at, gd), 0);
    h += `<div title="${t.holdValue}">${t.holdValue}: ≈ ${fmt(Math.round(hv))}</div>`;
    const nd = world.nodes[s.at];
    h += `<div class="scenebox">${citySceneSvg({ id: s.at, pop: nd.pop ?? 8000, warehouse: !!warehouseOf(g, s.at), shipyard: true, ships: g.ships.filter((x) => x.at === s.at && !x.voyage).length, day: g.day, tod: 0.35 + progress * 0.4 })}</div>`;
    const bp = bestPorts(g, s).slice(0, 3);
    if (bp.length) h += `<div class="best"><b>${t.bestLbl}</b>` + bp.map((r) => `<div><button data-pick="${r.city}">${t.target}</button> ${t.bestRow.replace("{city}", cityName(r.city)).replace("{r}", fmt(r.revenue)).replace("{p}", (r.profit >= 0 ? "+" : "") + fmt(r.profit)).replace("{d}", r.days)} <small>(${r.age === 0 ? t.ageNow : t.ageDays.replace("{n}", r.age)}${r.exact ? "" : ", " + t.rumorTag})</small></div>`).join("") + `</div>`;
    if (!bp.length && Object.keys(s.cargo).length) h += `<div class="best"><i>${t.noInfo}</i></div>`;
    const wh = warehouseOf(g, s.at);
    h += `<div class="tabs">` + [["market", t.tabMarket], ["city", t.tabCity], ["hall", t.tabHall], ["buildings", t.bldBuild], ["yard", t.tabYard], ["tavern", t.tabTavern], ["route", t.tabRoute], ["bank", t.tabBank], ["house", premises(g,s.at,lang).label], ["store", t.tabStore], ...(lonjaEnabled(location.search) ? [["lonja", t.tabLonja]] : [])].map(([k, l]) => `<button data-tab="${k}" ${tab === k ? "disabled" : ""}>${l}</button>`).join("") + `</div>`;    const bldCard = () => { // armed buy/build/upgrade action: quote card with confirm/cancel
      if (!bldAction) return "";
      const layA = plotsCache[s.at];
      let card = "", canPay = false;
      if (bldAction.kind === "walls") { const o = quoteWalls(g, s.at); if (o.ok) { card = `<b>${t.wallTitle} · ${t.wallLevel.replace("{l}", o.level).replace("{m}", WALL_MAX_LEVEL)}</b><br><small>${t.bldCost.replace("{c}", fmt(o.cost)).replace("{m}", fmt(o.materials)).replace("{f}", fmt(o.fee)).replace("{d}", Math.round(o.ticks / TICKS_PER_DAY)).replace("{u}", o.level * WALL_UPKEEP)}</small>`; canPay = g.cash >= o.cost; } else { card = `<b>${t.wallTitle}</b><br><small style="color:#a11">${o.reason === "max level" ? t.bldMax : whyText(t, o.reason)}</small>`; } }
      else if (bldAction.kind === "buy") { const o = plotOffers(world, g, s.at, Array.isArray(layA) ? layA : []).find((x) => x.id === bldAction.plotId); if (o) { card = `<b>${t.bldBuy.replace("{p}", fmt(o.price))}</b> ${o.id} <small>${t.bldTypes[o.type] ?? o.type} · ${o.w}×${o.d}</small>`; canPay = g.cash >= o.price; } }
      else if (bldAction.kind === "build") { const o = buildOffers(g, s.at, bldAction.plotId).find((x) => x.type === bldAction.type); if (o?.ok) { card = `<b>${t.bldTypes[bldAction.type]}</b> ${bldAction.plotId}<br><small>${t.bldCost.replace("{c}", fmt(o.cost)).replace("{m}", fmt(o.materials)).replace("{f}", fmt(o.fee)).replace("{d}", o.days).replace("{u}", o.upkeep)}</small>`; canPay = o.affordable; } else if (o) { card = `<b>${t.bldTypes[bldAction.type]}</b> ${bldAction.plotId}<br><small style="color:#a11">${whyText(t, o.reason)}</small>`; } }
      else if (bldAction.kind === "upgrade") { const o = upgradeOffer(g, s.at, bldAction.plotId); if (o?.ok) { card = `<b>${t.bldTypes[o.type]}</b> ${bldAction.plotId}<br><small>${t.bldCost.replace("{c}", fmt(o.cost)).replace("{m}", fmt(o.materials)).replace("{f}", fmt(o.fee)).replace("{d}", o.days).replace("{u}", o.upkeep)}</small>`; canPay = o.affordable; } }
      return card ? `<div class="card">${card}<br><button data-bldconf="1" ${canPay ? "" : "disabled"}>${t.bldConfirm}</button> <button data-bldcancel="1">${t.bldCancel}</button>${canPay ? "" : ` <small>${t.capCash}</small>`}${bldError ? ` <small style="color:#a11">${bldError}</small>` : ""}</div>` : "";
    };
    const bldFx = (r) => { // one line: what this building does or when it is ready
      if (r.state === "construction") return `${t.bldState.construction} ${r.nextLevel} · ${t.bldReady.replace("{d}", r.readyDay).replace("{p}", Math.round(r.progress * 100))}`;
      if (r.halted) return r.fire ? t.bldState.fire : t.bldState.halted; // no running stats while the workers are gone (or the fire burns)
      if (r.state === "active") {
        if (r.type === "workshop") return t.bldFxW.replace("{r}", r.rate).replace("{m}", r.margin === null ? "—" : fmt(r.margin)).replace("{n}", fmt(r.produced));
        if (r.rate !== undefined) return t.bldFxP.replace("{r}", r.rate).replace("{n}", fmt(r.produced)); // primary producers: rate and units, no margin
        if (r.type === "house") return t.bldFxH.replace("{n}", fmt(r.popBonus));
        if (r.type === "warehouse") return t.bldFxS.replace("{n}", fmt(r.capBonus));
        if (r.type === "dock") return t.bldFxD.replace("{n}", r.tollCut);
      }
      return "-";
    };
    const ui2dMark = h.length; // start of the tab content (ui2d wraps it below)
    if (tab === "market") {
      const market2d=ui2dEnabled(location.search);
      if(market2d)h+=`<div class="ui2d-market-intro"><h3>${t.tabMarket} · ${cityName(s.at)}</h3><p>${t.cash}: <b>${fmt(g.cash)}</b> · ${t.hold}: <b>${cargoUsed(s)}/${SHIP_TYPES[s.type].capacity}</b></p></div>`;
      h += `<table${market2d?' class="ui2d-market"':""}><thead><tr><th>${t.good}</th><th>${t.price}</th><th>${t.stock}</th><th>${t.hold}</th><th></th></tr></thead>`;
      for (const gd of Object.keys(g.world.goods)) {
        const have = s.cargo[gd] ?? 0, stored = wh?.goods?.[gd] ?? 0, q = Math.max(1, Math.min(qtys[gd] ?? 10, 999)), pb = previewBuy(g.world, g.market, s, g.cash, gd, q, FEE * feeMul(g, s.at)), ps = previewSell(g.world, g.market, s, gd, q, FEE * feeMul(g, s.at));
        const p = quote(g, s.at, gd), base = g.world.goods[gd].base, col = p < base * 0.9 ? "#161" : p > base * 1.2 ? "#a11" : "inherit", tag = p < base * 0.9 ? "▼" : p > base * 1.2 ? "▲" : "";
        h += `<tbody><tr><td>${goodIcon(gd)}${t.goods[gd]}</td><td data-label="${t.price}" style="color:${col}" title="${tag === "" ? "" : tag === "▼" ? t.cheap : t.dear}">${spark(priceHistory(g, s.at, gd), col)}${tag} ${p}${(() => { const tp = trendPct(g, s.at, gd); return tp === null || tp === 0 ? "" : ` <small class="tr" title="${t.trend7}">${tp > 0 ? "+" : ""}${tp}%</small>`; })()}</td><td data-label="${t.stock}">${g.market[s.at][gd].stock} ${(() => { const lv = stockLevel(g.market[s.at][gd]); const cl = { scarce: "#b3261e", short: "#b26a00", normal: "#6b6355", plenty: "#1e7a34" }[lv]; return `<small style="color:${cl}" title="${t.lvlInfo[lv]}">${t.lvl[lv]}</small>`; })()}</td><td data-label="${t.hold}">${have}${stored ? ` <small title="${t.warehouse}">+${stored}</small>` : ""}</td>` +
          `<td class="qty" data-label="${t.qtyLbl}"><button data-q="${gd}:-1" aria-label="-1">−</button><b>${q}</b><button data-q="${gd}:1" aria-label="+1">+</button><button data-q="${gd}:10">10</button><button data-q="${gd}:max">Max</button></td></tr>` +
          `<tr class="deal"><td colspan="5"><button data-b="${gd}:${q}" ${pb.qty ? "" : "disabled"}>${t.buy} ${q}</button> <button data-s="${gd}:${q}" ${ps.qty ? "" : "disabled"}>${t.sell} ${q}</button> <button data-s="${gd}:all" ${have ? "" : "disabled"}>${t.sell} ${t.sellAll}</button> <br><small>${pb.qty ? t.dealBuy.replace("{q}", pb.qty).replace("{c}", fmt(pb.cost)).replace("{a}", pb.avg).replace("{n}", pb.next) + (pb.limit ? " - " + t[pb.limit === "cash" ? "capCash" : pb.limit === "stock" ? "capStock" : "capRoom"] : "") : ""}${ps.qty ? " | " + t.dealSell.replace("{q}", ps.qty).replace("{c}", fmt(ps.revenue)).replace("{a}", ps.avg).replace("{n}", ps.next) + (ps.hasBasis ? ` (${Math.abs(ps.profit)} ${ps.profit >= 0 ? t.profit : t.loss})` : "") : ""}</small></td></tr></tbody>`;
      }
      h += `</table>`;
      { const here = alertsOf(g, s.at), elsewhere = alertsOf(g).length - here.length, line = (a) => `${goodIcon(a.good) || ""}${t.goods[a.good] ?? a.good} ${a.dir === "below" ? t.alBelow : t.alAbove} ${fmt(a.price)}`;
        h += `<h4>${t.alTitle}</h4><p><small>${t.alInfo}</small></p>`;
        h += `<div class="rumor"><select id="al-good">${Object.keys(g.world.goods).map((k) => `<option value="${k}">${t.goods[k]}</option>`).join("")}</select> <select id="al-dir"><option value="below">${t.alBelow}</option><option value="above">${t.alAbove}</option></select> <input id="al-price" type="number" min="1" size="5" placeholder="${t.alPrice}"> <button id="al-set">${t.alSet}</button> <small id="al-msg" style="color:#a11"></small></div>`;
        h += here.length ? here.map((a) => `<div class="card"><small>${line(a)}</small> <button data-al-x="${a.good}">${t.admClear}</button></div>`).join("") : `<p><i>${t.alNone}</i></p>`;
        if (elsewhere) h += `<p><small>${t.alElse.replace("{n}", elsewhere)}</small></p>`; }
    } else if (tab === "route") {
      const rt = s.route, gn = (k) => goodIcon(k, 16) + (t.goods[k] ?? k), gnTxt = (k) => t.goods[k] ?? k, others = world.cities.filter((c) => c.id !== s.at && isDiscovered(g, c.id));
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
      const goods = Object.keys(g.world.goods);
      const d = (routeDrafts[s.id] ??= newRouteDraft(s.at, others.map((c) => c.id)));
      h += `<p><b>${t.routeAdv}</b></p><p>${t.routeAdvInfo}</p>`;
      d.stops.forEach((st, i) => {
        const cityOpts = others.map((c) => `<option value="${c.id}" ${st.city === c.id ? "selected" : ""}>${cityName(c.id)}</option>`).join("");
        const goodOpts = (sel) => `<option value="">${t.routeAny}</option>` + goods.map((k) => `<option value="${k}" ${sel === k ? "selected" : ""}>${gnTxt(k)}</option>`).join("");
        h += `<div class="rumor">${t.routeStop.replace("{n}", i + 1)}: <select id="rts-city-${i}">${cityOpts}</select> ${t.routeBuyIf}: <select id="rts-bg-${i}">${goodOpts(st.buyGood)}</select> <input id="rts-bp-${i}" type="number" min="0" step="1" size="5" placeholder="≤" value="${st.buyMax}"> ${t.routeSellIf}: <select id="rts-sg-${i}">${goodOpts(st.sellGood)}</select> <input id="rts-sp-${i}" type="number" min="0" step="1" size="5" placeholder="≥" value="${st.sellMin}"> <button id="rts-del-${i}">${t.routeDelStop}</button></div>`;
      });
      h += `<div class="rumor"><button id="rts-add">${t.routeAddStop}</button> ${t.routeMinCash}: <input id="rts-mincash" type="number" min="0" step="1" size="6" value="${d.minCash}"> <button id="rts-set2">${t.routeSetAdv}</button></div>`;
      h += rt ? `<div class="card">${t.routeNow.replace("{a}", cityName(rt.a)).replace("{b}", cityName(rt.b)).replace("{out}", gn(rt.out)).replace("{back}", rt.back ? t.routeBackTxt.replace("{g}", gn(rt.back)) : "").replace("{n}", rt.legs)}<br><button id="rt-cancel">${t.routeCancel}</button></div>` : `<p><i>${t.routeNone}</i></p>`;
      h += `<div class="rumor">${t.routeTo}: <select id="rt-to">${others.map((c) => `<option value="${c.id}">${cityName(c.id)}</option>`).join("")}</select> ${t.routeOut}: <select id="rt-out">${goods.map((k) => `<option value="${k}">${gnTxt(k)}</option>`).join("")}</select> ${t.routeBack}: <select id="rt-back"><option value="">${t.routeNoBack}</option>${goods.map((k) => `<option value="${k}">${gnTxt(k)}</option>`).join("")}</select> <button id="rt-set">${t.routeSet}</button></div>`;
    } else if (tab === "city") {
      const nd2 = world.nodes[s.at], pop2 = nd2.pop ?? 8000, ks = Object.keys(g.world.goods), ent = g.market[s.at];
      const rows = cityRows(pop2, ks, (k) => affordRatio(ent[k], g.world.goods[k].base)), cn = { poor: t.clsPoor, middle: t.clsMiddle, rich: t.clsRich };
      { const eff = cityEffects(g, s.at); if (eff.popBonus) h += `<p><b>${t.bldPopLine.replace("{p}", fmt(eff.pop + eff.popBonus)).replace("{b}", fmt(eff.popBonus))}</b></p>`; }
      h += `<p>${t.cityInfo}</p><div class="cityclasses">` + rows.map((r) => `<div class="card"><b>${cn[r.cls]}</b>: ${fmt(r.count)} ${t.cityCitizens} (${r.pct} %)<br>${t.cityBuys}: ${r.top.map((x) => goodIcon(x.good) + t.goods[x.good]).join(", ") || "-"}` + (r.priced_out.length ? `<br><i>${t.cityOut}: ${r.priced_out.map((k) => t.goods[k]).join(", ")}</i>` : "") + `</div>`).join("") + `</div>`;
      { const cto = offerOf(g, s.at), cta = activeContracts(g);
        h += `<h3>${t.ctTitle}</h3><p>${t.ctInfo}</p>`;
        if (cto) h += `<div class="card"><b>${t.ctOffer.replace("{q}", fmt(cto.qty)).replace("{g}", goodIcon(cto.good, 16) + (t.goods[cto.good] ?? cto.good)).replace("{d}", cto.dueDay).replace("{r}", fmt(cto.reward))}</b><br><button data-contract-accept="${s.at}" ${cta.length >= CONTRACT_MAX_ACTIVE ? "disabled" : ""}>${t.ctAccept}</button>${cta.length >= CONTRACT_MAX_ACTIVE ? ` <small>${t.ctFull.replace("{n}", CONTRACT_MAX_ACTIVE)}</small>` : ""}</div>`;
        else if (!cta.some((x) => x.city === s.at)) h += `<p><i>${t.ctNone}</i></p>`;
        if (cta.length) h += `<p>` + cta.map((x) => t.ctActive.replace("{g}", goodIcon(x.good, 16) + (t.goods[x.good] ?? x.good)).replace("{n}", fmt(x.delivered)).replace("{q}", fmt(x.qty)).replace("{d}", x.dueDay)).join("<br>") + `</p>`; }
      if (localStorage.getItem("devMode") === "1") h += needsHtml(ent.grain,t.goods,lang); // hidden developer mode only; players never see telemetry
    } else if (tab === "hall") {
      const hv = hallView(g, s.at);
      if(ui2dEnabled(location.search))h += hall2dHtml(hv,t,fmt,RESPECT_NAMES[lang][hv.respectId],lang);
      else {
      h += `<p>${t.hallInfo}</p><div class="cityclasses"><div class="card"><b>${t.hallMayor}</b><br>${hv.mayor}</div>` + hv.councillors.map((n, i) => `<div class="card"><b>${t.hallRegs} ${i + 1}</b><br>${n}</div>`).join("") + `</div>`;
      h += `<p><i>${t.hallStand.replace("{r}", RESPECT_NAMES[lang][hv.respectId]).replace("{n}", hv.respectPts)}</i></p>`;
      const cityLines = [hv.identity, hv.mood, hv.craft, hv.festival, hv.memory, hv.relations, hv.growth].filter(Boolean); // living-city lines: present only while their flag is on (off: nothing renders)
      if (cityLines.length) h += `<p><i>` + cityLines.map((l) => l.txt?.[lang] ?? l.txt?.es).filter(Boolean).join("<br>") + `</i></p>`;
      h += `<h4>${t.hallDerechos}</h4><p>${t.hallFee.replace("{p}", hv.feePct)}<br>${t.hallToll.replace("{d}", hv.tollDiv).replace("{x}", hv.tollDiscountPct)}</p>`;
      h += `<p><b>${t.hallCaja.replace("{c}", fmt(hv.caja))}</b><br>${t.hallLevies.replace("{s}", (hv.sisa > 0 ? "+" : "") + hv.sisa).replace("{p}", (hv.portazgo > 0 ? "+" : "") + hv.portazgo)}<br>${t.hallNext.replace("{d}", hv.nextMeeting)}</p><p><i>${t.hallNote}</i></p>`;
      }
    } else if (tab === "buildings") {
      ensurePlots(s.at);
      if (bldAction && !bldAction.plotId.startsWith(s.at + ":")) { bldAction = null; bldError = null; } // sailed away with an armed action
      const eff = cityEffects(g, s.at);
      h += `<p>${t.bldInfo}</p>` + (eff.popBonus ? `<p><b>${t.bldPopLine.replace("{p}", fmt(eff.pop + eff.popBonus)).replace("{b}", fmt(eff.popBonus))}</b></p>` : "");
      if (eff.jobs) h += `<p><b>${t.bldJobsLine.replace("{j}", fmt(eff.jobs)).replace("{f}", fmt(eff.free)).replace("{s}", Math.round(eff.staffing * 100))}</b></p>` + (eff.staffing < 1 ? `<p><b style="color:#a11">${t.bldJobsShort.replace("{s}", Math.round(eff.staffing * 100))}</b></p>` : "");
      h += bldCard();
      if (g.walls) { // city walls (flag on): city-level works, no plot needed
        const wl = wallsLevel(g, s.at), wk = wallsKeptLevel(g, s.at), wr = g.walls[s.at], wq = quoteWalls(g, s.at);
        h += `<h3>${t.wallTitle}</h3><p><b>${wl ? t.wallLevel.replace("{l}", wl).replace("{m}", WALL_MAX_LEVEL) : t.wallNone}</b>${wk ? ` · ${t.bldFxH.replace("{n}", fmt(wk * WALL_POP))}` : ""}${wl ? ` · ${t.bldUpkeep.replace("{u}", wl * WALL_UPKEEP)}` : ""}</p><p><small>${t.wallInfo.replace("{p}", WALL_POP)}</small></p>`;
        if (wr?.nextLevel && wr.readyTick > g.tick) h += `<p>${t.bldState.construction} ${wr.nextLevel} · ${t.bldReady.replace("{d}", Math.ceil(wr.readyTick / TICKS_PER_DAY)).replace("{p}", Math.max(0, Math.min(99, Math.round(100 * (1 - (wr.readyTick - g.tick) / (WALL_BUILD_DAYS * wr.nextLevel * TICKS_PER_DAY))))))}</p>`;
        if (wr?.unkept) h += `<p><b style="color:#a11">${t.wallUnkept}</b></p>`;
        if (wq.ok) h += `<p><button data-wallact="1" ${g.cash < wq.cost ? "disabled" : ""}>${t.wallBuild.replace("{l}", wq.level).replace("{p}", fmt(wq.cost))}</button>${g.cash < wq.cost ? ` <small>${t.capCash}</small>` : ""}</p>`;
        else if (wq.reason === "max level") h += `<p><small>${t.bldMax}</small></p>`;
        else if (!wr?.nextLevel) h += `<p><small>${whyText(t, wq.reason)}</small></p>`; // works under way already show their progress line above
      }
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
        h += `<h3>${buildingLabel(t, r)} <small>${r.plotId}</small></h3><p>${bldFx(r)}${r.upkeep ? ` · ${t.bldUpkeep.replace("{u}", r.upkeep)}` : ""}${r.jobs ? ` · ${t.bldJobsW.replace("{j}", r.jobs)}` : ""}${r.wages ? ` · ${t.bldWagesW.replace("{w}", r.wages)}` : ""}</p>`;
        if (r.halted && r.fire) h += `<p><b style="color:#a11">${t.bldFireNote}</b></p>`; // a burnt building reopens when the fire is out, not by button
        else if (r.halted) h += `<p><b style="color:#a11">${t.bldHaltedNote}</b></p><p><button data-bldact="restart|${r.plotId}" ${g.cash > 0 ? "" : "disabled"}>${t.bldRestart}</button></p>`;
        h += bldCard();
        const up = r.state === "active" ? upgradeOffer(g, s.at, r.plotId) : null;
        if (up) h += up.ok ? `<p><button data-bldact="upgrade|${r.plotId}|${r.type}" ${up.affordable ? "" : "disabled"}>${t.bldUpgrade.replace("{l}", up.level).replace("{p}", fmt(up.cost))}</button></p>` : `<p><small>${up.reason === "max level" ? t.bldMax : whyText(t, up.reason)}</small></p>`;
        if (r.state === "plot") h += `<p>` + buildOffers(g, s.at, r.plotId).filter((o) => o.ok).map((o) => `<button data-bldact="build|${r.plotId}|${o.type}">${t.bldTypes[o.type] ?? o.type}</button>`).join(" ") + `</p>`; // only types this city's resources allow
      }
    } else if (tab === "town") { // a typed town building clicked in the 3D view: read-only card, no services yet
      h += t.townTypes[townSel] ? `<h3>${t.townTypes[townSel]}</h3><p>${t.townDesc[townSel]}</p>` : `<p><i>${t.townNone}</i></p>`;
    } else if (tab === "house") {
      const pr = premises(g,s.at,lang);
      h += `<h3>${pr.label}: ${cityName(s.at)}</h3><p>${pr.info}</p>`;
      h += houseHtml(g, lang, netWorth(g), fmt, cityName, LOAN_MAX);
      if (!pr.isHome && !hasOffice(g, s.at)) { const rp = repOf(g, s.at); h += `<p><i>${t.officeReq.replace("{p}", fmt(OFFICE_PRICE)).replace("{r}", RESPECT_NAMES[lang][respectOf(g, s.at).id]).replace("{n}", Math.floor(rp))}</i></p>` + `<p><button data-bldact="office|buy" ${g.cash < OFFICE_PRICE || rp < OFFICE_MIN_RESPECT ? "disabled" : ""}>${t.officeBuy.replace("{p}", fmt(OFFICE_PRICE))}</button></p>`; }
      else if (!pr.isHome) h += `<p><i>${t.officeOwned}</i></p>`;
      if(!pr.isHome) h += `<p>${warehouseOf(g,s.at) ? (lang==="es"?"Almacén propio disponible en este puerto.":"You own a warehouse in this port.") : (lang==="es"?"No tienes almacén en este puerto.":"You have no warehouse in this port.")}</p><button data-local-store>${t.tabStore}</button><button data-local-reports>${LT[lang].reports}</button>`;
    } else if (tab === "bank") {
      const room = bankRoom(g, s.at), tm = termsFor(g, s.at), capHere = tm.room < 1 ? Math.floor(loanCapFor(g, LOAN_MAX) * tm.room / 100) * 100 : loanCapFor(g, LOAN_MAX), amts = [100, 500, 1000, 5000].filter((a) => a <= room);
      h += `<p>${t.bankInfo.replace("{r}", +(LOAN_RATE * tm.rate * 100).toFixed(2)).replace("{m}", fmt(capHere))}</p><p>${t.bankRoom}: <b>${fmt(room)}</b> · ${t.bankOwed}: <b>${fmt(loansOwed(g))}</b></p>`;
      h += amts.map((a) => `<button data-loan="${a}">${t.bankTake.replace("{a}", fmt(a))}</button>`).join(" ");
      const ls = g.loans ?? [];
      h += ls.length ? ls.map((l) => `<div class="card">${t.bankLoan.replace("{d}", l.taken).replace("{l}", fmt(l.left)).replace("{u}", l.due)}<br><button data-repay="${l.id}:all" ${g.cash > 0 ? "" : "disabled"}>${t.bankRepay}</button> <button data-repay="${l.id}:100" ${g.cash >= 100 ? "" : "disabled"}>${t.bankRepay100}</button></div>`).join("") : `<p><i>${t.bankNone}</i></p>`;
    } else if (tab === "tavern") {
      h += tavernCaptainsHtml(g,s,lang);
      const unk = world.cities.filter((c) => !isLive(g, c.id));
      h += `<p>${t.tavernInfo}</p>` + (unk.length ? `<div class="rumor">${t.rumorPick}: <select id="rum">${unk.map((c) => `<option value="${c.id}">${cityName(c.id)}${g.intel?.[c.id] ? ` (${g.day - g.intel[c.id].day} d)` : ""}</option>`).join("")}</select> <button id="rumbtn" ${g.cash >= RUMOR_PRICE ? "" : "disabled"}>${t.rumorBtn.replace("{p}", RUMOR_PRICE)}</button> <small id="rum-msg"${rumorNote?.err ? ' style="color:#a11"' : ""}>${esc(rumorNote?.text ?? "")}</small></div>` : `<p><i>${t.tavernNone}</i></p>`);
      { const offers = chartOffers(g, s.at);
        if (offers.length) h += `<div class="rumor"><b>${t.chartTitle}</b> <small>${t.chartInfo}</small><br>` + offers.map((k) => `<button data-chart="${k}" ${g.cash < chartPrice(k) ? "disabled" : ""}>${t.chartBuy.replace("{c}", t.chartNames[k]).replace("{p}", fmt(chartPrice(k)))}</button>`).join(" ") + `</div>`;
        if (routeRumorTarget(g, s.at)) h += `<div class="rumor"><button id="rrumbtn" ${g.cash < ROUTE_RUMOR_PRICE ? "disabled" : ""}>${t.routeRumorBtn.replace("{p}", ROUTE_RUMOR_PRICE)}</button> <small>${t.routeRumorInfo}</small></div>`; }
      { const cts = contactsOf(g), here = cts.find((c) => c.city === s.at);
        h += `<h4>${t.ctaTitle}</h4>` + (cts.length ? cts.map((c) => `<div class="card"><small>${t.ctaActive.replace("{city}", cityName(c.city)).replace("{n}", c.nextDay - g.day)}</small> <button data-cta-x="${c.city}">${t.admClear}</button></div>`).join("") : `<p><small>${t.ctaInfo}</small></p>`);
        if (!here) h += `<div class="rumor"><button id="cta-hire" ${g.cash < CONTACT_PRICE || cts.length >= CONTACT_MAX ? "disabled" : ""}>${t.ctaHire.replace("{p}", CONTACT_PRICE)}</button>${cts.length >= CONTACT_MAX ? ` <small>${t.ctaMax.replace("{n}", CONTACT_MAX)}</small>` : ""}</div>`; }
      { const L = crewLimits(s), c = crewOf(s), sp = speedFactor(s);
        h += `<div class="rumor"><b>${t.crewTitle}</b>: ${c} (${t.crewMin} ${L.min} · ${t.crewOpt} ${L.opt} · ${t.crewMax} ${L.max})<br>${c < L.min ? `<b>${t.crewShort}</b>` : t.crewSpeed.replace("{s}", Math.round(sp * 100))}<br>` +
          [1, 5].map((n) => `<button data-hire="${n}" ${s.voyage || c >= L.max || g.cash < n * HIRE_FEE ? "disabled" : ""}>${t.crewHire.replace("{n}", n).replace("{p}", fmt(n * HIRE_FEE))}</button>`).join(" ") + " " +
          [1, 5].map((n) => `<button data-dismiss="${n}" ${s.voyage || c <= 0 ? "disabled" : ""}>${t.crewDismiss.replace("{n}", n)}</button>`).join(" ") + `</div>`; }
    } else if (tab === "yard") {
      h += `<p>${t.yardInfo}</p><div class="scenebox">${yardSceneSvg({ orders: (g.orders ?? []).filter((o) => o.at === s.at), day: g.day, tod: 0.35 + progress * 0.4, emptyLabel: t.yardEmpty })}</div>`;
      h += `<div class="yardcards">` + Object.entries(SHIP_TYPES).map(([k, v]) => `<div class="card yc">${shipIconSvg(k)}<b>${t.types[k]}</b><small>${t.yc.replace("{c}", v.capacity).replace("{d}", v.buildDays).replace("{u}", v.upkeepPerDay)}</small><button data-order="${k}" ${g.cash < v.price ? "disabled" : ""}>${t.orderShort.replace("{p}", fmt(v.price))}</button></div>`).join("") + `</div>`;
      h += `<div><button data-repair="1" ${repairPrice(g, s) <= 0 || g.cash < repairPrice(g, s) ? "disabled" : ""}>${t.repair.replace("{h}", Math.round(s.hull ?? 100)).replace("{p}", fmt(repairPrice(g, s)))}</button> <button data-gunrepair="1" ${gunRepairCost(s) <= 0 || s.voyage || g.cash < gunRepairCost(s) ? "disabled" : ""}>${cannonsOf(s) ? t.gunRepair.replace("{c}", Math.round(gunCond(s))).replace("{p}", fmt(gunRepairCost(s))) : t.gunNone}</button> </div><div><small>${t.weaponInfo.replace("{n}", weaponCount(s)).replace("{m}", maxCannons(s))}${weaponCount(s) ? " · " + Object.entries(weaponsOf(s)).map(([k, n]) => t.weaponNames[k] + " ×" + n).join(", ") + " · " + t.weaponPowerLbl.replace("{p}", weaponPower(s)) : ""}</small><br>${Object.entries(WEAPON_TYPES).map(([k, w]) => `<button data-weapon="${k}" ${s.voyage || weaponCount(s) >= maxCannons(s) || g.cash < w.price ? "disabled" : ""} title="${t.weaponPowerLbl.replace('{p}', w.power)}">${t.weaponBuy.replace("{w}", t.weaponNames[k]).replace("{p}", fmt(w.price))}</button>`).join(" ")} <button data-sellship="1" ${g.ships.length <= 1 || cargoUsed(s) > 0 ? "disabled" : ""}>${t.sellShip.replace("{p}", fmt(shipValue(s)))}</button></div>`;
      { const cvr = convoyOf(g, s), free = g.ships.filter((x) => !x.voyage && x.at === s.at && !convoyOf(g, x));
        if (cvr) h += `<div><small>${t.cvIn.replace("{name}", cvr.name).replace("{n}", cvr.ships.length)} ${t.cvSailNote}</small> <button data-cvleave="1" ${s.voyage ? "disabled" : ""}>${t.cvLeave}</button></div>`;
        else if (!s.voyage && free.length >= 2) h += `<div><button data-cvform="1">${t.cvForm.replace("{n}", Math.min(free.length, 5))}</button> <small>${t.cvSailNote}</small></div>`; }
      if (g.orders?.length) h += `<div><b>${t.orders}</b>` + g.orders.map((o) => `<div>${t.ready.replace("{type}", t.types[o.type]).replace("{city}", cityName(o.at)).replace("{day}", o.readyDay).replace("{pct}", Math.round(orderProgress(o, g.day) * 100))}</div>`).join("") + `</div>`;
    } else if (tab === "lonja") {
      h += `<h4>${t.tabLonja}</h4>` + lonjaHtml(g, s.at, { lang, fmt, goodLabel: (gd) => `${goodIcon(gd)}${t.goods[gd] ?? gd}` });
    } else {
      if (!wh) h += `<p>${t.whInfo}</p><button data-wh="1" ${g.cash < WAREHOUSE_PRICE ? "disabled" : ""}>${t.buyWh.replace("{p}", fmt(WAREHOUSE_PRICE))}</button>`;
      else {
        h += `<table><tr><th>${t.good}</th><th>${t.hold}</th><th>${t.warehouse}</th><th></th></tr>`;
        for (const gd of Object.keys(g.world.goods)) {
          const inHold = s.cargo[gd] ?? 0, inWh = wh.goods[gd] ?? 0; if (!inHold && !inWh) continue;
          h += `<tr><td>${goodIcon(gd)}${t.goods[gd]}</td><td>${inHold}</td><td>${inWh}</td><td><button data-st="${gd}" ${inHold ? "" : "disabled"}>${t.store}</button><button data-tk="${gd}" ${inWh ? "" : "disabled"}>${t.take}</button></td></tr>`;
        }
        h += `</table>${Object.keys(wh.goods).length || Object.keys(s.cargo).length ? "" : `<p>${t.whEmpty}</p>`}`;
        const adm = stewardOf(g, s.at), admRules = Object.entries(adm?.rules ?? {});
        h += `<h4>${t.admTitle}</h4><p><small>${t.admInfo}</small></p>`;
        h += admRules.length ? `<table>` + admRules.map(([gd, r]) => `<tr><td>${goodIcon(gd)}${t.goods[gd]}</td><td><small>${t.admRule.replace("{b}", r.buyBelow || "-").replace("{n}", r.buyTo || "-").replace("{v}", r.sellAbove || "-").replace("{k}", r.sellKeep || 0)}</small></td><td><button data-admclr="${gd}">${t.admClear}</button></td></tr>`).join("") + `</table>` : `<p><i>${t.admNoRules}</i></p>`;
        h += `<div class="rumor"><select id="adm-good">${Object.keys(g.world.goods).map((k) => `<option value="${k}">${t.goods[k]}</option>`).join("")}</select> <input id="adm-buy" type="number" min="0" placeholder="${t.admBuy}" size="6"> <input id="adm-to" type="number" min="0" placeholder="${t.admTo}" size="4"> <input id="adm-sell" type="number" min="0" placeholder="${t.admSell}" size="6"> <input id="adm-keep" type="number" min="0" placeholder="${t.admKeep}" size="4"> <button id="adm-set">${t.admSet}</button> <small id="adm-msg" style="color:#a11"></small></div>`;
        h += `<div class="rumor">${t.admReserve}: <input id="adm-res" type="number" min="0" value="${adm?.reserve ?? 0}" size="6"> <button id="adm-resset">${t.admReserveSet}</button></div>`;
      }
    }
    if (ui2dEnabled(location.search) && (tab === "store" || tab === "bank")) { // presentation only: same controls, framed with a heading and figures
      const inner = h.slice(ui2dMark), city = cityName(s.at);
      const head = tab === "store"
        ? warehouseHeader2d(lang, { city, hasWarehouse: !!wh, stored: Object.values(wh?.goods ?? {}).reduce((x, y) => x + y, 0), onShip: Object.values(s.cargo ?? {}).reduce((x, y) => x + y, 0), kinds: Object.values(wh?.goods ?? {}).filter((q) => q > 0).length }, fmt)
        : bankHeader2d(lang, { city, room: bankRoom(g, s.at), owed: loansOwed(g), ratePct: +(LOAN_RATE * termsFor(g, s.at).rate * 100).toFixed(2), loans: (g.loans ?? []).length }, fmt);
      h = h.slice(0, ui2dMark) + store2dWrap(tab === "store" ? "warehouse" : "bank", head, inner);
    }
    if(!(tab==="hall"&&ui2dEnabled(location.search))) { const te = target ? travelEstimate(world, s, target) : null;
      h += `<div class="dest"><b>${t.target}:</b> ` + (te?.ok ? `${cityName(target)} - ≈ ${hoursOf(te.ticks)} h, ${te.km} km <button data-go="1">${t.sailGo} (↵)</button>` : `<i>${t.hint}</i>`) + `</div>`; }
  }
  if (!g.over) h += `<div><button data-wait="1">${t.wait}</button>${s.voyage ? `<button data-arrive="1">${t.arrive}</button>` : ""}</div>`;
  }
  $("panel").innerHTML = h;
  $("v3d")?.querySelector(".city-window")?.classList.toggle("ui2d-hall-window",tab==="hall"&&ui2dEnabled(location.search));
  $("v3d")?.querySelector(".city-window")?.classList.toggle("ui2d-market-window",tab==="market"&&ui2dEnabled(location.search));
  { const w = $("v3d")?.querySelector(".city-window"); if (w) { w.classList.remove("ui2d-store-window", "ui2d-bank-window"); const k = ui2dEnabled(location.search) ? store2dWindowClass(tab) : ""; if (k) w.classList.add(k); } }
  const P = $("panel");
  P.querySelectorAll("[data-ev]").forEach((e) => e.onclick = () => act(() => resolveEvent(g, e.dataset.ev)));
  P.querySelectorAll("[data-sel]").forEach((e) => e.onclick = () => { sel = +e.dataset.sel; rumorNote = null; if (!shipWin) shipWin = { tab: "cargo" }; render(); });
  P.querySelectorAll("[data-q]").forEach((e) => e.onclick = () => {
    const [gd, v] = e.dataset.q.split(":"), cur = qtys[gd] ?? 10;
    qtys[gd] = v === "max" ? Math.max(1, previewBuy(g.world, g.market, s, g.cash, gd, 9999, FEE * feeMul(g, s.at)).qty) : v === "10" ? 10 : Math.max(1, cur + +v);
    render();
  });
  P.querySelectorAll("[data-b]").forEach((e) => e.onclick = () => { const [gd, q] = e.dataset.b.split(":"); act(() => doBuy(g, s, gd, +q)); });
  P.querySelectorAll("[data-s]").forEach((e) => e.onclick = () => { const [gd, v] = e.dataset.s.split(":"); act(() => doSell(g, s, gd, v === "all" ? s.cargo[gd] ?? 0 : +v)); });
  P.querySelectorAll("[data-captain-review]").forEach(b=>b.onclick=()=>{
    const c=captainRoster(g,s.at).find(x=>x.id===b.dataset.captainReview);if(!c)return;
    const el=$("title"),t=CT[lang],was=playing;playing=false;el.hidden=false;
    el.innerHTML=`<div class="box capdlg"><div class="capdlg-handle"><h2>${t.confirm}</h2></div><div class="capdlg-body"><p>${t.fee}: ${c.fee} · ${c.wage} ${t.day} (${c.wage*7}/${lang==="es"?"semana":"week"})</p><p>${t.info}</p><p>${t.navigation}: +${c.navigation*4}% ${lang==="es"?"velocidad":"speed"}</p><button id="cap-confirm">${t.confirm}</button><button id="cap-cancel">${t.cancel}</button><p id="cap-msg"></p></div></div>`;
    el.querySelector("h2").textContent=t.confirm+": "+c.name+" → "+(T[lang].types[s.type]??s.type)+" "+s.id;
    $("cap-cancel").onclick=()=>{el.hidden=true;playing=was;render();};
    $("cap-confirm").onclick=()=>{const r=hireCaptain(g,s,c.id);if(!r.ok){$("cap-msg").textContent=t.failed;return;}el.hidden=true;playing=was;autosave();render();};
  });
  P.querySelector("[data-captain-dismiss]")?.addEventListener("click", askDismissCaptain);
  const rb = P.querySelector("#rumbtn"); if (rb) rb.onclick = () => { const city = P.querySelector("#rum").value, r = buyRumor(g, city, s.at); rumorNote = r.ok ? { err: false, text: t.rumorOk.replace("{city}", cityName(city)) } : { err: true, text: r.reason === "already known" ? t.rumorErrKnown : r.reason === "no cash" ? t.rumorErrCash.replace("{price}", RUMOR_PRICE) : r.reason }; act(() => {}); };
  P.querySelectorAll("[data-chart]").forEach((e) => e.onclick = () => act(() => buyChart(g, e.dataset.chart, s.at)));
  const ch = P.querySelector("#cta-hire"); if (ch) ch.onclick = () => act(() => hireContact(g, s.at));
  P.querySelectorAll("[data-cta-x]").forEach((e) => e.onclick = () => act(() => fireContact(g, e.dataset.ctaX)));
  P.querySelectorAll("[data-contract-accept]").forEach((e) => e.onclick = () => act(() => acceptContract(g, e.dataset.contractAccept)));
  const rrb = P.querySelector("#rrumbtn"); if (rrb) rrb.onclick = () => act(() => buyRouteRumor(g, s.at));
  P.querySelector("[data-local-store]")?.addEventListener("click",()=>{if($("v3d"))openCityPanel("store");else{tab="store";render();}});
  P.querySelector("[data-local-reports]")?.addEventListener("click",()=>showLedger("rep"));
  P.querySelectorAll("[data-pick]").forEach((e) => e.onclick = () => { target = e.dataset.pick; render(); });
  P.querySelectorAll("[data-go]").forEach((e) => e.onclick = () => sailToTarget());
  P.querySelectorAll("[data-tab]").forEach((e) => e.onclick = () => { tab = e.dataset.tab; bldAction = null; bldError = null; bldSelPlot = null; townSel = null; rumorNote = null; render(); const title=$("v3d")?.querySelector(".city-window-title"); if(title)title.textContent=e.textContent; });
  P.querySelectorAll("[data-bldact]").forEach((e) => e.onclick = () => {
    if (e.dataset.bldact.startsWith("sel|")) { bldSelPlot = e.dataset.bldact.slice(4); bldAction = null; bldError = null; if ($("v3d")) openCityPanel("plot"); else { tab = "plot"; render(); } return; }
    if (e.dataset.bldact === "office|buy") { act(() => buyOffice(g, s.at)); return; }
    if (e.dataset.bldact.startsWith("restart|")) { const ra = parseBldAct(e.dataset.bldact); if (ra) act(() => restartBuilding(g, s.at, ra.plotId)); return; }
    bldAction = parseBldAct(e.dataset.bldact); bldError = null; render();
  });
  P.querySelectorAll("[data-wallact]").forEach((e) => e.onclick = () => { bldAction = { kind: "walls", plotId: s.at + ":walls" }; bldError = null; render(); }); // city-level works: fake plot id keeps the sailed-away guard working
  P.querySelector("[data-bldcancel]")?.addEventListener("click", () => { bldAction = null; bldError = null; render(); });
  P.querySelector("[data-bldconf]")?.addEventListener("click", () => { const a0 = bldAction; if (!a0) return;
    let r = null;
    act(() => {
      if (a0.kind === "buy") { const p = (Array.isArray(plotsCache[s.at]) ? plotsCache[s.at] : []).find((x) => x.id === a0.plotId); r = p ? buyPlot(g, s.at, p) : { ok: false, reason: "bad plot" }; }
      else if (a0.kind === "walls") r = startWalls(g, s.at);
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
  P.querySelector("#al-set")?.addEventListener("click", () => { const r = setPriceAlert(g, s.at, $("al-good").value, $("al-dir").value, Number($("al-price").value) || quote(g, s.at, $("al-good").value)); if (!r.ok) { $("al-msg").textContent = t.alErr; return; } act(() => {}); });
  P.querySelectorAll("[data-al-x]").forEach((e) => e.onclick = () => act(() => clearPriceAlert(g, s.at, e.dataset.alX)));
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
  P.querySelectorAll("[data-weapon]").forEach((e) => e.onclick = () => act(() => buyWeapon(g, s, e.dataset.weapon)));
  P.querySelectorAll("[data-gear]").forEach((e) => e.onclick = () => act(() => buyGear(g, s)));
  P.querySelectorAll("[data-cvform]").forEach((e) => e.onclick = () => act(() => formConvoy(g, g.ships.filter((x) => !x.voyage && x.at === s.at && !convoyOf(g, x)).slice(0, 5).map((x) => x.id))));
  P.querySelectorAll("[data-cvleave]").forEach((e) => e.onclick = () => act(() => leaveConvoy(g, s.id)));
  P.querySelectorAll("[data-repair]").forEach((e) => e.onclick = () => act(() => repairShip(g, s)));
  P.querySelectorAll("[data-sellship]").forEach((e) => e.onclick = () => act(() => { const r = sellShip(g, s); if (r.ok) sel = 0; }));
  P.querySelectorAll("[data-caravel]").forEach((e) => e.onclick = () => act(() => { const r = buyCaravel(g, s.at); if (r.ok) sel = g.ships.length - 1; }));
  P.querySelectorAll("[data-wait]").forEach((e) => e.onclick = () => act(() => advanceDay(g)));
  P.querySelectorAll("[data-arrive]").forEach((e) => e.onclick = () => act(() => waitUntilArrival(g, s)));
  renderShipWin();
}

// Ship window: floating .pwin dialog for the selected ship. Rebuilt on every render pass, so
// ETAs update live at sea; every button runs through act() like its panel twin.
function renderShipWin() {
  document.getElementById("shipwin")?.remove();
  if (!shipWin || !g || g.over || $("v3d") || !ship()) return;
  const s = ship();
  const d = document.createElement("section");
  d.id = "shipwin"; d.className = "pwin"; d.setAttribute("role", "dialog");
  d.setAttribute("aria-label", `${t.types[s.type]} ${s.id}`);
  const hp = { fmt, cityName, types: t.types, goods: t.goods, eta: (sh) => sh.voyage?.anchored ? t.anchored : etaText(g.tick + sh.voyage.ticksLeft) };
  d.innerHTML = `<div class="pwin-handle" tabindex="0" role="button" aria-label="${lang === "es" ? "Mover ventana con las flechas" : "Move window with arrow keys"}"><span class="pwin-title">${t.types[s.type]} ${s.id}</span><button class="pwin-close" data-swclose="1">${t.close} (Esc)</button></div><div class="pwin-body">${shipWindowHtml(g, s, lang, shipWin.tab, hp)}</div>`;
  document.body.appendChild(d);
  const handle = d.querySelector(".pwin-handle"); let drag = null;
  const move = (x, y) => { const q = clampWindow(x, y, d.offsetWidth, d.offsetHeight, innerWidth, innerHeight - 70); d.style.left = q.left + "px"; d.style.top = q.top + "px"; d.style.right = "auto"; };
  handle.onpointerdown = (e) => { if (e.target.closest("button")) return; drag = [e.clientX - d.offsetLeft, e.clientY - d.offsetTop]; handle.setPointerCapture(e.pointerId); };
  handle.onpointermove = (e) => { if (drag) move(e.clientX - drag[0], e.clientY - drag[1]); };
  handle.onpointerup = handle.onpointercancel = () => drag = null;
  handle.onkeydown = (e) => { if (e.target !== handle) return; const keys = { ArrowLeft: [-20, 0], ArrowRight: [20, 0], ArrowUp: [0, -20], ArrowDown: [0, 20] }; const v = keys[e.key]; if (v) { e.preventDefault(); e.stopPropagation(); move(d.offsetLeft + v[0], d.offsetTop + v[1]); } };
  d.querySelector("[data-swclose]").onclick = () => { shipWin = null; render(); };
  d.querySelectorAll("[data-swtab]").forEach((e) => e.onclick = () => { shipWin.tab = e.dataset.swtab; render(); });
  d.querySelectorAll("[data-st]").forEach((e) => e.onclick = () => act(() => storeGoods(g, s, e.dataset.st, s.cargo[e.dataset.st] ?? 0)));
  d.querySelectorAll("[data-tk]").forEach((e) => e.onclick = () => act(() => takeGoods(g, s, e.dataset.tk, 9999)));
  d.querySelectorAll("[data-hire]").forEach((e) => e.onclick = () => act(() => hireCrew(g, s, Number(e.dataset.hire))));
  d.querySelectorAll("[data-dismiss]").forEach((e) => e.onclick = () => act(() => dismissCrew(g, s, Number(e.dataset.dismiss))));
  d.querySelectorAll("[data-gunrepair]").forEach((e) => e.onclick = () => act(() => repairGuns(g, s)));
  d.querySelectorAll("[data-weapon]").forEach((e) => e.onclick = () => act(() => buyWeapon(g, s, e.dataset.weapon)));
  d.querySelectorAll("[data-gear]").forEach((e) => e.onclick = () => act(() => buyGear(g, s)));
  d.querySelectorAll("[data-repair]").forEach((e) => e.onclick = () => act(() => repairShip(g, s)));
  d.querySelectorAll("[data-sellship]").forEach((e) => e.onclick = () => act(() => { const r = sellShip(g, s); if (r.ok) { sel = 0; shipWin = null; } }));
  d.querySelector("[data-captain-dismiss]")?.addEventListener("click", askDismissCaptain);
}

// Captain dismissal confirm dialog (shared by the tavern card and the ship window).
function askDismissCaptain() {
  const s = ship(), c = captainOf(s); if (!c) return; const el = $("title"), tc = CT[lang], was = playing; playing = false; el.hidden = false;
  el.innerHTML = `<div class="box capdlg"><div class="capdlg-handle"><h2 id="cap-heading"></h2></div><div class="capdlg-body"><p>${tc.dismissInfo}</p><button id="cap-confirm">${tc.dismissConfirm}</button><button id="cap-cancel">${tc.cancel}</button><p id="cap-msg"></p></div></div>`;
  $("cap-heading").textContent = tc.dismissConfirm + ": " + c.name;
  $("cap-cancel").onclick = () => { el.hidden = true; playing = was; render(); };
  $("cap-confirm").onclick = () => { if (s.captain?.id !== c.id) { $("cap-msg").textContent = tc.failed; return; } const r = dismissCaptain(g, s); if (!r.ok) { $("cap-msg").textContent = tc.failed; return; } el.hidden = true; playing = was; autosave(); render(); };
}

function sailToTarget() { if (!target) return; const to = target; const s0 = ship(); close3d();
  act(() => { const cv = convoyOf(g, s0);
    if (cv) { const mates = cv.ships.map((id) => g.ships.find((x) => x.id === id));
      if (mates.every((m) => m && !m.voyage && m.at === s0.at)) return sailConvoy(g, cv.id, to, { doSail }); } // a grouped convoy departs together, at the pace of the slowest
    return doSail(g, s0, to); });
  if (automaticTime && s0.voyage) { playing = true; manualPause = false; }
  target = null; render(); }
function closeCityWindow() {
  const d=$("v3d"); if (!d) return;
  const w=d.querySelector(".city-window"); if(w){w.hidden=true;d.querySelector("[data-open-panel]")?.focus();}
  syncMissionEcho();
}
function close3d() {
  const d=$("v3d"); if(!d)return;
  const p=$("panel"), home=$("panel-home"); if(p&&home)home.appendChild(p);
  d.city2dResize?.disconnect();d.city2dNavObs?.disconnect();d.remove();document.body.classList.remove("in-city-3d");
  if (automaticTime && planningResume && !manualPause) playing = true;
  planningResume = false;
}
let bldSelPlot=null, townSel=null;
function openCityPanel(tb) {
  const d=$("v3d");if(!d)return;if(tb!==tab)rumorNote=null;tab=tb;
  const w=d.querySelector(".city-window");w.dataset.cityPanel=tb;w.hidden=false;
  render();
  d.querySelector(".city-window-title").textContent=({market:t.tabMarket,yard:t.tabYard,tavern:t.tabTavern,bank:t.tabBank,city:t.tabCity,hall:t.tabHall,buildings:t.bldBuild,route:t.tabRoute,house:premises(g,ship().at,lang).label,lonja:t.tabLonja,store:t.tabStore,plot:(()=>{const r=buildingsRows(g,ship().at).find((x)=>x.plotId===bldSelPlot);return r?buildingLabel(t,r):t.tabBuildings;})(),town:t.townTypes[townSel]??t.tabCity})[tb]||t.tabCity;
  d.querySelector("[data-close-panel]").focus();
}
function open3d(s0) {
  if($("v3d")||s0.voyage)return;
  if (automaticTime) { planningResume = playing && !manualPause; playing = false; }
  shipWin=null;rumorNote=null;document.getElementById("shipwin")?.remove();
  const nd = world.nodes[s0.at], q = new URLSearchParams({ city: s0.at, pop: nd.pop ?? 8000, ships: g.ships.filter((x) => x.at === s0.at && !x.voyage).length || 1, wh: warehouseOf(g, s0.at) ? "1" : "0", tod: String(0.35 + progress * 0.4), hud: t.hud3d, names: JSON.stringify({ market: t.tabMarket, tavern: t.tabTavern, shipyard: t.tabYard, bank: t.tabBank, ...(warehouseOf(g, s0.at) ? { warehouse: t.tabStore } : {}) }), tnames: JSON.stringify(Object.fromEntries(portLayout(s0.at, nd.pop ?? 8000).houses.filter((h) => h.type !== "house").map((h) => ["town:" + h.type, t.townTypes[h.type] ?? h.type]))), walls:String(wallsLevel(g,s0.at)), bld: JSON.stringify(g.buildings?.[s0.at] ?? {}), tick: String(g.tick), labels: JSON.stringify(Object.fromEntries(buildingsRows(g, s0.at).map((r) => [r.plotId, buildingLabel(t, r)]))), pnames: JSON.stringify(Object.fromEntries(buildingsRows(g, s0.at).map((r) => [r.plotId, (r.type ? (t.bldTypes[r.type] ?? r.type) + (r.state === "construction" ? ` ${r.nextLevel}` : r.level ? ` ${r.level}` : "") : t.bldState.plot) + " · " + (r.state === "construction" ? t.bldReady.replace("{d}", r.readyDay).replace("{p}", Math.round(r.progress * 100)) : (t.bldState[r.state] ?? r.state))]))) });
  const d=document.createElement("div");d.id="v3d";
  d.innerHTML=`<iframe src="${city2dEnabled(location.search)?"city2d":"proto3d"}/index.html?${q}" title="${t.tabCity}"></iframe><div class="city-mission" id="city-mission" hidden></div><nav class="city-controls" aria-label="${t.tabCity}"><button data-open-panel>${t.tabMarket}</button><button data-city-tab="city">${t.tabCity}</button><button data-city-tab="yard">${t.tabYard}</button><button data-city-tab="tavern">${t.tabTavern}</button><button data-city-tab="bank">${t.tabBank}</button><button data-city-tab="buildings">${t.bldBuild}</button><button data-city-tab="hall">${t.tabHall}</button><button data-city-tab="store">${t.tabStore}</button>${lonjaEnabled(location.search)?`<button data-city-tab="lonja">${t.tabLonja}</button>`:""}<button data-city-tab="house">${premises(g,s0.at,lang).label}</button><button data-city-ships>${lang==="es"?"Barcos":"Ships"}</button><button data-city-reports>${LT[lang].reports}</button><button data-city-menu>${lang==="es"?"Menú":"Menu"}</button><button data-map>${lang==="es"?"Volver al mapa":"Back to map"}</button></nav><section class="city-window pwin" role="dialog" aria-label="${t.tabCity}" hidden><div class="city-window-handle pwin-handle" tabindex="0" role="button" aria-label="${lang==="es"?"Mover ventana con las flechas":"Move window with arrow keys"}"><span class="city-window-title pwin-title"></span><span class="handle-mission" id="handle-mission" hidden></span><button class="pwin-close" data-close-panel>${t.close} (Esc)</button></div><div class="city-panel-host pwin-body"></div></section>`;  document.body.appendChild(d);document.body.classList.add("in-city-3d"); d.querySelector(".city-panel-host").appendChild($("panel"));
  syncMissionEcho();
  d.querySelector("iframe").addEventListener("load", () => { syncMissionEcho(); // re-dock the mission line once the iframe's own chrome (2D toolbar) exists
    try { const nav = d.querySelector("iframe").contentDocument?.querySelector("nav");
      if (nav) { d.city2dNavObs?.disconnect(); d.city2dNavObs = new MutationObserver(() => syncMissionEcho()); d.city2dNavObs.observe(nav, { attributes: true, childList: true, subtree: true, attributeFilter: ["hidden", "class", "style"] }); }
    } catch { /* cross-document watch unavailable: load/resize hooks still cover placement */ } });
  if(city2dEnabled(location.search)){const resize=()=>{d.querySelector("iframe").style.height=Math.max(120,d.clientHeight-d.querySelector(".city-controls").offsetHeight)+"px";syncMissionEcho();};d.city2dResize=new ResizeObserver(resize);d.city2dResize.observe(d);d.city2dResize.observe(d.querySelector(".city-controls"));resize();}
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
// Free navigation (only in games with g.freeNav): right click sends the selected ship there, port or open sea, no menu and no Zarpar button.
mapEl.addEventListener("contextmenu", (ev) => {
  if (g?.freeNav !== true) return; // flag off: the port menu works as before
  ev.preventDefault(); ev.stopPropagation(); closeMenu();
  const cityEl = ev.target.closest?.("g.city"), s0 = ship(); if (!s0) return;
  let lat, lon;
  if (cityEl && world.nodes[cityEl.dataset.c]) ({ lat, lon } = world.nodes[cityEl.dataset.c]);
  else { const p = mapEl.createSVGPoint(); p.x = ev.clientX; p.y = ev.clientY; const q = p.matrixTransform(mapEl.getScreenCTM().inverse()); lon = q.x / sc + x0; lat = y1 - q.y / (sc * 1.25); }
  let r; act(() => { r = doGoTo(g, s0, lat, lon); });
  if (r && !r.ok && r.reason !== "already there") { const h = $("hint"); h.textContent = r.reason === "no sea there" ? t.navNoSea : t.navCannot; setTimeout(() => render(), 2500); }
  else target = null, render();
}, true);
function closeMenu() { document.getElementById("ctx")?.remove(); }
function openMenu(city, x, y) {
  closeMenu(); target = city; const s0 = ship(), items = cityMenu(world, s0, city), est = travelEstimate(world, s0, city);
  const d = document.createElement("div"); d.id = "ctx"; d.setAttribute("role", "menu"); d.style.cssText = `left:${Math.min(x, innerWidth - 230)}px;top:${Math.min(y, innerHeight - 90)}px`;
  d.innerHTML = items.map((it) => `<button role="menuitem" data-m="${it.id}" ${it.enabled ? "" : "disabled"}>${(it.id === "sail" ? t.ctxSail.replace("{d}", est.ok ? "≈ " + hoursOf(est.ticks) + " h" : "-") : t.ctxSelect).replace("{city}", cityName(city))}</button>`).join("");
  document.body.appendChild(d);
  // The gesture that opened this menu ends over it: its trailing click must not
  // fire the first item. A new pointer press arms the items; keyboard (detail 0) always works.
  const guard = createMenuGuard();
  document.addEventListener("pointerdown", guard.arm, { capture: true, once: true });
  d.querySelectorAll("button").forEach((b) => b.onclick = (e) => { if (!guard.accepts(e.detail)) return; closeMenu(); if (b.dataset.m === "sail") sailToTarget(); else render(); });
  render();
}
document.addEventListener("pointerdown", (e) => { if (!e.target.closest?.("#ctx")) closeMenu(); });
document.addEventListener("keydown", (e) => {
  if (e.target.closest?.("select,input,textarea") || e.ctrlKey || e.metaKey || e.altKey) return;
  if ($("title") && !$("title").hidden) return;
  if (e.key === "Escape" && $("v3d")) { e.preventDefault(); const w=$("v3d").querySelector(".city-window"); if(!w.hidden)closeCityWindow();else close3d();return; }
  if($("v3d"))return;
  if (e.key === "Escape") { if (shipWin) { shipWin = null; render(); return; } closeMenu(); target = null; render(); }
  else if (e.key === "Enter" && target) { e.preventDefault(); sailToTarget(); }
  else if (e.key === " ") { e.preventDefault(); toggleClock(); }
  else { const i = shipForKey(g, e.key); if (i !== null) { sel = i; target = null; render(); } }
});
$("play").onclick = () => { toggleClock(); };
$("spd").onclick = () => { speed = nextTimeSpeed(speed, automaticTime); render(); };
$("new").onclick = () => showMenu();
{ // fullscreen toggle; the button stays hidden where the browser has no Fullscreen API (e.g. iPhone)
  const de = document.documentElement, fsb = $("fs");
  if (fsb && document.fullscreenEnabled && de.requestFullscreen) {
    fsb.hidden = false;
    fsb.onclick = () => { if (document.fullscreenElement) document.exitFullscreen(); else de.requestFullscreen().catch(() => {}); };
  }
}
function showLedger(kind) {
  const el = $("title"), wasPlaying = playing; playing = false;
  if (kind === "rep") { campaignEvent(g, { kind: "readReport" }, MISSION_HOOKS); render(); } // reading the weekly report is a mission step
  const styled = ui2dEnabled(location.search);
  const reportBody=()=>{const weekly=reportsHtml(g,lang,fmt,(k)=>T[lang].goods[k]??k),chronicle=chronicleHtml(g,lang,fmt,(k)=>T[lang].goods[k]??k),voyages=`<h3>${voyagesTitle(lang)}</h3>`+voyagesHtml(g,lang,fmt,cityName),encounters=encountersHtml(g,lang);return styled?reports2dHtml(weekly,chronicle,voyages,encounters,lang):weekly+chronicle+voyages+encounters;};
  const body = () => kind === "rep" ? reportBody() : styled ? inbox2dHtml(g,lang,fmt,cityName,(k)=>T[lang].goods[k]??k) : inboxHtml(g,lang,fmt,cityName,(k)=>T[lang].goods[k]??k);
  const draw = () => { el.innerHTML = styled ? `<section class="box wide ui2d-window${kind==='rep'?' ui2d-reports':''}" role="dialog" aria-modal="true" aria-labelledby="ui2d-title"><header class="ui2d-heading"><span aria-hidden="true">${kind==='rep'?'▤':'✉'}</span><h2 id="ui2d-title">${kind==='rep'?LT[lang].reports:LT[lang].messages}</h2><button id="l-close">${LT[lang].close}</button></header><div class="ui2d-content">${body()}</div></section>` : `<div class="box wide ledgerdlg"><div class="ledger-body">${body()}</div><p class="ledger-close"><button id="l-close">${LT[lang].close}</button></p></div>`; el.hidden = false;
    $("l-close").onclick = () => { el.hidden = true; playing = wasPlaying; autosave(); render(); if(styled)$(kind).focus(); };
    if(styled)el.querySelector(".ui2d-window").onkeydown=e=>{
      if(e.key==="Escape"){e.preventDefault();$("l-close").click();}
      if(e.key==="Tab"){const buttons=[...el.querySelectorAll("button:not(:disabled),a[href]")],first=buttons[0],last=buttons.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
    };
    el.querySelectorAll('[data-report-target]').forEach(button=>button.onclick=()=>el.querySelector(`#${button.dataset.reportTarget}`)?.scrollIntoView({block:'start'}));
    if ($("l-all")) $("l-all").onclick = () => { markAllRead(g); draw(); };
    el.querySelectorAll("[data-msg]").forEach((e) => e.onclick = () => { const id=e.dataset.msg; markRead(g, Number(id)); draw(); if(styled)el.querySelector(`[data-msg="${id}"]`)?.focus(); }); };
  draw();
  if(styled)$("l-close").focus();
}
$("rep").onclick = () => showLedger("rep");
$("msg").onclick = () => showLedger("msg");
$("lang").onclick = () => { lang = lang === "es" ? "en" : "es"; localStorage.setItem("lang", lang); render(); };
function showMenu() {
  t = T[lang]; const el = $("title"), wasPlaying = playing; playing = false;
  el.innerHTML = `<div class="box pausemenu"><div class="pausemenu-handle"><h2>${t.paused}</h2></div><div class="pausemenu-body"><p><button id="m-res">${t.resume}</button></p><p><button id="m-save">${t.saveNow}</button> <button id="m-exp">${t.exportS}</button> <span id="m-msg"></span></p>` +
    `<p><small>${t.seedLine.replace("{s}", g.seed ?? 0)}</small></p><p>${t.lang2}: <button id="m-lang">${lang === "es" ? "EN" : "ES"}</button> ${t.speedDef}: <button id="m-spd">${speed}x</button></p><p><label><input id="m-auto-time" type="checkbox" ${automaticTime ? "checked" : ""}> ${lang === "es" ? "Avance automático" : "Automatic time"}</label></p><p><small>${lang === "es" ? "El puerto se pausa para planificar. Las rutas automáticas siguen sin detenerse al llegar." : "The port pauses for planning. Automatic routes keep running on routine arrivals."}</small></p><p><button id="m-quit">${t.quit}</button></p></div></div>`;
  el.hidden = false;
  const close = () => { el.hidden = true; playing = wasPlaying; render(); };
  $("m-auto-time").onchange = e => { automaticTime = e.target.checked; localStorage.setItem('automatic-time', String(automaticTime)); tickAcc = 0; if (!automaticTime && speed === 8) speed = 4; $("m-spd").textContent = speed + 'x'; };
  $("m-res").onclick = close;
  $("m-save").onclick = () => { autosave(); $("m-msg").textContent = t.saved; };
  $("m-exp").onclick = () => { exportSave(JSON.stringify(packGame(g, company)), g.day); $("m-msg").textContent = t.expDone; };
  $("m-lang").onclick = () => { lang = lang === "es" ? "en" : "es"; localStorage.setItem("lang", lang); document.documentElement.lang = lang; showMenu(); };
  $("m-spd").onclick = () => { speed = nextTimeSpeed(speed, automaticTime); $("m-spd").textContent = speed + "x"; };
  $("m-quit").onclick = () => { autosave(); playing = false; close3d(); showTitle(); };
}
document.addEventListener("keydown", (e) => { if (e.defaultPrevented) return; if (e.key === "Escape") { const el = $("title"); if (el.hidden) showMenu(); else if ($("m-res")) $("m-res").click(); else if ($("l-close")) $("l-close").click(); else if($("cap-cancel"))$("cap-cancel").click(); } });
// freeNav defaults ON for new games (Marco 23/10: all flags on); existing saves keep their own flag.
function showCreate(name) {
  t = T[lang]; let freeNav = true; const el = $("title"), pf = defaultProfile(name || t.defCo), swatch = (key) => PALETTE.map((c) => `<button class="sw ${pf.crest[key] === c ? "on" : ""}" data-k="${key}" data-v="${c}" style="background:${c}" aria-label="${c}"></button>`).join("");
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
      `<p><label><input type="checkbox" id="p-freenav" ${freeNav ? "checked" : ""}> ${t.freeNavLbl}</label> <small>${t.freeNavInfo}</small></p><p><button id="p-back">${t.back}</button> <button id="p-go">${t.start}</button></p></div>`;
    $("p-co").value = pf.company; $("p-ch").value = pf.character; // set as values, never parsed as HTML
    const read = () => { pf.company = $("p-co").value; pf.character = $("p-ch").value; freeNav = $("p-freenav").checked === true; };
    el.querySelectorAll(".pt").forEach((b) => b.onclick = () => { read(); pf.portrait = +b.dataset.p; draw(); });
    el.querySelectorAll(".sw").forEach((b) => b.onclick = () => { read(); pf.crest[b.dataset.k] = b.dataset.v; draw(); });
    for (const [id, set] of [["p-home", (v) => pf.home = v], ["p-bg", (v) => pf.background = v], ["p-df", (v) => pf.difficulty = v], ["p-sh", (v) => pf.crest.shield = v], ["p-dv", (v) => pf.crest.division = v], ["p-cg", (v) => pf.crest.charge = v]]) $(id).onchange = (e) => { read(); set(e.target.value); draw(); };
    $("p-back").onclick = () => showTitle();
    $("p-go").onclick = () => { read(); playing = false; progress = 0; tickAcc = 0; inTitle = false; start(pf, true, { freeNav }); el.hidden = true; if(!ship().voyage)open3d(ship()); };
  };
  draw();
}
function showTitle() {
  inTitle = true;
  t = T[lang]; const saved = loadSaved(), el = $("title");
  el.innerHTML = `<div class="box"><h1>El Almojarife</h1><p>${t.tagline}</p>` +
    `<label>${t.company}<br><input id="co-in" maxlength="30" value="${t.defCo}"></label><br>` +
    `<button id="t-start">${t.start}</button> <button id="t-cont" ${saved ? "" : "disabled"} title="${saved ? "" : t.noSave}">${t.cont}</button> ` +
    `<button id="t-exp" ${saved ? "" : "disabled"}>${t.exportS}</button> <button id="t-imp">${t.importS}</button> <button id="t-rest" ${getBackup() ? "" : "disabled"} title="${t.restInfo}">${t.restB}</button> <button id="t-lang">${lang === "es" ? "EN" : "ES"}</button>` +
    `<input type="file" id="t-file" accept="application/json,.json" hidden><div id="t-msg"></div></div>`;
  el.hidden = false;
  $("t-start").onclick = () => showCreate($("co-in").value);
  $("t-cont").onclick = () => { if (!saved) return; g = saved.g; company = saved.company; sel = 0; playing = false; pauseNote = null; progress = 0; tickAcc = 0; inTitle = false; render(); el.hidden = true; if(!ship().voyage)open3d(ship()); };
  $("t-rest").onclick = () => {
    const b = getBackup(); if (!b) return;
    try { unpackGame(JSON.parse(b), world); } catch { $("t-msg").textContent = t.badSave; return; }
    if (!confirm(t.restConfirm)) return;
    const cur = localStorage.getItem(SAVE_KEY);
    try { restoreRotate(localStorage, SAVE_KEY, cur, b); } catch { $("t-msg").textContent = t.errB; return; } // fail-closed: nothing is overwritten unless both copies are safe
    showTitle(); $("t-msg").textContent = t.restDone;
  };
  $("t-lang").onclick = () => { lang = lang === "es" ? "en" : "es"; localStorage.setItem("lang", lang); document.documentElement.lang = lang; showTitle(); };
  $("t-exp").onclick = () => exportSave(); // wrap: the click event must not become the payload argument
  $("t-imp").onclick = () => $("t-file").click();
  $("t-file").onchange = async (e) => {
    const f = e.target.files[0]; if(!f)return;
    let r; try { r = unpackGame(JSON.parse(await f.text()), world); } catch { $("t-msg").textContent = t.badSave; return; }
    const prev = localStorage.getItem(SAVE_KEY);
    if (prev) try { localStorage.setItem(BACKUP_KEY, prev); } catch { $("t-msg").textContent = t.errB; return; } // no backup, no import: never replace the campaign unprotected
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(packGame(r.g, r.company))); } catch { $("t-msg").textContent = t.errB; return; } // setItem is atomic: on quota failure the old save stays intact
    g = r.g; company = r.company; sel = 0; playing = false; pauseNote = null; progress = 0; tickAcc = 0; inTitle = false; render(); el.hidden = true;
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

// Keep the existing live header visible in the city, including wrapped mobile rows.
const gameHeader=document.querySelector('body>header');
const syncHeaderHeight=()=>document.documentElement.style.setProperty('--game-header-height',`${gameHeader.getBoundingClientRect().height}px`);
new ResizeObserver(syncHeaderHeight).observe(gameHeader);
syncHeaderHeight();
