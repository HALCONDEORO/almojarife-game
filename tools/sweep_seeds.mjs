// 64-seed playability sweep over the current world (newGame opts.seed). Usage: node tools/sweep_seeds.mjs [seeds=64] [days=365] > report.json
// Blocks: routes (a one-way run of a basic cargo earns on cadiz->sevilla and cadiz->barcelona), rivals (median bot NET WORTH vs seed 0), repair, events (no crash, finite state).
// Net worth of a rival = cash + hull value + cargo at its port market price + warehouse goods; rivals carry no debt in this model (no loan field on a trader).
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, advanceDay, doBuy, doSell, doSail, waitUntilArrival, orderRepair, repairPrice, shipValue } from "../src/game/game.mjs";
/** Repairs cost real days here: the yard works REPAIR_POINTS_PER_DAY points a day, so after ordering, the calendar advances the quoted days (advanceDay runs the yard and the rest of the economy) and the ship waits in port meanwhile. */
const repairShip = (game, ship) => { const res = orderRepair(game, [ship.id], ship.at); if (res.ok) { for (let dayNum = 0; dayNum < res.days && !game.over; dayNum++) advanceDay(game); } return res; };
import { price } from "../src/sim/market.mjs";
const world = loadWorld(), N = Number(process.argv[2] ?? 64), DAYS = Number(process.argv[3] ?? 365);
const BASIC = ["grain", "fish", "salt", "wool", "wine", "olive_oil"], ROUTES = [["cadiz", "sevilla"], ["cadiz", "barcelona"]];
const median = (a) => { const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length ? (s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2) : 0; };
const mkOpts = (seed, extra = {}) => ({ seed, ...extra });
/** One real one-way run of one basic good: buy a hold (cash-limited), sail, check the ship ARRIVED at the destination, sell all of it and check the sale. Returns { net } or { fail: reason }. */
function oneWay(seed, extra, from, to, good) {
  const g = newGame(world, from, mkOpts(seed, extra)); const s = g.ships[0]; const c0 = g.cash;
  const b = doBuy(g, s, good, 40); if (!b.ok) return { fail: "buy:" + b.reason };
  const bought = s.cargo[good] ?? 0; if (bought <= 0) return { fail: "no cargo" };
  const r = doSail(g, s, to); if (!r.ok) return { fail: "sail:" + r.reason };
  waitUntilArrival(g, s); if (s.voyage || s.at !== to) return { fail: "did not arrive" };
  const q = s.cargo[good] ?? 0, sold = doSell(g, s, good, q); if (!sold.ok || q !== bought) return { fail: "sell:" + (sold.reason ?? "partial") };
  return { net: Math.round(g.cash - c0) };
}
function routes(seed, extra) {
  const out = {};
  for (const [a, b] of ROUTES) { const best = { good: null, net: null, fails: [] }; for (const good of BASIC) { const t = oneWay(seed, extra, a, b, good); if (t.fail) { best.fails.push(good + ":" + t.fail); continue; } if (best.net === null || t.net > best.net) { best.good = good; best.net = t.net; } } out[`${a}>${b}`] = best; }
  return out;
}
const portOf = (t) => t.ship.at ?? t.ship.voyage?.to ?? t.home;
function netWorth(g, t) {
  let w = t.cash + shipValue(t.ship); const e = g.market?.[portOf(t)];
  for (const [good, q] of Object.entries(t.ship.cargo ?? {})) if (e?.[good]) w += price(g.world, e[good], good) * q;
  for (const [port, goods] of Object.entries(t.warehouses ?? {})) for (const [good, v] of Object.entries(goods ?? {})) { const q = typeof v === "number" ? v : v?.qty ?? 0, me = g.market?.[port]?.[good]; if (me && q > 0) w += price(g.world, me, good) * q; }
  return Math.round(w);
}
function wealth(seed, extra) { const g = newGame(world, "cadiz", mkOpts(seed, extra)); for (let i = 0; i < DAYS && !g.over; i++) advanceDay(g); const bots = g.ai.map((t) => netWorth(g, t)); return { bots, median: median(bots), cash: g.ai.map((t) => Math.round(t.cash)), day: g.day }; }
function repair(seed, extra) { // the order model with real days: the bill is charged at order time and the quoted days pass before the hull is sound again; the day cost check tolerates the upkeep those days accrue
  const game = newGame(world, "cadiz", mkOpts(seed, extra)); const ship = game.ships[0]; ship.hull = 60; game.cash = 5000; const cash0 = game.cash, day0 = game.day, bill = repairPrice(game, ship), res = repairShip(game, ship);
  return { ok: Boolean(res.ok) && ship.hull === 100 && game.day - day0 === res.days && cash0 - game.cash >= bill, price: bill, days: res.days ?? 0 };
}
function events(seed, extra) {
  try {
    const g = newGame(world, "cadiz", mkOpts(seed, { ...extra, events: true })); for (let i = 0; i < DAYS && !g.over; i++) { advanceDay(g); if (g.pending) g.pending = null; }
    const finite = Number.isFinite(g.cash) && g.ships.every((s) => Number.isFinite(s.hull) && Number.isFinite(s.crew ?? 0)) && g.ai.every((t) => Number.isFinite(t.cash)) && Object.values(g.market).every((m) => Object.values(m).every((e) => Number.isFinite(e.stock) && e.stock >= 0));
    return { ok: finite && g.day > 0, over: g.over ?? null, day: g.day, cash: Math.round(g.cash), ships: g.ships.length };
  } catch (e) { return { ok: false, error: String(e.message).slice(0, 120) }; }
}
const report = { seeds: N, days: DAYS, mainMedian: wealth(0, {}).median, configs: {} }; // main = the default game (no regional rivals), same net-worth measure
for (const [name, extra] of [["default", {}], ["regionalRivals", { regionalRivals: true }]]) {
  const per = {}; for (let seed = 0; seed < N; seed++) per[seed] = { routes: routes(seed, extra), wealth: wealth(seed, extra), repair: repair(seed, extra), events: events(seed, extra) };
  const base = report.mainMedian, meds = Object.values(per).map((p) => p.wealth.median);
  const routeFail = Object.entries(per).filter(([, p]) => Object.values(p.routes).some((r) => r.net === null || r.net <= 0)).map(([s]) => Number(s));
  const bandFail = Object.entries(per).filter(([, p]) => base > 0 && Math.abs(p.wealth.median / base - 1) > 0.1).map(([s]) => Number(s));
  report.configs[name] = { per, summary: { mainMedian: base, seed0Median: per[0].wealth.median, withinBand: Object.values(per).filter((p) => base > 0 && Math.abs(p.wealth.median / base - 1) <= 0.1).length, medianOfMedians: median(meds), min: Math.min(...meds), max: Math.max(...meds), routeFail, bandFailOver10pct: bandFail, repairFail: Object.entries(per).filter(([, p]) => !p.repair.ok).map(([s]) => Number(s)), eventsFail: Object.entries(per).filter(([, p]) => !p.events.ok).map(([s]) => Number(s)) } };
}
console.log(JSON.stringify(report));
