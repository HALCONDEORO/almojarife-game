import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildWorld } from "../src/sim/world.mjs";
import { newGame, advanceDay, doBuy } from "../src/game/game.mjs";
import { serialize, deserialize, migrate, cleanCompany, SAVE_VERSION } from "../src/game/gamesave.mjs";
import { crestSvg, defaultProfile } from "../src/game/profile.mjs";

const world = buildWorld(JSON.parse(fs.readFileSync(new URL("../data/world.json", import.meta.url))));
const play = (g, n) => { for (let i = 0; i < n; i++) advanceDay(g); };

test("save and load gives the same game, and it keeps evolving the same way", () => {
  const a = newGame(world); doBuy(a, a.ships[0], "grain", 10); play(a, 12);
  const raw = JSON.stringify(serialize(a, "Casa Prueba"));
  const { g: b, company } = deserialize(JSON.parse(raw), world);
  assert.equal(company, "Casa Prueba");
  assert.deepEqual(b, a);
  play(a, 9); play(b, 9);
  assert.deepEqual(b, a);
});
test("the save has a version and does not include the world", () => {
  const s = serialize(newGame(world), "X");
  assert.equal(s.version, SAVE_VERSION); assert.equal(s.state.world, undefined);
});
test("bad or newer saves are refused", () => {
  assert.throws(() => migrate(null)); assert.throws(() => migrate({ version: SAVE_VERSION + 1 }));
  assert.throws(() => deserialize({ version: SAVE_VERSION, state: { cash: 1 } }, world));
});
test("pre-launch saves without profile, voyage fields or market pop are refused with a clear error", () => {
  const g = newGame(world); const s = serialize(g, "X");
  const noProfile = JSON.parse(JSON.stringify(s)); delete noProfile.state.profile;
  assert.throws(() => deserialize(noProfile, world), /not kept/);
  const oldVoyage = JSON.parse(JSON.stringify(s)); oldVoyage.state.ships[0].voyage = { to: "valencia", daysLeft: 3 };
  assert.throws(() => deserialize(oldVoyage, world), /not kept/);
  const noPop = JSON.parse(JSON.stringify(s)); delete noPop.state.market.cadiz.grain.pop;
  assert.throws(() => deserialize(noPop, world), /not kept/);
  assert.ok(deserialize(JSON.parse(JSON.stringify(s)), world).g.profile.home); // current saves still load
});

test("corrupt deep save structures are rejected or repaired at load instead of crashing a tick", () => {
  const fresh = () => JSON.parse(JSON.stringify(serialize(newGame(world), "Casa Oro")));
  const badStock = fresh(); badStock.state.market.cadiz.grain.stock = "plenty";
  assert.throws(() => deserialize(badStock, world), /damaged/);
  const badRow = fresh(); badRow.state.market.cadiz = "row";
  assert.throws(() => deserialize(badRow, world), /not kept|damaged/); // the existing pop check rejects it first
  const badShip = fresh(); badShip.state.ships[0].type = "galleon";
  assert.throws(() => deserialize(badShip, world), /damaged/);

  const ledgers = fresh();
  ledgers.state.market.cadiz.grain.needsLedger = { days: 3, policyId: "legacy-telemetry-v1", totals: "x", byClass: { poor: 7 } };
  ledgers.state.market.malaga.grain.needsLedger = { days: 2, policyId: "legacy-telemetry-v1", totals: {}, byClass: { poor: { grain: true } } }; // one level deeper
  ledgers.state.market.almeria.grain.needsLedger = { days: 9, policyId: "older-policy", totals: {}, byClass: {} }; // a stale policy makes recordNeeds throw mid-tick
  ledgers.state.market.sevilla.grain.commerce = "x";
  ledgers.state.market.valencia.grain.commerce = { cash: 5, households: { poor: null }, inventoryBasis: 9 };
  const { g: gl } = deserialize(ledgers, world);
  assert.equal(gl.market.cadiz.grain.needsLedger, undefined);
  assert.equal(gl.market.malaga.grain.needsLedger, undefined);
  assert.equal(gl.market.almeria.grain.needsLedger, undefined);
  assert.ok(Number.isFinite(gl.market.sevilla.grain.commerce?.cash), "load reopens a dropped commerce account");
  assert.ok(Number.isFinite(gl.market.valencia.grain.commerce?.cash), "load reopens a dropped commerce account");
  play(gl, 2); // the tick lazily reopens the dropped needs ledger instead of throwing
  assert.equal(typeof gl.market.cadiz.grain.needsLedger, "object");

  const history = fresh();
  history.state.hist.cadiz = "x";
  history.state.hist.sevilla = { grain: 7 };
  const { g: gh } = deserialize(history, world);
  assert.equal(gh.hist.cadiz, undefined);
  assert.equal(gh.hist.sevilla.grain, undefined);
  play(gh, 2);
  assert.ok(Array.isArray(gh.hist.cadiz.grain) && Array.isArray(gh.hist.sevilla.grain));

  const bots = fresh();
  bots.state.ai[1] = "x";
  bots.state.ai[2] = { cash: 9, ship: { type: "ufo" } };
  const { g: ga } = deserialize(bots, world);
  assert.equal(ga.ai.length, 1);
  play(ga, 2);
  const noBots = fresh(); noBots.state.ai = 7;
  assert.deepEqual(deserialize(noBots, world).g.ai, []);
});

test("imported profile data is cleaned before it reaches the UI", () => {
  const save = JSON.parse(JSON.stringify(serialize(newGame(world), 'Casa <script>alert(1)</script>')));
  save.state.profile = {
    company: 'Casa <img src=x onerror=alert(1)>', character: '<b>Ana</b>', portrait: 99,
    crest: { shield: '"><script>alert(1)</script>', division: 'x', charge: 'y', c1: 'red" onload="alert(1)', c2: 'not-a-colour' },
    home: 'nowhere', background: 'king', difficulty: 'impossible',
  };
  const { g } = deserialize(save, world);
  assert.equal(g.profile.company, 'Casa img src=x onerror=alert(1'); // text can stay; markup characters cannot
  assert.equal(g.profile.character, 'bAna/b');
  assert.deepEqual(g.profile.crest, defaultProfile().crest);
  assert.equal(g.profile.home, 'cadiz');
  assert.equal(g.profile.background, 'merchant');
  assert.equal(g.profile.difficulty, 'normal');
  assert.ok(!/<script|onload|onerror/i.test(crestSvg(g.profile.crest, 22, 'imported')));
});

test("company name is cleaned and limited", () => {
  assert.equal(cleanCompany("  <b>Casa</b> \n"), "bCasa/b");
  assert.equal(cleanCompany("x".repeat(80)).length, 30);
  assert.equal(cleanCompany(undefined), "");
});
