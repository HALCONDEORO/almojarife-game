import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { validateWorld } from "../src/sim/validate.mjs";
const good = () => JSON.parse(fs.readFileSync(new URL("../data/world.json", import.meta.url), "utf8"));
test("the shipped world data is valid", () => assert.deepEqual(validateWorld(good()), []));
test("catches unknown goods, duplicate ids, bad lanes and unreachable cities", () => {
  let w = good(); w.cities[0].makes.push("unobtainium");
  assert.ok(validateWorld(w).some((e) => e.includes("unknown good")));
  w = good(); w.cities[1].id = w.cities[0].id;
  assert.ok(validateWorld(w).some((e) => e.includes("duplicate id")));
  w = good(); w.lanes.push(["nowhere", w.cities[0].id]);
  assert.ok(validateWorld(w).some((e) => e.includes("unknown node")));
  w = good(); w.lanes = w.lanes.filter(([a, b]) => a !== w.cities[2].id && b !== w.cities[2].id);
  assert.ok(validateWorld(w).some((e) => e.includes("no sea route")));
  w = good(); w.goods[Object.keys(w.goods)[0]].base = -3;
  assert.ok(validateWorld(w).some((e) => e.includes("base price")));
  assert.ok(validateWorld(null).length && validateWorld({}).length);
});
