// M2 playable slice: game state and player actions on top of the M1 sim. No DOM here, so it is testable.
import { setRoute, clearRoute, processRoutes } from "./routes.mjs";
import { takeLoan, repayLoan, loansOwed, loanRoom } from "./bank.mjs";
import { addRespect, updateRank, rankOf } from "./rank.mjs";
import { buyCannon as buyCannonShip, repairGuns as repairGunsShip, wearGuns, hireCrew as hireCrewShip, dismissCrew as dismissCrewShip, speedFactor } from "./crew.mjs";
export const buyCannon = buyCannonShip, repairGuns = repairGunsShip, hireCrew = hireCrewShip, dismissCrew = dismissCrewShip;
import { openVoyage, recordSale } from "./voyages.mjs";
import { chargeToll, tollsDue } from "./tolls.mjs";
import { processLoans } from "./bank.mjs";
const r2d = (x) => Math.round(x * 100) / 100;
import { accrueDay, settleWeek, warnLowCash, accruedTotal, post, logBuy, logSell, OVERDRAFT_LIMIT } from "./ledger.mjs";
import { route } from "../sim/world.mjs";
import { makeMarket, tickMarket, tickMarketCity, price } from "../sim/market.mjs";
import { previewSell, makeShip, tickShip, sailTick, sail, buy, sell, SHIP_TYPES, cargoUsed } from "../sim/trade.mjs";
import { TICKS_PER_DAY as CLOCK_TICKS_PER_DAY, TICKS_PER_HOUR } from "../sim/clock.mjs";
import { captainSpeed } from "./captains.mjs";
import { seeded } from "../view/cityscene.mjs";
import { rollEvent } from "./events.mjs";
import { tickShocks, portClosed } from "./shocks.mjs";
import { defaultProfile } from "./profile.mjs";
import { refreshIntel, knownMarket } from "./intel.mjs";
import {automaticEncounter} from "./encounterdaily.mjs";
import { tickBuildings, accrueBuildings, workshopTick, housePopBonus, warehouseCapBonus } from "./buildings.mjs";
import { aiStep } from "../sim/ai.mjs";
import { npcPlan } from "../sim/npcplan.mjs";

export const HISTORY_DAYS = 30;
/** Append today's price of every good in every port; keep the last HISTORY_DAYS. */
export function recordPrices(world, market, hist) {
  for (const [city, goods] of Object.entries(market))
    for (const [good, e] of Object.entries(goods)) {
      const a = ((hist[city] ??= {})[good] ??= []);
      a.push(price(world, e, good));
      if (a.length > HISTORY_DAYS) a.shift();
    }
}
/** Price history of one good in one port (oldest first); [] for saves from before history existed. */
export function priceHistory(g, city, good) { return g.hist?.[city]?.[good] ?? []; }
/** Change over the last `days` days, as a whole percent; null if there is not enough history. */
export function trendPct(g, city, good, days = 7) {
  const a = priceHistory(g, city, good);
  if (a.length <= days) return null;
  const old = a[a.length - 1 - days];
  return old ? Math.round((a[a.length - 1] - old) / old * 100) : null;
}
export const START_CASH = 2000, GOAL_CASH = 50000, DEADLINE_DAYS = 365, CARAVEL_PRICE = 3000, WARMUP_DAYS = 60;
/** Ticks per game day (10 per hour). The tick is the simulation unit; the day stays the accounting unit. See docs/design/time-model.md. */
export const TICKS_PER_DAY = CLOCK_TICKS_PER_DAY;

