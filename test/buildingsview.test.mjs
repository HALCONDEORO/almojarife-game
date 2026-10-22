// Buildings tab view rows: states, progress, per-type effect lines, offers and quotes. Pure module tests.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildWorld } from "../src/sim/world.mjs";
import { newGame, advanceDay } from "../src/game/game.mjs";
import { buyPlot, startConstruction, buildingAt, BUILDING_TYPES, PRODUCERS } from "../src/game/buildings.mjs";
import { buildingsRows, plotOffers, plotViewState, buildOffers, upgradeOffer, cityEffects, parseBldAct, buildingLabel, whyText } from "../src/view/buildingsview.mjs";

const world = buildWorld(JSON.parse(fs.readFileSync(new URL("../data/world.json", import.meta.url))));
const PLOT = { id: "cadiz:7", type: "workshop", w: 4, d: 5 };
const funded = () => newGame(world, "cadiz", { cash: 30000 });

test("empty city: no rows, no bonuses", () => {
  const g = funded();
  assert.deepEqual(buildingsRows(g, "cadiz"), []);
  assert.deepEqual(cityEffects(g, "cadiz"), { pop: world.nodes.cadiz.pop ?? 8000, popBonus: 0, capBonus: 0, jobs: 0, free: Math.max(0, (world.nodes.cadiz.pop ?? 8000) - Math.round((world.nodes.cadiz.pop ?? 8000) * 0.9)), staffing: 1 });
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

test("build offers quote every type on an empty plot; producers quote only where the city makes the good; upgrade offer quotes the next full level", () => {
  const g = funded();
  buyPlot(g, "cadiz", PLOT);
  const offers = buildOffers(g, "cadiz", PLOT.id);
  assert.equal(offers.length, Object.keys(BUILDING_TYPES).filter((t) => !PRODUCERS[t] || g.world.goods[PRODUCERS[t].output]).length); // one entry per offered type, refused ones carry their reason; a type whose optional good is not in the game (pottery) is not offered
  for (const t of ["house", "workshop", "warehouse", "saltworks", "fishery"]) { // cadiz makes salt and fish
    const o = offers.find((x) => x.type === t);
    assert.ok(o.ok && o.days === BUILDING_TYPES[t].buildDays && o.cost > 0, t + " quotes");
  }
  for (const t of ["oil_mill", "vineyard", "farm", "pasture", "sawmill", "mine"]) {
    const o = offers.find((x) => x.type === t);
    assert.equal(o.ok, false); assert.equal(o.reason, "good not producible in this city");
  }
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

test("parseBldAct: the armed-action wiring, including upgrade carrying its type", () => {
  assert.deepEqual(parseBldAct("buy|cadiz:7"), { kind: "buy", plotId: "cadiz:7" });
  assert.deepEqual(parseBldAct("build|cadiz:7|house"), { kind: "build", plotId: "cadiz:7", type: "house" });
  assert.deepEqual(parseBldAct("upgrade|cadiz:7|workshop"), { kind: "upgrade", plotId: "cadiz:7", type: "workshop" }); // the upgrade arm must carry the type: startConstruction needs it
  assert.equal(parseBldAct("upgrade|cadiz:7"), null); // without the type the confirm would no-op (review defect)
  assert.equal(parseBldAct("build|cadiz:7|castle"), null);
  assert.equal(parseBldAct(""), null);
  assert.equal(parseBldAct(null), null);
  // end to end: an armed upgrade parses and startConstruction accepts it
  const g = funded();
  buyPlot(g, "cadiz", PLOT); startConstruction(g, "cadiz", PLOT.id, "workshop");
  const b = buildingAt(g, "cadiz", PLOT.id); b.state = "active"; b.level = 1; delete b.nextLevel; delete b.readyTick;
  const a = parseBldAct(`upgrade|${PLOT.id}|workshop`);
  const r = startConstruction(g, "cadiz", a.plotId, a.type);
  assert.ok(r.ok); assert.equal(r.level, 2);
});

test("buildingLabel: short floating names for the 3D view", () => {
  const t = { bldTypes: { house: "Casa", workshop: "Taller", warehouse: "Almacén" }, bldState: { plot: "solar" } };
  assert.equal(buildingLabel(t, { type: null }), "solar");
  assert.equal(buildingLabel(t, { type: "house", state: "active", level: 1 }), "Casa");
  assert.equal(buildingLabel(t, { type: "house", state: "active", level: 2 }), "Casa 2");
  assert.equal(buildingLabel(t, { type: "workshop", state: "construction", nextLevel: 3 }), "Taller (3)");
  const en = { bldTypes: { warehouse: "Warehouse" }, bldState: { plot: "empty plot" } };
  assert.equal(buildingLabel(en, { type: null }), "empty plot");
  assert.equal(buildingLabel(en, { type: "warehouse", state: "active", level: 1 }), "Warehouse");
});

test("single-plot view state: an empty cache is loading (a 3D click must trigger the plots load), a populated cache finds the buy offer", () => {
  const g = funded();
  assert.deepEqual(plotViewState({}, world, g, "cadiz", "cadiz:7"), { kind: "loading" });
  assert.equal(plotViewState({ cadiz: "error" }, world, g, "cadiz", "cadiz:7").kind, "error");
  const st = plotViewState({ cadiz: [PLOT] }, world, g, "cadiz", "cadiz:7");
  assert.equal(st.kind, "offer");
  assert.equal(st.offer.id, "cadiz:7");
  assert.equal(plotViewState({ cadiz: [PLOT] }, world, g, "cadiz", "cadiz:99").kind, "none");
  const r = buyPlot(g, "cadiz", PLOT);
  assert.ok(r.ok);
  assert.equal(plotViewState({ cadiz: [PLOT] }, world, g, "cadiz", "cadiz:7").kind, "owned");
});

test("whyText translates a known build-offer reason and falls back to the raw reason for unknown ones", () => {
  const t = { bldWhy: { "office required": "necesitas una oficina comercial en este puerto" } };
  assert.equal(whyText(t, "office required"), "necesitas una oficina comercial en este puerto");
  assert.equal(whyText(t, "plot not owned"), "plot not owned");
  assert.equal(whyText({}, "max level"), "max level");
});

test("both locales translate every build/upgrade offer reason the game can emit", () => {
  const src = fs.readFileSync(new URL("../web/main.mjs", import.meta.url), "utf8");
  const locales = src.match(/bldWhy: \{[^}]*\}/g);
  assert.equal(locales.length, 2);
  const reasons = ["office required", "respect required", "good not producible in this city"];
  for (const l of locales) for (const r of reasons) assert.ok(l.includes(`"${r}"`), `missing ${r} in ${l.slice(0, 40)}`);
});

test("cityEffects reports the port's employment: jobs, free citizens and staffing", () => {
  const g = newGame(world);
  g.buildings = { cadiz: { "cadiz:1": { type: "workshop", level: 2, state: "active" }, "cadiz:2": { type: "house", level: 1, state: "active" } } };
  const eff = cityEffects(g, "cadiz");
  const pop = world.nodes.cadiz.pop ?? 8000;
  assert.equal(eff.jobs, 16, "two workshop levels want 16 workers");
  assert.equal(eff.free, Math.max(0, pop + 50 - Math.round(pop * 0.9)), "the house feeds the pool");
  assert.equal(eff.staffing, 1, "a real port staffs this easily");
  const g2 = newGame(world); // no houses: a hamlet cannot staff the workshop
  g2.buildings = { cadiz: { "cadiz:1": { type: "workshop", level: 2, state: "active" } } };
  const node = g2.world.nodes.cadiz, orig = node.pop;
  try { node.pop = 60; const short = cityEffects(g2, "cadiz"); assert.equal(short.free, 6, "60 vecinos menos 54 del pueblo"); assert.ok(short.staffing < 1 && short.staffing > 0, "a hamlet runs short-staffed"); }
  finally { node.pop = orig; }
});

test("active rows carry the workers they hire", () => {
  const g = newGame(world);
  g.buildings = { cadiz: { "cadiz:1": { type: "mine", level: 2, state: "active" }, "cadiz:2": { type: "house", level: 3, state: "active" } } };
  const rows = buildingsRows(g, "cadiz");
  assert.equal(rows.find((r) => r.plotId === "cadiz:1").jobs, 20, "mine level 2 hires 20");
  assert.equal(rows.find((r) => r.plotId === "cadiz:2").jobs, 0, "houses hire nobody");
});

test("the buildings tab carries the employment strings in both languages", () => {
  const src = fs.readFileSync(new URL("../web/main.mjs", import.meta.url), "utf8");
  assert.equal((src.match(/bldJobsLine:/g) || []).length, 2, "ES and EN");
  assert.equal((src.match(/bldJobsShort:/g) || []).length, 2);
  assert.ok(src.includes("eff.staffing < 1"), "short-staffing warning rendered");
});
