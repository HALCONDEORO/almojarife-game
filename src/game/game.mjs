// M2 playable slice: game state and player actions on top of the M1 sim. No DOM here, so it is testable.
import { route } from "../sim/world.mjs";
import { makeMarket, tickMarket, price } from "../sim/market.mjs";
import { previewSell, makeShip, tickShip, sail, buy, sell, SHIP_TYPES, cargoUsed } from "../sim/trade.mjs";
import { rollEvent } from "./events.mjs";
import { refreshIntel, knownMarket } from "./intel.mjs";
import { aiStep } from "../sim/ai.mjs";

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

export function newGame(world, start = "cadiz", opts = {}) {
  const ids = world.cities.map((c) => c.id);
  const ai = Array.from({ length: 3 }, (_, i) => ({ cash: 2000, ship: makeShip(100 + i, i % 2 ? "caravel" : "cog", ids[(i * 3 + 1) % ids.length]) }));
  const market = makeMarket(world), hist = {};
  for (let d = 0; d < WARMUP_DAYS; d++) { tickMarket(market, d - WARMUP_DAYS); for (const t of ai) { tickShip(t.ship); aiStep(world, market, t, t.ship); } recordPrices(world, market, hist); } // so prices differ from day 0
  const g = { world, day: 0, cash: START_CASH + (opts.cash ?? 0), market, hist, ships: [makeShip(1, "cog", start)], ai, nextId: 2, log: [], over: null, warehouses: {}, upkeepMul: opts.upkeepMul ?? 1, profile: opts.profile ?? null, eventsOn: !!opts.events, pending: null };
  refreshIntel(g);
  return g;
}
const say = (g, key, p = {}) => { g.log.unshift({ day: g.day, key, ...p }); if (g.log.length > 30) g.log.pop(); };
export function netWorth(g) {
  let w = g.cash;
  for (const s of g.ships) for (const [good, q] of Object.entries(s.cargo)) w += q * g.world.goods[good].base;
  for (const wh of Object.values(g.warehouses ?? {})) for (const [good, q] of Object.entries(wh.goods)) w += q * g.world.goods[good].base; // goods in warehouses count
  return w;
}
/** Advance one day: markets, AI traders, ships, upkeep; then check the end. */
export function advanceDay(g) {
  if (g.over || g.pending) return; // an event waits for the player's choice
  g.day++;
  tickMarket(g.market, g.day);
  for (const t of g.ai) { tickShip(t.ship); aiStep(g.world, g.market, t, t.ship); }
  recordPrices(g.world, g.market, g.hist ??= {});
  for (const s of g.ships) {
    const was = s.voyage;
    tickShip(s);
    g.cash -= SHIP_TYPES[s.type].upkeepPerDay * (g.upkeepMul ?? 1);
    if (was && !s.voyage) say(g, "arrive", { ship: s.id, city: s.at });
  }
  if (g.cash < 0) g.cash = 0;
  rollEvent(g);
  deliverOrders(g);
  refreshIntel(g);
  if (g.cash >= GOAL_CASH) g.over = "win";
  else if (g.day >= DEADLINE_DAYS) g.over = "lose";
}
export function waitUntilArrival(g, ship) {
  let n = 0;
  while (ship.voyage && !g.over && !g.pending && n++ < 400) advanceDay(g);
}
export function doBuy(g, ship, good, qty) {
  if (g.over) return { ok: false, reason: "game over" };
  const r = buy(g.world, g.market, ship, g.cash, good, qty);
  if (r.ok) { g.cash -= r.cost; say(g, "buy", { qty: r.qty, good, sum: r.cost }); }
  return r;
}
export function doSell(g, ship, good, qty) {
  if (g.over) return { ok: false, reason: "game over" };
  const r = sell(g.world, g.market, ship, good, qty);
  if (r.ok) { g.cash += r.revenue; say(g, "sell", { qty: r.qty, good, sum: r.revenue }); if (g.cash >= GOAL_CASH && !g.over) g.over = "win"; } // victory is checked right after a sale
  return r;
}
export function doSail(g, ship, to) {
  if (g.over) return { ok: false, reason: "game over" };
  const r = sail(g.world, ship, to);
  if (r.ok) say(g, "sail", { ship: ship.id, city: to, days: r.days });
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
    const s = makeShip(g.nextId++, o.type, o.at); g.ships.push(s); say(g, "built", { city: o.at, type: o.type, ship: s.id });
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
export const shipValue = (ship) => Math.round(SHIP_TYPES[ship.type].price * SELL_RATE * (0.5 + 0.5 * (ship.hull ?? 100) / 100));
export function sellShip(g, ship) {
  if (ship.voyage) return { ok: false, reason: "at sea" };
  if (g.ships.length <= 1) return { ok: false, reason: "last ship" };
  if (cargoUsed(ship) > 0) return { ok: false, reason: "hold not empty" };
  const v = shipValue(ship); g.cash += v; g.ships.splice(g.ships.indexOf(ship), 1);
  return { ok: true, value: v };
}
export const WAREHOUSE_PRICE = 1500, WAREHOUSE_CAP = 300;
const whUsed = (w) => Object.values(w.goods).reduce((a, b) => a + b, 0);
export const warehouseOf = (g, city) => g.warehouses?.[city] ?? null;
/** Buy a warehouse in the port where a ship is docked. One per port. */
export function buyWarehouse(g, city) {
  if (g.over) return { ok: false, reason: "game over" };
  g.warehouses ??= {};
  if (g.warehouses[city]) return { ok: false, reason: "already owned" };
  if (g.cash < WAREHOUSE_PRICE) return { ok: false, reason: "no cash" };
  g.cash -= WAREHOUSE_PRICE; g.warehouses[city] = { goods: {} }; refreshIntel(g); say(g, "warehouse", { city });
  return { ok: true };
}
/** Move goods from the ship's hold into the warehouse of the port where it is docked. */
export function storeGoods(g, ship, good, qty) {
  const w = warehouseOf(g, ship.at);
  if (g.over || ship.voyage || !w) return { ok: false, reason: "no warehouse here" };
  qty = Math.min(Math.floor(qty), ship.cargo[good] ?? 0, WAREHOUSE_CAP - whUsed(w));
  if (!(qty > 0)) return { ok: false, reason: "nothing to store" };
  ship.cargo[good] -= qty; if (!ship.cargo[good]) delete ship.cargo[good];
  w.goods[good] = (w.goods[good] ?? 0) + qty;
  return { ok: true, qty };
}
/** Move goods from the warehouse into the hold (limited by the free room). */
export function takeGoods(g, ship, good, qty) {
  const w = warehouseOf(g, ship.at);
  if (g.over || ship.voyage || !w) return { ok: false, reason: "no warehouse here" };
  qty = Math.min(Math.floor(qty), w.goods[good] ?? 0, SHIP_TYPES[ship.type].capacity - cargoUsed(ship));
  if (!(qty > 0)) return { ok: false, reason: "nothing to take" };
  w.goods[good] -= qty; if (!w.goods[good]) delete w.goods[good];
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