export function newGame(world, start = "cadiz", opts = {}) {
  const ids = world.cities.map((c) => c.id);
  // Opt-in research option only. Production defaults stay exactly three traders.
  const origins = opts.npcCompetition === "planned" ? npcPlan(world).ports.flatMap(r=>Array(r.count).fill(r.city)) : Array.from({length:3},(_,i)=>ids[(i*3+1)%ids.length]);
  const ai = origins.map((at, i) => ({ cash: 2000, ship: makeShip(100 + i, i % 2 ? "caravel" : "cog", at) }));
  const market = makeMarket(world), hist = {};
  for (let d = 0; d < WARMUP_DAYS; d++) { tickMarket(market, d - WARMUP_DAYS, world); for (const t of ai) { for (let i = 0; i < TICKS_PER_DAY && t.ship.voyage; i++) if (sailTick(t.ship)) break; tickShip(t.ship); aiStep(world, market, t, t.ship); } recordPrices(world, market, hist); } // so prices differ from day 0
  const g = { world, day: 0, tick: 0, cash: START_CASH + (opts.cash ?? 0), market, hist, ships: [makeShip(1, "cog", start)], ai, nextId: 2, log: [], over: null, warehouses: {}, offices: [], upkeepMul: opts.upkeepMul ?? 1, profile: opts.profile ?? { ...defaultProfile(), home: start }, eventsOn: !!opts.events, pending: null }; // saves always carry a profile (pre-launch saves are not kept)
  refreshIntel(g);
  return g;
}
const say = (g, key, p = {}) => { g.log.unshift({ day: g.day, key, ...p }); if (g.log.length > 30) g.log.pop(); };
export function netWorth(g) {
  let w = g.cash - accruedTotal(g) - tollsDue(g) - loansOwed(g); // upkeep owed but not yet settled counts against you
  for (const s of g.ships) for (const [good, q] of Object.entries(s.cargo)) w += q * g.world.goods[good].base;
  for (const wh of Object.values(g.warehouses ?? {})) for (const [good, q] of Object.entries(wh.goods)) w += q * g.world.goods[good].base; // goods in warehouses count
  return w;
}
/** The work of one day boundary: markets, AI traders, ships, upkeep; then check the end. */
function dayTick(g) {
  g.day++;
  for (const t of g.ai) { tickShip(t.ship); aiStep(g.world, g.market, t, t.ship); } // aiStep no-ops at sea; arrivals act on their own tick
  // price history is recorded per port at its market slot (marketTick), not in one midnight pulse
  for (const s of g.ships) {
    if (s.voyage) { wearGuns(s); tickShip(s); } // armament and hull wear at sea, once per day
    accrueDay(g, s);
  }
  accrueBuildings(g); // active buildings add their daily upkeep to the weekly book
  processRoutes(g, { doBuy, doSell, doSail }); // ships with a standing route act on the day they are docked
  g.weekLoanPrincipal = r2d((g.weekLoanPrincipal ?? 0) + processLoans(g, post)); // loans fall due on their day, not at the next weekly settlement
  warnLowCash(g);
  settleWeek(g);
  updateRank(g, netWorth(g), post);
  if (g.cash < -OVERDRAFT_LIMIT) { g.over = "lose"; g.overReason = "bankrupt"; }
  rollEvent(g);
  tickShocks(g); // regional shocks expire (market restored) and maybe a new one starts
  deliverOrders(g);
  refreshIntel(g);
  if (g.cash - loansOwed(g) >= GOAL_CASH) g.over = "win"; // borrowed money does not count towards the goal
  else if (!g.over && g.day >= DEADLINE_DAYS) g.over = "lose";
}
/** Arrival of a player's ship on its exact tick: the current day's sea wear (as under the day model), tolls, log and ledger. */
function arrive(g, s) {
  wearGuns(s); tickShip(s, true); // the arrival day counts as a day at sea, charged now instead of at the boundary
  chargeToll(g, s, s.at); say(g, "arrive", { ship: s.id, city: s.at }); post(g, "arrival", { ship: s.id, city: s.at });
}
/** Advance one whole day: step ticks to the next day boundary (same as the old daily step, including its progress reset). Stops early when one of the player's ships arrives, so no day work runs before the player can act. */
export function advanceDay(g) {
  if (g.over || g.pending || g.encounterReport) return; // an event waits for the player's choice
  const target = (Math.floor(g.tick / TICKS_PER_DAY) + 1) * TICKS_PER_DAY;
  do {
    const atSea = new Set(g.ships.filter((s) => s.voyage).map((s) => s.id));
    advanceTick(g);
    if (atSea.size && g.ships.some((s) => atSea.has(s.id) && !s.voyage)) break; // a ship of yours just arrived
  } while (g.tick < target && !g.over && !g.pending && !g.encounterReport);
}
/** The slot inside the day at which port i ticks its market (P3-style stagger: updates spread through the day). */
export const marketSlot = (world, i) => Math.floor(i * TICKS_PER_DAY / world.cities.length);
/** Ports whose daily market tick is this tick run it now, with their own day count (bit-identical per port to a daily tick). */
function marketTick(g) {
  const slot = g.tick % TICKS_PER_DAY, day = Math.ceil(g.tick / TICKS_PER_DAY), n = g.world.cities.length;
  g.world.cities.forEach((c, i) => {
    if (marketSlot(g.world, i) !== slot) return;
    for (const e of Object.values(g.market[c.id])) e.pop = (c.pop ?? 8000) + housePopBonus(g, c.id); // houses add their people before demand is computed
    tickMarketCity(g.market[c.id], day, g.world);
    workshopTick(g, c.id); // workshops produce with the fresh prices of their own port's tick
    const hist = (g.hist ??= {});
    for (const [good, e] of Object.entries(g.market[c.id])) {
      const a = ((hist[c.id] ??= {})[good] ??= []);
      a.push(price(g.world, e, good));
      if (a.length > HISTORY_DAYS) a.shift();
    }
  });
}
/** Advance one tick: ships move continuously and arrive on the exact tick; staggered markets tick at their slot; day work runs only at a day boundary. */
export function advanceTick(g) {
  if (g.over || g.pending || g.encounterReport) return; // an event waits for the player's choice
  g.tick++;
  for (const s of g.ships) if (sailTick(s)) arrive(g, s);
  for (const t of g.ai) if (sailTick(t.ship)) { tickShip(t.ship, true); aiStep(g.world, g.market, t, t.ship); } // AI traders act (and pay the arrival day's wear) on their own arrival tick
  if (!g.over) for (const s of g.ships) if (s.voyage) automaticEncounter(g, s); // one seeded roll per tick at sea; a pirate decision stops time
  marketTick(g);
  tickBuildings(g); // construction finishes on its exact tick
  if (g.tick % TICKS_PER_DAY === 0) dayTick(g);
}
export function waitUntilArrival(g, ship) {
  let n = 0;
  while (ship.voyage && !g.over && !g.pending && !g.encounterReport && n++ < 400) advanceDay(g);
}
export function doBuy(g, ship, good, qty) {
  if (g.over) return { ok: false, reason: "game over" };
  if (portClosed(g, ship.at)) return { ok: false, reason: "port closed" };
  const r = buy(g.world, g.market, ship, g.cash, good, qty);
  if (r.ok) { g.cash -= r.cost; logBuy(g, good, r.qty, r.cost); say(g, "buy", { qty: r.qty, good, sum: r.cost }); }
  return r;
}
export function doSell(g, ship, good, qty) {
  if (g.over) return { ok: false, reason: "game over" };
  if (portClosed(g, ship.at)) return { ok: false, reason: "port closed" };
  const r = sell(g.world, g.market, ship, good, qty);
  if (r.ok) { g.cash += r.revenue; recordSale(g, ship, r.qty, r.revenue, logSell(g, good, r.qty, r.revenue)); if (addRespect(g, ship.at, r.revenue)) post(g, "respect", { city: ship.at }); say(g, "sell", { qty: r.qty, good, sum: r.revenue }); if (g.cash - loansOwed(g) >= GOAL_CASH && !g.over) g.over = "win"; } // victory is checked right after a sale
  return r;
}
export function doSail(g, ship, to) {
  if (g.over) return { ok: false, reason: "game over" };
  if (ship.at !== undefined && !ship.voyage && speedFactor(ship) <= 0) return { ok: false, reason: "crew" }; // below the minimum crew a ship cannot leave port
  const from = ship.at;
  // Per-leg wind, seeded by departure tick and leg, so replays and save/load keep the same weather.
  const wind = 0.8 + 0.4 * seeded(`wind-v1:${g.seed ?? 0}:${g.tick}:${ship.id}:${from}>${to}`)();
  const r = sail(g.world, ship, to, { speedMul: speedFactor(ship) * captainSpeed(ship), wind });
  if (r.ok) openVoyage(g, ship, from, to);
  if (r.ok) say(g, "sail", { ship: ship.id, city: to, hours: Math.max(1, Math.round(r.ticks / TICKS_PER_HOUR)) });
  return r;
}
/** Buy a second ship (caravel) at the port where ship[0] is docked. */
export function buyCaravel(g, at) {
  if (g.over) return { ok: false, reason: "game over" };
  if (g.cash < CARAVEL_PRICE) return { ok: false, reason: "no cash" };
  g.cash -= CARAVEL_PRICE;
  const s = makeShip(g.nextId++, "caravel", at);
  g.ships.push(s); say(g, "caravel", { city: at });
  return { ok: true, ship: s };
}
export const SELL_RATE = 0.6, REPAIR_PER_POINT = 4;
/** Order a new ship at the shipyard of the port where a ship of yours is docked. It is delivered after buildDays. */
export function orderShip(g, type, at) {
  const t = SHIP_TYPES[type];
  if (g.over) return { ok: false, reason: "game over" };
  if (!t || !Object.hasOwn(SHIP_TYPES, type)) return { ok: false, reason: "unknown type" };
  if (!g.ships.some((s) => !s.voyage && s.at === at)) return { ok: false, reason: "no ship here" };
  if (g.cash < t.price) return { ok: false, reason: "no cash" };
  g.cash -= t.price;
  (g.orders ??= []).push({ type, at, readyDay: g.day + t.buildDays });
  say(g, "ordered", { city: at, type });
  return { ok: true, readyDay: g.day + t.buildDays };
}
/** Deliver finished orders (called every day). */
export function deliverOrders(g) {
  for (const o of [...(g.orders ?? [])]) {
    if (o.readyDay > g.day) continue;
    g.orders.splice(g.orders.indexOf(o), 1);
    const s = makeShip(g.nextId++, o.type, o.at); g.ships.push(s); say(g, "built", { city: o.at, type: o.type, ship: s.id }); post(g, "order", { city: o.at, type: o.type, ship: s.id });
  }
}
export const repairCost = (ship) => Math.ceil((100 - (ship.hull ?? 100)) * REPAIR_PER_POINT);
export function repairShip(g, ship) {
  if (ship.voyage) return { ok: false, reason: "at sea" };
  const c = repairCost(ship);
  if (c <= 0) return { ok: false, reason: "no damage" };
  if (g.cash < c) return { ok: false, reason: "no cash" };
  g.cash -= c; ship.hull = 100; return { ok: true, cost: c };
}
export const PRIZE_SELL_RATE = 0.4; // a captured pirate ship resells below the cared-for rate
export const shipValue = (ship) => Math.round(SHIP_TYPES[ship.type].price * (ship.prize ? PRIZE_SELL_RATE : SELL_RATE) * (0.5 + 0.5 * (ship.hull ?? 100) / 100));
export function sellShip(g, ship) {
  if(g.over||!g.ships.includes(ship))return {ok:false,reason:"not an active owned ship"};
  if (ship.voyage) return { ok: false, reason: "at sea" };
  if (g.ships.length <= 1) return { ok: false, reason: "last ship" };
  if (cargoUsed(ship) > 0) return { ok: false, reason: "hold not empty" };
  const v = shipValue(ship); g.cash += v; g.ships.splice(g.ships.indexOf(ship), 1);
  return { ok: true, value: v };
}
export const WAREHOUSE_PRICE = 1500, WAREHOUSE_CAP = 300;
/** Storage cap at a port: the base warehouse plus each active warehouse-building level (design doc piece 5). */
export const warehouseCap = (g, city) => WAREHOUSE_CAP + warehouseCapBonus(g, city);
const whUsed = (w) => Object.values(w.goods).reduce((a, b) => a + b, 0);
export const warehouseOf = (g, city) => g.warehouses?.[city] ?? null;
/** Buy a warehouse in the port where a ship is docked. One per port. */
export function buyWarehouse(g, city) {
  if (g.over) return { ok: false, reason: "game over" };
  if(!g.ships.some(s=>s.at===city&&!s.voyage))return {ok:false,reason:"no ship here"};
  g.warehouses ??= {};
  if (g.warehouses[city]) return { ok: false, reason: "already owned" };
  if (g.cash < WAREHOUSE_PRICE) return { ok: false, reason: "no cash" };
  g.cash -= WAREHOUSE_PRICE; g.warehouses[city] = { goods: {} }; refreshIntel(g); say(g, "warehouse", { city });
  return { ok: true };
}
/** Move goods from the ship's hold into the warehouse of the port where it is docked. */
export function storeGoods(g, ship, good, qty) {
  if(!g.ships.includes(ship))return {ok:false,reason:"not owned"};
  const w = warehouseOf(g, ship.at);
  if (g.over || ship.voyage || !w) return { ok: false, reason: "no warehouse here" };
  qty = Math.min(Math.floor(qty), ship.cargo[good] ?? 0, warehouseCap(g, ship.at) - whUsed(w));
  if (!(qty > 0)) return { ok: false, reason: "nothing to store" };
  const had=ship.cargo[good],paid=ship.basis?.[good]??0,transferred=Math.round(paid*qty/had);
  if(ship.basis)ship.basis[good]=paid-transferred;
  (w.basis??={})[good]=(w.basis[good]??0)+transferred;
  ship.cargo[good] -= qty; if (!ship.cargo[good]){delete ship.cargo[good];if(ship.basis)delete ship.basis[good];}
  w.goods[good] = (w.goods[good] ?? 0) + qty;
  return { ok: true, qty };
}
/** Move goods from the warehouse into the hold (limited by the free room). */
export function takeGoods(g, ship, good, qty) {
  if(!g.ships.includes(ship))return {ok:false,reason:"not owned"};
  const w = warehouseOf(g, ship.at);
  if (g.over || ship.voyage || !w) return { ok: false, reason: "no warehouse here" };
  qty = Math.min(Math.floor(qty), w.goods[good] ?? 0, SHIP_TYPES[ship.type].capacity - cargoUsed(ship));
  if (!(qty > 0)) return { ok: false, reason: "nothing to take" };
  const had=w.goods[good],paid=w.basis?.[good]??0,transferred=Math.round(paid*qty/had);
  if(w.basis)w.basis[good]=paid-transferred;
  (ship.basis??={})[good]=(ship.basis[good]??0)+transferred;
  w.goods[good] -= qty; if (!w.goods[good]){delete w.goods[good];if(w.basis)delete w.basis[good];}
  ship.cargo[good] = (ship.cargo[good] ?? 0) + qty;
  return { ok: true, qty };
}
export function quote(g, city, good) { return price(g.world, g.market[city][good], good); }
export { cargoUsed, SHIP_TYPES };
export { buyRumor, RUMOR_PRICE, isLive } from "./intel.mjs";

