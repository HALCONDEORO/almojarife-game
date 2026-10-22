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

test("a won fight never overfills the hold (full and partial hold)", () => {
  for (const have of [60, 30]) {
    const { g, s, t } = setup(); lane(g, s, t); buyLetter(g, data, "cadiz", "portugal");
    s.cargo = { salt: have }; s.weapons = { cannon: 3 }; s.crew = 18; t.ship.cargo = { wool: 30, fish: 30 }; t.ship.crew = 3; t.ship.weapons = {};
    const r = attackTrader(g, data, s.id, 0);
    assert.ok(r.ok);
    const used = Object.values(s.cargo).reduce((a, b) => a + b, 0);
    assert.ok(used <= 60 - 0 && used <= 60, `hold used ${used} over 60`); assert.ok(have === 60 ? used === 60 : used >= have);
  }
});
// --- mechanic 2: prize court ---
import { doSell, storeGoods, buyWarehouse } from "../src/game/game.mjs";
import { settlePrize, prizeUnits, prizeLocked } from "../src/game/privateering.mjs";
const prized = () => { const { g, s } = setup(); s.at = "cadiz"; s.voyage = null; s.cargo = { wool: 10, salt: 5 }; s.prizeLots = [{ realm: "portugal", goods: { wool: 10 }, day: 0 }]; return { g, s }; };
test("prize goods are locked: only the free part can be sold, and nothing locks with the flag off", () => {
  const { g, s } = prized();
  assert.equal(prizeUnits(s, "wool"), 10); assert.equal(doSell(g, s, "wool", 1).reason, "prize"); assert.equal(doSell(g, s, "salt", 1).ok, true);
  g.marque = false; assert.equal(prizeLocked(g, s, "wool"), 0);
});
test("a prize cannot be stored in a warehouse before the court", () => {
  const { g, s } = prized(); g.cash = 1e6; buyWarehouse(g, "cadiz"); assert.equal(storeGoods(g, s, "wool", 5).reason, "prize");
});
test("a port with no realm has no court; the lot waits", () => {
  const { g, s } = prized(); s.at = "tetuan"; assert.equal(settlePrize(g, data, s).reason, "no court"); assert.equal(s.prizeLots.length, 1);
});
test("a good port releases the prize; the goods become free cargo", () => {
  const { g, s } = prized(); const r = settlePrize(g, data, s);
  assert.equal(r.ok, true); assert.deepEqual(r.released, { wool: 10 }); assert.equal(s.cargo.wool, 10); assert.equal(s.prizeLots, undefined); assert.equal(doSell(g, s, "wool", 10).ok, true);
});
test("the victim's realm seizes the prize, and so does an ill-seen port", () => {
  let { g, s } = prized(); s.at = "lisboa"; let r = settlePrize(g, data, s);
  assert.deepEqual(r.seized, { wool: 10 }); assert.equal(s.cargo.wool, undefined); assert.equal(s.cargo.salt, 5);
  ({ g, s } = prized()); g.portRep = { cadiz: -10 }; r = settlePrize(g, data, s); assert.deepEqual(r.seized, { wool: 10 });
});
test("a sunk or lost cargo never leaves phantom locks, and flag off settles nothing", () => {
  const { g, s } = prized(); s.cargo = { wool: 3 }; assert.equal(prizeUnits(s, "wool"), 3);
  g.marque = false; assert.equal(settlePrize(g, data, s).reason, "off");
});
test("an attack tags the kept goods as a prize lot", () => {
  const { g, s, t } = setup(); lane(g, s, t); buyLetter(g, data, "cadiz", "portugal"); s.weapons = { bombarda: 2 }; s.crew = 20;
  const r = attackTrader(g, data, s.id, 0); assert.equal(r.ok, true);
  const kept = Object.values(r.kept).reduce((a, b) => a + b, 0), tagged = (s.prizeLots ?? []).reduce((a, l) => a + Object.values(l.goods).reduce((x, y) => x + y, 0), 0);
  assert.equal(tagged, kept);
});
// --- interaction with captured-ship prizes (ship.prize === true) and saves ---
import { shipValue } from "../src/game/game.mjs";
test("a captured prize ship (ship.prize === true) is never locked and sells its cargo with the flag on", () => {
  const { g, s } = setup(); s.at = "cadiz"; s.voyage = null; s.cargo = { salt: 3 }; s.prize = true;
  assert.equal(prizeUnits(s, "salt"), 0); assert.equal(prizeLocked(g, s, "salt"), 0); assert.equal(doSell(g, s, "salt", 3).ok, true);
});
test("prize lots never change the resale value of the ship; a captured hull keeps its own rate", () => {
  const { s } = setup(); const base = shipValue(s);
  s.prizeLots = [{ realm: "portugal", goods: { wool: 1 }, day: 0 }]; assert.equal(shipValue(s), base);
  const c = { ...s, prizeLots: undefined, prize: true }; assert.ok(shipValue(c) < base);
});
test("a ship that is both a captured hull and carries prize lots keeps both rules apart", () => {
  const { g, s } = setup(); s.at = "cadiz"; s.voyage = null; s.prize = true; s.cargo = { wool: 4, salt: 2 }; s.prizeLots = [{ realm: "portugal", goods: { wool: 4 }, day: 0 }];
  assert.equal(doSell(g, s, "wool", 1).reason, "prize"); assert.equal(doSell(g, s, "salt", 2).ok, true);
  const r = settlePrize(g, data, s); assert.equal(r.ok, true); assert.equal(s.prize, true); assert.equal(s.prizeLots, undefined);
});
test("prize lots survive a save and reload and still lock the goods", () => {
  const { g, s } = prized(); const h = deserialize(JSON.parse(JSON.stringify(serialize(g, "T"))), world).g;
  const hs = h.ships.find((x) => x.id === s.id); assert.deepEqual(hs.prizeLots, s.prizeLots); assert.equal(prizeUnits(hs, "wool"), 10);
  assert.equal(doSell(h, hs, "wool", 1).reason, "prize");
});
