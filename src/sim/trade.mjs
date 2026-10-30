import {defaultShipName} from "./shipnames.mjs";
// M1b: ships, voyages along sea lanes, and buy/sell with price impact.
// Own design. Numbers are first-pass and will be tuned by the balance tests.
import { route } from "./world.mjs";
import { ticksForKm } from "./clock.mjs";
import { price } from "./market.mjs";
import { loadWeight } from "./armament.mjs";
import { WHOLESALE_PURSE_BINDING, commerceOf, recordMarketPurchase, recordWholesaleSale } from "./procurement.mjs";

export const SHIP_TYPES = {
  barca: { capacity: 25, kmPerDay: 100, upkeepPerDay: 1, price: 900, buildDays: 8 },
  cog: { capacity: 60, kmPerDay: 90, upkeepPerDay: 2, price: 2200, buildDays: 14 },
  caravel: { capacity: 40, kmPerDay: 140, upkeepPerDay: 3, price: 3000, buildDays: 12 },
  nao: { capacity: 110, kmPerDay: 80, upkeepPerDay: 5, price: 5200, buildDays: 25 },
};

/** Display names for each ship type, es/en, so game-layer messages never show a raw type key
 *  ("una coca", not "una cog"). Bare names: each sentence adds its own article. */
export const SHIP_TYPE_NAMES = Object.freeze({
  barca: Object.freeze({ es: "barca", en: "barca" }),
  cog: Object.freeze({ es: "coca", en: "cog" }),
  caravel: Object.freeze({ es: "carabela", en: "caravel" }),
  nao: Object.freeze({ es: "nao", en: "nao" }),
});

/** The display name of a ship type in one language, raw key as fallback (never throws). */
export function shipTypeName(type, lang) {
  const n = SHIP_TYPE_NAMES[type];
  return (n && (lang === "en" ? n.en : n.es)) || type;
}
/** Hold space of a ship: its type capacity minus the weight of mounted weapons and sailors' gear. Never negative. */
export const shipCapacity = (ship) => Math.max(0, SHIP_TYPES[ship.type].capacity - loadWeight(ship));
export const FEE = 0.02; // market fee on every deal, both sides
/** Unit prices settle to cents: the fee keeps its nominal size on cheap goods instead of vanishing into integer rounding. Buy rounds up, sell rounds down, so a one-port round trip still loses to the fee. The epsilon keeps binary float noise (5.1*100 = 510.000...06) from flipping a cent. */
export const ceil2 = (x) => Math.ceil(x * 100 - 1e-9) / 100;
export const floor2 = (x) => Math.floor(x * 100 + 1e-9) / 100;

