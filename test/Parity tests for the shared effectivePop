// One effective population everywhere: market demand, port header, buildings tab and
// city modal must read the same number (Auditoría 30/10: the header showed 12.260 where
// the modal showed 12.360 - the header omitted the weekly neighbour drift and the walls).
import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, advanceDay } from "../src/game/game.mjs";
import { effectivePop, citylifeExtra } from "../src/game/citylife.mjs";
import { housePopBonus } from "../src/game/buildings.mjs";
import { WALL_POP, wallsKeptLevel } from "../src/game/walls.mjs";
import { cityEffects } from "../src/view/buildingsview.mjs";
import { serialize, deserialize } from "../src/game/gamesave.mjs";

const world = loadWorld();
const scene = ({ extra = 0, buildings = {}, walls = null } = {}) => {
  const g = newGame(world, "cadiz", { seed: 7, freePlay: true, calamities: false });
  g.day = 7;
  g.citylife.cities.cadiz.extra = extra;
  g.buildings = { cadiz: buildings };
  if (walls) g.walls = { cadiz: walls };
  return g;
};
const house = (type = "house_poor", level = 1, halted = false) => ({ type, level, halted, state: "active" });

test("the helper composes base + houses + drift + kept walls, and only those", () => {
  const base = world.nodes.cadiz.pop;
  assert.equal(effectivePop(scene(), "cadiz"), base, "bare city reads its census");
  const g = scene({ extra: 100, buildings: { poor: house("house_poor", 2), rich: house("house_rich", 1) }, walls: { level: 2, state: "active" } });
  assert.ok(housePopBonus(g, "cadiz") > 0, "the scene really has house population");
  assert.equal(effectivePop(g, "cadiz"), base + housePopBonus(g, "cadiz") + 100 + WALL_POP * 2);
});

test("drift and walls move the reading in both directions", () => {
  const base = world.nodes.cadiz.pop;
  assert.equal(effectivePop(scene({ extra: -40 }), "cadiz"), base - 40, "neighbours who leave count too");
  assert.equal(effectivePop(scene({ walls: { level: 3, state: "active" } }), "cadiz"), base + WALL_POP * 3);
  assert.equal(effectivePop(scene({ walls: { level: 3, state: "active", unkept: true } }), "cadiz"), base, "unpaid watch suspends the wall bonus");
  const halted = scene({ buildings: { poor: house("house_poor", 1, true) } });
  assert.equal(effectivePop(halted, "cadiz"), base + housePopBonus(halted, "cadiz"), "halted houses still house their residents");
  assert.ok(housePopBonus(halted, "cadiz") > 0);
});

test("every UI surface reads the helper: header, buildings tab and modal agree", () => {
  const g = scene({ extra: 100, buildings: { poor: house("house_poor", 2) }, walls: { level: 1, state: "active" } });
  const eff = cityEffects(g, "cadiz");
  // port header (updateCityHeader) and buildings tab (bldPopLine) print eff.popEff;
  // the city modal prints effectivePop(g, cityId) with its own base/houses/walls/drift breakdown
  assert.equal(eff.popEff, effectivePop(g, "cadiz"));
  const modalBreakdown = (world.nodes.cadiz.pop ?? 8000) + eff.popBonus + citylifeExtra(g, "cadiz") + WALL_POP * wallsKeptLevel(g, "cadiz");
  assert.equal(eff.popEff, modalBreakdown, "the modal breakdown sums to the same total");
  assert.equal(eff.pop + eff.popBonus + 100 + WALL_POP, eff.popEff, "the old header formula differed exactly by drift + walls");
});

test("market demand rows scale the same composition", () => {
  const g = scene({ extra: 60, buildings: { poor: house() }, walls: { level: 1, state: "active" } });
  advanceDay(g); // quiet scene: no plague, festival, growth or calamity, so every multiplier is 1
  assert.equal(g.market.cadiz.grain.pop, effectivePop(g, "cadiz"), "grain demand reads the helper");
  assert.equal(g.market.cadiz.wine.pop, effectivePop(g, "cadiz"), "and so does wine");
});

test("save/load preserves the composition", () => {
  const g = scene({ extra: 100, buildings: { poor: house("house_poor", 2) }, walls: { level: 2, state: "active" } });
  const before = effectivePop(g, "cadiz");
  const g2 = deserialize(JSON.parse(JSON.stringify(serialize(g, "Casa Vivienda", 1000))), world).g;
  assert.equal(effectivePop(g2, "cadiz"), before);
  assert.equal(cityEffects(g2, "cadiz").popEff, before);
});
