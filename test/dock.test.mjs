// Dock building: per-level toll discount at its port (docs/design/dock-building.md). Own design.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildWorld } from "../src/sim/world.mjs";
import { newGame, advanceTick, TICKS_PER_DAY } from "../src/game/game.mjs";
import { BUILDING_TYPES, buyPlot, quoteConstruction, startConstruction, buildingAt, dockTollFactor, DOCK_TOLL_DISCOUNT } from "../src/game/buildings.mjs";
import { RECIPES } from "../src/sim/recipes.mjs";
import { tollFor, chargeToll, baseToll } from "../src/game/tolls.mjs";
import { serialize, deserialize } from "../src/game/gamesave.mjs";

const world = buildWorld(JSON.parse(fs.readFileSync(new URL("../data/world.json", import.meta.url))));
const PLOT = { id: "cadiz:11", type: "warehouse", w: 4, d: 5 };
const PLOT2 = { id: "cadiz:12", type: "warehouse", w: 4, d: 5 };
const game = (cash = 20000) => newGame(world, "cadiz", { cash });
const activate = (g, plotId, level) => { const b = buildingAt(g, "cadiz", plotId); b.type = "dock"; b.level = level; b.state = "active"; };

test("dock is a buildable type with its own recipe", () => {
  const spec = BUILDING_TYPES.dock;
  assert.ok(spec, "dock registered"); assert.equal(spec.recipe, "dock");
  assert.ok(RECIPES.dock, "dock recipe registered");
  const g = game();
  assert.equal(buyPlot(g, "cadiz", PLOT).ok, true);
  const q = quoteConstruction(g, "cadiz", PLOT.id, "dock");
  assert.ok(q.ok, q.reason); assert.equal(q.level, 1);
  assert.equal(q.ticks, spec.buildDays * TICKS_PER_DAY);
});

test("no dock means the full toll; active levels cut it 25/50/100%", () => {
  const g = game(), ship = g.ships[0]; // a cog: capacity 60, base toll 6
  assert.equal(baseToll(ship), 6);
  assert.equal(dockTollFactor(g, "cadiz"), 1);
  assert.equal(tollFor(g, ship, "cadiz"), 6);
  buyPlot(g, "cadiz", PLOT);
  for (const [level, want] of [[1, 3], [2, 1.5], [3, 0]]) {
    activate(g, PLOT.id, level);
    assert.equal(dockTollFactor(g, "cadiz"), 1 - DOCK_TOLL_DISCOUNT[level]);
    assert.equal(tollFor(g, ship, "cadiz"), want, `level ${level}`);
  }
});

test("a dock under construction gives no discount; it starts on the exact ready tick", () => {
  const g = game(), ship = g.ships[0];
  buyPlot(g, "cadiz", PLOT);
  assert.ok(startConstruction(g, "cadiz", PLOT.id, "dock").ok);
  assert.equal(dockTollFactor(g, "cadiz"), 1);
  assert.equal(tollFor(g, ship, "cadiz"), 6);
  while (buildingAt(g, "cadiz", PLOT.id).state !== "active") advanceTick(g);
  assert.equal(dockTollFactor(g, "cadiz"), 0.5); // level 1 active
  assert.equal(tollFor(g, ship, "cadiz"), 3);
});

test("two docks stack their levels but the discount caps at level 3 (free)", () => {
  const g = game(), ship = g.ships[0];
  buyPlot(g, "cadiz", PLOT); buyPlot(g, "cadiz", PLOT2);
  activate(g, PLOT.id, 2); activate(g, PLOT2.id, 2); // sums to 4
  assert.equal(dockTollFactor(g, "cadiz"), 0);
  assert.equal(tollFor(g, ship, "cadiz"), 0);
});

test("the discount is per port and stacks multiplicatively with respect", () => {
  const g = game(), ship = g.ships[0];
  buyPlot(g, "cadiz", PLOT); activate(g, PLOT.id, 2); // -50% at cadiz
  assert.equal(tollFor(g, ship, "huelva"), 6, "other ports charge full price");
  g.rep = { cadiz: 2000 }; // "known": -25% respect discount
  assert.equal(tollFor(g, ship, "cadiz"), 1.13); // 6 x 0.75 x 0.25, rounded to cents
  g.rep = { cadiz: 40000 }; // "honoured": respect alone already passes free
  assert.equal(tollFor(g, ship, "cadiz"), 0);
});

test("a free (level 3) dock leaves no toll line in the weekly bill", () => {
  const g = game(), ship = g.ships[0];
  buyPlot(g, "cadiz", PLOT); activate(g, PLOT.id, 3);
  assert.equal(chargeToll(g, ship, "cadiz"), 0);
  assert.equal(g.accrued, undefined); // nothing accrued, no ghost line
  const g2 = game();
  assert.equal(chargeToll(g2, g2.ships[0], "cadiz"), 6);
  assert.equal(g2.accrued.tolls, 6);
});

test("dock state survives a save round-trip with its discount", () => {
  const g = game();
  buyPlot(g, "cadiz", PLOT); activate(g, PLOT.id, 2);
  const r = deserialize(serialize(g, "T"), world).g;
  assert.equal(dockTollFactor(r, "cadiz"), 0.25);
  assert.equal(tollFor(r, r.ships[0], "cadiz"), 1.5);
});
