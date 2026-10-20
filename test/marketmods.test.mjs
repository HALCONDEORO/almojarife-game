import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { makeMarket, tickMarket } from "../src/sim/market.mjs";
const world = loadWorld();
const run = (mods, days = 40) => { const m = makeMarket(world); for (let d = 0; d < days; d++) tickMarket(m, d, mods); return m; };
test("tickMarket without modifiers gives the same market as with none, empty or neutral ones", () => {
  const plain = run(undefined);
  assert.deepEqual(run(null), plain);
  assert.deepEqual(run({}), plain);
  assert.deepEqual(run({ lisboa: { grain: { make: 1, use: 1 } } }), plain);
});
test("modifiers only touch the city and good they name", () => {
  const plain = run(null), hungry = run({ lisboa: { grain: { use: 2.5 } } });
  assert.ok(hungry.lisboa.grain.stock < plain.lisboa.grain.stock);
  assert.deepEqual(hungry.sevilla, plain.sevilla);
  assert.deepEqual(hungry.lisboa.wine, plain.lisboa.wine);
  const poor = run({ valencia: { grain: { make: 0.3 } } });
  assert.ok(poor.valencia.grain.stock < plain.valencia.grain.stock);
});
