import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, doBuy } from "../src/game/game.mjs";
import { craftCount, craftTitle, craftLine, CRAFT_MIN_UNITS } from "../src/game/crafts.mjs";
import { stewardTick } from "../src/game/steward.mjs";
import { hallView } from "../src/view/townhallview.mjs";
import { serialize, deserialize } from "../src/game/gamesave.mjs";
const world = loadWorld();
const inbox = (g) => g.inbox ?? g.ledger?.inbox ?? [];
const mk = (opts) => newGame(world, "cadiz", { cityIdentity: false, cityMoodOut: false, citySeasons: false, cityCrafts: false, cityFestivals: false, cityMemory: false, cityRelations: false, cityGrowth: false, freePlay: true, seed: 5, ...opts });
const fameNotices = (g) => inbox(g).filter((m) => /se hace nombre|making a name/.test(JSON.stringify(m)));
test("flag off: buys leave no trace and no tab field", () => {
  const g = mk({});
  const s = g.ships[0]; s.at = "cadiz"; s.voyage = null; g.cash = 1e6;
  assert.equal(doBuy(g, s, "salt", 5).ok, true);
  assert.equal(g.crafts, undefined); assert.equal(g.craftsTitle, undefined);
  assert.equal(craftLine(g, "cadiz"), null);
  assert.equal(hallView(g, "cadiz").craft, undefined);
});
test("a port earns its name from real loads, whoever carries them: player and steward both count", () => {
  const g = mk({ cityCrafts: true });
  const s = g.ships[0]; s.at = "cadiz"; s.voyage = null; g.cash = 1e6;
  const e = g.market.cadiz.salt; e.stock = 50000; e.target = 1000;
  const before = fameNotices(g).length;
  for (let i = 0; i < 10 && (g.crafts?.cadiz?.salt ?? 0) < 400; i++) { s.cargo = {}; doBuy(g, s, "salt", 60); } // a cog's hold is small: several loads, below the threshold
  assert.equal(craftTitle(g, "cadiz"), null);
  assert.ok(g.crafts.cadiz.salt >= 400, JSON.stringify(g.crafts));
  g.warehouses = { cadiz: { goods: {}, basis: {}, admin: { reserve: 0, rules: { salt: { buyBelow: 1e6, buyTo: 200, sellAbove: 0, sellKeep: 0 } } } } };
  stewardTick(g, "cadiz", 10000); // the steward's loads ship out too: past 500 together
  assert.equal(craftTitle(g, "cadiz"), "salt");
  assert.equal(fameNotices(g).length, before + 1);
  assert.match(JSON.stringify(fameNotices(g)[0]), /ciudad de la sal/); assert.match(JSON.stringify(fameNotices(g)[0]), /the salt city/);
  doBuy(g, s, "salt", 100); // a name, once earned, is not told twice
  assert.equal(fameNotices(g).length, before + 1);
});
test("the name needs a clear lead: two goods neck and neck earn nothing", () => {
  const g = mk({ cityCrafts: true });
  craftCount(g, "cadiz", "fish", CRAFT_MIN_UNITS - 100); // under the line alone
  craftCount(g, "cadiz", "salt", CRAFT_MIN_UNITS + 100); // ahead, but too close to fish
  assert.equal(craftTitle(g, "cadiz"), null);
  craftCount(g, "cadiz", "salt", CRAFT_MIN_UNITS); // now the lead is clear
  assert.equal(craftTitle(g, "cadiz"), "salt");
});
test("the tab line and the save keep the earned name, and counting moves no money", () => {
  const g = mk({ cityCrafts: true });
  craftCount(g, "cadiz", "salt", CRAFT_MIN_UNITS * 2);
  const tab = hallView(g, "cadiz").craft;
  assert.equal(tab.good, "salt");
  assert.match(tab.txt.es, /ciudad de la sal/); assert.match(tab.txt.en, /the salt city/);
  const h = deserialize(JSON.parse(JSON.stringify(serialize(g, "T"))), world).g;
  assert.equal(craftTitle(h, "cadiz"), "salt");
  const cash = g.cash; craftCount(g, "cadiz", "fish", 10);
  assert.equal(g.cash, cash);
});