/**
 * Where would the whole hold sell best at today's prices? One row per other port, best first:
 * {city, revenue, profit, days}. Prices at arrival will differ; this is a guide, not a promise.
 */
export function bestPorts(g, ship) {
  if (ship.voyage || Object.keys(ship.cargo).length === 0) return [];
  const rows = [], { market: km, age } = knownMarket(g);
  for (const c of g.world.cities) {
    if (c.id === ship.at || !km[c.id]) continue; // unknown port: no price
    const r = route(g.world, ship.at, c.id);
    if (!r) continue;
    const there = { ...ship, at: c.id, voyage: null };
    let revenue = 0, profit = 0, any = false;
    for (const [good, q] of Object.entries(ship.cargo)) {
      const p = previewSell(g.world, km, there, good, q);
      if (p.qty) { revenue += p.revenue; profit += p.profit; any = true; }
    }
    if (any) rows.push({ city: c.id, age: age[c.id].days, exact: age[c.id].exact, revenue, profit, days: Math.max(1, Math.ceil(r.km / SHIP_TYPES[ship.type].kmPerDay)) });
  }
  return rows.sort((a, b) => b.revenue - a.revenue);
}

/** Bank: borrow at a port where one of your ships is docked. */
export const borrow = (g, city, amount) => takeLoan(g, city, amount, netWorth(g), post);
export const repay = (g, id, amount) => repayLoan(g, id, amount, post);
export const bankRoom = (g) => loanRoom(g, netWorth(g));
export { loansOwed };
export { setRoute, clearRoute };
