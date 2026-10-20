// Automatic trade routes (an idea from classic trading games: standing orders for a ship).
// A route is: buy `out` at port A, sail to port B, sell it, optionally buy `back` there, sail home, repeat.
// Pure game logic, no DOM. The ship uses the normal buy/sell/sail rules, so prices, fees, hold space and cash all apply.
import { post } from "./ledger.mjs";
import { cargoUsed, SHIP_TYPES } from "../sim/trade.mjs";

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
    if (s.at !== r.a && s.at !== r.b) { ops.doSail(g, s, r.a); continue; } // not on the route yet: go to A
    const atA = s.at === r.a, sellGood = atA ? r.back : r.out, buyGood = atA ? r.out : r.back;
    if (sellGood && (s.cargo[sellGood] ?? 0) > 0) {
      const q = s.cargo[sellGood], res = ops.doSell(g, s, sellGood, q);
      if (res.ok) { r.legs++; post(g, "routeLeg", { ship: s.id, city: s.at, good: sellGood, qty: res.qty, amt: res.revenue, profit: res.profit }); }
    }
    if (buyGood) ops.doBuy(g, s, buyGood, SHIP_TYPES[s.type].capacity - cargoUsed(s));
    // At A never sail empty (wait and retry next day); at B always go home, empty if there is no return cargo.
    if (atA && (s.cargo[r.out] ?? 0) === 0) { // need the outbound good, not just any cargo
      if (r.stuck++ === 0) post(g, "routeStuck", { ship: s.id, city: s.at, good: r.out });
      continue;
    }
    r.stuck = 0;
    ops.doSail(g, s, atA ? r.b : r.a);
  }
}
