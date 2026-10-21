// Old saves must keep loading when the world gains a good or a port: missing market rows are filled.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildWorld } from "../src/sim/world.mjs";
import { newGame, advanceDay } from "../src/game/game.mjs";
import { serialize, deserialize } from "../src/game/gamesave.mjs";
import { fillMissingMarketRows, makeMarket } from "../src/sim/market.mjs";

const world = buildWorld(JSON.parse(fs.readFileSync(new URL("../data/world.json", import.meta.url))));

function saveWithout(good, city) {
  const g = newGame(world, "cadiz", { cash: 5000 });
  for (let i = 0; i < 5; i++) advanceDay(g);
  const s = serialize(g, "T");
  for (const c of Object.values(s.state.market)) delete c[good];
  if (city) delete s.state.market[city];
  return { s, g };
}

test("a save written before a good existed loads with a fresh row in every port", () => {
  const { s, g } = saveWithout("pepper");
  const r = deserialize(s, world).g;
  for (const c of world.cities) assert.ok(r.market[c.id].pepper, `pepper row in ${c.id}`);
  assert.equal(r.market.cadiz.pepper.stock, r.market.cadiz.pepper.target, "new row starts at target like a new game");
  assert.deepEqual(r.market.cadiz.grain, g.market.cadiz.grain, "existing rows are untouched");
});

test("a save from before a port existed gets that port's market too", () => {
  const { s } = saveWithout("pepper", "melilla");
  const r = deserialize(s, world).g;
  assert.ok(r.market.melilla && r.market.melilla.grain && r.market.melilla.pepper);
});

test("the game runs after loading such a save (AI traders touch every good)", () => {
  const { s } = saveWithout("sugar");
  const r = deserialize(s, world).g;
  for (let i = 0; i < 40; i++) advanceDay(r);
  assert.ok(!r.over || r.over, "ran 40 days without a TypeError");
});

test("fillMissingMarketRows adds nothing to a complete market and counts what it adds", () => {
  const m = makeMarket(world);
  assert.equal(fillMissingMarketRows(world, m), 0);
  delete m.cadiz.salt; delete m.sevilla.wine;
  assert.equal(fillMissingMarketRows(world, m), 2);
});
