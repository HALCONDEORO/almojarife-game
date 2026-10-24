import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { withPottery } from "../src/sim/optional_goods.mjs";
import { makeMarket } from "../src/sim/market.mjs";
import { makeShip } from "../src/sim/trade.mjs";
import { aiStep } from "../src/sim/ai.mjs";

// Owner call 24/10 (WhatsApp 11:01): pottery plays by the same rules as humans, like saffron in #381.
// The 23/10 probe that made it player-only is superseded; bots now load pottery when it is the profitable good.
test("pottery is NPC-tradeable: a trader loads it when it is the profitable good", () => {
  const world = withPottery(loadWorld());
  assert.equal(world.goods.pottery?.base, 40);
  assert.notEqual(world.goods.pottery?.npcTrade, false, "pottery must not be player-only");
  const market = makeMarket(world);
  for (const e of Object.values(market.valencia)) e.stock = 0; // nothing else to load here
  market.valencia.pottery.stock = market.valencia.pottery.target * 4; // cheap and plenty
  for (const c of world.cities) if (market[c.id].pottery && c.id !== "valencia") market[c.id].pottery.stock = 1; // dear elsewhere
  const t = { cash: 5000, ship: makeShip(1, "cog", "valencia") };
  const plan = aiStep(world, market, t, t.ship);
  assert.ok(plan, "trader found a plan");
  assert.equal(plan.good, "pottery");
  assert.ok((t.ship.cargo.pottery ?? 0) > 0, "pottery in the hold");
  assert.equal(t.ship.voyage?.from, "valencia");
});
