// Catalogue guard (production chains PR 9): the goods list and the building list stay inside the agreed size,
// and no good is orphaned. Rules from docs/design/production-chains-study.md.
import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { PRODUCERS, BUILDING_TYPES } from "../src/game/buildings.mjs";
import { RECIPES, OUTPUTS } from "../src/sim/recipes.mjs";
import { PER_1000, OPTIONAL_PER_1000 } from "../src/sim/classes.mjs";

const world = loadWorld(), goods = Object.keys(world.goods);
const SERVICE_BUILDINGS = new Set(["house", "warehouse", "dock"]); // they change the port, they do not make a good
const LUXURIES = new Set(["silk", "pepper", "sugar"]); // bought by the rich, made only where the land gives them
const producers = Object.keys(PRODUCERS), ships = new Set(["barca", "cog", "caravel", "nao"]);

test("at most 20 goods", () => assert.ok(goods.length <= 20, `goods: ${goods.length}`));
test("at most 16 production buildings (service buildings and the office are not counted)", () => {
  const prod = Object.keys(BUILDING_TYPES).filter((b) => PRODUCERS[b] && !SERVICE_BUILDINGS.has(b));
  assert.ok(prod.length <= 16, `production buildings: ${prod.length} (${prod.join(", ")})`);
});
test("every good has a maker: a port that makes it, a producer building, or it is a luxury", () => {
  const byBuilding = new Set(Object.values(PRODUCERS).flatMap((d) => [d.output, ...Object.keys(d.byproducts ?? {})]));
  for (const g of goods) assert.ok(world.cities.some((c) => c.makes.includes(g)) || byBuilding.has(g) || LUXURIES.has(g), `${g} has no maker`);
});
test("every good has a user: a port that needs it, citizen demand, or a recipe input", () => {
  const inRecipe = new Set(Object.values(RECIPES).flatMap((r) => Object.keys(r)));
  for (const g of goods) {
    const citizens = Object.values(PER_1000[g] ?? {}).some((v) => v > 0);
    assert.ok(world.cities.some((c) => c.needs.includes(g)) || citizens || inRecipe.has(g), `${g} has no user`);
  }
});
test("no recipe or building refers to a good that does not exist", () => {
  const known = new Set([...goods, ...Object.keys(OPTIONAL_PER_1000), "pottery"]); // optional goods exist only in games started with their flag (src/sim/optional_goods.mjs)
  for (const [name, r] of Object.entries(RECIPES)) for (const g of Object.keys(r)) assert.ok(known.has(g), `${name} uses unknown good ${g}`);
  for (const [name, o] of Object.entries(OUTPUTS)) for (const g of Object.keys(o)) assert.ok(known.has(g), `${name} outputs unknown good ${g}`);
  for (const [b, d] of Object.entries(PRODUCERS)) assert.ok(known.has(d.output), `${b} outputs unknown good ${d.output}`);
});
test("every building has a recipe, so construction always draws goods", () => {
  for (const b of Object.keys(BUILDING_TYPES)) assert.ok(RECIPES[BUILDING_TYPES[b].recipe], `${b} has no construction recipe`);
});
