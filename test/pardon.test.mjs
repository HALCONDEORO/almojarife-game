import { readFileSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame } from "../src/game/game.mjs";
import { infamyOf, addInfamy, decayInfamy, pardonFee, pardonBlocker, buyPardon, PARDON_PER_POINT, PARDON_MIN_FEE, PARDON_COOLDOWN_DAYS, INFAMY_MAX } from "../src/game/pardon.mjs";
import { serialize, deserialize } from "../src/game/gamesave.mjs";
const world = loadWorld(), realms = JSON.parse(readFileSync(new URL("../data/realms.json", import.meta.url), "utf8"));
const mk = (o = {}) => { const g = newGame(world); g.pardon = o.pardon ?? true; g.cash = 50000; g.ships[0].at = "cadiz"; g.ships[0].voyage = null; g.infamy = o.infamy ?? 40; return g; };
test("infamy is clamped and tolerant of junk", () => {
  const g = mk(); assert.equal(addInfamy(g, 1000), INFAMY_MAX); assert.equal(addInfamy(g, -1000), 0); g.infamy = "x"; assert.equal(infamyOf(g), 0); assert.equal(addInfamy(g, NaN), 0);
});
test("fee: 30 per point, never under the minimum, none without infamy", () => {
  const g = mk({ infamy: 40 }); assert.equal(pardonFee(g), 40 * PARDON_PER_POINT); g.infamy = 1; assert.equal(pardonFee(g), PARDON_MIN_FEE); g.infamy = 0; assert.equal(pardonFee(g), 0);
});
test("flag off: nothing is sold, nothing charged, nothing created", () => {
  const g = mk({ pardon: false }), s = JSON.stringify(g); assert.equal(buyPardon(g, realms, "cadiz").reason, "off"); decayInfamy(g); assert.equal(JSON.stringify(g), s);
});
test("buy: fee leaves the cash (a sink), infamy goes to zero, one note in the inbox", () => {
  const g = mk(); const c = g.cash, f = pardonFee(g), r = buyPardon(g, realms, "cadiz");
  assert.ok(r.ok); assert.equal(r.fee, f); assert.equal(r.realm, "castile"); assert.equal(g.cash, c - f); assert.equal(g.infamy, 0); assert.equal(g.pardonPaid, f); assert.equal(g.inbox.filter((m) => m.kind === "info").length, 1);
});
test("rules: needs a docked ship, a port not hostile, cash, a council, no recent pardon", () => {
  let g = mk(); g.ships[0].at = "malaga"; assert.equal(pardonBlocker(g, realms, "cadiz"), "no ship here");
  g = mk(); g.ships[0].voyage = { from: "cadiz", to: "malaga" }; assert.equal(pardonBlocker(g, realms, "cadiz"), "no ship here");
  g = mk(); g.portRep = { cadiz: -5 }; assert.equal(pardonBlocker(g, realms, "cadiz"), "port hostile");
  g = mk(); g.cash = 10; assert.equal(pardonBlocker(g, realms, "cadiz"), "no cash");
  g = mk(); g.ships[0].at = "tetuan"; assert.equal(pardonBlocker(g, realms, "tetuan"), "no council");
  g = mk({ infamy: 0 }); assert.equal(pardonBlocker(g, realms, "cadiz"), "nothing to pardon");
  g = mk(); assert.ok(buyPardon(g, realms, "cadiz").ok); g.infamy = 30; assert.equal(buyPardon(g, realms, "cadiz").reason, "too soon");
  g.day += PARDON_COOLDOWN_DAYS; assert.ok(buyPardon(g, realms, "cadiz").ok);
});
test("a pardon from one realm does not block another realm", () => {
  const g = mk(); g.ships.push({ ...g.ships[0], id: 99, at: "valencia", voyage: null }); assert.ok(buyPardon(g, realms, "cadiz").ok); g.infamy = 20; assert.ok(buyPardon(g, realms, "valencia").ok);
});
test("infamy fades one point a month and survives a save", () => {
  const g = mk({ infamy: 5 }); for (let d = 1; d <= 90; d++) { g.day = d; decayInfamy(g); } assert.equal(g.infamy, 2);
  const { g: back } = deserialize(serialize(g, "X"), world); assert.equal(back.infamy, 2);
});
