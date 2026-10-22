import { readFileSync } from "node:fs";
import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, doSail, advanceDay } from "../src/game/game.mjs";
import { buyLetter } from "../src/game/marque.mjs";
import { targetsFor, attackTrader } from "../src/game/privateering.mjs";
import { setJusticeData, arrivalJustice, chargePiracy, heldNow, PIRACY_REP_HIT } from "../src/game/justicewire.mjs";
import { infamyOf } from "../src/game/pardon.mjs";
import { portRep } from "../src/game/reputation.mjs";
import { openCharges } from "../src/game/justice.mjs";
import { serialize, deserialize } from "../src/game/gamesave.mjs";
const world = loadWorld(), realms = JSON.parse(readFileSync(new URL("../data/realms.json", import.meta.url), "utf8")), courts = JSON.parse(readFileSync(new URL("../data/courts.json", import.meta.url), "utf8"));
afterEach(() => setJusticeData(null));
function setup(justice) {
  const g = newGame(world); g.marque = true; g.justice = justice; g.cash = 50000; g.tick = 5; g.seed = 1;
  const s = g.ships[0], t = g.ai[0]; t.home = "lisboa"; t.ship.at = "cadiz"; t.ship.voyage = null; t.ship.cargo = { wool: 10, salt: 10, fish: 10 };
  s.at = "cadiz"; s.voyage = null; s.cargo = {}; s.crew = 20; assert.ok(doSail(g, s, "malaga").ok);
  t.ship.voyage = { ...s.voyage }; t.ship.at = s.voyage.from; return { g, s, t };
}
test("flag off: an unlicensed attack is not offered and nothing is charged", () => {
  setJusticeData(realms, courts); const { g, s } = setup(false);
  assert.deepEqual(targetsFor(g, realms, s, {}, { unlicensed: true }), []); assert.equal(attackTrader(g, realms, s.id, 0, {}, { unlicensed: true }).reason, "no target");
  assert.equal(g.charges, undefined); assert.equal(g.infamy, undefined);
});
test("flag on: no unlicensed target unless the caller asks for it; a letter keeps the plain target", () => {
  setJusticeData(realms, courts); const { g, s } = setup(true);
  assert.deepEqual(targetsFor(g, realms, s), []); assert.deepEqual(targetsFor(g, realms, s, {}, { unlicensed: true }), [{ index: 0, realm: "portugal", unlicensed: true }]);
  buyLetter(g, realms, "cadiz", "portugal"); assert.deepEqual(targetsFor(g, realms, s, {}, { unlicensed: true }), [{ index: 0, realm: "portugal" }]);
});
test("an unlicensed attack is charged in the victim's home port: infamy, port name, no quinto; a licensed one is not", () => {
  setJusticeData(realms, courts); const { g, s } = setup(true), rep0 = portRep(g, "lisboa");
  const r = attackTrader(g, realms, s.id, 0, {}, { unlicensed: true });
  assert.equal(r.ok, true); assert.deepEqual(r.quinto, {});
  if (Object.keys(r.report.loot).length) { assert.equal(openCharges(g).length, 1); assert.equal(openCharges(g)[0].kind, "piracy"); assert.equal(openCharges(g)[0].realm, "portugal"); assert.ok(infamyOf(g) > 0); assert.equal(portRep(g, "lisboa"), rep0 - PIRACY_REP_HIT); }
  const h = setup(true); buyLetter(h.g, realms, "cadiz", "portugal"); attackTrader(h.g, realms, h.s.id, 0, {}, { unlicensed: true }); assert.equal(h.g.charges, undefined);
});
test("chargePiracy needs data and the flag; with either missing nothing changes", () => {
  const { g } = setup(true); assert.equal(chargePiracy(g, "lisboa", { wool: 5 }), null); setJusticeData(realms, courts); g.justice = false; assert.equal(chargePiracy(g, "lisboa", { wool: 5 }), null); assert.equal(g.charges, undefined);
  g.justice = true; const c = chargePiracy(g, "lisboa", { wool: 5 }); assert.ok(c && c.value > 0);
});
test("officers try the charge when a ship docks in that realm; a prison sentence holds the ship until its day", () => {
  setJusticeData(realms, courts); const { g, s } = setup(true); g.infamy = 60; chargePiracy(g, "lisboa", { wool: 50 }); g.infamy = 60;
  s.voyage = null; s.at = "lisboa"; let out = []; for (let d = 1; d < 80 && !out.length; d++) { g.day = d; out = arrivalJustice(g, s); }
  assert.equal(out.length, 1); assert.ok(heldNow(g, s)); assert.equal(doSail(g, s, "cadiz").reason, "held"); g.day = s.heldUntil; assert.equal(heldNow(g, s), false);
});
test("flag off or no data: arrival does nothing", () => {
  const { g, s } = setup(true); s.voyage = null; s.at = "lisboa"; assert.deepEqual(arrivalJustice(g, s), []); setJusticeData(realms, courts); g.justice = false; assert.deepEqual(arrivalJustice(g, s), []);
  assert.equal(heldNow(g, { heldUntil: 99 }), false);
});
test("a bad name fades a point a month with justice on (and does not with every flag off)", () => {
  const a = newGame(world); a.justice = true; a.infamy = 10; const b = newGame(world); b.infamy = 10;
  for (let i = 0; i < 60; i++) { advanceDay(a); advanceDay(b); } assert.ok(infamyOf(a) < 10); assert.equal(infamyOf(b), 10);
});
test("charges, convictions and the held day survive a save and reload", () => {
  setJusticeData(realms, courts); const { g, s } = setup(true); chargePiracy(g, "lisboa", { wool: 20 }); s.heldUntil = 40; g.convictions = { portugal: 2 };
  const h = deserialize(JSON.parse(JSON.stringify(serialize(g, "T"))), world).g;
  assert.deepEqual(h.charges, g.charges); assert.equal(h.infamy, g.infamy); assert.deepEqual(h.convictions, { portugal: 2 }); assert.equal(h.ships[0].heldUntil, 40);
});
test("a convoy with one held member does not leave at all: no member is left sailing alone", async () => {
  const { formConvoy, sailConvoy } = await import("../src/game/convoys.mjs"); const { doSail: ds } = await import("../src/game/game.mjs");
  const g = newGame(world); g.justice = true; g.cash = 1e6; g.seed = 1; const a = g.ships[0]; a.at = "cadiz"; a.voyage = null; a.crew = 20;
  const { makeShip } = await import("../src/sim/trade.mjs"); const b = makeShip(g.nextId++, "cog", "cadiz"); b.crew = 20; g.ships.push(b);
  const cv = formConvoy(g, [a.id, b.id], "C"); assert.ok(cv.ok, JSON.stringify(cv)); b.heldUntil = g.day + 5;
  const r = sailConvoy(g, cv.convoy.id, "malaga", { doSail: ds }); assert.equal(r.reason, "held"); assert.equal(!!a.voyage, false); assert.equal(!!b.voyage, false);
  g.day = b.heldUntil; const ok = sailConvoy(g, cv.convoy.id, "malaga", { doSail: ds }); assert.equal(ok.ok, true);
  const off = newGame(world); off.ships[0].heldUntil = 99; assert.equal(heldNow(off, off.ships[0]), false);
});
import { messageText } from "../src/view/ledgerview.mjs";
test("a sentence reads as its own text in the inbox, in both languages", () => {
  setJusticeData(realms, courts); const { g, s } = setup(true); g.infamy = 60; chargePiracy(g, "lisboa", { wool: 50 }); g.infamy = 60; s.voyage = null; s.at = "lisboa";
  let out = []; for (let d = 1; d < 80 && !out.length; d++) { g.day = d; out = arrivalJustice(g, s); }
  const m = g.inbox.find((x) => /juzga|piratería/.test(JSON.stringify(x))), f = (n) => String(n);
  assert.ok(m); assert.match(messageText(m, "es", f), /te juzga|te juzgan/); assert.doesNotMatch(messageText(m, "es", f), /mantenimiento|upkeep/i); assert.match(messageText(m, "en", f), /piracy|tr(y|ies)|judge/i);
});
