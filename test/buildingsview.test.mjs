// Buildings tab view rows: states, progress, per-type effect lines, offers and quotes. Pure module tests.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildWorld } from "../src/sim/world.mjs";
import { newGame, advanceDay } from "../src/game/game.mjs";
import { buyPlot, startConstruction, buildingAt, BUILDING_TYPES } from "../src/game/buildings.mjs";
import { buildingsRows, plotOffers, buildOffers, upgradeOffer, cityEffects } from "../src/view/buildingsview.mjs";

const world = buildWorld(JSON.parse(fs.readFileSync(new URL("../data/world.json", import.meta.url))));
const PLOT = { id: "cadiz:7", type: "workshop", w: 4, d: 5 };
const funded = () => newGame(world, "cadiz", { cash: 30000 });

test("empty city: no rows, no bonuses", () => {
  const g = funded();
  assert.deepEqual(buildingsRows(g, "cadiz"), []);
  assert.deepEqual(cityEffects(g, "cadiz"), { pop: world.nodes.cadiz.pop ?? 8000, popBonus: 0, capBonus: 0 });
});

test("a bare plot row has state plot, no upkeep; a construction row carries progress and ready day", () => {
  const g = funded();
  buyPlot(g, "cadiz", PLOT);
  let [row] = buildingsRows(g, "cadiz");
  assert.equal(row.state, "plot"); assert.equal(row.type, null); assert.equal(row.upkeep, 0);
  const s = startConstruction(g, "cadiz", PLOT.id, "workshop");
  assert.ok(s.ok);
  [row] = buildingsRows(g, "cadiz");
  assert.equal(row.state, "construction"); assert.equal(row.nextLevel, 1);
  assert.equal(row.readyDay, Math.ceil(s.readyTick / 240));
  assert.ok(row.progress >= 0 && row.progress < 1);
  advanceDay(g); advanceDay(g);
  [row] = buildingsRows(g, "cadiz");
  assert.ok(row.progress > 0.2, `progress after 2 of 5 days: ${row.progress}`);
});

test("active rows expose per-type effects: workshop rate and margin, house pop, warehouse cap", () => {
  const g = funded();
  buyPlot(g, "cadiz", PLOT); startConstruction(g, "cadiz", PLOT.id, "workshop");
  const b = buildingAt(g, "cadiz", PLOT.id); b.state = "active"; b.level = 2; delete b.nextLevel; delete b.readyTick;
  const [row] = buildingsRows(g, "cadiz");
  assert.equal(row.state, "active"); assert.equal(row.upkeep, BUILDING_TYPES.workshop.upkeep * 2);
  assert.equal(row.rate, 1); assert.equal(row.produced, 0);
  assert.ok(row.margin !== null && Number.isFinite(row.margin));
  buyPlot(g, "cadiz", { id: "cadiz:8", type: "house", w: 3, d: 4 }); startConstruction(g, "cadiz", "cadiz:8", "house");
  const h = buildingAt(g, "cadiz", "cadiz:8"); h.state = "active"; h.level = 3; delete h.nextLevel; delete h.readyTick;
  const rows = buildingsRows(g, "cadiz");
  assert.equal(rows.find((r) => r.plotId === "cadiz:8").popBonus, 150);
  assert.equal(cityEffects(g, "cadiz").popBonus, 150);
});

test("plot offers exclude owned plots and come cheapest first", () => {
  const g = funded();
  const layout = [{ id: "cadiz:1", type: "house", w: 5, d: 5 }, { id: "cadiz:2", type: "workshop", w: 2, d: 2 }, { id: "cadiz:3", type: "warehouse", w: 6, d: 6 }];
  buyPlot(g, "cadiz", layout[1]);
  const offers = plotOffers(world, g, "cadiz", layout);
  assert.deepEqual(offers.map((o) => o.id), ["cadiz:1", "cadiz:3"]); // owned cadiz:2 is out; cheaper first
  assert.ok(offers[0].price <= offers[1].price);
  assert.ok(offers.every((o) => Number.isSafeInteger(o.price) && o.price > 0));
});

test("build offers quote all three types on an empty plot; upgrade offer quotes the next full level", () => {
  const g = funded();
  buyPlot(g, "cadiz", PLOT);
  const offers = buildOffers(g, "cadiz", PLOT.id);
  assert.equal(offers.length, 3);
  assert.ok(offers.every((o) => o.ok && o.days === BUILDING_TYPES[o.type].buildDays && o.cost > 0));
  assert.equal(upgradeOffer(g, "cadiz", PLOT.id), null); // nothing built yet
  startConstruction(g, "cadiz", PLOT.id, "workshop");
  const b = buildingAt(g, "cadiz", PLOT.id); b.state = "active"; b.level = 1; delete b.nextLevel; delete b.readyTick;
  const up = upgradeOffer(g, "cadiz", PLOT.id);
  assert.ok(up.ok); assert.equal(up.level, 2);
  assert.equal(up.days, BUILDING_TYPES.workshop.buildDays * 2);
  b.level = 3;
  const maxed = upgradeOffer(g, "cadiz", PLOT.id);
  assert.equal(maxed.ok, false); assert.equal(maxed.reason, "max level");
});