export function makeShip(id, type, at, fleet = []) {
  if (!Object.hasOwn(SHIP_TYPES, type)) throw new Error("unknown ship type " + type);
  return { id, type, at, name: defaultShipName(id, fleet), cargo: {}, voyage: null, hull: 100 };
}
export function cargoUsed(ship) {
  return Object.values(ship.cargo).reduce((a, b) => a + b, 0);
}
/** Start a voyage. speedMul covers crew and captain factors, wind the leg's weather. Returns {ok, ticks} or {ok:false, reason}. */
export function sail(world, ship, to, opts = {}) {
  if (ship.voyage) return { ok: false, reason: "at sea" };
  const r = route(world, ship.at, to);
  if (!r) return { ok: false, reason: "no route" };
  const { speedMul = 1, wind = 1 } = opts;
  // Continuous movement: no day rounding, so a short hop lands in hours, on the exact tick.
  const ticks = Math.max(1, Math.round(ticksForKm(r.km, SHIP_TYPES[ship.type].kmPerDay) / (speedMul * wind)));
  // Keep the route, total ticks and wind so the position at sea is known and survives a save.
  ship.voyage = { from: ship.at, to, ticksLeft: ticks, totalTicks: ticks, path: r.path, km: r.km, wind };
  return { ok: true, ticks, km: Math.round(r.km) };
}
/** One tick at sea; arrives exactly when ticksLeft reaches 0. Returns true on arrival. */
export function sailTick(ship) {
  if (!ship.voyage) return false;
  if (ship.voyage.anchored) return false; // free navigation: waiting at a point of the sea
  if (--ship.voyage.ticksLeft <= 0) { if (ship.voyage.free) { ship.voyage.ticksLeft = 0; ship.voyage.anchored = true; return false; } ship.at = ship.voyage.to; ship.voyage = null; return true; }
  return false;
}
/** One day at sea: hull wear. Movement is per tick in sailTick. `force` charges a ship that just arrived (its voyage is already cleared). */
export function tickShip(ship, force = false) {
  if (!ship.voyage && !force) return;
  if (ship.voyage?.anchored) return; // at anchor: no sea wear
  ship.hull = Math.max(10, (ship.hull ?? 100) - 0.5); // sea wear
}
// Each unit is priced at the stock level it leaves or joins, so large deals move the
// price against the trader and a buy-then-sell loop in one port always loses to fees.
/** Buy up to qty, limited by stock, hold space and cash. `fee` overrides the market fee (port reputation). */
export function buy(world, market, ship, cash, good, qty, fee = FEE) {
  if (ship.voyage) return { ok: false, reason: "at sea" };
  if (!Number.isSafeInteger(qty) || qty <= 0) return { ok: false, reason: "bad quantity" };
  if (typeof cash !== "number" || !Number.isFinite(cash) || cash < 0) return { ok: false, reason: "bad cash" };
  const e = market[ship.at]?.[good];
  if (!e) return { ok: false, reason: "no market" };
  qty = Math.min(qty, e.stock, Math.max(0, shipCapacity(ship) - cargoUsed(ship)));
  let n = 0, cost = 0;
  while (n < qty) {
    const unit = ceil2(price(world, e, good) * (1 + fee));
    if (cost + unit > cash) break;
    cost += unit; e.stock -= 1; n++;
  }
  if (n === 0) return { ok: false, reason: qty <= 0 ? "nothing to buy" : "no cash" };
  ship.cargo[good] = (ship.cargo[good] ?? 0) + n;
  ship.basis = ship.basis ?? {};
  ship.basis[good] = (ship.basis[good] ?? 0) + cost; // what this cargo cost, for profit display
  recordMarketPurchase(market[ship.at], good, n, cost, e.stock + n); // telemetry: the port's purse received the payment
  return { ok: true, qty: n, cost };
}
export function sell(world, market, ship, good, qty, fee = FEE) {
  if (ship.voyage) return { ok: false, reason: "at sea" };
  if (!Number.isSafeInteger(qty) || qty <= 0) return { ok: false, reason: "bad quantity" };
  const e = market[ship.at]?.[good];
  if (!e) return { ok: false, reason: "no market" };
  qty = Math.min(qty, ship.cargo[good] ?? 0);
  if (qty <= 0) return { ok: false, reason: "nothing to sell" };
  let revenue = 0;
  const purse = WHOLESALE_PURSE_BINDING ? commerceOf(market[ship.at]) : null; // a binding purse pays only what it holds
  const cashCents = purse ? Math.round(purse.cash * 100) : 0; // money compares in integer cents: 3 x 19.60 IS 58.80
  let revenueCents = 0;
  let n = 0;
  while (n < qty) {
    e.stock += 1;
    const unit = floor2(price(world, e, good) * (1 - fee));
    if (purse && revenueCents + Math.round(unit * 100) > cashCents) { e.stock -= 1; break; }
    revenueCents += Math.round(unit * 100); revenue += unit; n++;
  }
  if (n === 0) return { ok: false, reason: "market has no cash" };
  qty = n;
  const had = ship.cargo[good], paid = ship.basis?.[good] ?? 0;
  const spent = qty === had ? paid : Math.round(paid * qty / had); // share of the cost that leaves with the goods; a full sale settles at the exact book cost, no cent lost
  ship.cargo[good] -= qty;
  if (ship.basis) ship.basis[good] = paid - spent;
  if (!ship.cargo[good]) { delete ship.cargo[good]; if (ship.basis) delete ship.basis[good]; }
  recordWholesaleSale(market[ship.at], good, qty, revenue); // telemetry: the port's purse paid the seller
  return { ok: true, qty, revenue, profit: revenue - spent, spent };
}
/** What a buy of qty would do, without changing anything. Same rules as buy(). */
export function previewBuy(world, market, ship, cash, good, qty, fee = FEE) {
  const e = market[ship.at]?.[good];
  if (ship.voyage || !e || !Number.isSafeInteger(qty) || qty <= 0 || !(cash >= 0)) return { qty: 0, cost: 0, avg: 0, next: null };
  const room = Math.max(0, shipCapacity(ship) - cargoUsed(ship));
  const lim = Math.min(qty, e.stock, room);
  const sim = { ...e }; let n = 0, cost = 0;
  while (n < lim) {
    const unit = ceil2(price(world, sim, good) * (1 + fee));
    if (cost + unit > cash) break;
    cost += unit; sim.stock -= 1; n++;
  }
  return { qty: n, cost, avg: n ? Math.round(cost / n * 100) / 100 : 0, next: price(world, sim, good), limit: n < qty ? (e.stock < qty && n === e.stock ? "stock" : room < qty && n === room ? "room" : "cash") : null };
}
/** What a sell of qty would do, without changing anything. Same rules as sell(). */
export function previewSell(world, market, ship, good, qty, fee = FEE) {
  const e = market[ship.at]?.[good], have = ship.cargo[good] ?? 0;
  if (ship.voyage || !e || !Number.isSafeInteger(qty) || qty <= 0 || have <= 0) return { qty: 0, revenue: 0, avg: 0, profit: 0, next: null };
  const sim = { ...e }; let revenue = 0;
  const pvPurse = WHOLESALE_PURSE_BINDING ? commerceOf(market[ship.at]) : null; // same cash cap as sell()
  const pvCashCents = pvPurse ? Math.round(pvPurse.cash * 100) : 0;
  let pvCents = 0;
  let n = 0;
  while (n < Math.min(qty, have)) {
    sim.stock += 1;
    const unit = floor2(price(world, sim, good) * (1 - fee));
    if (pvPurse && pvCents + Math.round(unit * 100) > pvCashCents) { sim.stock -= 1; break; }
    pvCents += Math.round(unit * 100); revenue += unit; n++;
  }
  if (n === 0) return { qty: 0, revenue: 0, avg: 0, profit: 0, next: null };
  const spent = n === have ? (ship.basis?.[good] ?? 0) : Math.round((ship.basis?.[good] ?? 0) * n / have);
  return { qty: n, revenue, avg: Math.round(revenue / n * 100) / 100, profit: revenue - spent, hasBasis: ship.basis?.[good] != null, next: price(world, sim, good) };
}

