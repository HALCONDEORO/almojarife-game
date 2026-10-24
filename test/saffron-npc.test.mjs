import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { makeMarket } from "../src/sim/market.mjs";
import { makeShip } from "../src/sim/trade.mjs";
import { aiStep } from "../src/sim/ai.mjs";

// Owner call 24/10: bots play by the same rules as humans, so saffron is a normal
// trade good for NPC traders (it shipped npcTrade:false in #361 by design lead, reversed same day).
test("saffron is NPC-tradeable: a trader loads it when it is the profitable good", () => {
  const world = loadWorld();
  assert.equal(world.goods.saffron?.base, 210);
  assert.notEqual(world.goods.saffron?.npcTrade, false, "saffron must not be player-only");
  const market = makeMarket(world);
  for (const e of Object.values(market.valencia)) e.stock = 0; // nothing else to load here
  market.valencia.saffron.stock = market.valencia.saffron.target * 4; // cheap and plenty
  for (const c of world.cities) if (market[c.id].saffron && c.id !== "valencia") market[c.id].saffron.stock = 1; // dear elsewhere
  const t = { cash: 5000, ship: makeShip(1, "cog", "valencia") };
  const plan = aiStep(world, market, t, t.ship);
  assert.ok(plan, "trader found a plan");
  assert.equal(plan.good, "saffron");
  assert.ok((t.ship.cargo.saffron ?? 0) > 0, "saffron in the hold");
  assert.equal(t.ship.voyage?.from, "valencia");
});
