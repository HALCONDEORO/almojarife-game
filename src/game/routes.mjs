// Automatic trade routes (an idea from classic trading games: standing orders for a ship).
// A route is: buy `out` at port A, sail to port B, sell it, optionally buy `back` there, sail home, repeat.
// Pure game logic, no DOM. The ship uses the normal buy/sell/sail rules, so prices, fees, hold space and cash all apply.
import { post } from "./ledger.mjs";
import { tutorialNote } from "./tutorial.mjs"; // setting your first route by hand is a tutorial step
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
  tutorialNote(g, "route");
  return { ok: true, route: ship.route };
}
export function clearRoute(ship) {
  const had = !!ship.route;
  if (had) {
    const keep = { ...ship.route };
    for (const key of ["legs", "stuck", "stuckKey", "sailBlockKey", "since", "profit", "idx"]) delete keep[key];
    ship.lastRoute = keep;
  } // remembered so "repeat route" can bring it back
  delete ship.route; return had;
}
/** Bring back the route this ship had before it was cancelled. Same checks as setting it by hand; the counters start from zero. */
export function repeatRoute(g, ship) {
  if (ship.route) return { ok: false, reason: "already on a route" };
  const r = ship.lastRoute;
  if (!r) return { ok: false, reason: "no saved route" };
  return r.v === 2 ? setRouteAdv(g, ship, r.stops, { minCash: r.minCash }) : setRoute(g, ship, r.a, r.b, r.out, r.back ?? "");
}
/** Completed round trips and the profit they made, from counters the route keeps (profit starts counting when the route is set). */
export function routeStats(route) {
  if (!route) return null;
  const laps = route.v === 2 ? route.legs : route.back ? Math.floor(route.legs / 2) : route.legs, profit = Math.round((route.profit ?? 0) * 10) / 10;
  return { laps, profit, perLap: laps > 0 ? Math.round((profit / laps) * 10) / 10 : null };
}

// Automatic routes take care of the hull: below ROUTE_REPAIR_HULL a docked route ship orders a repair
// at the yard before loading, as long as the bill leaves the route's cash brake intact, and waits in
// port until the yard delivers. When the brake does not cover it the ship sails worn and the feed says
// so (once per stretch).
export const ROUTE_REPAIR_HULL = 50;
function routeRepair(g, s, r, ops, brake) {
  if (!ops.doRepair || !ops.repairQuote) return false;
  if ((s.hull ?? 100) >= ROUTE_REPAIR_HULL) { r.repairWarned = 0; return false; }
  const cost = ops.repairQuote(s);
  if (cost <= 0) return false;
  if (g.cash - cost < Math.max(0, brake)) {
    if (!r.repairWarned) { r.repairWarned = 1; post(g, "routeRepairSkip", { ship: s.id, city: s.at, hull: Math.round(s.hull ?? 100), cost }); }
    return false;
  }
  const res = ops.doRepair(s);
  if (res.ok) { r.repairWarned = 0; post(g, "routeRepair", { ship: s.id, city: s.at, cost: res.cost, days: res.days }); return true; } // the ship waits in the yard: no loading today
  return false;
}

/** Report a rejected departure without changing route progress or the sailing rules. */
function routeSail(g, ship, destination, ops) {
  const result = ops.doSail(g, ship, destination), route = ship.route;
  if (result?.ok) { delete route.sailBlockKey; return result; }
  const cause = result?.reason ?? "sail_failed";
  const key = JSON.stringify([ship.at, destination, cause]);
  if (route.sailBlockKey !== key) post(g, "routeStuck", { ship: ship.id, city: ship.at, destination, action: "sail", cause });
  route.sailBlockKey = key;
  return result;
}

