// Retiring dried_fish and the smokehouse (production chains PR 1b): old saves load and keep their goods and buildings.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildWorld } from "../src/sim/world.mjs";
import { newGame, advanceDay } from "../src/game/game.mjs";
import { serialize, deserialize, migrateRetired } from "../src/game/gamesave.mjs";

const world = buildWorld(JSON.parse(fs.readFileSync(new URL("../data/world.json", import.meta.url))));

function oldSave() {
  const g = newGame(world, "cadiz", { cash: 20000 });
  const s = g.ships[0]; s.cargo.dried_fish = 7; s.basis = { ...(s.basis ?? {}), dried_fish: 140 };
  for (const c of Object.values(g.market)) { c.dried_fish = { ...c.fish }; delete c.fish; }
  (g.buildings ??= {}).cadiz = [{ id: "cadiz:1", type: "smokehouse", level: 2, state: "active" }];
  return serialize(g, "T");
}

test("an old save with dried fish and a smokehouse loads as fish and a fishery", () => {
  const r = deserialize(oldSave(), world).g;
  assert.equal(r.ships[0].cargo.fish, 7); assert.equal(r.ships[0].cargo.dried_fish, undefined);
  assert.equal(r.ships[0].basis.fish, 140);
  assert.equal(JSON.stringify(r).includes("dried_fish"), false);
  assert.equal(JSON.stringify(r).includes("smokehouse"), false);
  for (const c of world.cities) { assert.ok(r.market[c.id].fish, c.id); assert.equal(r.market[c.id].dried_fish, undefined); }
  assert.equal(JSON.stringify(r.buildings).includes('"fishery"'), true);
  for (let i = 0; i < 5; i++) advanceDay(r); // the traders and the old building run without crashing
});

test("a save that has both ids keeps the existing fish row and adds the counts", () => {
  const g = { market: { cadiz: { fish: { stock: 5 }, dried_fish: { stock: 9 } } }, ships: [{ cargo: { fish: 2, dried_fish: 3 } }] };
  migrateRetired(g);
  assert.deepEqual(g.market.cadiz, { fish: { stock: 5 } });
  assert.deepEqual(g.ships[0].cargo, { fish: 5 });
});

test("an old save with kid meat loads it as common meat and drops the flag", () => {
  const g = newGame(world, "cadiz", { cash: 20000 });
  const s = g.ships[0]; s.cargo.kid_meat = 4; s.basis = { ...(s.basis ?? {}), kid_meat: 160 };
  for (const c of Object.values(g.market)) c.kid_meat = { ...c.meat };
  const save = serialize(g, "T"); save.state.kidMeat = true; // saves written while the good existed carry the flag
  const r = deserialize(save, world).g;
  assert.equal(r.ships[0].cargo.meat, 4); assert.equal(r.ships[0].cargo.kid_meat, undefined);
  assert.equal(r.ships[0].basis.meat, 160);
  assert.equal(r.kidMeat, undefined);
  assert.equal(JSON.stringify(r).includes("kid_meat"), false);
  for (const c of world.cities) { assert.ok(r.market[c.id].meat, c.id); assert.equal(r.market[c.id].kid_meat, undefined); }
});
