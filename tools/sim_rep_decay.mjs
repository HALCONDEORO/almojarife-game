// Reputation decay study with the REAL rule: the engine's decayRep runs inside advanceDay (10 points a month, only in ports with no trade that month).
// "off" keeps every port's trade day fresh each day, which is the same game without decay. A greedy-preview trader (the sim_player policy) trades
// through doBuy/doSell/doSail, so its trades set the trade days like a player's. Reports, per horizon, the mean fee multiplier paid in the year
// and the number of ports at each name tier. Run: node tools/sim_rep_decay.mjs <years=30> [start=cadiz]   Own design.
import { loadWorld, route } from "../src/sim/world.mjs";
import { newGame, advanceDay, doBuy, doSell, doSail, repairShip } from "../src/game/game.mjs";
import { previewBuy, previewSell, SHIP_TYPES } from "../src/sim/trade.mjs";
import { portRep, feeMul, repTierIndex } from "../src/game/reputation.mjs";

const years = Number(process.argv[2] ?? 30), start = process.argv[3] ?? "cadiz";
const w = loadWorld(), HOR = [1, 5, 10, 30, 50, 100].filter((y) => y <= years), out = {};
for (const mode of ["off", "on"]) {
  const g = newGame(w, start, { freePlay: true, seed: 1 }), rows = {};
  let fees = [];
  while (g.day < years * 365) {
    const ship = g.ships[0];
    if (!ship.voyage) {
      for (const [good, qty] of Object.entries(ship.cargo)) { const m = feeMul(g, ship.at); if (doSell(g, ship, good, qty).ok) fees.push(m); }
      if (ship.hull < 65) repairShip(g, ship);
      let best = null;
      for (const city of w.cities) {
        if (city.id === ship.at) continue;
        const r = route(w, ship.at, city.id); if (!r) continue;
        const days = Math.max(1, Math.ceil(r.km / SHIP_TYPES[ship.type].kmPerDay));
        for (const good of Object.keys(w.goods)) {
          const b = previewBuy(w, g.market, ship, g.cash, good, SHIP_TYPES[ship.type].capacity);
          if (!b.qty) continue;
          const s = previewSell(w, g.market, { ...ship, at: city.id, cargo: { [good]: b.qty } }, good, b.qty);
          const score = (s.revenue - b.cost - days * SHIP_TYPES[ship.type].upkeepPerDay - 6) / (days + 1);
          if (score > 0 && (!best || score > best.score)) best = { dest: city.id, good, qty: b.qty, score };
        }
      }
      if (best) { const m = feeMul(g, ship.at); const b = doBuy(g, ship, best.good, best.qty); if (b.ok) { fees.push(m); doSail(g, ship, best.dest); } }
    }
    if (mode === "off") for (const c of Object.keys(g.portRep ?? {})) (g.repTrade ??= {})[c] = g.day;
    advanceDay(g);
    const y = g.day / 365;
    if (g.day % 365 === 0 && HOR.includes(y) && !rows[y + "y"]) {
      const reps = Object.keys(g.portRep ?? {}).map((c) => portRep(g, c));
      rows[y + "y"] = { meanFeeMul: +(fees.reduce((a, b) => a + b, 0) / Math.max(1, fees.length)).toFixed(3), renowned: reps.filter((r) => repTierIndex(r) === 4).length, esteemed: reps.filter((r) => repTierIndex(r) === 3).length, known: reps.filter((r) => r > 0).length, cash: Math.round(g.cash) };
      fees = [];
    }
  }
  out[mode] = rows;
}
console.log(JSON.stringify(out, null, 1));
