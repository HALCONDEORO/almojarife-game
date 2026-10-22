// Automatic trade routes (an idea from classic trading games: standing orders for a ship).
// A route is: buy `out` at port A, sail to port B, sell it, optionally buy `back` there, sail home, repeat.
// Pure game logic, no DOM. The ship uses the normal buy/sell/sail rules, so prices, fees, hold space and cash all apply.
import { post } from "./ledger.mjs";
import { cargoUsed, SHIP_TYPES, shipCapacity, FEE } from "../sim/trade.mjs";
import { feeMul } from "./reputation.mjs";
import { price } from "../sim/market.mjs";

export function setRoute(g, ship, a, b, out, back = "") {
  if (g.over) return { ok: false, reason: "game over" };
  if (!g.world.nodes[a] || !g.world.nodes[b] || a === b) return { ok: false, reason: "bad route" };
  const has = (c, x) => !!g.market[c]?.[x];
  if (!out || !has(a, out) || !has(b, out)) return { ok: false, reason: "bad good" };
  if (back && (back === out || !has(a, back) || !has(b, back))) return { ok: false, reason: "bad good" };
  ship.route = { a, b, out, back: back || null, legs: 0, stuck: 0, since: g.day };
  return { ok: true, route: ship.route };
}
export function clearRoute(ship) { const had = !!ship.route; delete ship.route; return had; }

/** Run one step for every ship that has a route and is docked. `ops` are the game's own doBuy/doSell/doSail. */
export function processRoutes(g, ops) {
  for (const s of g.ships) {
    const r = s.route;
    if (!r || s.voyage || g.over) continue;
    if (r.v === 2) { processRouteAdv(g, s, r, ops); continue; } // advanced circuit; legacy A⇄B routes follow the original rules below
    if (s.at !== r.a && s.at !== r.b) { ops.doSail(g, s, r.a); continue; } // not on the route yet: go to A
    const atA = s.at === r.a, sellGood = atA ? r.back : r.out, buyGood = atA ? r.out : r.back;
    if (sellGood && (s.cargo[sellGood] ?? 0) > 0) {
      const q = s.cargo[sellGood], res = ops.doSell(g, s, sellGood, q);
      if (res.ok) { r.legs++; post(g, "routeLeg", { ship: s.id, city: s.at, good: sellGood, qty: res.qty, amt: res.revenue, profit: res.profit }); }
    }
    if (buyGood) ops.doBuy(g, s, buyGood, Math.max(0, shipCapacity(s) - cargoUsed(s)));
    // At A never sail empty (wait and retry next day); at B always go home, empty if there is no return cargo.
    if (atA && (s.cargo[r.out] ?? 0) === 0) { // need the outbound good, not just any cargo
      if (r.stuck++ === 0) post(g, "routeStuck", { ship: s.id, city: s.at, good: r.out });
      continue;
    }
    r.stuck = 0;
    ops.doSail(g, s, atA ? r.b : r.a);
  }
}

// Advanced routes (v2): a circuit of stops, each with optional buy and sell rules.
// A buy rule {good, maxPrice} only fires while the unit price is at most maxPrice;
// a sell rule {good, minPrice} only fires while the unit price is at least minPrice
// (null limit = trade at any price). minCash is the cash brake: the ship never
// spends money it would need to keep `minCash` in the strongbox. The ship uses the
// normal buy/sell/sail rules, so fees, hold space and price impact all apply.
const normRule = (x) => ({ good: x.good, maxPrice: x.maxPrice ?? null, minPrice: x.minPrice ?? null });

