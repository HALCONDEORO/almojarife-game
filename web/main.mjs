import { marketQuantity, destinationQuote } from '../src/view/marketdesk.mjs';
import { shipCapacity } from '../src/sim/trade.mjs';
import { sfx, soundOn } from "./audio.mjs";
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
import { titleBookHtml } from "./titlebook.mjs";
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
import { defaultProfile, cleanProfile, startBonus, startOptions, crestSvg, portraitSvg, flagSvg, PALETTE, DIVISIONS, CHARGES, SHIELDS, PORTRAITS, BACKGROUNDS, NAMES } from "../src/game/profile.mjs";
import { previewBuy, previewSell, FEE } from "../src/sim/trade.mjs";
import { stockLevel } from "../src/game/stocklevel.mjs";
import { BACKUP_KEY, TMP_KEY, finishPendingRotation, restoreRotate, saveFileName } from "./savefile.mjs";
import { loanCapFor } from "../src/game/rank.mjs";
import { houseHtml, RESPECT_NAMES } from "../src/view/rankview.mjs";
import { repOf, respectOf } from "../src/game/rank.mjs";
import { cityRows } from "../src/view/cityview.mjs";
import { tabForBuilding, portLayout } from "../src/view3d/port3d.mjs";
import { cityPlots } from "../src/view3d/cityplots.mjs";
import { whyText, plotViewState, buildingsRows, plotOffers, buildOffers, upgradeOffer, cityEffects, parseBldAct, buildingLabel, bldSummaryCard, bldChipInner, bldOfferCard, bldOfferLocked, bldOfferGroup, bldOfferArt, OFFER_LOCKED_SHOW, BO } from "../src/view/buildingsview.mjs";
import { hallView } from "../src/view/townhallview.mjs";
import { buyPlot, startConstruction, buyOffice, hasOffice, OFFICE_PRICE, OFFICE_MIN_RESPECT, restartBuilding } from "../src/game/buildings.mjs";
import { quoteWalls, startWalls, wallsLevel, wallsKeptLevel, WALL_POP, WALL_MAX_LEVEL, WALL_UPKEEP, WALL_BUILD_DAYS } from "../src/game/walls.mjs";
import { quoteTowers, startTowers, towersCount, towersKept, towersMax, TOWER_UPKEEP, TOWER_BUILD_DAYS } from "../src/game/towers.mjs"; // watchtowers on the wall (issue #363, lane C)
import { voyagesHtml, voyagesTitle } from "../src/view/voyageview.mjs";
import { affordRatio } from "../src/sim/market.mjs";
import { citylifeExtra } from "../src/game/citylife.mjs";
import { reportsHtml, inboxHtml, chronicleHtml, LT, badge } from "../src/view/ledgerview.mjs";
import { unread, markAllRead, markRead } from "../src/game/ledger.mjs";
import { shipIconSvg, orderProgress } from "../src/view/yardscene.mjs";
import { shipDescriptor } from "../src/view/shipvisual.mjs";
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
import { warehouseCap, setRoute, setRouteAdv, clearRoute, borrow, repay, feeMul, bankRoom, loansOwed, newGame, advanceTick, TICKS_PER_DAY, doBuy, doSell, doSail, waitUntilArrival, buyCaravel, orderShip, repairShip, repairGuns, buyCannon, buyWeapon, hireCrew, dismissCrew, repairPrice, sellShip, shipValue, buyRumor, RUMOR_PRICE, formConvoy, leaveConvoy, sailConvoy, convoyOf, isLive, buyWarehouse, storeGoods, takeGoods, warehouseOf, WAREHOUSE_PRICE, quote, trendPct, bestPorts, netWorth, cargoUsed, SHIP_TYPES, GOAL_CASH, DEADLINE_DAYS, CARAVEL_PRICE, isDiscovered } from "../src/game/game.mjs";
import { stewardOf, setStewardRule, clearStewardRule, setStewardReserve } from "../src/game/steward.mjs";
import { alertsOf, setPriceAlert, clearPriceAlert } from "../src/game/alerts.mjs";
import { offerOf, activeContracts, acceptContract, CONTRACT_MAX_ACTIVE } from "../src/game/contracts.mjs";
import { townIndustry, salesOf } from "../src/game/townindustry.mjs"; // the town's own works behind the market (townIndustry flag)
import { lotsOfDay, sellerOf, biddersOf, nextAuctionDay, placeBid } from "../src/game/almoneda.mjs"; // the weekly town auction (same flag)
import { setLiveText } from "./livetext.mjs"; // live regions: write only on change
import { tutorialLine } from "../src/game/tutorial.mjs"; // first-voyage tutorial hint (opt-in per game)

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
let mapMode = "geographic";
const historicalRealms = HISTORICAL_MAPS_ENABLED ? await fetch("../data/realms.json").then(r => r.ok ? r.json() : null).catch(() => null) : null;
const historicalLeagues = HISTORICAL_MAPS_ENABLED ? await fetch("../data/leagues.json").then(r=>r.ok?r.json():null).catch(()=>null) : null;
const T = {
  es: { play: "▶ Reanudar", pause: "⏸ Pausa", pauseArrive: "⏸ {ship} ha llegado a {city} · tiempo en pausa", speed: "Velocidad", day: "Día", cash: "Monedas", goal: "Meta", ships: "Barcos", new: "Nueva partida", cont: "Continuar", resume: "Seguir jugando", saveNow: "Guardar ahora", quit: "Salir al título", stTitle: "Ajustes", stText: "Tamaño de texto", stNormal: "Normal", stLarge: "Grande", stMotion: "Reducir animaciones", stSound: "Sonido", stNote: "Los ajustes se guardan en este dispositivo.", cred: "Créditos", credGame: "comercio marítimo en la costa ibérica, siglos XV-XVI.", credOwn: "Diseño, código, datos e ilustraciones: Marco Tevar (código MIT, arte CC BY 4.0).", credNE: "Costas y carta de fondo: Natural Earth (dominio público).", credPop: "Poblaciones hacia 1500: Bairoch, Batou y Chèvre (1988), vía la transcripción de J. W. Russ.", credOsm: "Coordenadas de puertos: © colaboradores de OpenStreetMap (ODbL).", credGen: "Calles y parcelas de la ciudad: gen-city, de Nikita Galadiy (MIT).", credThree: "Vista 3D: three.js (MIT).", credKenney: "Sonidos: Kenney (kenney.nl) y rubberduck (opengameart.org), CC0.", lang2: "Idioma", speedDef: "Velocidad", paused: "Juego en pausa", keys: "Atajos: Esc: cerrar menú · Espacio: pausa · Rueda: zoom del mapa · Arrastrar: mover el mapa", alTitle: "Alertas de precio", alInfo: "Marca un precio en este puerto y el buzón te avisa el día que el mercado lo cruce (avisos de una sola vez). Útil para saber cuándo volver.", alBelow: "baje de", alAbove: "suba de", alSet: "Crear alerta", alNone: "Sin alertas en este puerto.", alElse: "Tienes {n} alerta(s) en otros puertos.", alPrice: "precio", alErr: "Revisa la alerta: precio en números y un máximo de 8.", tabMarket: "Mercado", tabYard: "Astillero", tabStore: "Almacén", tabLonja: "Lonja", warehouse: "Almacén", yardInfo: "Encarga barcos (se entregan tras el plazo; sin límite de flota: el mantenimiento diario es el freno) y repara el casco. Para vender un barco, llévalo a la almoneda del ayuntamiento.", order: "Encargar {type} ({p}, {d} días, carga {c})", repair: "Reparar casco {h}% ({p})", sellShip: "Vender barco ({p})", orders: "En construcción", ready: "{type} en {city}, listo el día {day} ({pct}%)", yardEmpty: "Grada libre", orderShort: "Encargar ({p})", yc: "Carga {c} · {d} días · mantenimiento {u}/día", buyWh: "Comprar almacén ({p})", whInfo: "Guarda mercancías en este puerto (hasta 300 unidades).", whEmpty: "Vacío", store: "Guardar", take: "Sacar", admTitle: "Administrador del almacén", admInfo: "Órdenes automáticas: compra al precio máximo indicado o por debajo, hasta la cantidad objetivo. Vende al precio mínimo o por encima, conservando la cantidad que elijas. Actúa una vez al día y respeta tu reserva de monedas. Los límites de precio no incluyen la tasa del puerto: se suma al comprar y se resta al vender.", admRule: "compra ≤ {b} hasta {n} · vende ≥ {v}, conserva {k}", admNoRules: "Sin órdenes todavía.", admGood: "Bien", admBuy: "Compra máx. (sin tasa)", admTo: "Cantidad objetivo", admSell: "Venta mín. (sin tasa)", admKeep: "Conservar", admSet: "Guardar orden", admClear: "Quitar", admReserve: "Reserva de monedas", admReserveSet: "Fijar reserva", admErr: "Revisa la orden: el precio de compra debe ser menor que el de venta y la cantidad objetivo no debe superar la capacidad.", start: "Empezar", company: "Nombre de tu casa mercantil", defCo: "Mi Casa Mercantil", tagline: "Comercio marítimo en la costa ibérica, siglos XV-XVI", menu: "Menú", saved: "Partida guardada", noSave: "No hay partida guardada", exportS: "Exportar", importS: "Importar", badSave: "Ese archivo no es una partida válida", restB: "Restaurar copia previa", restInfo: "Vuelve a la partida que había antes de la última importación", splashLast: "Última partida", mapAlt: "Mapa de Iberia y el Estrecho", replaceTitle: "Ya tienes una partida guardada", replaceBody: "Guardada: {s}. Si empiezas una nueva, la actual se conserva como copia previa («Restaurar copia previa» en el título). Puedes exportarla antes.", replaceGo: "Empezar nueva partida", restDone: "Copia anterior restaurada.", errB: "No se pudo guardar la copia de seguridad: importación cancelada.", restConfirm: "¿Restaurar la copia previa? La partida actual pasará a ser la copia de seguridad (puedes deshacer restaurando otra vez).", expDone: "Copia descargada.", create: "Crea tu casa mercantil", character: "Tu nombre", portrait: "Retrato", crest: "Escudo", shield: "Forma", division: "División", charge: "Emblema", c1: "Color principal", c2: "Color secundario", home: "Puerto de origen", background: "Origen", back: "Atrás", sh: { heater: "Clásico", round: "Redondo" }, dv: { plain: "Liso", pale: "Partido", fess: "Cortado", chevron: "Cheurón", cross: "Cruz" }, ch: { star: "Estrella", tower: "Torre", ship: "Nave", anchor: "Ancla", sun: "Sol", wheat: "Trigo" }, bgInfo: { merchant: "+300 monedas", seafarer: "Barcos 15% más baratos de mantener", scholar: "+150 monedas y 5% menos de mantenimiento" },    hintOpen: "Compra barato donde un bien abunda, vende caro donde falta. Clic en un puerto para elegir destino y clic derecho para zarpar.",    hint0: "Misión 1: gana {goal} monedas en {days} días. Compra barato donde un bien abunda, vende caro donde falta. Clic en un puerto para elegir destino y clic derecho para zarpar.",
    hintSea: "Tu barco está en el mar. Espera para llegar.", hintAnchored: "Tu barco está al pairo. Clic derecho para darle un nuevo rumbo.", good: "Bien", price: "Precio", stock: "Stock", hold: "Bodega", holdValue: "Valor de la bodega aquí (aprox.)", cheap: "Barato: buen momento para comprar", dear: "Caro: buen momento para vender", lvl: { scarce: "Escaso", short: "Justo", normal: "Normal", plenty: "Abundante" }, lvlInfo: { scarce: "Escaso: buen momento para vender", short: "Justo: queda poco", normal: "Normal", plenty: "Abundante: buen momento para comprar" },
    seedLine: "Semilla de la partida: {s} (la misma semilla repite viento, piratas y sucesos)", difficulty: "Dificultad", diffName: { easy: "Fácil", normal: "Normal", hard: "Difícil" }, diffInfo: "Se elige al empezar la partida y no cambia después. Fácil: más monedas y menos gastos. Difícil: menos monedas y más gastos.",
    hud3d: "Arrastra para mirar, rueda para acercar, haz clic en un edificio para abrirlo.",
    openSea: "mar abierto", anchored: "al pairo", navNoSea: "Ahí no hay mar navegable.", navCannot: "Ese barco no puede cambiar de rumbo ahora.", freeNavLbl: "Navegación libre (experimental)", freeNavInfo: "Con la navegación libre mandas el barco con clic derecho a puertos y a puntos de las rutas navegables, y puedes fondear al pairo.", tabCity: "Ciudad", tabBuildings: "Edificios", bldInfo: "Tus parcelas y edificios en este puerto. Las casas suman vecinos (más demanda), el taller teje lana en paño al precio del mercado local y el almacén amplía tu depósito en 300 por nivel.", bldImport: "El mercado local no llega: se importan {n} materiales con recargo (incluido en el precio).", bldNone: "Aún no tienes parcelas en este puerto.", bldFree: "Parcelas libres", bldLoading: "Midiendo parcelas…", bldPlotsErr: "No se pudo medir el plano de parcelas de este puerto; inténtalo de nuevo al volver a entrar.", bldPlot: "Parcela", bldHType: "Edificio", bldHFx: "Efecto", bldHUp: "Mantenimiento", bldTypes: { house: "Casa", workshop: "Taller", warehouse: "Almacén", farm: "Granja", pasture: "Dehesa", sawmill: "Aserradero", mine: "Mina", oil_mill: "Almazara", vineyard: "Viñedo", saltworks: "Salina", brewery: "Cervecería", brickworks: "Ladrillería", esparto_field: "Espartizal", ranch: "Ganadería", dock: "Muelle", armory: "Armería", ironworks: "Fragua", fishery: "Pesca", soapworks: "Jabonería", pottery: "Alfarería", posito: "Pósito", hospital: "Hospital", alhondiga: "Alhóndiga", caminos: "Caminos", pozo: "Pozo", capilla: "Capilla", carniceria: "Carnicería", molino: "Molino", corral: "Corral de comedias", house_poor: "Casa pobre", house_comfortable: "Casa acomodada", house_rich: "Casa rica" }, bldState: { plot: "solar", construction: "en obras", active: "activo", halted: "parado", fire: "incendio" }, bldReady: "listo el día {d} ({p}%)", bldUpkeep: "mantenimiento {u}/día", bldFxW: "{r} lotes/día · margen ahora {m}/lote · {n} producidos", bldFxH: "+{n} habitantes", bldFxS: "+{n} de depósito", bldFxD: "-{n}% de peaje para tus barcos", bldBuy: "Comprar ({p})", bldBuild: "Construir", bldUpgrade: "Mejorar a nivel {l} ({p})", bldMax: "nivel máximo", bldConfirm: "Confirmar", bldCancel: "Cancelar", bldCost: "Coste {c} (materiales {m} + mano de obra {f}) · {d} días · mantenimiento {u}/día", bldFree3d: "{n} solares libres en este puerto: haz clic en uno en la vista 3D para comprarlo", bldNeedOffice: "Para construir en este puerto necesitas una oficina comercial propia: cómprala en la pestaña Oficina.", bldPick2d: "Elige una parcela tuya para construir o mejorar, o compra un solar libre.", wallTitle: "Murallas", wallInfo: "Las murallas rodean el puerto: cada nivel mantenido suma {p} habitantes efectivos. El hospital y la capilla solo se levantan dentro de una muralla de nivel 1.", wallLevel: "nivel {l} de {m}", wallNone: "Sin muralla", wallUnkept: "Sin guardia por impago: el impulso de la ciudad está suspendido.", wallBuild: "Obras de muralla · nivel {l} ({p})", officeBuy: "Comprar oficina comercial ({p})", officeReq: "Requisitos para la oficina: {p} monedas y respeto mínimo Conocido en este puerto (ahora: {r}, {n} puntos). Se construye con dinero, respeto y oficina.", officeOwned: "Tienes una oficina comercial en este puerto.", bldFxP: "{r} lotes/día · {n} producidos", bldWhy: { "good not producible in this city": "esta ciudad no produce ese bien", "office required": "necesitas una oficina comercial en este puerto", "respect required": "necesitas más respeto en este puerto", "missing materials": "faltan materiales en el mercado de este puerto", "walls required": "necesita muralla de nivel 1 en este puerto", "already building": "ya hay obras en curso" }, bldPopLine: "Población efectiva: {p} habitantes (+{b} por tus casas)", bldJobsLine: "Empleo: {j} puestos · {f} habitantes libres en el puerto · dotación {s}%", chartTitle: "Cartas de navegación", chartInfo: "Una carta pone toda una costa en tu mapa, sin revelar precios.", chartNames: { luz: "Costa de la Luz", portugal: "Costa portuguesa", cantabrico: "Costa Cantábrica", levante: "Levante y Cataluña", baleares: "Baleares", rif: "El Rif", marruecos: "Marruecos atlántico", berberia: "Berbería oriental" }, chartBuy: "Carta: {c} ({p})", routeRumorBtn: "Pagar por un rumor de ruta ({p})", routeRumorInfo: "Revela el puerto desconocido más cercano, con datos imprecisos.", bldJobsShort: "Faltan manos: la producción del puerto rinde al {s}% hasta que haya más habitantes.", bldJobsW: "{j} trabajadores", bldWagesW: "salarios {w}/día", bldHaltedNote: "Parado: no había caja para pagar mantenimiento y salarios. No produce ni acumula gastos hasta que lo reactives.", bldFireNote: "Incendio: cerrado hasta que el fuego se dé por domado. No produce ni acumula gastos.", bldRestart: "Reactivar", bldHint: "Tus parcelas y edificios llevan su nombre en la vista 3D: haz clic en uno para abrirlo y construir o mejorar.", townTypes: { inn: "Posada", smithy: "Herrería", chapel: "Capilla" }, townDesc: { inn: "La posada del barrio del muelle: comida caliente, vino y camas para marineros de paso. Aún no ofrece servicios.", smithy: "El taller del herrero: aperos, clavos y reparaciones de metal para el puerto. Aún no ofrece servicios.", chapel: "La capilla del barrio alto, donde los vecinos se encomiendan antes de zarpar. Aún no ofrece servicios." }, townNone: "Este edificio aún no ofrece servicios.", cityInfo: "Los habitantes se reparten en clases y cada clase tiene su cesta: la de los pobres se apoya en grano y pescado; la de artesanos y mercaderes pide paño, vino y aceite; la de los ricos, seda, pimienta y azúcar. Si un precio sube más de lo que una clase puede pagar, esa clase deja de comprarlo y aparece abajo como «sin dinero para…».", cityPopEff: "Población efectiva: {p} habitantes", cityPopBase: "base {n}", cityPopHouses: "{n} por tus casas", cityPopWalls: "{n} por las murallas", cityPopDrift: "{n} por vecinos que llegan o se van", ctTitle: "Encargo del concejo", ctInfo: "El concejo de este puerto pide una mercancía que le falta y paga una prima al que la traiga a tiempo. Vender esa mercancía aquí cuenta para el encargo.", ctOffer: "Piden {q} de {g} antes del día {d}. Prima al completar: {r}.", ctAccept: "Aceptar encargo", ctActive: "En curso: {g} {n}/{q}, entrega antes del día {d}.", ctNone: "El concejo no tiene encargos abiertos esta semana.", ctFull: "Ya llevas {n} encargos: cumple o deja caer uno antes de aceptar otro.", clsPoor: "Pobres", clsMiddle: "Artesanos y mercaderes", clsRich: "Ricos", cityBuys: "Compran sobre todo", cityOut: "Sin dinero para", cityCitizens: "habitantes", buy: "Comprar", sell: "Vender", sellAll: "Todo", seasons: { winter: "Invierno", spring: "Primavera", summer: "Verano", autumn: "Otoño" }, months: ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"], target: "Destino", sailGo: "Zarpar", ctxSail: "Zarpar a {city} ({d})", ctxSelect: "Elegir {city} como destino", hint: "Clic: elegir · Clic derecho o pulsación larga: menú · Arrastrar: mover · Rueda: zoom · Espacio: pausa · Intro: zarpar · 1-9: barco", daysLbl: "días", eta: "llegada: día {d}, {h}:00", view3d: "Vista 3D (experimental)", close: "Cerrar", bestLbl: "Mejor puerto según lo que sabes", noInfo: "No conoces los precios de otros puertos. Visita uno, ten almacén o pregunta en la taberna.", tabTavern: "Taberna", tabRoute: "Ruta", routeInfo: "Ruta automática: el barco compra en este puerto, vende en el destino y vuelve solo, una y otra vez. Usa las reglas normales de precios y gastos.", routeTo: "Destino", routeOut: "Comprar aquí", routeBack: "Comprar allí (vuelta)", routeNoBack: "Nada: vuelve vacío", routeSet: "Fijar ruta", routeCancel: "Cancelar ruta", routeNow: "Ruta activa: {a} ⇄ {b}, lleva {out}{back}. Viajes completados: {n}.", routeNone: "Este barco no tiene ruta.", routeBackTxt: " y trae {g}", routeAdv: "Ruta avanzada", routeAdvInfo: "Varias paradas en orden: en cada una el barco vende y luego compra lo que marques, y solo si el precio llega al límite. El freno de caja guarda siempre ese mínimo de monedas.", routeStop: "Parada {n}", routeColCity: "Puerto", routeBuyIf: "Comprar", routeSellIf: "Vender", routeAny: "—", routeBuyW: "compra", routeSellW: "vende", routeNoBuy: "sin compras", routeNoSell: "sin ventas", routeIfLe: "si ≤ {p}", routeIfGe: "si ≥ {p}", routeMinCash: "Freno de caja", routeAddStop: "Añadir parada", routeDelStop: "Quitar", routeSetAdv: "Fijar ruta avanzada", routeSetErr: "No se pudo fijar: hacen falta al menos 2 paradas y no valen dos ciudades iguales seguidas.", routeNow2: "Ruta activa ({n} paradas) · Vueltas: {l} · Freno de caja: {m}", tabBank: "Banco", tabOffice: "Oficina",  crewTitle: "Tripulación", crewMin: "mínimo", crewOpt: "óptima", crewMax: "máxima", crewShort: "Faltan marineros: con menos del mínimo el barco no zarpa.", crewSpeed: "Velocidad: {s} % (menos que la óptima va más lento; completa, algo más rápido y con más defensa).", crewHire: "Contratar {n} ({p})", crewDismiss: "Despedir {n}", cannonBuy: "Comprar cañón ({p}) · {n}/{m}", gunRepair: "Reparar armamento {c}% ({p})", gunNone: "Sin cañones", weaponBuy: "{w} ({p})", weaponInfo: "Armamento {n}/{m}: cada pieza suma potencia frente a piratas, pesa mantenimiento diario y se desgasta en el mar.", weaponList: "{w}", weaponNames: { ballista: "Balista", catapult: "Catapulta", cannon: "Cañón", bombard: "Bombarda" }, weaponPowerLbl: "potencia {p}", tabHouse: "Casa", bankInfo: "El prestamista del puerto. Solo puedes pedir dinero si tienes un barco amarrado aquí. Interés: {r} % a la semana sobre lo que debes. Máximo: la mitad de tu patrimonio (tope {m}). Si un préstamo vence, el banco lo cobra de tu caja aunque la deje en negativo. El dinero prestado no cuenta para la meta.", bankRoom: "Puedes pedir hasta", bankOwed: "Debes al banco", bankNone: "No tienes préstamos.", bankTake: "Pedir {a}", bankLoan: "Préstamo del día {d}: debes {l}, vence el día {u}", bankRepay: "Devolver todo", bankRepay100: "Devolver 100", ctaTitle: "Informantes", ctaInfo: "Un informante local te manda los precios de su puerto cada 7 días durante un mes: imprecisos, y a veces mal informado. Donde tienes barco o almacén siempre mandan tus propios ojos.", ctaHire: "Contratar informante aquí ({p})", ctaActive: "{city}: informa cada 7 días (quedan {n} d)", ctaMax: "Máximo {n} informantes.", tavernInfo: "Entre jarras y humo, marineros y mercaderes cuentan lo que saben de otros puertos. Un trago y una moneda compran un rumor: viejo y con algo de exageración.", tavernNone: "Aquí ya lo sabes todo: tienes barco o almacén en todos los puertos.", rumorBtn: "Pagar una ronda por un rumor ({p})", rumorPick: "Puerto", rumorOk: "Apuntado: {city}, hoy. Lo que te cuentan es un rumor, impreciso.", rumorErrKnown: "Ese puerto ya lo ves con tus propios ojos: tienes barco o almacén allí.", rumorErrCash: "No te llega para la ronda ({price}).", ageNow: "hoy", ageDays: "hace {n} d", rumorTag: "rumor, impreciso", bestRow: "{city}: ≈ {r} monedas ({p} de ganancia), {d} días", trend7: "Cambio en 7 días", qtyAll: "Cantidad",tipHdrPlay:"Pausar o reanudar (Espacio)",tipHdrSpeed:"Velocidad del tiempo",tipReports:"Informes de tu compañía",tipMsgs:"Mensajes y avisos",tipLang:"Cambiar idioma / Switch language",tipMenu:"Abrir el menú (Esc)",tipQty:"Cantidad de cada compra o venta",tipBuild:"Construir y mejorar edificios",tipShips:"Barcos atracados aquí",tipBack:"Volver al mapa",toastBought:"Compraste {q} {g} por {c}",toastSold:"Vendiste {q} {g} por {c}", avgLbl: "Media", previewHint: "Pasa por un bien para ver el trato", maxLbl: "Max", dealBuy: "Compras {q}: {c} (media {a}, precio pasa a {n})", dealSell: "Vendes {q}: {c} (media {a}, precio pasa a {n})", profit: "ganancia", loss: "pérdida", capCash: "limitado por tus monedas", capStock: "limitado por el stock", capRoom: "limitado por la bodega", qtyLbl: "Cantidad", sailTo: "Zarpar a", days: "días", arrive: "Esperar llegada",    caravel: "Comprar carabela ({p})", at: "En", sea: "En el mar hacia", win: "¡Victoria! Alcanzaste la meta.", lose: "Se acabó el tiempo. Patrimonio final:", bankrupt: "Quiebra: la deuda pasó del límite. Patrimonio final:",    cap: "Carga", log: { warehouse: "Día {day}: compras un almacén en {city}", arrive: "Día {day}: el barco {ship} llega a {city}", buy: "Día {day}: compraste {qty} {good} por {sum}", sell: "Día {day}: vendiste {qty} {good} por {sum}", sail: "Día {day}: el barco {ship} zarpa a {city} (≈ {hours} h)", caravel: "Día {day}: compras una carabela en {city}", ordered: "Día {day}: encargas un barco en {city}", built: "Día {day}: tu barco {ship} está listo en {city}", discovered: "Día {day}: descubres el puerto de {city}", rumor: "Día {day}: pagas una ronda ({price}) en la taberna de {at}: te cuentan cómo anda el mercado de {city}. Rumor, impreciso." }, goods: { grain: "Trigo", fish: "Pescado", salt: "Sal", wool: "Lana", iron: "Hierro", ironware: "Herrajes", timber: "Madera", cloth: "Paño", olive_oil: "Aceite", wine: "Vino", silk: "Seda", sugar: "Azúcar", pepper: "Pimienta", saffron: "Azafrán", beer: "Cerveza", bricks: "Ladrillos", esparto: "Esparto", meat: "Carne", pottery: "Cerámica", legumes: "Legumbres", leather: "Cuero", soap: "Jabón" },    types: { barca: "Barca", cog: "Coca", caravel: "Carabela", nao: "Nao" }, tabHall: "Ayuntamiento", hallInfo: "El concejo gobierna el puerto: nombra al alcalde, vela por el muelle y fija los derechos que paga quien comercia.", hallMayor: "Alcalde", hallRegs: "Regidor", hallStand: "Trato del concejo contigo: {r} ({n} puntos de respeto). El respeto de un puerto crece con lo que vendes en él.", hallDerechos: "Derechos del concejo", hallFee: "Almojarifazgo: el {p} % de lo que compres y vendas en este mercado", hallToll: "Portazgo al atracar: la capacidad del barco entre {d} (tu descuento por respeto: {x} %)", hallNote: "El concejo se reúne en sala capitular y sus acuerdos se pregonan en la plaza.", hallCaja: "Caja del concejo: {c} monedas", hallLevies: "Nivel de tasas: sisa {s} · portazgo {p} (0 = lo normal; subidas y bajadas las vota el concejo)", hallNext: "Próximo cabildo: día {d}", cvIn: "Convoy: {name} · {n} barcos. Si zarpan juntos, la escolta suma el armamento de todo el grupo contra los piratas.", cvForm: "Formar convoy aquí ({n} barcos)", cvLeave: "Salir del convoy", cvSailNote: "Zarpan juntos al ritmo del más lento.", indTitle: "Industria del puerto", indInfo: "Los talleres, granjas y casas de contratación que dan trabajo a los vecinos y sostienen la producción de este mercado. Cambian de manos en la almoneda del concejo.", indLevel: "nivel {l}", indJobs: "{n} trabajadores", indCouncil: "del concejo", indYours: "de tu casa", indSoldNpc: "vendido en almoneda", indTypes: { tannery: "Curtiduría", trading_post: "Casa de contratación" }, almTitle: "Almoneda", almInfo: "Un día por semana la almoneda vende en la plaza lo que sale en este puerto: un establecimiento, un barco de segunda mano o una casa de vecinos, del concejo o de un vecino. Dejas una puja máxima por cada lote: gana la más alta y paga una moneda sobre la segunda. El martillo cae al final del día.", almNext: "Próxima almoneda: día {d}", almLot: "{x} ({g})", almSeller: "Vendedor", almReserve: "precio de salida {p}", almBidders: "Se dice que pujan:", almNoBidders: "Hoy no se esperan pujadores.", almBid: "Dejar puja máxima", almBidPlaced: "Tu puja: {p} · se juzga al caer el martillo", almNone: "Hoy no hay almoneda en este puerto.", almErr: "Revisa la puja: un número entero de monedas.", almErrCash: "No tienes tantas monedas para esa puja.", almToday: "Almoneda hoy en la plaza: el martillo cae al final del día.", almFollowing: "Siguiente almoneda: día {d}", almSellShipTitle: "Vender un barco", almSellShipInfo: "Los barcos se venden solo aquí, en la almoneda: el concejo paga el valor del barco al momento. El barco debe estar amarrado en este puerto y con la bodega vacía.", almSellShipNone: "No tienes barcos amarrados en este puerto." },  en: { stSound: "Sound", credKenney: "Sound: Kenney (kenney.nl) and rubberduck (opengameart.org), CC0.", play: "▶ Resume", pause: "⏸ Pause", pauseArrive: "⏸ {ship} has arrived at {city} · time paused", speed: "Speed", day: "Day", cash: "Coins", goal: "Goal", ships: "Ships", new: "New game", cont: "Continue", resume: "Resume", saveNow: "Save now", quit: "Quit to title", stTitle: "Settings", stText: "Text size", stNormal: "Normal", stLarge: "Large", stMotion: "Reduce motion", stNote: "Settings are stored on this device.", cred: "Credits", credGame: "sea trading on the Iberian coast, 15th-16th century.", credOwn: "Design, code, data and illustrations: Marco Tevar (MIT code, CC BY 4.0 art).", credNE: "Coastlines and background chart: Natural Earth (public domain).", credPop: "Populations around 1500: Bairoch, Batou and Chèvre (1988), via J. W. Russ's transcription.", credOsm: "Port coordinates: © OpenStreetMap contributors (ODbL).", credGen: "City streets and plots: gen-city, by Nikita Galadiy (MIT).", credThree: "3D view: three.js (MIT).", lang2: "Language", speedDef: "Speed", paused: "Game paused", keys: "Shortcuts: Esc: close menu · Space: pause · Wheel: map zoom · Drag: pan map", alTitle: "Price alerts", alInfo: "Mark a price in this port and a messenger lets you know the day the market crosses it (one-shot notices). Handy to know when to come back.", alBelow: "falls below", alAbove: "rises above", alSet: "Set alert", alNone: "No alerts in this port.", alElse: "Price alerts in other ports: {n}.", alPrice: "price", alErr: "Check the alert: the price must be a number, and you can set at most 8 alerts.", tabMarket: "Market", tabYard: "Shipyard", tabStore: "Warehouse", tabLonja: "Exchange", warehouse: "Stored", yardInfo: "Order ships (delivered after the build time; no fleet limit: daily upkeep is the brake) and repair the hull. To sell a ship, take it to the town-hall auction.", order: "Order {type} ({p}, {d} days, cargo {c})", repair: "Repair hull {h}% ({p})", sellShip: "Sell ship ({p})", orders: "Under construction", ready: "{type} at {city}, ready on day {day} ({pct}%)", yardEmpty: "The slipway is free.", orderShort: "Order ({p})", yc: "Cargo {c} · {d} days · upkeep {u}/day", buyWh: "Buy warehouse ({p})", whInfo: "Store goods in this port (up to 300 units).", whEmpty: "Empty", store: "Store", take: "Take", admTitle: "Warehouse steward", admInfo: "Standing orders: buy when the price drops to your cap (up to the stock target) and sell when it rises to your floor (keeping the amount you choose). Acts once a day and never spends your reserve. The cap and the floor compare against the market price, before the port fee (added when buying, subtracted when selling).", admRule: "buy ≤ {b} up to {n} · sell ≥ {v} keeping {k}", admNoRules: "No standing orders yet.", admGood: "Good", admBuy: "Max buy price (market, before fee)", admTo: "Stock target", admSell: "Min sell price (market, before fee)", admKeep: "Keep", admSet: "Save order", admClear: "Remove", admReserve: "Coin reserve", admReserveSet: "Set reserve", admErr: "Check the order: the buy cap must stay below the sell floor and the target within capacity.", start: "Start", company: "Name of your trading house", defCo: "My Trading House", tagline: "Sea trading on the Iberian coast, 15th-16th century", menu: "Menu", saved: "Game saved", noSave: "No saved game", exportS: "Export", importS: "Import", badSave: "That file is not a valid save", restB: "Restore previous backup", restInfo: "Goes back to the save kept before the last import.", splashLast: "Last game", mapAlt: "Map of Iberia and the Strait", replaceTitle: "You already have a saved game", replaceBody: "Saved: {s}. If you start a new one, the current game is kept as the previous backup (\"Restore previous backup\" on the title screen). You can export it first.", replaceGo: "Start new game", restDone: "Previous backup restored.", errB: "Could not keep the safety backup: import cancelled.", restConfirm: "Restore the previous backup? The current save becomes the safety copy (restore again to undo).", expDone: "Copy downloaded.", create: "Create your trading house", character: "Your name", portrait: "Portrait", crest: "Coat of arms", shield: "Shape", division: "Division", charge: "Emblem", c1: "Main colour", c2: "Second colour", home: "Home port", background: "Background", back: "Back", sh: { heater: "Classic", round: "Round" }, dv: { plain: "Plain", pale: "Split", fess: "Cut", chevron: "Chevron", cross: "Cross" }, ch: { star: "Star", tower: "Tower", ship: "Ship", anchor: "Anchor", sun: "Sun", wheat: "Wheat" }, bgInfo: { merchant: "+300 coins", seafarer: "Ships cost 15% less to keep", scholar: "+150 coins and 5% lower upkeep" },
    hintOpen: "Buy cheap where a good is plentiful, sell dear where it is scarce. Click a port to choose a destination, right-click to sail.",
    hint0: "Mission 1: earn {goal} coins in {days} days. Buy cheap where a good is plentiful, sell dear where it is scarce. Click a port to choose a destination, right-click to sail.",
    hintSea: "Your ship is at sea. Wait to arrive.", hintAnchored: "Your ship is holding position. Right-click to set a new course.", good: "Good", price: "Price", stock: "Stock", hold: "Hold", holdValue: "Hold value here (approx.)", cheap: "Cheap: good time to buy", dear: "Dear: good time to sell", lvl: { scarce: "Scarce", short: "Short", normal: "Normal", plenty: "Plenty" }, lvlInfo: { scarce: "Scarce: good time to sell", short: "Short: not much left", normal: "Normal", plenty: "Plenty: good time to buy" },
    seedLine: "Game seed: {s} (the same seed gives the same wind, pirates and events)", difficulty: "Difficulty", diffName: { easy: "Easy", normal: "Normal", hard: "Hard" }, diffInfo: "Chosen when the game starts and fixed afterwards. Easy: more coins and lower costs. Hard: fewer coins and higher costs.",
    hud3d: "Drag to look around, wheel to zoom, click a building to open it.",
    openSea: "open sea", anchored: "holding position", navNoSea: "No navigable sea there.", navCannot: "That ship cannot change course now.", freeNavLbl: "Free navigation (experimental)", freeNavInfo: "With free navigation you send the ship with a right click to ports and points along the navigable routes, and can anchor offshore.", tabCity: "City", tabBuildings: "Buildings", bldInfo: "Your plots and buildings in this port. Houses add citizens (more demand), the workshop weaves wool into cloth at local market prices and the warehouse adds 300 storage per level.", bldImport: "Local stock falls short: {n} materials are imported at a premium (included in the price).", bldNone: "You own no plots in this port yet.", bldFree: "Free plots", bldLoading: "Surveying plots…", bldPlotsErr: "Could not survey this port's plot plan; try reopening the tab.", bldPlot: "Plot", bldHType: "Building", bldHFx: "Effect", bldHUp: "Upkeep", bldTypes: { house: "House", workshop: "Workshop", warehouse: "Warehouse", farm: "Farm", pasture: "Pasture", sawmill: "Sawmill", mine: "Mine", oil_mill: "Oil mill", vineyard: "Vineyard", saltworks: "Saltworks", brewery: "Brewery", brickworks: "Brickworks", esparto_field: "Esparto field", ranch: "Ranch", dock: "Dock", armory: "Armory", ironworks: "Ironworks", fishery: "Fishery", soapworks: "Soapworks", pottery: "Pottery", posito: "Granary", hospital: "Hospital", alhondiga: "Corn exchange", caminos: "Streets", pozo: "Well", capilla: "Chapel", carniceria: "Butcher's", molino: "Mill", corral: "Playhouse", house_poor: "Poor house", house_comfortable: "Well-off house", house_rich: "Rich house" }, bldState: { plot: "empty plot", construction: "under construction", active: "active", halted: "halted", fire: "fire" }, bldReady: "ready on day {d} ({p}%)", bldUpkeep: "upkeep {u}/day", bldFxW: "{r} batches/day · margin now {m}/batch · {n} produced", bldFxH: "+{n} citizens", bldFxS: "+{n} storage", bldFxD: "-{n}% toll for your ships", bldBuy: "Buy ({p})", bldBuild: "Build", bldUpgrade: "Upgrade to level {l} ({p})", bldMax: "max level", bldConfirm: "Confirm", bldCancel: "Cancel", bldCost: "Cost {c} (materials {m} + labour {f}) · {d} days · upkeep {u}/day", bldFree3d: "{n} free plots in this port: click one in the 3D view to buy it", bldNeedOffice: "To build in this port you need your own trading office: buy one in the Office tab.", bldPick2d: "Pick one of your plots to build or upgrade, or buy a free plot.", wallTitle: "Walls", wallInfo: "Walls ring the port: each maintained level adds {p} effective citizens. The hospital and the chapel only stand inside level-1 walls.", wallLevel: "level {l} of {m}", wallNone: "No walls", wallUnkept: "Watch unpaid: the city growth bonus is suspended.", wallBuild: "Wall works · level {l} ({p})", officeBuy: "Buy a trading office ({p})", officeReq: "Office requirements: {p} coins and at least Known respect in this port (now: {r}, {n} points). Building takes money, respect and an office.", officeOwned: "You own a trading office in this port.", bldFxP: "{r} batches/day · {n} produced", bldWhy: { "good not producible in this city": "this city does not produce that good", "office required": "you need a trading office in this port", "respect required": "you need more respect in this port", "missing materials": "not enough building materials in this port's market", "walls required": "requires level-1 walls in this port", "already building": "works already under way" }, bldPopLine: "Effective population: {p} citizens (+{b} from your houses)", bldJobsLine: "Jobs: {j} positions · {f} citizens free to hire in this port · staffing {s}%", chartTitle: "Navigation charts", chartInfo: "A chart puts a whole coast on your map, without revealing prices.", chartNames: { luz: "Costa de la Luz", portugal: "Portuguese coast", cantabrico: "Cantabrian coast", levante: "Levante & Catalonia", baleares: "Balearics", rif: "The Rif", marruecos: "Atlantic Morocco", berberia: "Eastern Barbary" }, chartBuy: "Chart: {c} ({p})", routeRumorBtn: "Buy a route rumour ({p})", routeRumorInfo: "Reveals the nearest unknown port, with inexact figures.", bldJobsShort: "Short of hands: the port's production runs at {s}% until more citizens move in.", bldJobsW: "{j} workers", bldWagesW: "wages {w}/day", bldHaltedNote: "Halted: there was no cash for upkeep and wages. It produces nothing and accrues no costs until you restart it.", bldFireNote: "Fire: closed until the fire is under control. It produces nothing and accrues no costs.", bldRestart: "Restart", bldHint: "Your plots and buildings carry their name in the 3D view: click one to open it and build or upgrade.", townTypes: { inn: "Inn", smithy: "Smithy", chapel: "Chapel" }, townDesc: { inn: "The quayside inn: hot food, wine and beds for passing sailors. No services yet.", smithy: "The smith's workshop: tools, nails and metal repairs for the port. No services yet.", chapel: "The upper-quarter chapel, where neighbours pray before sailing. No services yet." }, townNone: "This building offers no services yet.", cityInfo: "Citizens are split into classes and each class has its own basket: the poor lean on grain and fish, craftsmen and merchants ask for cloth, wine and oil, and the rich for silk, pepper and sugar. When a price climbs past what a class can pay, that class stops buying it and it shows below as 'cannot afford'.", cityPopEff: "Effective population: {p} citizens", cityPopBase: "base {n}", cityPopHouses: "{n} from your houses", cityPopWalls: "{n} from the walls", cityPopDrift: "{n} from neighbours moving in or out", ctTitle: "Town-council contract", ctInfo: "This port's council asks for a good it lacks and pays a premium to whoever brings it in time. Selling that good here counts towards the contract.", ctOffer: "They want {q} of {g} before day {d}. Premium on completion: {r}.", ctAccept: "Accept contract", ctActive: "Under way: {g} {n}/{q}, deliver before day {d}.", ctNone: "The council has no open contracts this week.", ctFull: "You already carry {n} contracts: finish or drop one before taking another.", clsPoor: "Poor", clsMiddle: "Craftsmen and merchants", clsRich: "Rich", cityBuys: "Mostly buy", cityOut: "Cannot afford", cityCitizens: "citizens", buy: "Buy", sell: "Sell", sellAll: "All", seasons: { winter: "Winter", spring: "Spring", summer: "Summer", autumn: "Autumn" }, months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], target: "Destination", sailGo: "Sail", ctxSail: "Sail to {city} ({d})", ctxSelect: "Choose {city} as destination", hint: "Click: choose · Right-click or long press: menu · Drag: pan · Wheel: zoom · Space: pause · Enter: sail · 1-9: ship", daysLbl: "days", eta: "arrives: day {d}, {h}:00", view3d: "3D view (experimental)", close: "Close", bestLbl: "Best port given what you know", noInfo: "You do not know other ports' prices. Visit one, own a warehouse or ask at the tavern.", tabTavern: "Tavern", tabRoute: "Route", routeInfo: "Automatic route: the ship buys at this port, sells at the destination and comes back by itself, again and again. Normal price and cost rules apply.", routeTo: "Destination", routeOut: "Buy here", routeBack: "Buy there (return)", routeNoBack: "Nothing: returns empty", routeSet: "Set route", routeCancel: "Cancel route", routeNow: "Active route: {a} ⇄ {b}, carries {out}{back}. Trips completed: {n}.", routeNone: "This ship has no route.", routeBackTxt: " and brings back {g}", routeAdv: "Advanced route", routeAdvInfo: "Several stops in order: at each one the ship sells then buys what you mark, only when the price meets the limit. The cash brake always keeps at least that many coins.", routeStop: "Stop {n}", routeColCity: "Port", routeBuyIf: "Buy", routeSellIf: "Sell", routeAny: "—", routeBuyW: "buys", routeSellW: "sells", routeNoBuy: "no buys", routeNoSell: "no sells", routeIfLe: "if ≤ {p}", routeIfGe: "if ≥ {p}", routeMinCash: "Cash brake", routeAddStop: "Add stop", routeDelStop: "Remove", routeSetAdv: "Set advanced route", routeSetErr: "Could not set it: you need at least 2 stops and no repeated city back to back.", routeNow2: "Active route ({n} stops) · Runs: {l} · Cash brake: {m}", tabBank: "Bank", tabOffice: "Office", crewTitle: "Crew", crewMin: "minimum", crewOpt: "optimal", crewMax: "maximum", crewShort: "Short of sailors: below the minimum the ship will not sail.", crewSpeed: "Speed: {s}% (slower below the optimal crew; a full crew is a bit faster with more defence).", crewHire: "Hire {n} ({p})", crewDismiss: "Dismiss {n}", cannonBuy: "Buy a cannon ({p}) · {n}/{m}", gunRepair: "Repair armament {c}% ({p})", gunNone: "No cannons", weaponBuy: "{w} ({p})", weaponInfo: "Armament {n}/{m}: each piece adds power against pirates, costs daily upkeep and wears at sea.", weaponList: "{w}", weaponNames: { ballista: "Ballista", catapult: "Catapult", cannon: "Cannon", bombard: "Bombard" }, weaponPowerLbl: "power {p}", tabHouse: "House", bankInfo: "The port moneylender. You can only borrow while one of your ships is docked here. Interest: {r}% a week on what you owe. Limit: half of your net worth (cap {m}). When a loan falls due the bank takes it from your cash even if that makes it negative. Borrowed money does not count towards the goal.", bankRoom: "You can borrow up to", bankOwed: "You owe the bank", bankNone: "You have no loans.", bankTake: "Borrow {a}", bankLoan: "Loan from day {d}: you owe {l}, due on day {u}", bankRepay: "Pay back all", bankRepay100: "Pay back 100", ctaTitle: "Contacts", ctaInfo: "A local contact sends you his port's prices every 7 days for a month: inexact, and sometimes wrong. Where you keep a ship or a warehouse, your own eyes always win.", ctaHire: "Hire a contact here ({p})", ctaActive: "{city}: reports every 7 days ({n} d left)", ctaMax: "At most {n} contacts.", tavernInfo: "Between mugs and smoke, sailors and merchants tell what they know of other ports. A drink and a coin buy a rumour: old, and a little exaggerated.", tavernNone: "You already know it all: you have a ship or warehouse in every port.", rumorBtn: "Buy a round for a rumour ({p})", rumorPick: "Port", rumorOk: "Noted: {city}, as of today. What you hear is a rumour, inexact.", rumorErrKnown: "You already see that port first-hand: you keep a ship or warehouse there.", rumorErrCash: "You cannot cover the round ({price}).", ageNow: "today", ageDays: "{n} d ago", rumorTag: "rumour, inexact", bestRow: "{city}: ≈ {r} coins ({p} profit), {d} days", trend7: "Change over 7 days", qtyAll: "Amount",tipHdrPlay:"Pause or resume (Space)",tipHdrSpeed:"Time speed",tipReports:"Your company reports",tipMsgs:"Messages and notices",tipLang:"Switch language / Cambiar idioma",tipMenu:"Open the menu (Esc)",tipQty:"Amount of each purchase or sale",tipBuild:"Construct and upgrade buildings",tipShips:"Ships docked here",tipBack:"Back to map",toastBought:"You bought {q} {g} for {c}",toastSold:"You sold {q} {g} for {c}", avgLbl: "Avg cost", previewHint: "Hover or focus a good to preview the deal", maxLbl: "Max", dealBuy: "You buy {q}: {c} (avg {a}, price moves to {n})", dealSell: "You sell {q}: {c} (avg {a}, price moves to {n})", profit: "profit", loss: "loss", capCash: "limited by your coins", capStock: "limited by stock", capRoom: "limited by hold space", qtyLbl: "Quantity", sailTo: "Sail to", days: "days", arrive: "Wait for arrival",    caravel: "Buy a caravel ({p})", at: "At", sea: "Sailing to", win: "Victory! You reached the goal.", lose: "Time is up. Final net worth:", bankrupt: "Bankrupt: your debt passed the limit. Final net worth:",    cap: "Cargo", log: { warehouse: "Day {day}: you buy a warehouse in {city}", arrive: "Day {day}: ship {ship} arrives at {city}", buy: "Day {day}: you bought {qty} {good} for {sum}", sell: "Day {day}: you sold {qty} {good} for {sum}", sail: "Day {day}: ship {ship} sails to {city} (≈ {hours} h)", caravel: "Day {day}: you buy a caravel at {city}", ordered: "Day {day}: you order a ship in {city}", built: "Day {day}: your ship {ship} is ready in {city}", discovered: "Day {day}: you discover the port of {city}", rumor: "Day {day}: you buy a round ({price}) at the {at} tavern: you hear how the {city} market is doing. Rumour, inexact." }, goods: { grain: "Grain", fish: "Fish", salt: "Salt", wool: "Wool", iron: "Iron", ironware: "Ironware", timber: "Timber", cloth: "Cloth", olive_oil: "Olive oil", wine: "Wine", silk: "Silk", sugar: "Sugar", pepper: "Pepper", saffron: "Saffron", beer: "Beer", bricks: "Bricks", esparto: "Esparto", meat: "Meat", pottery: "Pottery", legumes: "Legumes", leather: "Leather", soap: "Soap" }, tabHall: "Town hall", hallInfo: "The council governs the port: it names the mayor, watches over the quay and sets the duties every trader pays.", hallMayor: "Mayor", hallRegs: "Councillor", hallStand: "How the council regards you: {r} ({n} respect points). A port's respect grows with what you sell there.", hallDerechos: "Council duties", hallFee: "Almojarifazgo: {p}% of what you buy and sell in this market", hallToll: "Toll on docking: the ship's capacity divided by {d} (your respect discount: {x}%)", hallNote: "The council meets in its chapter house and proclaims its rulings in the square.", hallCaja: "Council chest: {c} coins", hallLevies: "Tax levels: excise {s} · toll {p} (0 = normal; the council votes raises and cuts)", hallNext: "Next council meeting: day {d}", cvIn: "Convoy: {name} · {n} ships. Sailing together, the escort adds the whole group's armament against pirates.", cvForm: "Form convoy here ({n} ships)", cvLeave: "Leave convoy", cvSailNote: "They sail together at the pace of the slowest.", indTitle: "Port industry", indInfo: "The workshops, farms and trading houses that employ the townsfolk and sustain this market's output. They change hands at the council auction.", indLevel: "level {l}", indJobs: "{n} workers", indCouncil: "council-owned", indYours: "yours", indSoldNpc: "sold at auction", indTypes: { tannery: "Tannery", trading_post: "Trading house" }, almTitle: "Town auction", almInfo: "One day a week the town auction sells whatever comes up in this port: an establishment, a second-hand ship or a town house, from the council or a neighbour. You leave a maximum bid per lot: the highest wins and pays one coin over the second. The hammer falls at the end of the day.", almNext: "Next auction: day {d}", almLot: "{x} ({g})", almSeller: "Seller", almReserve: "reserve {p}", almBidders: "Rumoured bidders:", almNoBidders: "No bidders expected today.", almBid: "Leave maximum bid", almBidPlaced: "Your bid: {p} · judged when the hammer falls", almNone: "No auction in this port today.", almErr: "Check the bid: the amount must be a whole number of coins.", almErrCash: "You do not have that many coins for that bid.", almToday: "Auction today in the square: the hammer falls at the end of the day.", almFollowing: "Following auction: day {d}", almSellShipTitle: "Sell a ship", almSellShipInfo: "Ships are sold only here, at the town auction: the council pays the ship's value on the spot. The ship must be docked in this port with an empty hold.", almSellShipNone: "You have no ships docked in this port.",types: { barca: "Barque", cog: "Cog", caravel: "Caravel", nao: "Nao" } },};
