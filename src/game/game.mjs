// M2 playable slice: game state and player actions on top of the M1 sim. No DOM here, so it is testable.
import { makeMarket, tickMarket, price } from "../sim/market.mjs";
import { makeShip, tickShip, sail, buy, sell, SHIP_TYPES, cargoUsed } from "../sim/trade.mjs";
import { aiStep } from "../sim/ai.mjs";

export const START_CASH = 2000, GOAL_CASH = 50000, DEADLINE_DAYS = 365, CARAVEL_PRICE = 3000, WARMUP_DAYS = 60;

export function newGame(world, start = "cadiz", opts = {}) {
  const ids = world.cities.map((c) => c.id);
  const ai = Array.from({ length: 3 }, (_, i) => ({ cash: 2000, ship: makeShip(100 + i, i % 2 ? "caravel" : "cog", ids[(i * 3 + 1) % ids.length]) }));
  const market = makeMarket(world);
  for (let d = 0; d < WARMUP_DAYS; d++) { tickMarket(market); for (const t of ai) { tickShip(t.ship); aiStep(world, market, t, t.ship); } } // so prices differ from day 0
  return { world, day: 0, cash: START_CASH + (opts.cash ?? 0), market, ships: [makeShip(1, "cog", start)], ai, nextId: 2, log: [], over: null, upkeepMul: opts.upkeepMul ?? 1, profile: opts.profile ?? null };
}
const say = (g, key, p = {}) => { g.log.unshift({ day: g.day, key, ...p }); if (g.log.length > 30) g.log.pop(); };
export function netWorth(g) {
  let w = g.cash;
  for (const s of g.ships) for (const [good, q] of Object.entries(s.cargo)) w += q * g.world.goods[good].base;
  return w;
}
/** Advance one day: markets, AI traders, ships, upkeep; then check the end. */
export function advanceDay(g) {
  if (g.over) return;
  g.day++;
  tickMarket(g.market);
  for (const t of g.ai) { tickShip(t.ship); aiStep(g.world, g.market, t, t.ship); }
  for (const s of g.ships) {
    const was = s.voyage;
    tickShip(s);
    g.cash -= SHIP_TYPES[s.type].upkeepPerDay * (g.upkeepMul ?? 1);
    if (was && !s.voyage) say(g, "arrive", { ship: s.id, city: s.at });
  }
  if (g.cash < 0) g.cash = 0;
  if (g.cash >= GOAL_CASH) g.over = "win";
  else if (g.day >= DEADLINE_DAYS) g.over = "lose";
}
export function waitUntilArrival(g, ship) {
  let n = 0;
  while (ship.voyage && !g.over && n++ < 400) advanceDay(g);
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
  if (g.ships.length >= 3) return { ok: false, reason: "fleet full" };
  g.cash -= CARAVEL_PRICE;
  const s = makeShip(g.nextId++, "caravel", at);
  g.ships.push(s); say(g, "caravel", { city: at });
  return { ok: true, ship: s };
}
export function quote(g, city, good) { return price(g.world, g.market[city][good], good); }
export { cargoUsed, SHIP_TYPES };