/** Run one step for every ship that has a route and is docked. `ops` are the game's own doBuy/doSell/doSail. */
export function processRoutes(g, ops) { // skipcq: JS-R1005 - pre-existing complexity; this PR adds one yard guard, extraction is out of scope
  for (const s of g.ships) {
    const r = s.route;
    if (!r || s.voyage || g.over) continue;
    if (ops.inRepair?.(s)) continue; // the yard holds the ship: the route waits and resumes when the order closes
    if (r.v === 2) { processRouteAdv(g, s, r, ops); continue; } // advanced circuit; legacy A⇄B routes follow the original rules below
    if (s.at !== r.a && s.at !== r.b) { routeSail(g, s, r.a, ops); continue; } // not on the route yet: go to A
    const atA = s.at === r.a, sellGood = atA ? r.back : r.out, buyGood = atA ? r.out : r.back;
    if (sellGood && (s.cargo[sellGood] ?? 0) > 0) {
      const q = s.cargo[sellGood], res = ops.doSell(g, s, sellGood, q);
      if (res.ok) { r.legs++; r.profit = (r.profit ?? 0) + (res.profit ?? 0); post(g, "routeLeg", { ship: s.id, city: s.at, good: sellGood, qty: res.qty, amt: res.revenue, profit: res.profit }); }
    }
    if (routeRepair(g, s, r, ops, 0)) continue; // repair before loading: the yard holds the ship
    let buyRes = null;
    if (buyGood) buyRes = ops.doBuy(g, s, buyGood, Math.max(0, shipCapacity(s) - cargoUsed(s)));
    // At A never sail empty (wait and retry next day); at B always go home, empty if there is no return cargo.
    if (atA && (s.cargo[r.out] ?? 0) === 0) { // need the outbound good, not just any cargo
      if (r.stuck++ === 0) {
        if (!buyGood) post(g, "routeStuck", { ship: s.id, city: s.at, good: r.out }); // no outbound rule: legacy notice
        else { // name the real reason the hold stayed empty (playtest 30/10: a full hold read as "no cash or no stock")
          const room = Math.max(0, shipCapacity(s) - cargoUsed(s)), e = g.market[s.at]?.[r.out];
          const cause = room <= 0 ? "no_space" : !e ? "no market" : e.stock <= 0 ? "no_stock"
            : buyRes && !buyRes.ok && (buyRes.reason === "port closed" || buyRes.reason === "embargo") ? buyRes.reason : "no cash";
          post(g, "routeStuck", { ship: s.id, city: s.at, action: "buy", good: r.out, cause });
        }
      }
      continue;
    }
    r.stuck = 0;
    routeSail(g, s, atA ? r.b : r.a, ops);
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
  tutorialNote(g, "route"); // an advanced circuit is a standing route too
  return { ok: true, route: ship.route };
}

/** Units a buy rule would take: room, stock, the cash brake and the per-unit price cap all bind. */
function planBuy(g, s, good, room, budget, maxPrice) {
  const e = g.market[s.at]?.[good];
  if (!e) return 0;
  const sim = { ...e };
  const maxN = Math.min(room, sim.stock); // freeze availability: sim.stock shrinks as each unit is planned
  let n = 0, cost = 0;
  while (n < maxN) {
    const unit = price(g.world, sim, good);
    if (maxPrice != null && unit > maxPrice) break; // the limit compares to the market price, before the port fee
    const charged = Math.ceil(unit * (1 + FEE * feeMul(g, s.at))); // plan with the REAL fee of this port (respect-scaled), so the cash brake never underestimates the charge
    if (cost + charged > budget) break; // cash brake
    cost += charged; sim.stock -= 1; n++;
  }
  return n;
}

/** One docked day for a ship on an advanced route. */
function processRouteAdv(g, s, r, ops) { // skipcq: JS-R1005 - pre-existing complexity; this PR adds the yard hold, extraction is out of scope
  const n = r.stops.length, stop = r.stops[r.idx % n];
  if (s.at !== stop.city) { routeSail(g, s, stop.city, ops); return; } // on the way to the next stop
  const quoteAt = (good) => price(g.world, g.market[s.at][good], good);
  let traded = false, blocker = null;
  // Deterministic precedence: the first blocked sell, then the first blocked buy.
  const blocked = (action, good, cause) => { blocker ??= { action, good, cause: cause || "trade_failed" }; };
  for (const rule of stop.sell) { // sells first: they free the hold and fund the buys
    const q = s.cargo[rule.good] ?? 0;
    if (q <= 0) continue;
    if (rule.minPrice != null && quoteAt(rule.good) < rule.minPrice) { blocked("sell", rule.good, "min_price"); continue; } // below the limit: hold for a better day
    const res = ops.doSell(g, s, rule.good, q);
    if (res.ok) { traded = true; r.profit = (r.profit ?? 0) + (res.profit ?? 0); post(g, "routeLeg", { ship: s.id, city: s.at, good: rule.good, qty: res.qty, amt: res.revenue, profit: res.profit }); }
    else blocked("sell", rule.good, res.reason);
  }
  if (routeRepair(g, s, r, ops, r.minCash)) return; // repair before loading: the yard holds the ship
  for (const rule of stop.buy) {
    const room = Math.max(0, shipCapacity(s) - cargoUsed(s));
    if (room <= 0) { blocked("buy", rule.good, "no_space"); break; }
    const qty = planBuy(g, s, rule.good, room, Math.max(0, g.cash - r.minCash), rule.maxPrice);
    if (qty <= 0) {
      const e = g.market[s.at]?.[rule.good];
      const cause = !e ? "no market" : e.stock <= 0 ? "no_stock" : rule.maxPrice != null && quoteAt(rule.good) > rule.maxPrice ? "max_price" : r.minCash > 0 ? "cash_brake" : "no cash";
      blocked("buy", rule.good, cause); continue;
    }
    const res = ops.doBuy(g, s, rule.good, qty);
    if (res.ok) traded = true;
    else blocked("buy", rule.good, res.reason);
  }
  // Wait in port only when nothing traded and nothing aboard is wanted at a later stop.
  const holdsForLater = Object.keys(s.cargo).some((good) =>
    r.stops.some((st, i) => i !== r.idx % n && st.sell.some((x) => x.good === good)));
  if (!traded && !holdsForLater) {
    const detail = blocker ?? { action: "wait", good: "", cause: "no_trade" };
    const key = JSON.stringify([s.at, r.idx % n, detail.action, detail.good, detail.cause]);
    // One notice per unchanged cause/good/stop stretch; a changed cause is useful news.
    if (r.stuck++ === 0 || r.stuckKey !== key) post(g, "routeStuck", { ship: s.id, city: s.at, ...detail });
    r.stuckKey = key;
    return;
  }
  r.stuck = 0;
  delete r.stuckKey;
  r.idx = (r.idx + 1) % n;
  if (r.idx === 0) r.legs++; // a full circuit counts as one completed run
  routeSail(g, s, r.stops[r.idx].city, ops);
}
