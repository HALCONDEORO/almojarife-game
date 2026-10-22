// Reputation decay study: a greedy-preview trader (the sim_player policy) in free play, with and without a monthly decay of port reputation.
// The decay is applied here, on top of the real game functions: the engine is untouched. Reports, per horizon, the share of the
// year's trades done at each fee tier and the mean market fee multiplier paid.
// Run: node tools/sim_rep_decay.mjs <years=30> <decayPointsPerMonth,...=0,1,2> [start=cadiz]   Own design.
import { loadWorld, route } from "../src/sim/world.mjs";
import { newGame, advanceDay, doBuy, doSell, doSail, repairShip } from "../src/game/game.mjs";
import { previewBuy, previewSell, SHIP_TYPES } from "../src/sim/trade.mjs";
import { portRep, feeMul, REP_MIN } from "../src/game/reputation.mjs";

const years = Number(process.argv[2] ?? 30), decays = (process.argv[3] ?? "0,1,2").split(",").map(Number), start = process.argv[4] ?? "cadiz";
const w = loadWorld(), HOR = [1, 5, 10, 30, 50, 100].filter((y) => y <= years);
const out = {};
for (const decay of decays) {
  const g = newGame(w, start, { freePlay: true, seed: 1 });
  const rows = {}; let fees = [], tiers = [0, 0, 0, 0, 0];
  const note = (ship) => { fees.push(feeMul(g, ship.at)); };
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
    advanceDay(g);
    if (decay && g.day % 30 === 0) for (const c of Object.keys(g.portRep ?? {})) { const v = portRep(g, c); if (v > 0) g.portRep[c] = Math.max(0, v - decay); else if (v < 0) g.portRep[c] = Math.min(0, v + decay); }
    if (g.day % 365 === 0 && HOR.includes(g.day / 365) && !rows[g.day / 365 + "y"]) {
      const reps = Object.keys(g.portRep ?? {}).map((c) => portRep(g, c)), mean = (xs) => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
      rows[g.day / 365 + "y"] = { trades: fees.length, meanFeeMul: +mean(fees).toFixed(3), portsRenowned: reps.filter((r) => r >= 80).length, portsEsteemed: reps.filter((r) => r >= 50 && r < 80).length, portsKnown: reps.filter((r) => r > 0).length, meanRep: +mean(reps).toFixed(1), cash: Math.round(g.cash) };
      fees = [];
    }
  }
  out["decay" + decay + "/month"] = rows;
}
console.log(JSON.stringify(out, null, 1));