/** Set an advanced route: stops = [{city, buy: [{good, maxPrice?}], sell: [{good, minPrice?}]}]. */
export function setRouteAdv(g, ship, stops, opts = {}) {
  if (g.over) return { ok: false, reason: "game over" };
  if (!Array.isArray(stops) || stops.length < 2) return { ok: false, reason: "too few stops" };
  const minCash = opts.minCash ?? 0;
  if (!Number.isFinite(minCash) || minCash < 0) return { ok: false, reason: "bad cash brake" };
  const norm = [];
  for (let i = 0; i < stops.length; i++) {
    const st = stops[i];
    if (!g.world.nodes[st?.city]) return { ok: false, reason: "bad stop" };
    if (st.city === stops[(i + 1) % stops.length].city) return { ok: false, reason: "bad stop" }; // consecutive equal stops loop nowhere
    const rulesFor = (list, kind) => {
      if (!Array.isArray(list)) return null;
      const out = [];
      for (const x of list) {
        if (!g.market[st.city]?.[x?.good]) return null;
        const lim = kind === "buy" ? x.maxPrice : x.minPrice;
        if (lim != null && (!Number.isFinite(lim) || lim < 0)) return null;
        out.push(normRule(x));
      }
      return out;
    };
    const buy = rulesFor(st.buy ?? [], "buy"), sell = rulesFor(st.sell ?? [], "sell");
    if (!buy || !sell) return { ok: false, reason: "bad rule" };
    norm.push({ city: st.city, buy, sell });
  }
  ship.route = { v: 2, stops: norm, idx: 0, minCash, legs: 0, stuck: 0, since: g.day };
  return { ok: true, route: ship.route };
}

/** Units a buy rule would take: room, stock, the cash brake and the per-unit price cap all bind. */
function planBuy(g, s, good, room, budget, maxPrice) {
  const e = g.market[s.at]?.[good];
  if (!e) return 0;
  const sim = { ...e };
  let n = 0, cost = 0;
  while (n < Math.min(room, sim.stock)) {
    const unit = price(g.world, sim, good);
    if (maxPrice != null && unit > maxPrice) break; // the limit compares to the market price, before the port fee
    const charged = Math.ceil(unit * (1 + FEE * feeMul(g, s.at))); // plan with the REAL fee of this port (respect-scaled), so the cash brake never underestimates the charge
    if (cost + charged > budget) break; // cash brake
    cost += charged; sim.stock -= 1; n++;
  }
  return n;
}

/** One docked day for a ship on an advanced route. */
function processRouteAdv(g, s, r, ops) {
  const n = r.stops.length, stop = r.stops[r.idx % n];
  if (s.at !== stop.city) { ops.doSail(g, s, stop.city); return; } // on the way to the next stop
  const quoteAt = (good) => price(g.world, g.market[s.at][good], good);
  let traded = false;
  for (const rule of stop.sell) { // sells first: they free the hold and fund the buys
    const q = s.cargo[rule.good] ?? 0;
    if (q <= 0) continue;
    if (rule.minPrice != null && quoteAt(rule.good) < rule.minPrice) continue; // below the limit: hold for a better day
    const res = ops.doSell(g, s, rule.good, q);
    if (res.ok) { traded = true; post(g, "routeLeg", { ship: s.id, city: s.at, good: rule.good, qty: res.qty, amt: res.revenue, profit: res.profit }); }
  }
  for (const rule of stop.buy) {
    const room = Math.max(0, shipCapacity(s) - cargoUsed(s));
    if (room <= 0) break;
    const qty = planBuy(g, s, rule.good, room, Math.max(0, g.cash - r.minCash), rule.maxPrice);
    if (qty <= 0) continue;
    if (ops.doBuy(g, s, rule.good, qty).ok) traded = true;
  }
  // Wait in port only when nothing traded and nothing aboard is wanted at a later stop.
  const holdsForLater = Object.keys(s.cargo).some((good) =>
    r.stops.some((st, i) => i !== r.idx % n && st.sell.some((x) => x.good === good)));
  if (!traded && !holdsForLater) {
    if (r.stuck++ === 0) post(g, "routeStuck", { ship: s.id, city: s.at, good: stop.buy[0]?.good ?? "" });
    return;
  }
  r.stuck = 0;
  r.idx = (r.idx + 1) % n;
  if (r.idx === 0) r.legs++; // a full circuit counts as one completed run
  ops.doSail(g, s, r.stops[r.idx].city);
}
