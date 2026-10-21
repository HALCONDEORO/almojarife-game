// Dock balance measurement (docs/design/dock-building.md): is a private dock worth building?
// A/B protocol per seed: two identical games (same seed => comparable winds), one with a dock
// of level L at the home port, one without. The dock is built AND UPGRADED through the real
// construction flow (full level cost per level, house policy), then the ships run the shortest
// route on the chart for one game year. Delta spending = tolls saved - running costs; the
// one-off plot+construction cost is reported separately for the payback figure.
// Run: node tools/sim_dock_balance.mjs
import fs from "node:fs";
import { buildWorld } from "../src/sim/world.mjs";
import { newGame, advanceDay, advanceTick, doSail } from "../src/game/game.mjs";
import { makeShip } from "../src/sim/trade.mjs";
import { buyPlot, quoteConstruction, startConstruction, buildingAt, BUILDING_TYPES } from "../src/game/buildings.mjs";

const world = buildWorld(JSON.parse(fs.readFileSync(new URL("../data/world.json", import.meta.url))));
const PLOT = { id: "cadiz:11", type: "warehouse", w: 4, d: 5 };
const AWAY = "huelva"; // cadiz<->huelva: the shortest hop on the chart
const DAYS = 365, SEEDS = [1, 2, 3, 4, 5, 6, 7, 8];

function runYear(seed, { dockLevel = 0, ships = 1, shipType = "cog" } = {}) {
  const g = newGame(world, "cadiz", { cash: 50000, freePlay: true });
  g.seed = seed;
  let oneOff = 0;
  if (dockLevel > 0) {
    const c0 = g.cash; buyPlot(g, "cadiz", PLOT); oneOff += c0 - g.cash;
    for (;;) {
      const b = buildingAt(g, "cadiz", PLOT.id);
      if (b.level >= dockLevel && b.state === "active") break;
      if (b.state !== "construction") {
        const q = quoteConstruction(g, "cadiz", PLOT.id, "dock");
        if (!q.ok) throw new Error("dock quote failed: " + q.reason);
        startConstruction(g, "cadiz", PLOT.id, "dock");
        oneOff += q.cost;
      }
      advanceTick(g);
    }
  }
  while (g.ships.length < ships) g.ships.push(makeShip(g.nextId++, shipType, "cadiz"));
  const cash0 = g.cash;
  let homeDockings = 0;
  for (let d = 0; d < DAYS && !g.over; d++) {
    for (const s of g.ships) {
      if (s.voyage) continue;
      if (s.at === "cadiz") homeDockings++;
      doSail(g, s, s.at === "cadiz" ? AWAY : "cadiz");
    }
    advanceDay(g);
  }
  return { spent: cash0 - g.cash, oneOff, homeDockings };
}

const r2 = (x) => Math.round(x * 100) / 100;
const out = { days: DAYS, seeds: SEEDS, route: `cadiz<->${AWAY}`, spec: BUILDING_TYPES.dock, scenarios: {} };
const lines = [];
for (const [shipType, ships] of [["cog", 1], ["cog", 3], ["nao", 3]]) {
  let base = null;
  for (const level of [0, 1, 2, 3]) {
    const runs = SEEDS.map((seed) => runYear(seed, { dockLevel: level, ships, shipType }));
    const avg = (k) => r2(runs.reduce((a, r) => a + r[k], 0) / runs.length);
    const sc = { avgSpent: avg("spent"), avgOneOff: avg("oneOff"), avgHomeDockings: avg("homeDockings"), spentMin: Math.min(...runs.map((r) => r.spent)), spentMax: Math.max(...runs.map((r) => r.spent)) };
    if (level === 0) base = sc;
    else {
      sc.netPerYear = r2(base.avgSpent - sc.avgSpent); // >0: the dock SAVES this much per year after its running costs
      sc.paybackYears = sc.netPerYear > 0 ? r2(sc.avgOneOff / sc.netPerYear) : null;
      lines.push(`${shipType} x${ships} L${level}: saves ${sc.netPerYear}/y after running costs, one-off ${sc.avgOneOff}, payback ${sc.paybackYears ?? "never"} y (${sc.avgHomeDockings} home dockings/y)`);
    }
    out.scenarios[`${shipType}${ships}_L${level}`] = sc;
  }
}
console.log(JSON.stringify(out, null, 1));
console.error(lines.join("\n"));