let lang = localStorage.getItem("lang") || (navigator.language?.toLowerCase().startsWith("es") ? "es" : "en"), t = T[lang], g, sel = 0;
const TW = { es: { title: "Atalayas", none: "Sin atalayas", count: "{n} de {m} atalayas en pie", cardN: "atalaya {n} de {m} tras la obra", watch: "vigilancia de incendios ({n})", upkeep: "guardia {u}/día", unkept: "Sin paga, las atalayas están desguarnecidas: nadie vigila los fuegos.", build: "Levantar la atalaya {n} · {p}", info: "Montadas sobre la muralla; su guardia avista los fuegos antes de que prendan.", why: { "walls required": "Necesitan la muralla en pie (nivel 1)" } }, en: { title: "Watchtowers", none: "No watchtowers", count: "{n} of {m} watchtowers standing", cardN: "watchtower {n} of {m} after the works", watch: "fire watch ({n})", upkeep: "watch {u}/day", unkept: "Unpaid, the watchtowers stand unmanned: no one watches for fires.", build: "Raise watchtower {n} · {p}", info: "Mounted on the wall; their watch spots fires before they take.", why: { "walls required": "They need a standing wall (level 1)" } } }; // lane C (issue #363): tower strings live OUTSIDE T.es/T.en while the EN sweep (issue #20) owns those long lines
const CLOSE_ICON = `<svg class="x-ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6.5 6.5 L17.5 17.5 M17.5 6.5 L6.5 17.5" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>`;
const $ = (id) => document.getElementById(id), fmt = (n) => Math.round(n).toLocaleString(lang), fmtM = (n) => (Math.round(n * 100) / 100).toLocaleString(lang, { maximumFractionDigits: 2 }); // fmtM: money, cents shown when they exist; integers render the same as fmt
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
document.body?.classList.toggle("text-large", localStorage.getItem("text-size") === "large");
document.body?.classList.toggle("reduce-motion", localStorage.getItem("reduce-motion") === "1");
// Moving ships. The view only reads sim state; the sim advances on the daily tick below.
// `progress` is how much of the current day has elapsed (0 to 1). It is kept across pause,
// resume and speed changes, so ships never move backwards or jump.
let playing = false, speed = Math.min(8, Math.max(1, +localStorage.getItem("speed") || 1)), progress = 0, lastFrame = 0, tickAcc = 0;
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
// A convoy at sea shares one position: spread its members on a tight ring (marker space, so it scales with the icons at every zoom), stable by ship id.
const convoyOffset = (sh) => {
  const cv = sh.voyage && convoyOf(g, sh), n = cv ? cv.ships.length : 0, i = n > 1 ? [...cv.ships].sort((a, b) => a - b).indexOf(sh.id) : -1;
  if (i < 0) return "";
  const a = (2 * Math.PI * i) / n - Math.PI / 2, rad = n === 2 ? 8 : 10;
  return `translate(${(Math.cos(a) * rad).toFixed(1)} ${(Math.sin(a) * rad).toFixed(1)}) `;
};
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
    const rot = el.firstElementChild; if (rot) { const off = convoyOffset(sh); rot.setAttribute("transform", `${off}rotate(${ang}) scale(1.7)`); const lab = el.querySelector("text"); if (lab) lab.setAttribute("transform", off); }
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
    if (arrivedAt >= 0) { playing = false; typeof sfx === "function" && sfx("arrive"); // pause when your ship arrives (guarded: test VMs have no sfx)
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
let fleetFilter="all",fleetSearch="";
let marketSearch = "", marketCargoOnly = false, marketCompare = "", marketQty = 10;
let city3dId = null; // city shown in the 3D/2D view, for the right-panel badges
let tab = "market"; let rumorNote = null; let almNote = null; // transient almoneda feedback for the max-bid button // transient tavern feedback for the round-for-a-rumour button // per-good quantity chosen in the market table
let shipWin = null; // open ship window { tab }: always shows the selected ship (docs/design/ship-window.md)
let bldAction = null, bldError = null; const plotsCache = {}; // armed Buildings-tab action; seeded layout plots per city (async)
function ensurePlots(city) { if (plotsCache[city] && plotsCache[city] !== "error") return; plotsCache[city] = "loading"; cityPlots(city, world.nodes[city]?.pop ?? 8000).then((l) => { plotsCache[city] = l.plots; if ((tab === "buildings" || tab === "plot") && ship().at === city) render(); }).catch(() => { plotsCache[city] = "error"; if ((tab === "buildings" || tab === "plot") && ship().at === city) render(); }); }
const SAVE_KEY = "almojarife.save.v1";
let company = "";
let inTitle = true; // boot lands on the title screen over a throwaway background game
function autosave() { try { if (inTitle) return; localStorage.setItem(SAVE_KEY, JSON.stringify(packGame(g, company))); } catch {} }
function loadSaved() { try { const raw = localStorage.getItem(SAVE_KEY); if (!raw) return null; return unpackGame(JSON.parse(raw), world); } catch { return null; } }
function getBackup() { try { return localStorage.getItem(BACKUP_KEY); } catch { return null; } }
function getTmp() { try { return localStorage.getItem(TMP_KEY); } catch { return null; } }
function isValidSaveText(txt) { try { unpackGame(JSON.parse(txt), world); return true; } catch { return false; } }
function recoverRotations() { try { finishPendingRotation(localStorage, isValidSaveText); return true; } catch { return false; } }
function exportSave(raw = localStorage.getItem(SAVE_KEY), day = loadSaved()?.g?.day) { if (!raw) return; const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([raw], { type: "application/json" })); a.download = saveFileName(day); a.click(); URL.revokeObjectURL(a.href); }
const cityIds = world.cities.map((c) => c.id), cityIdSet = new Set(cityIds);
// P3 visual route strip: module-level so the live preview can re-render without a full panel render (focus-safe)
const rpathChip = (city, io) => `<span class="rpath-stop"><b>${cityName(city)}</b><span class="rpath-io">${io || t.routeAny}</span></span>`; // one port of the route, with what the ship does there
const rpathGn = (k) => goodIcon(k, 16) + (t.goods[k] ?? k);
const rpathIo = (buys, sells) => // buys/sells: {good, maxPrice|minPrice} — visual: up-arrow buys, down-arrow sells, icons from the market
  (sells.length ? `<span class="rpath-sell" aria-label="${t.routeSellIf}">▼${sells.map((x) => rpathGn(x.good) + (x.minPrice != null ? "≥" + x.minPrice : "")).join(", ")}</span>` : "") +
  (buys.length ? `<span class="rpath-buy" aria-label="${t.routeBuyIf}">▲${buys.map((x) => rpathGn(x.good) + (x.maxPrice != null ? "≤" + x.maxPrice : "")).join(", ")}</span>` : "");