/** Sell qty of a good from a warehouse's stored goods into the local market: same per-unit price impact,
 *  purse cap and fee as sell(), but the goods (and their book cost) leave the warehouse, not a hold. */
export function sellStored(world, market, city, store, good, qty, fee = FEE) {
  if (!Number.isSafeInteger(qty) || qty <= 0) return { ok: false, reason: "bad quantity" };
  const e = market[city]?.[good];
  if (!e) return { ok: false, reason: "no market" };
  qty = Math.min(qty, store.goods?.[good] ?? 0);
  if (qty <= 0) return { ok: false, reason: "nothing to sell" };
  let revenue = 0;
  const purse = WHOLESALE_PURSE_BINDING ? commerceOf(market[city]) : null; // a binding purse pays only what it holds
  const cashCents = purse ? Math.round(purse.cash * 100) : 0;
  let revenueCents = 0;
  let n = 0;
  while (n < qty) {
    e.stock += 1;
    const unit = floor2(price(world, e, good) * (1 - fee));
    if (purse && revenueCents + Math.round(unit * 100) > cashCents) { e.stock -= 1; break; }
    revenueCents += Math.round(unit * 100); revenue += unit; n++;
  }
  if (n === 0) return { ok: false, reason: "market has no cash" };
  qty = n;
  const had = store.goods[good], paid = store.basis?.[good] ?? 0;
  const spent = qty === had ? paid : Math.round(paid * qty / had); // same book-cost share rule as sell()
  store.goods[good] -= qty;
  if (store.basis) store.basis[good] = paid - spent;
  if (!store.goods[good]) { delete store.goods[good]; if (store.basis) delete store.basis[good]; }
  recordWholesaleSale(market[city], good, qty, revenue); // telemetry: the port's purse paid the seller
  return { ok: true, qty, revenue, profit: revenue - spent, spent };
}
/** What a sale of qty would do taken from the ship's hold FIRST and then from the port warehouse,
 *  one market simulation so the price moves across both parts. No mutation. */
export function previewSellCombined(world, market, ship, store, good, qty, fee = FEE) {
  const e = market[ship.at]?.[good], have = ship.cargo[good] ?? 0, stored = store?.goods?.[good] ?? 0;
  if (ship.voyage || !e || !Number.isSafeInteger(qty) || qty <= 0 || have + stored <= 0) return { qty: 0, revenue: 0, avg: 0, profit: 0, next: null };
  const sim = { ...e }; let revenue = 0;
  const pvPurse = WHOLESALE_PURSE_BINDING ? commerceOf(market[ship.at]) : null; // same cash cap as sellStored()
  const pvCashCents = pvPurse ? Math.round(pvPurse.cash * 100) : 0;
  let pvCents = 0;
  let n = 0;
  while (n < Math.min(qty, have + stored)) {
    sim.stock += 1;
    const unit = floor2(price(world, sim, good) * (1 - fee));
    if (pvPurse && pvCents + Math.round(unit * 100) > pvCashCents) { sim.stock -= 1; break; }
    pvCents += Math.round(unit * 100); revenue += unit; n++;
  }
  if (n === 0) return { qty: 0, revenue: 0, avg: 0, profit: 0, next: null };
  const fromCargo = Math.min(n, have), fromStore = n - fromCargo;
  const paidC = ship.basis?.[good] ?? 0, paidS = store?.basis?.[good] ?? 0;
  const spent = (fromCargo === have ? paidC : Math.round(paidC * fromCargo / Math.max(1, have)))
    + (fromStore === stored ? paidS : Math.round(paidS * fromStore / Math.max(1, stored)));
  return { qty: n, fromCargo, fromStore, revenue, avg: Math.round(revenue / n * 100) / 100, profit: revenue - spent, hasBasis: ship.basis?.[good] != null || store?.basis?.[good] != null, next: price(world, sim, good) };
}
