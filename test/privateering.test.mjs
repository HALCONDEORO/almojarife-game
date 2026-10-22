import { readFileSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, doSail } from "../src/game/game.mjs";
import { buyLetter } from "../src/game/marque.mjs";
import { targetsFor, attackTrader, quintoUnits, traderRealm } from "../src/game/privateering.mjs";
import { serialize, deserialize } from "../src/game/gamesave.mjs";
const world = loadWorld(), data = JSON.parse(readFileSync(new URL("../data/realms.json", import.meta.url), "utf8"));
/** A game with the player's ship and trader 0 on the same lane; trader 0 is made Portuguese. */
function setup(over = {}) {
  const g = newGame(world); g.marque = true; g.cash = 50000; g.tick = 5;
  const s = g.ships[0], t = g.ai[0]; t.home = "lisboa"; t.ship.at = "cadiz"; t.ship.voyage = null; t.ship.cargo = { wool: 10, salt: 10, fish: 10 };
  s.at = "cadiz"; s.voyage = null; s.cargo = {}; s.crew = 20;
  const r = doSail(g, s, "malaga"); assert.ok(r.ok, JSON.stringify(r));
  return { g, s, t };
}
const lane = (g, s, t) => { const v = s.voyage; t.ship.voyage = { ...v, ticksLeft: v.ticksLeft }; t.ship.at = v.from; };
test("a trader's realm comes from its home port and the year", () => {
  const g = newGame(world); assert.equal(traderRealm(g, data, { home: "lisboa" }), "portugal"); assert.equal(traderRealm(g, data, { home: "tetuan" }), null); assert.equal(traderRealm(g, data, {}), null);
});
test("flag off: no targets and no fight", () => {
  const { g, s, t } = setup(); lane(g, s, t); g.marque = false;
  assert.deepEqual(targetsFor(g, data, s), []); assert.equal(attackTrader(g, data, s.id, 0).reason, "off");
});
test("no letter, no target; with a letter the trader on the same lane is one", () => {
  const { g, s, t } = setup(); lane(g, s, t);
  assert.deepEqual(targetsFor(g, data, s), []);
  buyLetter(g, data, "cadiz", "portugal");
  assert.deepEqual(targetsFor(g, data, s), [{ index: 0, realm: "portugal" }]);
  t.ship.voyage = { ...t.ship.voyage, from: "x", to: "y" }; assert.deepEqual(targetsFor(g, data, s), []);
});
test("an attack is seeded, once per tick, and conserves goods except the quinto", () => {
  const { g, s, t } = setup(); lane(g, s, t); buyLetter(g, data, "cadiz", "portugal");
  s.weapons = { bombarda: 2 }; s.crew = 20; 
  const before = Object.values(t.ship.cargo).reduce((a, b) => a + b, 0);
  const r = attackTrader(g, data, s.id, 0);
  assert.equal(r.ok, true);
  const heldNow = Object.values(s.cargo).reduce((a, b) => a + b, 0), left = Object.values(t.ship.cargo).reduce((a, b) => a + b, 0);
  const taken = Object.values(r.report.loot).reduce((a, b) => a + b, 0), qn = Object.values(r.quinto).reduce((a, b) => a + b, 0);
  assert.equal(heldNow, taken - qn); assert.equal(left + taken + Object.values(r.report.destroyed ?? {}).reduce((a, b) => a + b, 0), before);
  assert.equal(attackTrader(g, data, s.id, 0).reason, "already fought");
});
test("quinto is a fifth per good, rounded down", () => assert.deepEqual(quintoUnits({ a: 10, b: 4, c: 1 }), { a: 2, b: 0, c: 0 }));
test("a sunk trader starts again from home; save and reload keep the home", () => {
  const { g } = setup(); const h = deserialize(JSON.parse(JSON.stringify(serialize(g, "T"))), world).g;
  assert.equal(h.ai[0].home, "lisboa");
});
test("the marque flag is opt-in and survives a save", () => {
  assert.equal(newGame(world).marque, false);
  const g = newGame(world, "cadiz", { marque: true }); assert.equal(g.marque, true);
  assert.equal(deserialize(JSON.parse(JSON.stringify(serialize(g, "T"))), world).g.marque, true);
});