const rpathChain = (start, stops) => // stops: {city, io} in sailing order; the arrow home closes the loop
  `<span class="rpath-chain">${rpathChip(start, "")}${stops.map((st) => `<span class="rpath-arrow">→</span>${rpathChip(st.city, st.io)}`).join("")}<span class="rpath-arrow rpath-home">↩</span></span>`;
const rpathLoop = (stops) => // v2 is a pure circuit between its stops (no sail home); ↩ closes the loop back to the first stop
  `<span class="rpath-chain">${stops.map((st, i) => (i ? `<span class="rpath-arrow">→</span>` : "") + rpathChip(st.city, st.io)).join("")}<span class="rpath-arrow rpath-home">↩</span></span>`;
const rpathDraftIo = (st) => rpathIo(st.buyGood ? [{ good: st.buyGood, ...(st.buyMax !== "" ? { maxPrice: st.buyMax } : {}) }] : [], st.sellGood ? [{ good: st.sellGood, ...(st.sellMin !== "" ? { minPrice: st.sellMin } : {}) }] : []);
const rpathUpdatePreview = (ship) => { const el = $("rts-preview"); if (el && routeDrafts[ship.id]) el.innerHTML = rpathLoop(routeDrafts[ship.id].stops.map((st) => ({ city: st.city, io: rpathDraftIo(st) }))); };
const routeDrafts = {}; // advanced-route editor drafts, per ship id
const newRouteDraft = (at, ids) => ({ minCash: "", stops: [{ city: ids[0] ?? at, buyGood: "", buyMax: "", sellGood: "", sellMin: "" }] });
function start(prof, save = true, opts = {}) {
  const p = cleanProfile({ ...prof, company: prof?.company || T[lang].defCo }, cityIds);
  g = newGame(world, p.home, { ...startOptions(p), ...opts, profile: p, events: true, seed: crypto.getRandomValues(new Uint32Array(1))[0] }); sel = 0; pauseNote = null; company = p.company; if (save) autosave(); render(); if (prof && !ship().voyage) open3d(ship()); // city opens for a real new game, not for the background boot game
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
// Marco 25/10: the mission being worked on is always visible, even while the tutorial runs.
// Priority: the mission line first, the tutorial step after it; whichever exists.
function hudObjectiveLines() {
  return [activeMissionLine(), tutorialLine(g, lang)].filter(Boolean);
}
// City-view mission chip: the same objective lines as the map hint, always visible,
// minimizable to a flag button; the open window keeps clear of it. Same state, no progression change.
function syncMissionEcho() {
  const d = $("v3d"); if (!d) return;
  // Marco 25/10: the mission line is always visible in the city view - it no longer hides
  // while a window is open - and minimizable to a small chip that restores it.
  const line = hudObjectiveLines().join("\n"),
    minimized = localStorage.getItem("missionMin") === "1";
  const wrap = $("city-mission-wrap"), cm = $("city-mission"), mn = $("mission-min"), mx = $("mission-max");
  if (!wrap || !cm || !mn || !mx) return;
  setLiveText(cm, line ?? "");
  wrap.hidden = !line || minimized;
  mx.hidden = !line || !minimized;
  mn.title = lang === "es" ? "Minimizar misión" : "Minimise mission";
  mn.setAttribute("aria-label", mn.title);
  mx.title = lang === "es" ? "Mostrar misión" : "Show mission";
  mx.setAttribute("aria-label", mx.title);
  mx.textContent = "\u2691";
  // Dock 6px below the header; if the corner bar reaches the line, dock below the bar instead.
  let top = "";
  const hh = d.querySelector(".city-header"), el = minimized ? mx : wrap;
  if (hh && !el.hidden) {
    const vt = d.getBoundingClientRect().top;
    top = (hh.getBoundingClientRect().bottom - vt + 6) + "px";
    const bar = d.querySelector(".city-corner");
    if (bar) {
      const br = bar.getBoundingClientRect(), mr = el.getBoundingClientRect();
      if (mr.right > br.left - 8) top = (br.bottom - vt + 6) + "px";
    }
  }
  if (top) { wrap.style.top = top; mx.style.top = top; }
  // The open window keeps clear of the mission chip and the corner bar (same rule as the drag clamp; Marco 25/10: market Cerrar landed under the bar).
  const win = d.querySelector(".city-window"), chip = !wrap.hidden ? wrap : (!mx.hidden ? mx : null), cbar = d.querySelector(".city-corner");
  if (win && !win.hidden && (chip || cbar)) {
    const wr = win.getBoundingClientRect(), vt = d.getBoundingClientRect().top;
    let need = 0;
    for (const el of [chip, cbar]) {
      if (!el || el.hidden) continue;
      const cr = el.getBoundingClientRect();
      if (!(wr.right < cr.left || wr.left > cr.right || wr.bottom < cr.top || wr.top > cr.bottom)) need = Math.max(need, cr.bottom - vt + 6);
    }
    if (need) {
      win.style.left = win.offsetLeft + "px"; win.style.right = "auto";
      win.style.top = Math.min(need, Math.max(0, innerHeight - 70 - Math.min(win.offsetHeight, 80))) + "px";
    }
  }
}
// State for the 2D city iframe: walls, buildings, labels and the player's real docked ships.
// The iframe asks for a resend when it finishes booting, so a state post that raced its load is not lost.
function postCity2dState() {
  const frame = document.getElementById("v3d")?.querySelector("iframe");
  if (!frame || !city2dEnabled(location.search)) return;
  const s = g.ships[sel];
  // The town's real industry (flag on only; off or old save: no field, the iframe draws nothing).
  const industry = g.townIndustry === true ? (() => { const sales = salesOf(g, s.at), gone = new Set(sales.gone ?? []), own = new Set(sales.ids ?? []);
    return townIndustry(g.world, s.at).map((e) => { const council = e.owner.kind === "council",
      typeName = t.bldTypes[e.type] ?? t.indTypes[e.type] ?? e.type,
      ownerDesc = gone.has(e.id) ? t.indSoldNpc : own.has(e.id) ? t.indYours : council ? t.indCouncil : e.owner.name;
      return { id: e.id, type: e.type, level: e.level, own: own.has(e.id), gone: gone.has(e.id), council, typeName, ownerDesc, label: typeName + " · " + ownerDesc }; }); })() : undefined;
  frame.contentWindow.postMessage({ kind: "city2d-state", walls: wallsLevel(g, s.at), city: s.at, buildings: g.buildings?.[s.at] ?? {}, tick: g.tick, labels: Object.fromEntries(buildingsRows(g, s.at).map((r) => [r.plotId, buildingLabel(t, r)])), ships: g.ships.filter((x) => x.at === s.at && !x.voyage).map(shipDescriptor), industry, civic: [{ id: "hall", label: t.tabHall }, ...(lonjaEnabled(location.search) ? [{ id: "lonja", label: t.tabLonja }] : [])] }, location.origin);
}
addEventListener("message", (e) => { const frame = document.getElementById("v3d")?.querySelector("iframe"); if (frame && e.origin === location.origin && e.source === frame.contentWindow && e.data?.kind === "city2d-ready" && e.data.city === g.ships[sel]?.at) postCity2dState(); });
function toast(msg) {
  let box = $("toasts"); if (!box) { box = document.createElement("div"); box.id = "toasts"; box.setAttribute("role", "status"); document.body.appendChild(box); }
  const el = document.createElement("div"); el.className = "toast"; el.textContent = msg; box.appendChild(el);
  while (box.childElementCount > 3) box.firstChild.remove();
  setTimeout(() => el.remove(), 2600);
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
  $("day").textContent = `${cal.day} ${t.months[cal.month]} ${cal.year}, ${hh}:${mm} · ${t.day} ${g.noGoal || g.freePlay ? g.day : `${g.day}/${DEADLINE_DAYS}`} · ${t.seasons[seasonOf(g.day)]}`;
  $("todbar").firstElementChild.style.width = `${Math.round(dayFrac * 100)}%`; // the bar filling is the time-passing indicator
  $("cash").textContent = `${t.cash}: ${fmtM(g.cash)}`; $("cash").style.color = g.cash < 0 ? "#b3261e" : "";
  $("rep").textContent = LT[lang].reports; $("msg").textContent = badge(LT[lang].messages, unread(g)); $("rep").title = t.tipReports; $("msg").title = t.tipMsgs; $("lang").title = t.tipLang; $("new").title = t.tipMenu;
  $("goal").textContent = g.noGoal || g.freePlay ? "" : `${t.goal}: ${fmt(GOAL_CASH)}`; // an open-ended game has no goal to show
  $("ships").textContent = `${t.ships}: ${g.ships.length}`;
  $("play").textContent = playing ? t.pause : t.play; $("spd").textContent = `${t.speed} ${speed}x`; $("play").title = t.tipHdrPlay; $("spd").title = t.tipHdrSpeed;
  { const pn = $("pausenote"); if (pn) { const ps = !playing && pauseNote && !g.pending && !g.encounterReport && !g.over ? g.ships.find((x) => x.id === pauseNote.ship) : null;
    pn.textContent = ps ? t.pauseArrive.replace("{ship}", ps.name ?? `${T[lang].types[ps.type] ?? ps.type} ${ps.id}`).replace("{city}", cityName(pauseNote.city)) : ""; } }
  $("new").textContent = t.menu; { const fl = lang === "es" ? "Pantalla completa" : "Fullscreen"; $("fs").title = fl; $("fs").setAttribute("aria-label", fl); } $("lang").textContent = lang === "es" ? "EN" : "ES";
  syncCityControls();
  syncMissionEcho();
  const objMin = localStorage.getItem("missionMin") === "1", objLine = g.over ? "" : hudObjectiveLines().join(" \u00b7 "); // Marco 25/10: the mission stays visible on the map too, even under sail, unless minimised
  setLiveText($("hint"), g.over === "win" ? t.win : g.over === "lose" ? `${g.overReason === "bankrupt" ? t.bankrupt : t.lose} ${fmtM(netWorth(g))}` :
    s.voyage ? ((s.voyage.anchored ? t.hintAnchored : t.hintSea) + (objLine && !objMin ? " \u00b7 " + objLine : "")) :
    (objMin && objLine ? "" : objLine || ((g.noGoal || g.freePlay) ? t.hintOpen : t.hint0.replace("{goal}", fmt(GOAL_CASH)).replace("{days}", DEADLINE_DAYS))));
  const ht = $("hint-mission-toggle");
  if (ht) {
    ht.hidden = !!g.over || !objLine;
    ht.textContent = objMin ? "\u2691" : "\u2212";
    ht.title = objMin ? (lang === "es" ? "Mostrar misión" : "Show mission") : (lang === "es" ? "Minimizar misión" : "Minimise mission");
    ht.setAttribute("aria-label", ht.title);
  }
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
  if (inCity) postCity2dState();
  document.body.classList.toggle("has-event", !!pe && !inCity);
  if (pe) { playing = false; h += `<div class="event"><b>${pe.title[lang]}</b><p>${pe.text[lang]}</p>` + pe.choices.map((c) => `<button data-ev="${c.id}">${c.label[lang]}</button>`).join(" ") + `</div>`; }
  if (inCity || pe) {
  // Marco 25/10: the ship card is not wallpaper for every window - it shows only where the
  // selected ship actually operates: market (its cargo), warehouse (hold in/out), route, shipyard.
  const shipCtx = !inCity || tab === "market" || tab === "store" || tab === "route" || tab === "yard";
  if (shipCtx) {
  h += `<div class="port-ship-summary">` + g.ships.map((sh, i) => `<button data-sel="${i}" ${i === sel ? "disabled" : ""}>${t.types[sh.type]} ${sh.id}</button>`).join("");
  h += ` <b>${t.types[s.type]} ${s.id}</b>: ${s.voyage ? `${t.sea} ${cityName(s.voyage.to)} (${s.voyage.anchored ? t.anchored : etaText(g.tick + s.voyage.ticksLeft)})` : `${t.at} ${cityName(s.at)}`} - ${t.cap} ${cargoUsed(s)}/${shipCapacity(s)}<br>`;
  h += assignedCaptainHtml(s,lang) + `</div>`;
  }
  if (!s.voyage && !g.over) {
    const hv = Object.keys(s.cargo).reduce((a, gd) => a + (s.cargo[gd] ?? 0) * quote(g, s.at, gd), 0);
    if (!inCity || tab === "market") h += `<div title="${t.holdValue}">${t.holdValue}: ≈ ${fmtM(hv)}</div>`;
    if (!inCity || tab === "market" || tab === "route") {
      const bp = bestPorts(g, s).slice(0, 3);
      if (bp.length) h += `<div class="best"><b>${t.bestLbl}</b>` + bp.map((r) => `<div><button data-pick="${r.city}">${t.target}</button> ${t.bestRow.replace("{city}", cityName(r.city)).replace("{r}", fmtM(r.revenue)).replace("{p}", (r.profit >= 0 ? "+" : "") + fmtM(r.profit)).replace("{d}", r.days)} <small>(${r.age === 0 ? t.ageNow : t.ageDays.replace("{n}", r.age)}${r.exact ? "" : ", " + t.rumorTag})</small></div>`).join("") + `</div>`;
      if (!bp.length && Object.keys(s.cargo).length) h += `<div class="best"><i>${t.noInfo}</i></div>`;
    }
    const wh = warehouseOf(g, s.at);
    if (!inCity) h += `<div class="tabs">` + [["market", t.tabMarket], ["city", t.tabCity], ["hall", t.tabHall], ["buildings", t.bldBuild], ["yard", t.tabYard], ["tavern", t.tabTavern], ["route", t.tabRoute], ["bank", t.tabBank], ["house", premises(g,s.at,lang).label], ["store", t.tabStore], ...(lonjaEnabled(location.search) ? [["lonja", t.tabLonja]] : [])].map(([k, l]) => `<button data-tab="${k}" ${tab === k ? "disabled" : ""}>${l}</button>`).join("") + `</div>`;    const bldCard = () => { // armed buy/build/upgrade action: quote card with confirm/cancel
    const impNote = (t, o) => { const nn = Object.values(o.imported ?? {}).reduce((a, b) => a + b, 0); return nn ? ` · <i>${t.bldImport.replace("{n}", fmt(nn))}</i>` : ""; };
      if (!bldAction) return "";
      const layA = plotsCache[s.at];
      let card = "", canPay = false;
      if (bldAction.kind === "towers") { const o = quoteTowers(g, s.at), tw3 = TW[lang] ?? TW.es; if (o.ok) { card = `<b>${tw3.title} · ${tw3.cardN.replace("{n}", o.count).replace("{m}", towersMax(g, s.at))}</b><br><small>${t.bldCost.replace("{c}", fmtM(o.cost)).replace("{m}", fmtM(o.materials)).replace("{f}", fmtM(o.fee)).replace("{d}", Math.round(o.ticks / TICKS_PER_DAY)).replace("{u}", o.count * TOWER_UPKEEP)}</small>`; canPay = g.cash >= o.cost; } else { card = `<b>${tw3.title}</b><br><small style="color:#a11">${o.reason === "max level" ? t.bldMax : (tw3.why[o.reason] ?? whyText(t, o.reason))}</small>`; } }
      if (bldAction.kind === "walls") { const o = quoteWalls(g, s.at); if (o.ok) { card = `<b>${t.wallTitle} · ${t.wallLevel.replace("{l}", o.level).replace("{m}", WALL_MAX_LEVEL)}</b><br><small>${t.bldCost.replace("{c}", fmtM(o.cost)).replace("{m}", fmtM(o.materials)).replace("{f}", fmtM(o.fee)).replace("{d}", Math.round(o.ticks / TICKS_PER_DAY)).replace("{u}", o.level * WALL_UPKEEP)}</small>`; canPay = g.cash >= o.cost; } else { card = `<b>${t.wallTitle}</b><br><small style="color:#a11">${o.reason === "max level" ? t.bldMax : whyText(t, o.reason)}</small>`; } }
      else if (bldAction.kind === "buy") { const o = plotOffers(world, g, s.at, Array.isArray(layA) ? layA : []).find((x) => x.id === bldAction.plotId); if (o) { card = `<b>${t.bldBuy.replace("{p}", fmtM(o.price))}</b> ${o.id} <small>${t.bldTypes[o.type] ?? o.type} · ${o.w}×${o.d}</small>`; canPay = g.cash >= o.price; } }
      else if (bldAction.kind === "buypermit") { const o = plotOffers(world, g, s.at, Array.isArray(layA) ? layA : []).find((x) => x.id === bldAction.plotId); const pn = g.almonedaPermits?.[s.at] ?? 0; const pbc = { es: { usePermit: "Usar permiso de obra", permitCost: "El permiso paga el solar: 0 monedas (te quedaran {n}).", noPermit: "No te quedan permisos de obra en este puerto." }, en: { usePermit: "Use building permit", permitCost: "The permit pays for the plot: 0 coins ({n} left afterwards).", noPermit: "You have no building permits left in this port." } }[lang] ?? {}; if (o) { card = `<b>${pbc.usePermit}</b> ${o.id} <small>${t.bldTypes[o.type] ?? o.type} · ${o.w}×${o.d}</small><br><small>${pn ? pbc.permitCost.replace("{n}", pn - 1) : pbc.noPermit}</small>`; canPay = pn > 0; } }
      else if (bldAction.kind === "build") { const o = buildOffers(g, s.at, bldAction.plotId).find((x) => x.type === bldAction.type); if (o?.ok) { card = `<b>${t.bldTypes[bldAction.type]}</b> ${bldAction.plotId}<br><small>${t.bldCost.replace("{c}", fmtM(o.cost)).replace("{m}", fmtM(o.materials)).replace("{f}", fmtM(o.fee)).replace("{d}", o.days).replace("{u}", o.upkeep)}</small>` + impNote(t, o); canPay = o.affordable; } else if (o) { card = `<b>${t.bldTypes[bldAction.type]}</b> ${bldAction.plotId}<br><small style="color:#a11">${whyText(t, o.reason, lang)}</small>`; } }
      else if (bldAction.kind === "upgrade") { const o = upgradeOffer(g, s.at, bldAction.plotId); if (o?.ok) { card = `<b>${t.bldTypes[o.type]}</b> ${bldAction.plotId}<br><small>${t.bldCost.replace("{c}", fmtM(o.cost)).replace("{m}", fmtM(o.materials)).replace("{f}", fmtM(o.fee)).replace("{d}", o.days).replace("{u}", o.upkeep)}</small>` + impNote(t, o); canPay = o.affordable; } }
      return card ? `<div class="card">${card}<br><button data-bldconf="1" ${canPay ? "" : "disabled"}>${t.bldConfirm}</button> <button data-bldcancel="1">${t.bldCancel}</button>${canPay ? "" : ` <small>${t.capCash}</small>`}${bldError ? ` <small style="color:#a11">${bldError}</small>` : ""}</div>` : "";
    };
    const ui2dMark = h.length; // start of the tab content (ui2d wraps it below)
    if (tab === "market") {
      const market2d=ui2dEnabled(location.search);
      if(market2d) {
        const known = world.cities.filter(c => c.id !== s.at && isDiscovered(g,c.id) && g.intel?.[c.id]);
        h+=`<div class="ui2d-market-intro"><h3>${t.tabMarket} · ${cityName(s.at)}</h3><p>${t.cash}: <b>${fmtM(g.cash)}</b> · ${t.hold}: <b>${cargoUsed(s)}/${shipCapacity(s)}</b> · ${lang==='es'?'Libres':'Free'}: <b>${Math.max(0,shipCapacity(s)-cargoUsed(s))}</b></p></div>`;
        h+=`<div class="market-tools mkt-tools"><label>${lang==='es'?'Buscar bien':'Find good'} <input data-market-search type="search" ></label><label><input data-market-cargo type="checkbox" ${marketCargoOnly?'checked':''}> ${lang==='es'?'Solo mi carga':'My cargo only'}</label><label>${lang==='es'?'Comparar precio con':'Compare price with'} <select data-market-compare><option value="">${lang==='es'?'Elegir puerto conocido':'Choose known port'}</option>${known.map(c=>`<option value="${c.id}" ${marketCompare===c.id?'selected':''}>${cityName(c.id)}</option>`).join('')}</select></label></div>`;
        if(marketCompare)h+=`<p class="market-compare-note">${lang==='es'?'Referencia conocida por unidad, no precio garantizado al llegar. No incluye tasa ni impacto de cantidad.':'Known unit-price reference, not a guaranteed arrival price. Excludes fees and quantity impact.'}</p>`;
      }
      const mktFee = FEE * feeMul(g, s.at);
      h += `<div class="mkt-preview" data-market-preview aria-live="polite">${esc(t.previewHint)}</div><div class="mkt-table${market2d ? " ui2d-market" : ""}"><div class="mkt-heads"><div class="mkt-head">${[t.good, t.price, t.stock, t.hold, t.avgLbl, t.buy, t.sell].map((x) => `<span>${esc(x)}</span>`).join("")}</div><div class="mkt-head mkt-head2">${[t.good, t.price, t.stock, t.hold, t.avgLbl, t.buy, t.sell].map((x) => `<span>${esc(x)}</span>`).join("")}</div></div><div class="mkt-grid">`;
      for (const gd of Object.keys(g.world.goods).sort((a, b) => t.goods[a].localeCompare(t.goods[b], lang))) {
        if(market2d && ((marketCargoOnly && !(s.cargo[gd]>0)) || !t.goods[gd].toLocaleLowerCase(lang).includes(marketSearch.toLocaleLowerCase(lang)))) continue;
        const cmp = market2d && marketCompare ? destinationQuote(g, marketCompare, gd) : null;
        const have = s.cargo[gd] ?? 0, stored = wh?.goods?.[gd] ?? 0, bq = marketQty === "max" ? marketQuantity(previewBuy(g.world, g.market, s, g.cash, gd, 9999, mktFee).qty) : marketQty, sq = marketQty === "max" ? Math.max(1, have) : marketQty, pb = previewBuy(g.world, g.market, s, g.cash, gd, bq, mktFee), ps = previewSell(g.world, g.market, s, gd, sq, mktFee), spb = s.basis?.[gd], avg = spb != null && spb > 0 && have > 0 ? Math.round(spb / have) : null;
        const p = quote(g, s.at, gd), base = g.world.goods[gd].base, col = p < base * 0.9 ? "#161" : p > base * 1.2 ? "#a11" : "inherit", tag = p < base * 0.9 ? "▼" : p > base * 1.2 ? "▲" : "";
        const buyTip = pb.qty ? t.dealBuy.replace("{q}", pb.qty).replace("{c}", fmtM(pb.cost)).replace("{a}", pb.avg).replace("{n}", pb.next) + (pb.limit ? " - " + t[pb.limit === "cash" ? "capCash" : pb.limit === "stock" ? "capStock" : "capRoom"] : "") : "", sellTip = ps.qty ? t.dealSell.replace("{q}", ps.qty).replace("{c}", fmtM(ps.revenue)).replace("{a}", ps.avg).replace("{n}", ps.next) + (ps.hasBasis ? ` (${fmtM(Math.abs(ps.profit))} ${ps.profit >= 0 ? t.profit : t.loss})` : "") : "";
        const lv = stockLevel(g.market[s.at][gd]), lvc = { scarce: "#b3261e", short: "#b26a00", normal: "#6b6355", plenty: "#1e7a34" }[lv], tp = trendPct(g, s.at, gd);
        h += `<div class="mkt-row"><div class="mkt-good">${goodIcon(gd)}<span>${t.goods[gd]}</span></div>` +
          `<div class="mkt-price" style="color:${col}" title="${tag === "" ? "" : tag === "▼" ? t.cheap : t.dear}">${tag} ${p}${tp === null || tp === 0 ? "" : ` <small class="tr" title="${t.trend7}">${tp > 0 ? "+" : ""}${tp}%</small>`}${cmp ? `<small class="market-destination">${cityName(marketCompare)}: ${cmp.price} · ${cmp.age===0?t.ageNow:t.ageDays.replace("{n}",cmp.age)}${cmp.exact?"":", "+t.rumorTag}</small>` : ""}</div>` +
          `<div class="mkt-stock">${g.market[s.at][gd].stock} <small style="color:${lvc}" title="${t.lvlInfo[lv]}">${t.lvl[lv]}</small></div>` +
          `<div class="mkt-hold">${have}${stored ? ` <small title="${t.warehouse}">+${stored}</small>` : ""}</div><div class="mkt-avg">${avg === null ? "—" : avg}</div>` +
          `<div class="mkt-act mkt-act-buy"><button class="mkt-pill mkt-buy-btn" style="${pb.qty ? "background:#2e6b34;color:#fff0cd;border-color:#1d4a22;" : ""}border-left:4px solid #2e6b34" aria-label="${esc(t.buy)}" data-b="${gd}:${bq}" data-tip="${esc(buyTip)}" title="${esc(buyTip)}" ${pb.qty ? "" : "disabled"}>${pb.qty ? `+${pb.qty} → ${fmtM(pb.cost)}` : t.buy}</button></div>` +
          `<div class="mkt-act mkt-act-sell" style="padding-left:6px"><button class="mkt-pill mkt-sell mkt-sell-btn" style="${ps.qty ? "background:#8a5a17;color:#fff0cd;border-color:#5e3c0e;" : ""}border-left:4px solid #8a5a17" aria-label="${esc(t.sell)}" data-s="${gd}:${sq}" data-tip="${esc(sellTip)}" title="${esc(sellTip)}" ${ps.qty ? "" : "disabled"}>${ps.qty ? `−${ps.qty} → ${fmtM(ps.revenue)}` : t.sell}</button></div></div>`;
      }
      h += `</div></div><div class="mkt-qtybar"><span>${esc(t.qtyAll)}</span>${[1, 5, 10, 50, "max"].map((v) => `<button data-market-qty="${v}" title="${esc(t.tipQty)}" aria-pressed="${marketQty === v}" class="${marketQty === v ? "on" : ""}">${v === "max" ? esc(t.maxLbl) : v}</button>`).join("")}</div>`;
      { const here = alertsOf(g, s.at), elsewhere = alertsOf(g).length - here.length, line = (a) => `${goodIcon(a.good) || ""}${t.goods[a.good] ?? a.good} ${a.dir === "below" ? t.alBelow : t.alAbove} ${fmt(a.price)}`;
        h += `<details class="mkt-alerts"${here.length ? " open" : ""}><summary>${t.alTitle} (${here.length})</summary><p><small>${t.alInfo}</small></p>`;
        h += `<div class="rumor"><select id="al-good">${Object.keys(g.world.goods).map((k) => `<option value="${k}">${t.goods[k]}</option>`).join("")}</select> <select id="al-dir"><option value="below">${t.alBelow}</option><option value="above">${t.alAbove}</option></select> <input id="al-price" type="number" min="1" size="5" placeholder="${t.alPrice}"> <button id="al-set">${t.alSet}</button> <small id="al-msg" style="color:#a11"></small></div>`;
        h += here.length ? here.map((a) => `<div class="card"><small>${line(a)}</small> <button data-al-x="${a.good}">${t.admClear}</button></div>`).join("") : `<p><i>${t.alNone}</i></p>`;
        if (elsewhere) h += `<p><small>${t.alElse.replace("{n}", elsewhere)}</small></p>`; h += `</details>`; }
    } else if (tab === "route") {
      const rt = s.route, gn = (k) => goodIcon(k, 16) + (t.goods[k] ?? k), gnTxt = (k) => t.goods[k] ?? k, others = world.cities.filter((c) => c.id !== s.at && isDiscovered(g, c.id));
      h += `<p>${t.routeInfo}</p>`;
      if (rt?.v === 2) {
        h += `<div class="card rpath-card">${t.routeNow2.replace("{n}", rt.stops.length).replace("{l}", rt.legs).replace("{m}", rt.minCash)}` +
          rpathLoop(rt.stops.map((st) => ({ city: st.city, io: rpathIo(st.buy, st.sell) }))) +
          `<button id="rt-cancel">${t.routeCancel}</button></div>`;
      }
      const goods = Object.keys(g.world.goods);
      const d = (routeDrafts[s.id] ??= newRouteDraft(s.at, others.map((c) => c.id)));
      h += `<p><b>${t.routeAdv}</b></p><p>${t.routeAdvInfo}</p>`;
      h += `<table class="route-table route-editor"><thead><tr><th></th><th>${t.routeColCity}</th><th>${t.routeBuyIf}</th><th>≤</th><th>${t.routeSellIf}</th><th>≥</th><th></th></tr></thead><tbody>` +
        d.stops.map((st, i) => {
          const cityOpts = others.map((c) => `<option value="${c.id}" ${st.city === c.id ? "selected" : ""}>${cityName(c.id)}</option>`).join("");
          const goodOpts = (sel) => `<option value="">${t.routeAny}</option>` + goods.map((k) => `<option value="${k}" ${sel === k ? "selected" : ""}>${gnTxt(k)}</option>`).join("");
          return `<tr><td>${i + 1}</td><td><select id="rts-city-${i}">${cityOpts}</select></td><td><select id="rts-bg-${i}">${goodOpts(st.buyGood)}</select></td><td><input id="rts-bp-${i}" type="number" min="0" step="1" size="5" placeholder="≤" value="${st.buyMax}"></td><td><select id="rts-sg-${i}">${goodOpts(st.sellGood)}</select></td><td><input id="rts-sp-${i}" type="number" min="0" step="1" size="5" placeholder="≥" value="${st.sellMin}"></td><td><button id="rts-del-${i}" title="${t.routeDelStop}" aria-label="${t.routeDelStop}" class="rt-x">✕</button></td></tr>`;
        }).join("") + `</tbody></table>`;
      h += `<div class="rumor"><button id="rts-add">${t.routeAddStop}</button> ${t.routeMinCash}: <input id="rts-mincash" type="number" min="0" step="1" size="6" value="${d.minCash}"> <button id="rts-set2">${t.routeSetAdv}</button> <small id="rts-msg" style="color:#a11"></small></div>`;
      h += `<div class="card rpath-card rpath-preview" id="rts-preview">${rpathLoop(d.stops.map((st) => ({ city: st.city, io: rpathDraftIo(st) })))}</div>`; // live preview of the draft, same visual language as the active route
      h += rt && rt.v !== 2 ? `<div class="card rpath-card">${rpathChain(rt.a, [{ city: rt.b, io: rpathIo(rt.back ? [{ good: rt.back }] : [], [{ good: rt.out }]) }, { city: rt.a, io: rpathIo([{ good: rt.out }], rt.back ? [{ good: rt.back }] : []) }])}<button id="rt-cancel">${t.routeCancel}</button></div>` : rt ? "" : `<p><i>${t.routeNone}</i></p>`; // chip A buys out/sells back, chip B sells out/buys back
      h += `<div class="rumor">${t.routeTo}: <select id="rt-to">${others.map((c) => `<option value="${c.id}">${cityName(c.id)}</option>`).join("")}</select> ${t.routeOut}: <select id="rt-out">${goods.map((k) => `<option value="${k}">${gnTxt(k)}</option>`).join("")}</select> ${t.routeBack}: <select id="rt-back"><option value="">${t.routeNoBack}</option>${goods.map((k) => `<option value="${k}">${gnTxt(k)}</option>`).join("")}</select> <button id="rt-set">${t.routeSet}</button></div>`;
    } else if (tab === "city") {
      const nd2 = world.nodes[s.at], ks = Object.keys(g.world.goods), ent = g.market[s.at];
      const eff = cityEffects(g, s.at), drift = citylifeExtra(g, s.at), wallPop = WALL_POP * wallsKeptLevel(g, s.at);
      const popEff = (nd2.pop ?? 8000) + eff.popBonus + drift + wallPop; // same composition as market demand (game.mjs), before per-good multipliers
      const rows = cityRows(popEff, ks, (k) => affordRatio(ent[k], g.world.goods[k].base)), cn = { poor: t.clsPoor, middle: t.clsMiddle, rich: t.clsRich };
      { const parts = [t.cityPopBase.replace("{n}", fmt(nd2.pop ?? 8000))];
        if (eff.popBonus) parts.push(t.cityPopHouses.replace("{n}", "+" + fmt(eff.popBonus)));
        if (wallPop) parts.push(t.cityPopWalls.replace("{n}", "+" + fmt(wallPop)));
        if (drift) parts.push(t.cityPopDrift.replace("{n}", (drift > 0 ? "+" : "\u2212") + fmt(Math.abs(drift))));
        h += `<p><b>${t.cityPopEff.replace("{p}", fmt(popEff))}</b><br><small>${parts.join(" · ")}</small></p>`;
        if (eff.jobs > 0) h += `<p>${t.bldJobsLine.replace("{j}", fmt(eff.jobs)).replace("{f}", fmt(eff.free)).replace("{s}", Math.round(eff.staffing * 100))}</p>`; }
      h += `<p>${t.cityInfo}</p><div class="cityclasses">` + rows.map((r) => `<div class="card"><b>${cn[r.cls]}</b>: ${fmt(r.count)} ${t.cityCitizens} (${lang === "es" ? String(r.pct).replace(".", ",") : r.pct} %)<br>${t.cityBuys}: ${r.top.map((x) => goodIcon(x.good) + t.goods[x.good]).join(", ") || "-"}` + (r.priced_out.length ? `<br><i>${t.cityOut}: ${r.priced_out.map((k) => t.goods[k]).join(", ")}</i>` : "") + `</div>`).join("") + `</div>`;
      if (g.townIndustry === true) { // the town's own works behind the market (flag on only; off: nothing renders)
        const roster = townIndustry(g.world, s.at), ownIds = new Set(salesOf(g, s.at).ids), goneIds = new Set(salesOf(g, s.at).gone ?? []);
        const indCard = (e) => `<div class="card"><b>${goodIcon(e.good, 16)}${t.goods[e.good] ?? e.good}</b><br>${(t.bldTypes[e.type] ?? t.indTypes[e.type] ?? e.type)} · ${t.indLevel.replace("{l}", e.level)} · ${t.indJobs.replace("{n}", fmt(e.jobs))}<br><i>${goneIds.has(e.id) ? t.indSoldNpc : ownIds.has(e.id) ? t.indYours : e.owner.kind === "council" ? t.indCouncil : e.owner.name}</i></div>`;
        h += `<h3>${t.indTitle}</h3><p>${t.indInfo}</p><div class="cityclasses">` + roster.map(indCard).join("") + `</div>`;
      }
      { const cto = offerOf(g, s.at), cta = activeContracts(g);
        h += `<h3>${t.ctTitle}</h3><p>${t.ctInfo}</p>`;
        if (cto) h += `<div class="card"><b>${t.ctOffer.replace("{q}", fmt(cto.qty)).replace("{g}", goodIcon(cto.good, 16) + (t.goods[cto.good] ?? cto.good)).replace("{d}", cto.dueDay).replace("{r}", fmt(cto.reward))}</b><br><button data-contract-accept="${s.at}" ${cta.length >= CONTRACT_MAX_ACTIVE ? "disabled" : ""}>${t.ctAccept}</button>${cta.length >= CONTRACT_MAX_ACTIVE ? ` <small>${t.ctFull.replace("{n}", CONTRACT_MAX_ACTIVE)}</small>` : ""}</div>`;
        else if (!cta.some((x) => x.city === s.at)) h += `<p><i>${t.ctNone}</i></p>`;
        if (cta.length) h += `<p>` + cta.map((x) => t.ctActive.replace("{g}", goodIcon(x.good, 16) + (t.goods[x.good] ?? x.good)).replace("{n}", fmt(x.delivered)).replace("{q}", fmt(x.qty)).replace("{d}", x.dueDay)).join("<br>") + `</p>`; }
      if (localStorage.getItem("devMode") === "1") h += needsHtml(ent.grain,t.goods,lang); // hidden developer mode only; players never see telemetry
    } else if (tab === "hall") {
      const hv = hallView(g, s.at);
      if(ui2dEnabled(location.search))h += hall2dHtml(hv,t,fmtM,RESPECT_NAMES[lang][hv.respectId],lang);
      else {
      h += `<p>${t.hallInfo}</p><div class="cityclasses"><div class="card"><b>${t.hallMayor}</b><br>${hv.mayor}</div>` + hv.councillors.map((n, i) => `<div class="card"><b>${t.hallRegs} ${i + 1}</b><br>${n}</div>`).join("") + `</div>`;
      h += `<p><i>${t.hallStand.replace("{r}", RESPECT_NAMES[lang][hv.respectId]).replace("{n}", hv.respectPts)}</i></p>`;
      const cityLines = [hv.identity, hv.mood, hv.craft, hv.festival, hv.memory, hv.relations, hv.growth].filter(Boolean); // living-city lines: present only while their flag is on (off: nothing renders)
      if (cityLines.length) h += `<p><i>` + cityLines.map((l) => l.txt?.[lang] ?? l.txt?.es).filter(Boolean).join("<br>") + `</i></p>`;
      h += `<h4>${t.hallDerechos}</h4><p>${t.hallFee.replace("{p}", hv.feePct)}<br>${t.hallToll.replace("{d}", hv.tollDiv).replace("{x}", hv.tollDiscountPct)}</p>`;
      h += `<p><b>${t.hallCaja.replace("{c}", fmtM(hv.caja))}</b><br>${t.hallLevies.replace("{s}", (hv.sisaPct > 0 ? "+" : "") + hv.sisaPct + "%").replace("{p}", (hv.portazgoPct > 0 ? "+" : "") + hv.portazgoPct + "%")}<br>${t.hallNext.replace("{d}", hv.nextMeeting)}</p><p><i>${t.hallNote}</i></p>`;
      }
      if (g.townIndustry === true) { // the weekly town auction (flag on only): one card per lot on today's table
        const lots = lotsOfDay(g, s.at);
        h += `<h3>${t.almTitle}</h3><p>${t.almInfo}</p>` + (lots.length ? `<p><b>${t.almToday}</b></p>` : `<p><b>${t.almNext.replace("{d}", nextAuctionDay(s.at, g.day))}</b></p>`);
        if (lots.length) {
          const bids = g.townBids?.[s.at];
          h += lots.map((lot) => {
            const nb = biddersOf(g, s.at, lot);
            const mine = typeof bids === "number" ? (lot.kind === "establishment" ? bids : null) : bids?.[lot.id]; // a bare number from an old save belongs to the establishment table
            const title = lot.kind === "establishment"
              ? t.almLot.replace("{x}", (t.bldTypes[lot.est.type] ?? t.indTypes[lot.est.type] ?? lot.est.type) + " · " + t.indLevel.replace("{l}", lot.est.level)).replace("{g}", goodIcon(lot.est.good, 16) + (t.goods[lot.est.good] ?? lot.est.good))
              : (lot.name?.[lang] ?? lot.name?.es); // generated lots name themselves in the engine: no i18n-table edit needed
            const sv = sellerOf(lot);
            return `<div class="card"><b>${title}</b><br>${t.almSeller}: <i>${sv.kind === "council" ? t.indCouncil : sv.name}</i> · ${t.almReserve.replace("{p}", fmt(lot.reserve))}<br>${nb.length ? t.almBidders + " " + nb.map((b) => b.who).join(", ") : t.almNoBidders}${mine != null ? `<br><b>${t.almBidPlaced.replace("{p}", fmt(mine))}</b>` : ""}<br><input data-alminput="${lot.id}" type="number" min="0" step="1" style="width:8em"> <button data-almbid="${lot.id}">${t.almBid}</button></div>`;
          }).join("") + `${almNote ? `<small style="color:#a11">${almNote}</small><br>` : ""}<small>${t.almFollowing.replace("{d}", nextAuctionDay(s.at, g.day))}</small>`;
        } else h += `<p><i>${t.almNone}</i></p>`;
      }
      { // selling a ship happens only here, at the town auction: not in the shipyard, not in the ship window
        const sellable = g.ships.filter((x) => x.at === s.at && !x.voyage);
        h += `<h3>${t.almSellShipTitle}</h3><p>${t.almSellShipInfo}</p>`;
        h += sellable.length
          ? sellable.map((x) => `<div class="card"><b>${t.types[x.type]} ${x.id}</b> · ${t.cap}: ${cargoUsed(x)}/${SHIP_TYPES[x.type].capacity} <button data-sellship-id="${x.id}" ${g.ships.length <= 1 || cargoUsed(x) > 0 ? "disabled" : ""}>${t.sellShip.replace("{p}", fmt(shipValue(x)))}</button></div>`).join("")
          : `<p><i>${t.almSellShipNone}</i></p>`;
      }
    } else if (tab === "buildings") {
      const pb = { // almoneda building permits: local table (TW precedent) so the i18n sweep lines stay untouched
        es: { usePermit: "Usar permiso de obra", permits: "Permisos de obra de la almoneda: {n}. Canjea uno al comprar un solar de este puerto.", permitCost: "El permiso paga el solar: 0 monedas (te quedaran {n}).", noPermit: "No te quedan permisos de obra en este puerto." },
        en: { usePermit: "Use building permit", permits: "Building permits from the town auction: {n}. Redeem one when buying a plot in this port.", permitCost: "The permit pays for the plot: 0 coins ({n} left afterwards).", noPermit: "You have no building permits left in this port." },
      }[lang] ?? {};
      const permits = g.almonedaPermits?.[s.at] ?? 0;
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
        if (wq.ok) h += `<p><button data-wallact="1" ${g.cash < wq.cost ? "disabled" : ""}>${t.wallBuild.replace("{l}", wq.level).replace("{p}", fmtM(wq.cost))}</button>${g.cash < wq.cost ? ` <small>${t.capCash}</small>` : ""}</p>`;
        else if (wq.reason === "max level") h += `<p><small>${t.bldMax}</small></p>`;
        else if (!wr?.nextLevel) h += `<p><small>${whyText(t, wq.reason)}</small></p>`; // works under way already show their progress line above
      }
      if (g.towers) { // watchtowers (flag on): mounted on the wall, no plot needed (issue #363, lane C; strings local while the EN sweep owns T.es/T.en)
        const tw2 = TW[lang] ?? TW.es, tc = towersCount(g, s.at), tk = towersKept(g, s.at), tm = towersMax(g, s.at), tr2 = g.towers[s.at], tq = quoteTowers(g, s.at);
        h += `<h3>${tw2.title}</h3><p><b>${tc ? tw2.count.replace("{n}", tc).replace("{m}", tm) : tw2.none}</b>${tk ? ` · ${tw2.watch.replace("{n}", tk)}` : ""}${tc ? ` · ${tw2.upkeep.replace("{u}", fmt(tc * TOWER_UPKEEP))}` : ""}</p><p><small>${tw2.info}</small></p>`;
        if (tr2?.nextCount && tr2.readyTick > g.tick) h += `<p>${t.bldState.construction} ${tr2.nextCount} · ${t.bldReady.replace("{d}", Math.ceil(tr2.readyTick / TICKS_PER_DAY)).replace("{p}", Math.max(0, Math.min(99, Math.round(100 * (1 - (tr2.readyTick - g.tick) / (TOWER_BUILD_DAYS * TICKS_PER_DAY))))))}</p>`;
        if (tr2?.unkept) h += `<p><b style="color:#a11">${tw2.unkept}</b></p>`;
        if (tq.ok) h += `<p><button data-toweract="1" ${g.cash < tq.cost ? "disabled" : ""}>${tw2.build.replace("{n}", tq.count).replace("{p}", fmt(tq.cost))}</button>${g.cash < tq.cost ? ` <small>${t.capCash}</small>` : ""}</p>`;
        else if (tq.reason === "max level") h += `<p><small>${t.bldMax}</small></p>`;
        else if (!tr2?.nextCount) h += `<p><small>${tw2.why[tq.reason] ?? whyText(t, tq.reason)}</small></p>`; // works under way already show their progress line above
      }
      const own = buildingsRows(g, s.at);
      if (!hasOffice(g, s.at)) h += `<p><i>${t.bldNeedOffice}</i></p>`; // building is office-gated
      else {
        if (permits > 0) h += `<p><i>${pb.permits.replace("{n}", permits)}</i></p>`;
        h += `<p><i>${$("v3d") ? t.bldHint : t.bldPick2d}</i></p>`;
        if (own.length) h += `<p class="bldchips">` + own.map((r) => `<button data-bldact="sel|${r.plotId}">${bldChipInner(t, r, lang, goodIcon)}</button>`).join(" ") + `</p>`; // P3 chips: icon + name + state; also the no-WebGL path to build/upgrade
        const lay = plotsCache[s.at];
        if (lay === "error") h += `<p><i style="color:#a11">${t.bldPlotsErr}</i></p>`;
        else if (!Array.isArray(lay)) h += `<p><i>${t.bldLoading}</i></p>`;
        else {
          const offers = plotOffers(world, g, s.at, lay);
          if ($("v3d")) { if (offers.length) h += `<p><i>${t.bldFree3d.replace("{n}", offers.length)}</i></p>`; }
          else h += offers.length ? `<p><b>${t.bldFree}</b></p><div class="yardcards">` + offers.map((o) => `<div class="card"><b>${o.id}</b> <small>${t.bldTypes[o.type] ?? o.type} · ${o.w}×${o.d}</small><br><button data-bldact="buy|${o.id}" ${g.cash < o.price ? "disabled" : ""}>${t.bldBuy.replace("{p}", fmtM(o.price))}</button>${permits ? ` <button data-bldact="buypermit|${o.id}">${pb.usePermit}</button>` : ""}</div>`).join("") + `</div>` : "";
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
        else if (o && hasOffice(g, s.at)) { const pnl = g.almonedaPermits?.[s.at] ?? 0; h += `<h3>${t.bldState.plot} <small>${o.id}</small></h3><p>${t.bldTypes[o.type] ?? o.type} · ${o.w}×${o.d}</p>`; h += bldCard(); if (pnl > 0) h += `<p><i>${({ es: "Permisos de obra de la almoneda: {n}. Canjea uno al comprar este solar.", en: "Building permits from the town auction: {n}. Redeem one when buying this plot." }[lang] ?? "Permisos de obra de la almoneda: {n}.").replace("{n}", pnl)}</i></p>`; h += `<p><button data-bldact="buy|${o.id}" ${g.cash < o.price ? "disabled" : ""}>${t.bldBuy.replace("{p}", fmtM(o.price))}</button>${(g.almonedaPermits?.[s.at] ?? 0) ? ` <button data-bldact="buypermit|${o.id}">${{ es: "Usar permiso de obra", en: "Use building permit" }[lang] ?? "Usar permiso de obra"}</button>` : ""}</p>`; }
        else h += `<p><i>${o ? t.bldNeedOffice : t.bldNone}</i></p>`;
      }
      else {
        h += bldSummaryCard(t, r, lang, fmt, goodIcon); // P3 summary card: name, state and only the stats that apply
        if (r.halted && r.fire) h += `<p><b style="color:#a11">${t.bldFireNote}</b></p>`; // a burnt building reopens when the fire is out, not by button
        else if (r.halted) h += `<p><b style="color:#a11">${t.bldHaltedNote}</b></p><p><button data-bldact="restart|${r.plotId}" ${g.cash > 0 ? "" : "disabled"}>${t.bldRestart}</button></p>`;
        h += bldCard();
        const up = r.state === "active" ? upgradeOffer(g, s.at, r.plotId) : null;
        if (up) h += up.ok ? `<p><button data-bldact="upgrade|${r.plotId}|${r.type}" ${up.affordable ? "" : "disabled"}>${t.bldUpgrade.replace("{l}", up.level).replace("{p}", fmt(up.cost))}</button></p>` : `<p><small>${up.reason === "max level" ? t.bldMax : whyText(t, up.reason, lang)}</small></p>`;
        if (r.state === "plot") { // P3 build menu: one card per type - drawing, investment, running costs, production; grouped like the classic Hansa build menu
          const offers = buildOffers(g, s.at, r.plotId).filter((o) => o.ok || OFFER_LOCKED_SHOW.has(o.reason)), bo2 = BO[lang] ?? BO.es; // only types this city's resources allow; refused-but-unlockable ones stay visible, disabled, with their reason
          for (const grp of ["primary", "workshop", "own", "civic"]) { // Marco 25/10: fields and factories first, civic buildings last so they stay out of the way
            const list = offers.filter((o) => bldOfferGroup(o.type) === grp);
            if (list.length) h += `<p class="bldoffer-group"><b>${bo2.groups[grp]}</b></p><div class="bldoffers">` + list.map((o) => o.ok
              ? `<button class="bldoffer-btn" data-bldact="build|${r.plotId}|${o.type}" ${o.affordable ? "" : "disabled"}>${bldOfferCard(t, o, lang, fmt, fmtM, goodIcon, bldOfferArt(r.plotId, o.type, o.level))}</button>`
              : `<button class="bldoffer-btn bldoffer-locked" disabled>${bldOfferLocked(t, o, lang, bldOfferArt(r.plotId, o.type, 1))}</button>`).join("") + `</div>`;
          }
        }
      }
    } else if (tab === "town") { // a typed town building clicked in the 3D view: read-only card, no services yet
      h += t.townTypes[townSel] ? `<h3>${t.townTypes[townSel]}</h3><p>${t.townDesc[townSel]}</p>` : `<p><i>${t.townNone}</i></p>`;
    } else if (tab === "house") {
      const pr = premises(g,s.at,lang);
      h += `<h3>${pr.label}: ${cityName(s.at)}</h3><p>${pr.info}</p>`;
      h += houseHtml(g, lang, netWorth(g), fmtM, cityName, LOAN_MAX);
      if (!pr.isHome && !hasOffice(g, s.at)) { const rp = repOf(g, s.at); h += `<p><i>${t.officeReq.replace("{p}", fmt(OFFICE_PRICE)).replace("{r}", RESPECT_NAMES[lang][respectOf(g, s.at).id]).replace("{n}", Math.floor(rp))}</i></p>` + `<p><button data-bldact="office|buy" ${g.cash < OFFICE_PRICE || rp < OFFICE_MIN_RESPECT ? "disabled" : ""}>${t.officeBuy.replace("{p}", fmt(OFFICE_PRICE))}</button></p>`; }
      else if (!pr.isHome) h += `<p><i>${t.officeOwned}</i></p>`;
      if(!pr.isHome) h += `<p>${warehouseOf(g,s.at) ? (lang==="es"?"Almacén propio disponible en este puerto.":"You own a warehouse in this port.") : (lang==="es"?"No tienes almacén en este puerto.":"You have no warehouse in this port.")}</p><button data-local-store>${t.tabStore}</button><button data-local-reports>${LT[lang].reports}</button>`;
    } else if (tab === "bank") {
      const room = bankRoom(g, s.at), tm = termsFor(g, s.at), capHere = tm.room < 1 ? Math.floor(loanCapFor(g, LOAN_MAX) * tm.room / 100) * 100 : loanCapFor(g, LOAN_MAX), amts = [100, 500, 1000, 5000].filter((a) => a <= room);
      h += `<p>${t.bankInfo.replace("{r}", +(LOAN_RATE * tm.rate * 100).toFixed(2)).replace("{m}", fmtM(capHere))}</p><p>${t.bankRoom}: <b>${fmtM(room)}</b> · ${t.bankOwed}: <b>${fmtM(loansOwed(g))}</b></p>`;
      h += amts.map((a) => `<button data-loan="${a}">${t.bankTake.replace("{a}", fmt(a))}</button>`).join(" ");
      const ls = g.loans ?? [];
      h += ls.length ? ls.map((l) => `<div class="card">${t.bankLoan.replace("{d}", l.taken).replace("{l}", fmtM(l.left)).replace("{u}", l.due)}<br><button data-repay="${l.id}:all" ${g.cash > 0 ? "" : "disabled"}>${t.bankRepay}</button> <button data-repay="${l.id}:100" ${g.cash >= 100 ? "" : "disabled"}>${t.bankRepay100}</button></div>`).join("") : `<p><i>${t.bankNone}</i></p>`;
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
      h += `<p>${t.yardInfo}</p>`;
      h += `<div class="yardcards">` + Object.entries(SHIP_TYPES).map(([k, v]) => `<div class="card yc">${shipIconSvg(k)}<b>${t.types[k]}</b><small>${t.yc.replace("{c}", v.capacity).replace("{d}", v.buildDays).replace("{u}", v.upkeepPerDay)}</small><button data-order="${k}" ${g.cash < v.price ? "disabled" : ""}>${t.orderShort.replace("{p}", fmt(v.price))}</button></div>`).join("") + `</div>`;
      h += `<div><button data-repair="1" ${repairPrice(g, s) <= 0 || g.cash < repairPrice(g, s) ? "disabled" : ""}>${t.repair.replace("{h}", Math.round(s.hull ?? 100)).replace("{p}", fmt(repairPrice(g, s)))}</button> <button data-gunrepair="1" ${gunRepairCost(s) <= 0 || s.voyage || g.cash < gunRepairCost(s) ? "disabled" : ""}>${cannonsOf(s) ? t.gunRepair.replace("{c}", Math.round(gunCond(s))).replace("{p}", fmt(gunRepairCost(s))) : t.gunNone}</button> </div><div><small>${t.weaponInfo.replace("{n}", weaponCount(s)).replace("{m}", maxCannons(s))}${weaponCount(s) ? " · " + Object.entries(weaponsOf(s)).map(([k, n]) => t.weaponNames[k] + " ×" + n).join(", ") + " · " + t.weaponPowerLbl.replace("{p}", weaponPower(s)) : ""}</small><br>${Object.entries(WEAPON_TYPES).map(([k, w]) => `<button data-weapon="${k}" ${s.voyage || weaponCount(s) >= maxCannons(s) || g.cash < w.price ? "disabled" : ""} title="${t.weaponPowerLbl.replace('{p}', w.power)}">${t.weaponBuy.replace("{w}", t.weaponNames[k]).replace("{p}", fmt(w.price))}</button>`).join(" ")}</div>`;
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
        : bankHeader2d(lang, { city, room: bankRoom(g, s.at), owed: loansOwed(g), ratePct: +(LOAN_RATE * termsFor(g, s.at).rate * 100).toFixed(2), loans: (g.loans ?? []).length }, fmtM);
      h = h.slice(0, ui2dMark) + store2dWrap(tab === "store" ? "warehouse" : "bank", head, inner);
    }
    if(!(tab==="hall"&&ui2dEnabled(location.search))) { const te = target ? travelEstimate(world, s, target) : null;
      h += `<div class="dest"><b>${t.target}:</b> ` + (te?.ok ? `${cityName(target)} - ≈ ${hoursOf(te.ticks)} h, ${te.km} km <button data-go="1">${t.sailGo} (↵)</button>` : `<i>${t.hint}</i>`) + `</div>`; }
  }
  if (!g.over) h += `${s.voyage ? `<div><button data-arrive="1">${t.arrive}</button></div>` : ""}`;
  }
  $("panel").innerHTML = h;
  $("v3d")?.querySelector(".city-window")?.classList.toggle("ui2d-hall-window",tab==="hall"&&ui2dEnabled(location.search));
  $("v3d")?.querySelector(".city-window")?.classList.toggle("ui2d-market-window",tab==="market"&&ui2dEnabled(location.search));
  { const w = $("v3d")?.querySelector(".city-window"); if (w) { w.classList.remove("ui2d-store-window", "ui2d-bank-window"); const k = ui2dEnabled(location.search) ? store2dWindowClass(tab) : ""; if (k) w.classList.add(k); } }
  const P = $("panel");
  P.querySelectorAll("[data-ev]").forEach((e) => e.onclick = () => act(() => resolveEvent(g, e.dataset.ev)));
  P.querySelectorAll("[data-sel]").forEach((e) => e.onclick = () => { sel = +e.dataset.sel; rumorNote = null; if (!shipWin) shipWin = { tab: "cargo" }; render(); });
  if(P.querySelector('[data-market-search]'))P.querySelector('[data-market-search]').value=marketSearch;
  P.querySelector('[data-market-search]')?.addEventListener('input',e=>{const start=e.target.selectionStart;marketSearch=e.target.value;render();const n=P.querySelector('[data-market-search]');n?.focus();n?.setSelectionRange(start,start);});
  P.querySelector('[data-market-cargo]')?.addEventListener('change',e=>{marketCargoOnly=e.target.checked;render();});
  P.querySelector('[data-market-compare]')?.addEventListener('change',e=>{marketCompare=world.cities.find(c=>c.id===e.target.value&&c.id!==s.at&&isDiscovered(g,c.id)&&g.intel?.[c.id])?.id??"";render();});
  P.querySelectorAll("[data-market-qty]").forEach((e) => e.onclick = () => { marketQty = e.dataset.marketQty === "max" ? "max" : +e.dataset.marketQty; render(); });
  { const pv = P.querySelector("[data-market-preview]"); if (pv) P.querySelectorAll(".mkt-pill").forEach((e) => { const show = () => { pv.textContent = e.dataset.tip || t.previewHint; }, hide = () => { pv.textContent = t.previewHint; }; e.addEventListener("mouseenter", show); e.addEventListener("focus", show); e.addEventListener("mouseleave", hide); e.addEventListener("blur", hide); }); }
  P.querySelectorAll("[data-b]").forEach((e) => e.onclick = () => { const [gd, q] = e.dataset.b.split(":"); const cash0 = g.cash, q0 = s.cargo[gd] ?? 0; const r = doBuy(g, s, gd, +q); sfx(r.ok ? "buy" : "error"); act(() => r); const dq = (s.cargo[gd] ?? 0) - q0, dc = cash0 - g.cash; if (dq > 0 && dc > 0) toast(t.toastBought.replace("{q}", dq).replace("{g}", t.goods[gd] ?? gd).replace("{c}", fmtM(dc))); });
  P.querySelectorAll("[data-s]").forEach((e) => e.onclick = () => { const [gd, v] = e.dataset.s.split(":"); const cash0 = g.cash, q0 = s.cargo[gd] ?? 0; const r = doSell(g, s, gd, v === "all" ? s.cargo[gd] ?? 0 : +v); sfx(r.ok ? "sell" : "error"); act(() => r); const dq = q0 - (s.cargo[gd] ?? 0), dc = g.cash - cash0; if (dq > 0 && dc > 0) toast(t.toastSold.replace("{q}", dq).replace("{g}", t.goods[gd] ?? gd).replace("{c}", fmtM(dc))); });
  P.querySelectorAll("[data-captain-review]").forEach(b=>b.onclick=()=>{
    const c=captainRoster(g,s.at).find(x=>x.id===b.dataset.captainReview);if(!c)return;
    const el=$("title"),t=CT[lang],was=playing;playing=false;el.hidden=false;
    el.innerHTML=`<div class="box capdlg"><div class="capdlg-handle"><h2>${t.confirm}</h2></div><div class="capdlg-body"><p>${t.fee}: ${c.fee} · ${c.wage} ${t.day} (${c.wage*7}/${lang==="es"?"semana":"week"})</p><p>${t.info}</p><p>${t.navigation}: +${c.navigation*4}% ${lang==="es"?"velocidad":"speed"}</p><button id="cap-confirm">${t.confirm}</button><button id="cap-cancel">${t.cancel}</button><p id="cap-msg"></p></div></div>`;
    el.querySelector("h2").textContent=t.confirm+": "+c.name+" → "+(T[lang].types[s.type]??s.type)+" "+s.id;
    $("cap-cancel").onclick=()=>{el.hidden=true;playing=was;render();};
    $("cap-confirm").onclick=()=>{const r=hireCaptain(g,s,c.id);if(!r.ok){$("cap-msg").textContent=t.failed;return;}el.hidden=true;playing=was;autosave();render();};
  });
  P.querySelector("[data-captain-dismiss]")?.addEventListener("click", askDismissCaptain);
  P.querySelectorAll("[data-almbid]").forEach((e) => e.onclick = () => { const v = Math.floor(+P.querySelector(`[data-alminput="${e.dataset.almbid}"]`)?.value); const r = placeBid(g, s.at, v, e.dataset.almbid); almNote = r.ok ? null : (r.reason === "no cash" ? t.almErrCash : t.almErr); act(() => {}); });
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
  P.querySelectorAll("[data-wallact]").forEach((e) => e.onclick = () => { bldAction = { kind: "walls", plotId: s.at + ":walls" }; bldError = null; render(); });
  P.querySelectorAll("[data-toweract]").forEach((e) => e.onclick = () => { bldAction = { kind: "towers", plotId: s.at + ":towers" }; bldError = null; render(); }); // city-level works: fake plot id keeps the sailed-away guard (same as walls) // city-level works: fake plot id keeps the sailed-away guard working
  P.querySelector("[data-bldcancel]")?.addEventListener("click", () => { bldAction = null; bldError = null; render(); });
  P.querySelector("[data-bldconf]")?.addEventListener("click", () => { const a0 = bldAction; if (!a0) return;
    let r = null;
    act(() => {
      if (a0.kind === "buy") { const p = (Array.isArray(plotsCache[s.at]) ? plotsCache[s.at] : []).find((x) => x.id === a0.plotId); r = p ? buyPlot(g, s.at, p) : { ok: false, reason: "bad plot" }; }
      else if (a0.kind === "buypermit") { const p = (Array.isArray(plotsCache[s.at]) ? plotsCache[s.at] : []).find((x) => x.id === a0.plotId); r = p ? buyPlot(g, s.at, p, { permit: true }) : { ok: false, reason: "bad plot" }; }
      else if (a0.kind === "walls") r = startWalls(g, s.at);
      else if (a0.kind === "towers") r = startTowers(g, s.at);
      else r = startConstruction(g, s.at, a0.plotId, a0.type);
    });
    if (r && !r.ok) { bldError = r.reason ?? "error"; render(); return; } // keep the card armed and say why
    bldAction = null; bldError = null; render(); });
  if ($("rt-set")) $("rt-set").onclick = () => act(() => setRoute(g, s, s.at, $("rt-to").value, $("rt-out").value, $("rt-back").value));
  if ($("rt-cancel")) $("rt-cancel").onclick = () => act(() => clearRoute(s));
  if ($("rts-add")) { // advanced-route editor
    const d = routeDrafts[s.id], ids = world.cities.filter((c) => c.id !== s.at).map((c) => c.id);
    d.stops.forEach((st, i) => {
      $("rts-city-" + i).onchange = (e) => { st.city = e.target.value; rpathUpdatePreview(s); };
      $("rts-bg-" + i).onchange = (e) => { st.buyGood = e.target.value; rpathUpdatePreview(s); };
      $("rts-sg-" + i).onchange = (e) => { st.sellGood = e.target.value; rpathUpdatePreview(s); };
      $("rts-bp-" + i).oninput = (e) => { st.buyMax = e.target.value; rpathUpdatePreview(s); };
      $("rts-sp-" + i).oninput = (e) => { st.sellMin = e.target.value; rpathUpdatePreview(s); };
      $("rts-del-" + i).onclick = () => act(() => { d.stops.splice(i, 1); });
    });
    $("rts-mincash").oninput = (e) => { d.minCash = e.target.value; };
    $("rts-add").onclick = () => act(() => { d.stops.push({ city: ids[0] ?? s.at, buyGood: "", buyMax: "", sellGood: "", sellMin: "" }); });
    $("rts-set2").onclick = () => {
      let r = null;
      act(() => {
        const num = (v) => (v === "" || v == null || !Number.isFinite(+v) ? null : Math.max(0, Math.floor(+v)));
        const stops = d.stops.filter((st) => st.city).map((st) => ({
          city: st.city,
          buy: st.buyGood ? [{ good: st.buyGood, ...(num(st.buyMax) != null ? { maxPrice: num(st.buyMax) } : {}) }] : [],
          sell: st.sellGood ? [{ good: st.sellGood, ...(num(st.sellMin) != null ? { minPrice: num(st.sellMin) } : {}) }] : [],
        }));
        r = setRouteAdv(g, s, stops, { minCash: num(d.minCash) ?? 0 });
        if (r.ok) delete routeDrafts[s.id];
      });
      if (r && !r.ok) { const m = $("rts-msg"); if (m) m.textContent = t.routeSetErr; } // after the re-render, so the message survives
    };
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
  P.querySelectorAll("[data-sellship-id]").forEach((e) => e.onclick = () => act(() => { const x = g.ships.find((y) => y.id === Number(e.dataset.sellshipId)); const r = x && sellShip(g, x); if (r && r.ok) sel = 0; }));
  P.querySelectorAll("[data-caravel]").forEach((e) => e.onclick = () => act(() => { const r = buyCaravel(g, s.at); if (r.ok) sel = g.ships.length - 1; }));
  P.querySelectorAll("[data-arrive]").forEach((e) => e.onclick = () => act(() => waitUntilArrival(g, s)));
  renderShipWin();
  if ($("v3d")) updateCityHeader(g.ships[sel]?.at);
}

// Ship window: floating .pwin dialog for the selected ship. Rebuilt on every render pass, so
// ETAs update live at sea; every button runs through act() like its panel twin.
function renderShipWin() {
  const swWasOpen = !!document.getElementById("shipwin");
  document.getElementById("shipwin")?.remove();
  if (!shipWin || !g || g.over || $("v3d") || !ship()) return;
  const s = ship();
  const d = document.createElement("section");
  d.id = "shipwin"; d.className = "pwin"; d.setAttribute("role", "dialog");
  d.setAttribute("aria-label", `${t.types[s.type]} ${s.id}`);
  const hp = { fmt, fmtM, cityName, types: t.types, goods: t.goods, eta: (sh) => sh.voyage?.anchored ? t.anchored : etaText(g.tick + sh.voyage.ticksLeft) };
  d.innerHTML = `<div class="pwin-handle" tabindex="0" role="button" aria-label="${lang === "es" ? "Mover ventana con las flechas" : "Move window with arrow keys"}"><span class="pwin-title">${t.types[s.type]} ${s.id}</span><button class="pwin-close" data-swclose="1" aria-label="${t.close} (Esc)" title="${t.close} (Esc)">${CLOSE_ICON}</button></div><div class="pwin-body">${shipWindowHtml(g, s, lang, shipWin.tab, hp)}</div>`;
  if (!swWasOpen) sfx("open"); // only when the window appears, not on every re-render
  document.body.appendChild(d);
  const handle = d.querySelector(".pwin-handle"); let drag = null;
  const move = (x, y) => { const q = clampWindow(x, y, d.offsetWidth, d.offsetHeight, innerWidth, innerHeight - 70); d.style.left = q.left + "px"; d.style.top = q.top + "px"; d.style.right = "auto"; };
  handle.onpointerdown = (e) => { if (e.target.closest("button")) return; drag = [e.clientX - d.offsetLeft, e.clientY - d.offsetTop]; handle.setPointerCapture(e.pointerId); };
  handle.onpointermove = (e) => { if (drag) move(e.clientX - drag[0], e.clientY - drag[1]); };
  handle.onpointerup = handle.onpointercancel = () => drag = null;
  handle.onkeydown = (e) => { if (e.target !== handle) return; const keys = { ArrowLeft: [-20, 0], ArrowRight: [20, 0], ArrowUp: [0, -20], ArrowDown: [0, 20] }; const v = keys[e.key]; if (v) { e.preventDefault(); e.stopPropagation(); move(d.offsetLeft + v[0], d.offsetTop + v[1]); } };
  d.querySelector("[data-swclose]").onclick = () => { sfx("close"); shipWin = null; render(); };
  d.querySelectorAll("[data-swtab]").forEach((e) => e.onclick = () => { shipWin.tab = e.dataset.swtab; render(); });
  d.querySelectorAll("[data-st]").forEach((e) => e.onclick = () => act(() => storeGoods(g, s, e.dataset.st, s.cargo[e.dataset.st] ?? 0)));
  d.querySelectorAll("[data-tk]").forEach((e) => e.onclick = () => act(() => takeGoods(g, s, e.dataset.tk, 9999)));
  d.querySelectorAll("[data-hire]").forEach((e) => e.onclick = () => act(() => hireCrew(g, s, Number(e.dataset.hire))));
  d.querySelectorAll("[data-dismiss]").forEach((e) => e.onclick = () => act(() => dismissCrew(g, s, Number(e.dataset.dismiss))));
  d.querySelectorAll("[data-gunrepair]").forEach((e) => e.onclick = () => act(() => repairGuns(g, s)));
  d.querySelectorAll("[data-weapon]").forEach((e) => e.onclick = () => act(() => buyWeapon(g, s, e.dataset.weapon)));
  d.querySelectorAll("[data-gear]").forEach((e) => e.onclick = () => act(() => buyGear(g, s)));
  d.querySelectorAll("[data-repair]").forEach((e) => e.onclick = () => act(() => repairShip(g, s)));
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
  if (s0.voyage) sfx("sail");
  if (automaticTime && s0.voyage) { playing = true; manualPause = false; }
  target = null; render(); }
function closeCityWindow() {
  const d=$("v3d"); if (!d) return;
  const w=d.querySelector(".city-window"); if(w){if(!w.hidden)sfx("close");w.hidden=true;d.classList.remove("win-open");d.querySelector("[data-city-tab]")?.focus();}
  syncMissionEcho();
}
function close3d() {
  const d=$("v3d"); if(!d)return;
  city3dId = null;
  const p=$("panel"), home=$("panel-home"); if(p&&home)home.appendChild(p);
  d.city2dResize?.disconnect();d.city2dNavObs?.disconnect();d.remove();document.body.classList.remove("in-city-3d");
  if (automaticTime && planningResume && !manualPause) playing = true;
  planningResume = false;
}
let bldSelPlot=null, townSel=null;
function openCityPanel(tb) {
  const d=$("v3d");if(!d)return;if(tb!==tab)rumorNote=null;tab=tb;
  const w=d.querySelector(".city-window");w.dataset.cityPanel=tb;if(w.hidden)sfx("open");w.hidden=false;d.classList.add("win-open");
  render();
  d.querySelector(".city-window-title").textContent=cityPanelTitle(tb);
  d.querySelector("[data-close-panel]").focus();
}
// Right city panel (P3-style button bar): flat own-work icons, one stroke style.
const CC_ICONS = Object.fromEntries(Object.entries({
  build: '<path d="M4 21h16M6 21V11l6-6 6 6v10" fill="none" stroke-width="1.7"/><path d="M10 21v-5h4v5" fill="currentColor" stroke="none"/>',
  ships: '<path d="M12 3v13M12 5c4 1 6 4 7 8l-7 1zM12 8c-3 .5-5 3-5.5 6l5.5 1z" stroke="none"/><path d="M4 18h16l-2 3H6z" stroke="none"/>',
  reports: '<rect x="6" y="4" width="12" height="16" rx="1.5" fill="none" stroke-width="1.7"/><path d="M9 9h6M9 13h6M9 17h4" fill="none" stroke-width="1.5"/>',
  msgs: '<rect x="4" y="6" width="16" height="12" rx="1.5" fill="none" stroke-width="1.7"/><path d="M4.5 8 12 14l7.5-6" fill="none" stroke-width="1.7"/>',
  clock: '<circle cx="12" cy="12" r="8" fill="none" stroke-width="1.7"/><path d="M12 7v5l3.5 2" fill="none" stroke-width="1.7"/>',
  speed: '<path d="M5 6l7 6-7 6zM12 6l7 6-7 6z" stroke="none"/>',
  menu: '<path d="M5 7h14M5 12h14M5 17h14" fill="none" stroke-width="1.8"/>',
  back: '<path d="M14 5l-8 7 8 7" fill="none" stroke-width="1.8"/><path d="M17 12h3" fill="none" stroke-width="1.8"/>',
}).map(([k, v]) => [k, `<svg class="cc-ico" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" stroke="currentColor">${v}</svg>`]));
// Live labels for the city right panel: same source values as the header buttons, re-read every render.
function syncCityControls() {
  const d = $("v3d"); if (!d || !g) return;
  const set = (k, txt) => { const el = d.querySelector(`[data-cc="${k}"]`); if (el && el.textContent !== txt) el.textContent = txt; };
  set("build", t.bldBuild);
  set("ships", lang === "es" ? "Barcos" : "Ships");
  set("reports", LT[lang].reports);
  set("msgs", LT[lang].messages);
  const ub = d.querySelector('[data-cc-badge="msgs"]'); if (ub) { const n = unread(g); if (ub.textContent !== String(n)) ub.textContent = n; ub.hidden = n <= 0; }
  const sb = d.querySelector('[data-cc-badge="ships"]'); if (sb) { const n = g.ships.filter((x) => x.at === city3dId && !x.voyage).length; if (sb.textContent !== String(n)) sb.textContent = n; sb.hidden = n <= 0; }
  const cp = d.querySelector('[data-corner="play"]');
  if (cp) { cp.textContent = playing ? "⏸" : "▶"; cp.title = playing ? t.pause : t.play; cp.setAttribute("aria-label", playing ? t.pause : t.play); }
  const cs = d.querySelector('[data-corner="speed"]');
  if (cs) { cs.textContent = `${speed}x`; cs.title = `${t.speed} ${speed}x`; cs.setAttribute("aria-label", `${t.speed} ${speed}x`); }
  for (const [k, es, en] of [["fit", "Encajar", "Fit"], ["zoom-in", "Acercar", "Zoom in"], ["zoom-out", "Alejar", "Zoom out"], ["motion", "Animaciones", "Animations"], ["construct", "Vista de construcción", "Build view"]]) {
    const b = d.querySelector(`[data-corner="${k}"]`); if (b) { b.title = lang === "es" ? es : en; b.setAttribute("aria-label", lang === "es" ? es : en); }
  }
  set("section", lang === "es" ? "Ciudad" : "City");
  set("section2", lang === "es" ? "Actividad" : "Activity");
  for (const [sel, tip] of [['[data-city-tab="buildings"]', t.tipBuild], ["[data-city-ships]", t.tipShips], ["[data-city-reports]", t.tipReports], ["[data-city-msgs]", t.tipMsgs], ["[data-city-menu]", t.tipMenu], ["[data-map]", t.tipBack]]) { const rb = d.querySelector(sel); if (rb && rb.title !== tip) rb.title = tip; }
  const bar2 = d.querySelector(".city-corner"); if (bar2) bar2.setAttribute("aria-label", lang === "es" ? "Controles de tiempo, vista y configuración" : "Time, view and settings controls");
  set("menu", lang === "es" ? "Menú" : "Menu");
  set("back", lang === "es" ? "Volver al mapa" : "Back to map");
  const fsb = $("fs"), cfs = d.querySelector('[data-corner="fs"]');
  if (cfs && fsb) { cfs.hidden = fsb.hidden; cfs.title = fsb.title; cfs.setAttribute("aria-label", fsb.getAttribute("aria-label") ?? "Fullscreen"); }
  const cl = d.querySelector('[data-corner="lang"]'); if (cl) { cl.textContent = lang === "es" ? "EN" : "ES"; cl.title = t.tipLang; }
  const w = d.querySelector(".city-window");
  if (w && !w.hidden && w.dataset.cityPanel) {
    const ttl = d.querySelector(".city-window-title"); if (ttl) ttl.textContent = cityPanelTitle(w.dataset.cityPanel);
    const cb = d.querySelector("[data-close-panel]"); if (cb) { cb.setAttribute("aria-label", `${t.close} (Esc)`); cb.title = `${t.close} (Esc)`; }
    const hd = d.querySelector(".city-window-handle"); if (hd) hd.setAttribute("aria-label", lang === "es" ? "Mover ventana con las flechas" : "Move window with arrow keys");
  }
  const s0 = ship(); if (s0 && !s0.voyage) updateCityHeader(s0.at);
}
function cityPanelTitle(tb) {
  return ({ market: t.tabMarket, yard: t.tabYard, tavern: t.tabTavern, bank: t.tabBank, city: t.tabCity, hall: t.tabHall, buildings: t.bldBuild, route: t.tabRoute, house: premises(g, ship().at, lang).label, lonja: t.tabLonja, store: t.tabStore, plot: (() => { const r = buildingsRows(g, ship().at).find((x) => x.plotId === bldSelPlot); return r ? buildingLabel(t, r) : t.tabBuildings; })(), town: t.townTypes[townSel] ?? t.tabCity })[tb] || t.tabCity;
}
function updateCityHeader(cityId) {
  const d = $("v3d"); if (!d || !cityId || !world.nodes[cityId]) return;
  const nm = d.querySelector("#city-header-name"), info = d.querySelector("#city-header-info");
  if (!nm || !info) return;
  const eff = cityEffects(g, cityId), rs = respectOf(g, cityId);
  nm.textContent = cityName(cityId);
  const extra = [];
  const wl = wallsLevel(g, cityId); if (wl > 0) extra.push(`${lang === "es" ? "Murallas" : "Walls"} ${wl}`);
  if (hasOffice(g, cityId)) extra.push(t.tabOffice);
  if (warehouseOf(g, cityId)) extra.push(t.tabStore);
  info.textContent = ` · ${fmt(eff.pop + eff.popBonus)} ${t.cityCitizens} · ${lang === "es" ? "Respeto" : "Respect"}: ${RESPECT_NAMES[lang][rs.id]}${extra.length ? " · " + extra.join(" · ") : ""}`;
}
function open3d(s0) {
  if($("v3d")||s0.voyage)return;
  city3dId = s0.at;
  if (automaticTime) { planningResume = playing && !manualPause; playing = false; }
  shipWin=null;rumorNote=null;document.getElementById("shipwin")?.remove();
  const nd = world.nodes[s0.at], q = new URLSearchParams({ ...(city2dEnabled(location.search) ? { chrome: "0" } : {}), city: s0.at, pop: nd.pop ?? 8000, ships: g.ships.filter((x) => x.at === s0.at && !x.voyage).length || 1, wh: warehouseOf(g, s0.at) ? "1" : "0", tod: String(0.35 + progress * 0.4), hud: t.hud3d, bnames: JSON.stringify(t.bldTypes), names: JSON.stringify({ market: t.tabMarket, tavern: t.tabTavern, shipyard: t.tabYard, bank: t.tabBank, office: t.tabOffice, ...(warehouseOf(g, s0.at) ? { warehouse: t.tabStore } : {}) }), tnames: JSON.stringify(Object.fromEntries(portLayout(s0.at, nd.pop ?? 8000).houses.filter((h) => h.type !== "house").map((h) => ["town:" + h.type, t.townTypes[h.type] ?? h.type]))), walls:String(wallsLevel(g,s0.at)), bld: JSON.stringify(g.buildings?.[s0.at] ?? {}), tick: String(g.tick), labels: JSON.stringify(Object.fromEntries(buildingsRows(g, s0.at).map((r) => [r.plotId, buildingLabel(t, r)]))), pnames: JSON.stringify(Object.fromEntries(buildingsRows(g, s0.at).map((r) => [r.plotId, (r.type ? (t.bldTypes[r.type] ?? r.type) + (r.state === "construction" ? ` ${r.nextLevel}` : r.level ? ` ${r.level}` : "") : t.bldState.plot) + " · " + (r.state === "construction" ? t.bldReady.replace("{d}", r.readyDay).replace("{p}", Math.round(r.progress * 100)) : (t.bldState[r.state] ?? r.state))]))) });
  const d=document.createElement("div");d.id="v3d";
  d.innerHTML=`<iframe src="${city2dEnabled(location.search)?"city2d":"proto3d"}/index.html?${q}" title="${t.tabCity}"></iframe><header class="city-header"><strong id="city-header-name"></strong><span id="city-header-info" role="button" tabindex="0"></span></header><div class="city-mission-wrap" id="city-mission-wrap" hidden><span class="city-mission" id="city-mission" role="status" aria-live="polite"></span><button type="button" id="mission-min">\u2212</button></div><button type="button" class="city-mission-max" id="mission-max" hidden>\u2691</button><nav class="city-controls" aria-label="${t.tabCity}"><p class="cc-section" data-cc="section">${lang==="es"?"Ciudad":"City"}</p><button data-city-tab="buildings">${CC_ICONS.build}<span data-cc="build">${t.bldBuild}</span></button><button data-city-ships>${CC_ICONS.ships}<span data-cc="ships">${lang==="es"?"Barcos":"Ships"}</span><b class="cc-badge" data-cc-badge="ships" hidden></b></button><p class="cc-section" data-cc="section2">${lang==="es"?"Actividad":"Activity"}</p><button data-city-reports>${CC_ICONS.reports}<span data-cc="reports">${LT[lang].reports}</span></button><button data-city-msgs>${CC_ICONS.msgs}<span data-cc="msgs">${LT[lang].messages}</span><b class="cc-badge" data-cc-badge="msgs" hidden></b></button><button data-city-menu>${CC_ICONS.menu}<span data-cc="menu">${lang==="es"?"Menú":"Menu"}</span></button><button data-map>${CC_ICONS.back}<span data-cc="back">${lang==="es"?"Volver al mapa":"Back to map"}</span></button></nav><div class="city-corner" role="toolbar" aria-label="${lang==="es"?"Controles de tiempo, vista y configuración":"Time, view and settings controls"}"><button data-corner="play"></button><button data-corner="speed"></button>${city2dEnabled(location.search) ? `<span class="cc-sep"></span><button data-corner="fit">&#x2922;</button><button data-corner="zoom-in">+</button><button data-corner="zoom-out">&minus;</button><button data-corner="motion" aria-pressed="true">&#x2726;</button><button data-corner="construct" aria-pressed="false">&#x2692;</button>` : ""}<span class="cc-sep"></span><button data-corner="fs">⛶</button><button data-corner="lang">${lang === "es" ? "EN" : "ES"}</button></div><section class="city-window pwin" role="dialog" aria-label="${t.tabCity}" hidden><div class="city-window-handle pwin-handle" tabindex="0" role="button" aria-label="${lang==="es"?"Mover ventana con las flechas":"Move window with arrow keys"}"><span class="city-window-title pwin-title"></span><button class="pwin-close" data-close-panel aria-label="${t.close} (Esc)" title="${t.close} (Esc)">${CLOSE_ICON}</button></div><div class="city-panel-host pwin-body"></div></section>`;  document.body.appendChild(d);document.body.classList.add("in-city-3d"); d.querySelector(".city-panel-host").appendChild($("panel")); updateCityHeader(s0.at);
  syncMissionEcho();
  d.querySelector("iframe").addEventListener("load", () => { syncMissionEcho(); // re-dock the mission line once the iframe's own chrome (2D toolbar) exists
    try { const nav = d.querySelector("iframe").contentDocument?.querySelector("nav");
      if (nav) { d.city2dNavObs?.disconnect(); d.city2dNavObs = new MutationObserver(() => syncMissionEcho()); d.city2dNavObs.observe(nav, { attributes: true, childList: true, subtree: true, attributeFilter: ["hidden", "class", "style"] }); }
    } catch { /* cross-document watch unavailable: load/resize hooks still cover placement */ } });
  if(city2dEnabled(location.search)){const resize=()=>{d.querySelector("iframe").style.width=Math.max(200,d.clientWidth-d.querySelector(".city-controls").offsetWidth)+"px";syncMissionEcho();};d.city2dResize=new ResizeObserver(resize);d.city2dResize.observe(d);d.city2dResize.observe(d.querySelector(".city-controls"));resize();}
  d.querySelector("[data-map]").onclick=close3d;
  d.querySelector("[data-city-ships]").onclick=()=>openCityPanel("route");
  d.querySelector("[data-city-reports]").onclick=()=>showLedger("rep");
  d.querySelector("[data-city-menu]").onclick=showMenu;
  d.querySelector("[data-city-msgs]").onclick=()=>showLedger("msg");
  const fr=d.querySelector("iframe"), cornerCmd=(cmd)=>fr.contentWindow?.postMessage({kind:"city2d-cmd",city:s0.at,cmd},location.origin);
  d.querySelector('[data-corner="play"]').onclick=()=>toggleClock();
  d.querySelector('[data-corner="speed"]').onclick=()=>{speed=nextTimeSpeed(speed,automaticTime);localStorage.setItem("speed",String(speed));render();};
  for(const c of ["fit","zoom-in","zoom-out"]){const b=d.querySelector(`[data-corner="${c}"]`);if(b)b.onclick=()=>cornerCmd(c);}
  const cm=d.querySelector('[data-corner="motion"]');if(cm)cm.onclick=()=>cornerCmd("toggle-motion");
  const cc2=d.querySelector('[data-corner="construct"]');if(cc2)cc2.onclick=()=>cornerCmd("toggle-construct");
  d.querySelector('[data-corner="fs"]').onclick=()=>$("fs")?.click();
  d.querySelector('[data-corner="lang"]').onclick=()=>$("lang")?.click();
  $("mission-min").onclick=()=>{localStorage.setItem("missionMin","1");syncMissionEcho();};
  $("mission-max").onclick=()=>{localStorage.setItem("missionMin","0");syncMissionEcho();};
  d.querySelector("[data-close-panel]").onclick=closeCityWindow;
  d.querySelectorAll("[data-city-tab]").forEach(b=>b.onclick=()=>openCityPanel(b.dataset.cityTab));
  const ci=d.querySelector("#city-header-info");ci.onclick=()=>openCityPanel("city");ci.onkeydown=(e)=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();openCityPanel("city");}};
  const handle=d.querySelector(".city-window-handle"),win=d.querySelector(".city-window");let drag=null;
  const move=(x,y)=>{const p=clampWindow(x,y,win.offsetWidth,win.offsetHeight,innerWidth,innerHeight-70);
  for(const el of [d.querySelector(".city-corner"),$("city-mission-wrap"),$("mission-max")]){ // the bar and the mission chip (expanded or minimised flag) never cover the title/close row (Marco 25/10)
    if(el&&!el.hidden){const bl=el.offsetLeft,br=bl+el.offsetWidth,bb=el.offsetTop+el.offsetHeight;
      if(p.left<br&&p.left+win.offsetWidth>bl&&p.top<bb+6)p.top=Math.min(bb+6,Math.max(0,innerHeight-70-Math.min(win.offsetHeight,80)));}}
  win.style.left=p.left+"px";win.style.top=p.top+"px";win.style.right="auto";};
  handle.onpointerdown=e=>{if(e.target.closest("button"))return;drag=[e.clientX-win.offsetLeft,e.clientY-win.offsetTop];handle.setPointerCapture(e.pointerId);};
  handle.onpointermove=e=>{if(drag)move(e.clientX-drag[0],e.clientY-drag[1]);};
  handle.onpointerup=handle.onpointercancel=()=>drag=null;
  handle.onkeydown=e=>{if(e.target!==handle)return;const keys={ArrowLeft:[-20,0],ArrowRight:[20,0],ArrowUp:[0,-20],ArrowDown:[0,20]};const v=keys[e.key];if(v){e.preventDefault();e.stopPropagation();move(win.offsetLeft+v[0],win.offsetTop+v[1]);}};
  d.querySelector("[data-city-tab]").focus();
  syncCityControls();
}
addEventListener("message",e=>{
  const d=$("v3d");
  if(!d||e.origin!==location.origin||e.source!==d.querySelector("iframe").contentWindow)return;
  if(e.data?.kind==="city2d-view"){const m=d.querySelector('[data-corner="motion"]'),cn=d.querySelector('[data-corner="construct"]');m?.setAttribute("aria-pressed",String(!!e.data.motion));cn?.setAttribute("aria-pressed",String(!!e.data.construct));return;}
  if(e.data?.kind==="plot"){if(bldSelPlot!==e.data.id){bldAction=null;bldError=null;}bldSelPlot=e.data.id;openCityPanel("plot");return;} // switching plots drops an armed action so confirm cannot hit the old plot
  if(e.data?.kind!=="building")return;
  if(String(e.data.id).startsWith("town:")){townSel=e.data.id.slice(5);openCityPanel("town");return;}
  if(e.data.id==="hall"||e.data.id==="lonja"){openCityPanel(e.data.id);return;}
  const tb=tabForBuilding(e.data.id);if(tb)openCityPanel(tb);
});
// Free navigation (only in games with g.freeNav): right click sends the selected ship there, port or open sea, no menu and no Zarpar button.
mapEl.addEventListener("contextmenu", (ev) => {
  if (g?.freeNav !== true) return; // flag off: the port menu works as before
  ev.preventDefault(); ev.stopPropagation(); closeMenu();
  const cityEl = ev.target.closest?.("g.city"), s0 = ship(); if (!s0) return;
  let lat, lon;
  if (cityEl && world.nodes[cityEl.dataset.c]) ({ lat, lon } = world.nodes[cityEl.dataset.c]);
  else { const p = mapEl.createSVGPoint(); p.x = ev.clientX; p.y = ev.clientY; const ctm = mapEl.getScreenCTM(), q = p.matrixTransform(ctm.inverse()); const tol = 48 / (ctm.a || 1); let snap = null, snapD = tol; mapEl.querySelectorAll("g.city").forEach((el) => { const d = Math.hypot(Number(el.dataset.mx) - q.x, Number(el.dataset.my) - q.y); if (d < snapD) { snapD = d; snap = el.dataset.c; } }); if (snap && world.nodes[snap]) ({ lat, lon } = world.nodes[snap]); else { lon = q.x / sc + x0; lat = y1 - q.y / (sc * 1.25); } } // missing the small port dot by a few screen px must not send the ship to open sea (24/10 human playtest: 3 near-port clicks missed, one routed 759 km away); snap within 48 screen px, zoom-independent via the CTM
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
$("spd").onclick = () => { speed = nextTimeSpeed(speed, automaticTime); localStorage.setItem("speed", String(speed)); render(); };
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
  const reportBody=()=>{const activity=`<h3>${lang==="es"?"Historial de operaciones":"Activity history"}</h3><div class="activity-history">${logHtml(g.log,T[lang],lang,cityName)||`<p>${lang==="es"?"Aún no hay operaciones.":"No activity yet."}</p>`}</div>`,weekly=reportsHtml(g,lang,fmtM,(k)=>T[lang].goods[k]??k),chronicle=chronicleHtml(g,lang,fmtM,(k)=>T[lang].goods[k]??k),voyages=`<h3>${voyagesTitle(lang)}</h3>`+voyagesHtml(g,lang,fmtM,cityName),encounters=encountersHtml(g,lang);return activity+(styled?reports2dHtml(weekly,chronicle,voyages,encounters,lang):weekly+chronicle+voyages+encounters);};
  const body = () => kind === "rep" ? reportBody() : styled ? inbox2dHtml(g,lang,fmtM,cityName,(k)=>T[lang].goods[k]??k) : inboxHtml(g,lang,fmtM,cityName,(k)=>T[lang].goods[k]??k);
  const draw = () => { el.innerHTML = styled ? `<section class="box wide ui2d-window${kind==='rep'?' ui2d-reports':''}" role="dialog" aria-modal="true" aria-labelledby="ui2d-title"><header class="ui2d-heading"><span aria-hidden="true">${kind==='rep'?'▤':'✉'}</span><h2 id="ui2d-title">${kind==='rep'?LT[lang].reports:LT[lang].messages}</h2><button id="l-close" class="pwin-close" aria-label="${LT[lang].close}" title="${LT[lang].close}">${CLOSE_ICON}</button></header><div class="ui2d-content">${body()}</div></section>` : `<div class="box wide ledgerdlg"><div class="ledger-body">${body()}</div><p class="ledger-close"><button id="l-close" class="pwin-close" aria-label="${LT[lang].close}" title="${LT[lang].close}">${CLOSE_ICON}</button></p></div>`; el.hidden = false;
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
$("hint-mission-toggle").onclick = () => { localStorage.setItem("missionMin", localStorage.getItem("missionMin") === "1" ? "0" : "1"); render(); };
function showMenu() {
  t = T[lang]; const el = $("title"), wasPlaying = playing; playing = false;
  el.innerHTML = `<div class="box pausemenu"><div class="pausemenu-handle"><h2>${t.paused}</h2></div><div class="pausemenu-body"><p><button id="m-res">${t.resume}</button></p><p><button id="m-save">${t.saveNow}</button> <button id="m-exp">${t.exportS}</button> <span id="m-msg"></span></p>` +
    `<p><small>${t.seedLine.replace("{s}", g.seed ?? 0)}</small></p><p>${t.lang2}: <button id="m-lang">${lang === "es" ? "EN" : "ES"}</button> ${t.speedDef}: <button id="m-spd">${speed}x</button></p><p><label><input id="m-auto-time" type="checkbox" ${automaticTime ? "checked" : ""}> ${lang === "es" ? "Avance automático" : "Automatic time"}</label></p><p><small>${lang === "es" ? "El puerto se pausa para planificar. Las rutas automáticas siguen sin detenerse al llegar." : "The port pauses for planning. Automatic routes keep running on routine arrivals."}</small></p><p><small>${t.keys}</small></p><p><button id="m-cred">${t.cred}</button></p><p><button id="m-set">${t.stTitle}</button></p><p><button id="m-quit">${t.quit}</button></p></div></div>`;
  el.hidden = false;
  const close = () => { el.hidden = true; playing = wasPlaying; render(); };
  $("m-auto-time").onchange = e => { automaticTime = e.target.checked; localStorage.setItem('automatic-time', String(automaticTime)); tickAcc = 0; if (!automaticTime && speed === 8) { speed = 4; localStorage.setItem("speed", "4"); } $("m-spd").textContent = speed + 'x'; };
  $("m-res").onclick = close;
  $("m-save").onclick = () => { autosave(); $("m-msg").textContent = t.saved; };
  $("m-exp").onclick = () => { exportSave(JSON.stringify(packGame(g, company)), g.day); $("m-msg").textContent = t.expDone; };
  $("m-lang").onclick = () => { lang = lang === "es" ? "en" : "es"; localStorage.setItem("lang", lang); document.documentElement.lang = lang; showMenu(); };
  $("m-spd").onclick = () => { speed = nextTimeSpeed(speed, automaticTime); localStorage.setItem("speed", String(speed)); $("m-spd").textContent = speed + "x"; };
  $("m-cred").onclick = () => showCredits();
  $("m-set").onclick = () => showSettings();
  $("m-quit").onclick = () => { autosave(); playing = false; close3d(); showTitle(); };
}

function showCredits() {
  t = T[lang]; const el = $("title");
  const line = (k) => `<p class="cred-line">${t[k]}</p>`;
  el.innerHTML = `<div class="box pausemenu"><div class="pausemenu-handle"><h2>${t.cred}</h2></div><div class="pausemenu-body"><p><b>El Almojarife</b> · ${t.credGame}</p>${line("credOwn")}${line("credNE")}${line("credPop")}${line("credOsm")}${line("credGen")}${line("credThree")}${line("credKenney")}<p><button id="cred-back">${t.back}</button></p></div></div>`;
  $("cred-back").onclick = () => { if (inTitle) showTitle(); else showMenu(); };

}

function showSettings() {
  t = T[lang]; const el = $("title");
  const ts = localStorage.getItem("text-size") === "large", rm = localStorage.getItem("reduce-motion") === "1";
  el.innerHTML = `<div class="box pausemenu"><div class="pausemenu-handle"><h2>${t.stTitle}</h2></div><div class="pausemenu-body"><p>${t.lang2}: <button id="st-lang">${lang === "es" ? "EN" : "ES"}</button> ${t.speedDef}: <button id="st-spd">${speed}x</button></p><p><label><input id="st-auto" type="checkbox" ${automaticTime ? "checked" : ""}> ${lang === "es" ? "Avance automático" : "Automatic time"}</label></p><p>${t.stText}: <button id="st-text" aria-pressed="${ts}">${ts ? t.stLarge : t.stNormal}</button></p><p><label><input id="st-motion" type="checkbox" ${rm ? "checked" : ""}> ${t.stMotion}</label></p><p><label><input id="st-sound" type="checkbox" ${soundOn() ? "checked" : ""}> ${t.stSound}</label></p><p><small>${t.stNote}</small></p><p><button id="st-back">${t.back}</button></p></div></div>`;
  $("st-lang").onclick = () => { lang = lang === "es" ? "en" : "es"; localStorage.setItem("lang", lang); document.documentElement.lang = lang; showSettings(); };
  $("st-spd").onclick = () => { speed = nextTimeSpeed(speed, automaticTime); localStorage.setItem("speed", String(speed)); $("st-spd").textContent = speed + "x"; };
  $("st-auto").onchange = e => { automaticTime = e.target.checked; localStorage.setItem("automatic-time", String(automaticTime)); tickAcc = 0; if (!automaticTime && speed === 8) { speed = 4; localStorage.setItem("speed", "4"); } $("st-spd").textContent = speed + "x"; };
  $("st-text").onclick = () => { const large = localStorage.getItem("text-size") !== "large"; localStorage.setItem("text-size", large ? "large" : "normal"); document.body.classList.toggle("text-large", large); showSettings(); };
  $("st-motion").onchange = e => { localStorage.setItem("reduce-motion", e.target.checked ? "1" : "0"); document.body.classList.toggle("reduce-motion", e.target.checked); };
  $("st-sound").onchange = e => { localStorage.setItem("sound", e.target.checked ? "1" : "0"); if (e.target.checked) sfx("confirm"); };
  $("st-back").onclick = () => { if (inTitle) showTitle(); else showMenu(); };
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
    $("p-go").onclick = () => {
      read();
      const raw = localStorage.getItem(SAVE_KEY), prev = raw && isValidSaveText(raw) ? raw : null; // a corrupt current save is not worth protecting
      const launch = () => { playing = false; progress = 0; tickAcc = 0; inTitle = false; start(pf, true, { freeNav }); el.hidden = true; if(!ship().voyage)open3d(ship()); };
      if (!prev) return launch(); // nothing saved: nothing to protect
      // A saved game exists: ask first, and park it in the backup slot before the new game's autosave replaces it (same rotation as Import).
      const old = unpackGame(JSON.parse(prev), world), sum = `${esc(old.company || t.defCo)} · ${t.day} ${old.g.day} · ${fmtM(old.g.cash)}`;
      el.innerHTML = `<div class="box"><h2>${t.replaceTitle}</h2><p>${t.replaceBody.replace("{s}", sum)}</p><p><button id="r-cancel">${t.back}</button> <button id="r-exp">${t.exportS}</button> <button id="r-go">${t.replaceGo}</button></p><div id="r-msg" role="alert"></div></div>`;
      $("r-cancel").onclick = () => draw(); // the saved game was never touched
      $("r-exp").onclick = () => exportSave(prev, old.g.day);
      $("r-go").onclick = () => {
        if (!recoverRotations()) { $("r-msg").textContent = t.errB; return; } // never overwrite backup slots with a parked copy pending
        const keep = localStorage.getItem(SAVE_KEY) ?? prev;
        start(pf, false, { freeNav }); // builds the new game in memory; autosave stays off while inTitle is true
        try { restoreRotate(localStorage, SAVE_KEY, keep, JSON.stringify(packGame(g, company))); } catch { $("r-msg").textContent = t.errB; return; } // fail-closed: if either write fails the saved game is untouched and we stay here
        playing = false; progress = 0; tickAcc = 0; inTitle = false; el.hidden = true; if(!ship().voyage)open3d(ship());
      };
    };
  };
  draw();
}
// The open book is designed for a tall desktop window: on shorter screens scale it down so the whole page stays visible.
function fitTitleBook() {
  const d = document.querySelector("#title .tbroot .desk"); if (!d) return;
  d.style.setProperty("--tbz", "1");
  const need = d.scrollHeight, z = innerWidth > 760 && need > innerHeight + 2 ? Math.max(.6, innerHeight / need) : 1;
  d.style.setProperty("--tbz", String(z));
}
addEventListener("resize", () => fitTitleBook());
function showTitle() {
  inTitle = true;
  t = T[lang]; const saved = loadSaved(), el = $("title");
  const prev = (() => { const raw = getBackup() || getTmp(); if (!raw) return null; try { const r = unpackGame(JSON.parse(raw), world); return { house: r.company || t.defCo, day: r.g.day }; } catch { return { house: t.defCo, day: "?" }; } })(); // what Restore would bring back
  el.innerHTML = titleBookHtml({ lang, saved: saved && { house: saved.company || t.defCo }, backup: prev, dayLabel: saved ? `${t.day} ${saved.g.day}` : "", coinsLabel: saved ? `${fmt(saved.g.cash)} ${lang === "es" ? "monedas" : "coins"}` : "" });
  el.hidden = false;
  fitTitleBook();
  $("t-start").onclick = () => showCreate(t.defCo);
  $("t-cont").onclick = () => { if (!saved) return; g = saved.g; company = saved.company; sel = 0; playing = false; pauseNote = null; progress = 0; tickAcc = 0; inTitle = false; render(); el.hidden = true; if(!ship().voyage)open3d(ship()); };
  $("t-rest").onclick = () => {
    if (!getBackup() && !getTmp()) return;
    if (!recoverRotations()) { $("t-msg").textContent = t.errB; return; } // complete a pending rotation first, or the parked copy would be lost
    const b = getBackup(); if (!b) return;
    try { unpackGame(JSON.parse(b), world); } catch { $("t-msg").textContent = t.badSave; return; }
    if (!confirm(t.restConfirm)) return;
    const raw = localStorage.getItem(SAVE_KEY), cur = raw && isValidSaveText(raw) ? raw : null; // a corrupt current is not worth parking
    try { restoreRotate(localStorage, SAVE_KEY, cur, b); } catch { $("t-msg").textContent = t.errB; return; } // fail-closed: nothing is overwritten unless both copies are safe
    showTitle(); $("t-msg").textContent = t.restDone;
  };
  $("t-lang").onclick = () => { lang = lang === "es" ? "en" : "es"; localStorage.setItem("lang", lang); document.documentElement.lang = lang; showTitle(); };
  $("t-exp").onclick = () => exportSave(); // wrap: the click event must not become the payload argument
  $("t-imp").onclick = () => $("t-file").click();
  $("t-cred").onclick = () => showCredits();
  $("t-file").onchange = async (e) => {
    const f = e.target.files[0]; if(!f)return;
    let r; try { r = unpackGame(JSON.parse(await f.text()), world); } catch { $("t-msg").textContent = t.badSave; return; }
    const prevRaw = localStorage.getItem(SAVE_KEY), prev = prevRaw && isValidSaveText(prevRaw) ? prevRaw : null, packed = JSON.stringify(packGame(r.g, r.company)); // a corrupt current is not worth parking; the old backup stays
    if (!recoverRotations()) { $("t-msg").textContent = t.errB; return; } // never overwrite backup slots with a parked copy pending
    if (prev) { try { restoreRotate(localStorage, SAVE_KEY, prev, packed); } catch { $("t-msg").textContent = t.errB; return; } } // prev lands in the backup slot; the old backup survives until the new save is written
    else try { localStorage.setItem(SAVE_KEY, packed); } catch { $("t-msg").textContent = t.errB; return; } // no campaign to protect: still verify the write
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
