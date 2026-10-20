import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const pop = JSON.parse(fs.readFileSync(new URL("../data/population-1500.json", import.meta.url), "utf8"));
const world = JSON.parse(fs.readFileSync(new URL("../data/world.json", import.meta.url), "utf8"));
test("every city of the map has an entry, with a number or an explicit null", () => {
  for (const c of world.cities) assert.ok(Object.hasOwn(pop.cities, c.id), c.id);
  for (const [id, v] of Object.entries(pop.cities)) { assert.ok(v === null || (Number.isInteger(v) && v > 0 && v % 1000 === 0), id); assert.ok(world.cities.some((c) => c.id === id), "unknown city " + id); }
});
test("the file names its year, unit and source", () => {
  assert.equal(pop.year, 1500); assert.equal(pop.unit, "inhabitants"); assert.match(pop.source, /Bairoch/);
});
test("world.json pop1500 matches the population file", () => {
  for (const c of world.cities) if (Object.hasOwn(c, "pop1500")) assert.equal(c.pop1500, pop.cities[c.id], c.id);
});
