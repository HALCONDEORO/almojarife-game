import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, doBuy, doSell } from "../src/game/game.mjs";
import { embargoOn, grainShort, EMBARGO_BELOW } from "../src/game/embargo.mjs";
import { serialize, deserialize } from "../src/game/gamesave.mjs";
const world = loadWorld();
const mk = (on, ratio) => { const g = newGame(world); g.embargo = on; g.cash = 1e6; const s = g.ships[0]; s.at = "cadiz"; s.voyage = null; const e = g.market.cadiz.grain; e.target = 100; e.stock = Math.round(100 * ratio); return { g, s }; };
test("flag off: a starved port still sells grain", () => { const { g, s } = mk(false, 0.05); assert.equal(grainShort(g, "cadiz"), true); assert.equal(embargoOn(g, "cadiz"), false); assert.equal(doBuy(g, s, "grain", 1).reason, undefined); });
test("flag on, grain critically short: the council refuses to sell grain but sells everything else", () => {
  const { g, s } = mk(true, 0.2); const before = g.cash; assert.equal(doBuy(g, s, "grain", 1).reason, "embargo"); assert.equal(g.cash, before);
  assert.notEqual(doBuy(g, s, "salt", 1).reason, "embargo");
});
test("the door opens again at the threshold, and grain may always be sold into the port", () => {
  const { g, s } = mk(true, EMBARGO_BELOW); assert.equal(embargoOn(g, "cadiz"), false);
  const t = mk(true, 0.1); t.s.cargo = { grain: 3 }; assert.equal(doSell(t.g, t.s, "grain", 3).ok, true);
});
test("the flag survives a save and reload", () => { const { g } = mk(true, 0.1); const h = deserialize(JSON.parse(JSON.stringify(serialize(g, "T"))), world).g; assert.equal(embargoOn(h, "cadiz"), true); });
