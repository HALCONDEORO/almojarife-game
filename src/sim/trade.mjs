// M1b: ships, voyages along sea lanes, and buy/sell with price impact.
// Own design. Numbers are first-pass and will be tuned by the balance tests.
import { route } from "./world.mjs";
import { price } from "./market.mjs";

export const SHIP_TYPES = {
  cog: { capacity: 60, kmPerDay: 90, upkeepPerDay: 2 },
  caravel: { capacity: 40, kmPerDay: 140, upkeepPerDay: 3 },
};
export const FEE = 0.02; // market fee on every deal, both sides

export function makeShip(id, type, at) {
  if (!Object.hasOwn(SHIP_TYPES, type)) throw new Error("unknown ship type " + type);
  return { id, type, at, cargo: {}, voyage: null };
}
export function cargoUsed(ship) {
  return Object.values(ship.cargo).reduce((a, b) => a + b, 0);
}
/** Start a voyage. Returns {ok, days} or {ok:false, reason}. */
export function sail(world, ship, to) {
  if (ship.voyage) return { ok: false, reason: "at sea" };
  const r = route(world, ship.at, to);
  if (!r) return { ok: false, reason: "no route" };
  const days = Math.max(1, Math.ceil(r.km / SHIP_TYPES[ship.type].kmPerDay));
  // Keep the route and total days so the position at sea is known and survives a save.
  ship.voyage = { from: ship.at, to, daysLeft: days, totalDays: days, path: r.path, km: r.km };
  return { ok: true, days, km: Math.round(r.km) };
}
/** One day at sea; arrives when daysLeft reaches 0. */
export function tickShip(ship) {
  if (!ship.voyage) return;
  if (--ship.voyage.daysLeft <= 0) { ship.at = ship.voyage.to; ship.voyage = null; }
}
// Each unit is priced at the stock level it leaves or joins, so large deals move the
// price against the trader and a buy-then-sell loop in one port always loses to fees.
/** Buy up to qty, limited by stock, hold space and cash. */
export function buy(world, market, ship, cash, good, qty) {
  if (ship.voyage) return { ok: false, reason: "at sea" };
  if (!Number.isSafeInteger(qty) || qty <= 0) return { ok: false, reason: "bad quantity" };
  if (typeof cash !== "number" || !Number.isFinite(cash) || cash < 0) return { ok: false, reason: "bad cash" };
  const e = market[ship.at]?.[good];
  if (!e) return { ok: false, reason: "no market" };
  qty = Math.min(qty, e.stock, SHIP_TYPES[ship.type].capacity - cargoUsed(ship));
  let n = 0, cost = 0;
  while (n < qty) {
    const unit = Math.ceil(price(world, e, good) * (1 + FEE));
    if (cost + unit > cash) break;
    cost += unit; e.stock -= 1; n++;
  }
  if (n === 0) return { ok: false, reason: qty <= 0 ? "nothing to buy" : "no cash" };
  ship.cargo[good] = (ship.cargo[good] ?? 0) + n;
  return { ok: true, qty: n, cost };
}
export function sell(world, market, ship, good, qty) {
  if (ship.voyage) return { ok: false, reason: "at sea" };
  if (!Number.isSafeInteger(qty) || qty <= 0) return { ok: false, reason: "bad quantity" };
  const e = market[ship.at]?.[good];
  if (!e) return { ok: false, reason: "no market" };
  qty = Math.min(qty, ship.cargo[good] ?? 0);
  if (qty <= 0) return { ok: false, reason: "nothing to sell" };
  let revenue = 0;
  for (let i = 0; i < qty; i++) { e.stock += 1; revenue += Math.floor(price(world, e, good) * (1 - FEE)); }
  ship.cargo[good] -= qty;
  if (!ship.cargo[good]) delete ship.cargo[good];
  return { ok: true, qty, revenue };
}
