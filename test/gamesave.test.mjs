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
  assert.equal(s.version, SAVE_VERSION); assert.ok(s.state.world === undefined);
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
  const nullRow = fresh(); nullRow.state.market.cadiz = null;
  assert.throws(() => deserialize(nullRow, world), /damaged/); // a clear error, not a raw TypeError from Object.values
  const badShip = fresh(); badShip.state.ships[0].type = "galleon";
  assert.throws(() => deserialize(badShip, world), /damaged/);
  for (const t of ["constructor", "__proto__", "toString"]) { // inherited Object properties are not ship classes
    const inherited = fresh(); inherited.state.ships[0].type = t;
    assert.throws(() => deserialize(inherited, world), /damaged/, t);
  }

  const ledgers = fresh();
  ledgers.state.market.cadiz.grain.needsLedger = { days: 3, policyId: "legacy-telemetry-v1", totals: "x", byClass: { poor: 7 } };
  ledgers.state.market.malaga.grain.needsLedger = { days: 2, policyId: "legacy-telemetry-v1", totals: {}, byClass: { poor: { grain: true } } }; // one level deeper
  ledgers.state.market.almeria.grain.needsLedger = { days: 9, policyId: "older-policy", totals: {}, byClass: {} }; // a stale policy makes recordNeeds throw mid-tick
  ledgers.state.market.huelva.grain.needsLedger = { days: 2, policyId: "legacy-telemetry-v1", byClass: {} }; // totals missing
  ledgers.state.market.sevilla.grain.needsLedger = { days: 2, policyId: "legacy-telemetry-v1", totals: {} }; // byClass missing
  ledgers.state.market.valencia.grain.needsLedger = { days: 2, policyId: "legacy-telemetry-v1", totals: null, byClass: {} }; // null totals
  ledgers.state.market.barcelona.grain.commerce = "x";
  ledgers.state.market.palma.grain.commerce = {}; // inventoryBasis missing: the first trade would crash procurement
  ledgers.state.market.bilbao.grain.commerce = { cash: 5, inventoryBasis: null };
  ledgers.state.market.tanger.grain.commerce = { cash: 5, inventoryBasis: {}, households: {} }; // empty households: settleHouseholdDay only rebuilds from null
  ledgers.state.market.cartagena.grain.commerce = { cash: 5, inventoryBasis: {}, households: { poor: null } };
  const { g: gl } = deserialize(ledgers, world);
  for (const c of ["cadiz", "malaga", "almeria", "huelva", "sevilla", "valencia"]) assert.equal(gl.market[c].grain.needsLedger, undefined, c);
  for (const city of ["barcelona", "palma", "bilbao", "tanger", "cartagena"]) assert.ok(Number.isFinite(gl.market[city].grain.commerce?.cash), `load reopens a dropped commerce account in ${city}`);
  play(gl, 2); // the tick lazily reopens the dropped needs ledgers instead of throwing
  assert.equal(typeof gl.market.cadiz.grain.needsLedger, "object");

  const history = fresh();
  history.state.hist.cadiz = "x";
  history.state.hist.sevilla = { grain: 7 };
  const { g: gh } = deserialize(history, world);
  assert.ok(gh.hist.cadiz === undefined);
  assert.ok(gh.hist.sevilla.grain === undefined);
  play(gh, 2);
  assert.ok(Array.isArray(gh.hist.cadiz.grain) && Array.isArray(gh.hist.sevilla.grain));

  for (const bad of [null, "x", 7, [], true]) { // player cargo must be a plain object of finite amounts
    const corrupt = fresh(); corrupt.state.ships[0].cargo = bad;
    assert.throws(() => deserialize(corrupt, world), /damaged/, String(bad));
  }
  const noCargo = fresh(); delete noCargo.state.ships[0].cargo;
  assert.throws(() => deserialize(noCargo, world), /damaged/);
  const badAmount = fresh(); badAmount.state.ships[0].cargo = { grain: "plenty" };
  assert.throws(() => deserialize(badAmount, world), /damaged/);

  const bots = fresh();
  bots.state.ai[1] = "x";
  bots.state.ai[2] = { cash: 9, ship: { type: "ufo" } };
  bots.state.ai[0].ship.type = "constructor"; // inherited property, not a ship class
  const { g: ga } = deserialize(bots, world);
  assert.equal(ga.ai.length, 0, "all three malformed bots are dropped");
  play(ga, 2);
  const botFields = fresh();
  botFields.state.ai[0].ship.cargo = null;
  botFields.state.ai[1].ship.voyage = "x"; // sailTick writes voyage.ticksLeft
  botFields.state.ai[2].intel = "x"; // aiStep writes intel[city]
  const { g: gb } = deserialize(botFields, world);
  assert.equal(gb.ai.length, 0, "bots with corrupt cargo, voyage or intel are dropped");
  play(gb, 2);
  const botFields2 = fresh();
  botFields2.state.ai[0].discovered = 7;
  botFields2.state.ai[1].cash = "x";
  delete botFields2.state.ai[2].ship.cargo;
  const { g: gb2 } = deserialize(botFields2, world);
  assert.equal(gb2.ai.length, 0, "bots with corrupt discovered, cash or cargo are dropped");
  play(gb2, 2);
  const noBots = fresh(); noBots.state.ai = 7;
  assert.deepEqual(deserialize(noBots, world).g.ai, []);
});

test("bots with half-built voyages are dropped instead of stalling at sea", () => {
  const fresh = () => JSON.parse(JSON.stringify(serialize(newGame(world), "Casa Oro")));
  const stalled = fresh();
  stalled.state.ai[0].ship.voyage = {}; // ticksLeft undefined: sailTick never reaches 0 and trades refuse "at sea" forever
  const { g: gs } = deserialize(stalled, world);
  assert.equal(gs.ai.length, 2);
  play(gs, 3);
  const shapes = fresh();
  const realVoyage = { from: "cadiz", to: "lisboa", path: ["cadiz", "lisboa"], totalTicks: 40, ticksLeft: 40, km: 300 };
  shapes.state.ai[0].ship.voyage = { ...realVoyage, path: "x" };
  shapes.state.ai[1].ship.voyage = { ...realVoyage, ticksLeft: "x" };
  shapes.state.ai[2].ship.voyage = { ...realVoyage }; // a complete voyage keeps counting down
  const { g: g2 } = deserialize(shapes, world);
  assert.equal(g2.ai.length, 1, "only the bot with the complete voyage survives");
  play(g2, 3);
  assert.ok(!g2.ai[0].ship.voyage || Number.isFinite(g2.ai[0].ship.voyage.ticksLeft), "the surviving bot still advances");
});

test("a bot saved with a complete voyage arrives at its destination", () => {
  const data = JSON.parse(JSON.stringify(serialize(newGame(world), "Casa Oro")));
  data.state.ai[0].ship.voyage = { from: "cadiz", to: "lisboa", path: ["cadiz", "lisboa"], totalTicks: 4, ticksLeft: 4, km: 300 };
  const { g } = deserialize(data, world);
  assert.equal(g.ai.length, 3);
  play(g, 1); // 1 day >> 4 ticks: the bot must reach lisboa (docked or already re-sailed from it)
  const sh = g.ai[0].ship;
  assert.ok(sh.at === "lisboa" || sh.voyage?.from === "lisboa", "the saved voyage completed via lisboa");
  play(g, 5);
});

test("negative cargo amounts are clamped away on load", () => {
  const data = JSON.parse(JSON.stringify(serialize(newGame(world), "Casa Oro")));
  data.state.ships[0].cargo = { grain: -5, wine: 3 };
  data.state.ai[0].ship.cargo = { grain: -2 };
  const { g } = deserialize(data, world);
  assert.equal(g.ships[0].cargo.grain, 0, "player cargo clamps to zero");
  assert.equal(g.ships[0].cargo.wine, 3, "positive amounts are untouched");
  assert.equal(g.ai.length, 3, "a bot with negative cargo is repaired, not dropped");
  assert.equal(g.ai[0].ship.cargo.grain, 0);
  play(g, 3);
});

test("a needs ledger with poisoned numerics is dropped, a sound one survives", () => {
  const withLedger = () => {
    const data = JSON.parse(JSON.stringify(serialize(newGame(world), "Casa Oro")));
    const { g } = deserialize(data, world);
    play(g, 2);
    return JSON.parse(JSON.stringify(serialize(g, "Casa Oro")));
  };
  const good = withLedger();
  const city = Object.keys(good.state.market)[0];
  const ledger = good.state.market[city].grain.needsLedger;
  assert.ok(ledger, "fixture carries a ledger after two days");
  const okG = deserialize(good, world).g;
  assert.ok(okG.market[city].grain.needsLedger, "a complete ledger survives the load");
  play(okG, 2);
  const badDays = withLedger();
  badDays.state.market[city].grain.needsLedger.days = "x";
  assert.equal(deserialize(badDays, world).g.market[city].grain.needsLedger, undefined, "non-numeric days drops the ledger");
  const badLeaf = withLedger();
  badLeaf.state.market[city].grain.needsLedger.totals.grain = { need: "x", desired: 0, consumed: 0, spending: 0, balance: 0 };
  assert.equal(deserialize(badLeaf, world).g.market[city].grain.needsLedger, undefined, "a non-numeric leaf drops the ledger");
  const badByClass = withLedger();
  badByClass.state.market[city].grain.needsLedger.byClass[Object.keys(badByClass.state.market[city].grain.needsLedger.byClass)[0]].grain = { need: 1, desired: "x" };
  assert.equal(deserialize(badByClass, world).g.market[city].grain.needsLedger, undefined, "a non-numeric byClass leaf drops the ledger");
  for (const key of ["need", "desired", "consumed", "spending", "balance"]) {
    const missing = withLedger();
    delete missing.state.market[city].grain.needsLedger.totals.grain[key];
    assert.equal(deserialize(missing, world).g.market[city].grain.needsLedger, undefined, `a totals leaf missing ${key} drops the ledger`);
    const missingBc = withLedger();
    const cls = Object.keys(missingBc.state.market[city].grain.needsLedger.byClass)[0];
    delete missingBc.state.market[city].grain.needsLedger.byClass[cls].grain[key];
    assert.equal(deserialize(missingBc, world).g.market[city].grain.needsLedger, undefined, `a byClass leaf missing ${key} drops the ledger`);
  }
  const empty = withLedger();
  empty.state.market[city].grain.needsLedger.totals.grain = {};
  assert.equal(deserialize(empty, world).g.market[city].grain.needsLedger, undefined, "an empty leaf drops the ledger");
});

test("ships moored at unknown ports are moved home; bots at unknown ports are dropped", () => {
  const data = JSON.parse(JSON.stringify(serialize(newGame(world), "Casa Oro")));
  const home = data.state.profile.home;
  data.state.ships[0].at = "narnia";
  data.state.ai[0].ship.at = "narnia";
  data.state.ai[1].home = "narnia";
  const { g } = deserialize(data, world);
  assert.equal(g.ships[0].at, home, "a docked player ship with an unknown port returns home");
  assert.equal(g.ai.length, 1, "bots with an unknown mooring or home are dropped");
  play(g, 3);
  const sailing = JSON.parse(JSON.stringify(serialize(newGame(world), "Casa Oro")));
  sailing.state.ships[0].at = "narnia";
  sailing.state.ships[0].voyage = { from: "cadiz", to: "lisboa", path: ["cadiz", "lisboa"], totalTicks: 40, ticksLeft: 40, km: 300 };
  const { g: g2 } = deserialize(sailing, world);
  assert.equal(g2.ships[0].at, "cadiz", "a sailing ship resumes from its voyage origin");
  play(g2, 2);
  const badBoth = JSON.parse(JSON.stringify(serialize(newGame(world), "Casa Oro")));
  badBoth.state.profile.home = "narnia";
  badBoth.state.ships[0].at = "narnia";
  const { g: g3 } = deserialize(badBoth, world);
  assert.ok(g3.world.cities.some((c) => c.id === g3.ships[0].at), "with both home and mooring unknown the ship still lands at a real port");
  assert.ok(g3.world.cities.some((c) => c.id === g3.profile.home), "the cleaned profile home is a real port");
  assert.equal(g3.ships[0].at, g3.profile.home, "ship and profile agree on the repaired home");
  play(g3, 3);
});

test("ship hull and ids are repaired on load", () => {
  const data = JSON.parse(JSON.stringify(serialize(newGame(world), "Casa Oro")));
  data.state.ships[0].hull = "x";
  data.state.ai[0].ship.hull = 150;
  const { g } = deserialize(data, world);
  assert.equal(g.ships[0].hull, 100, "non-numeric hull becomes a sound hull");
  assert.equal(g.ai[0].ship.hull, 100, "hull clamps to the 0-100 range");
  const dup = JSON.parse(JSON.stringify(serialize(newGame(world), "Casa Oro")));
  dup.state.ships.push({ ...JSON.parse(JSON.stringify(dup.state.ships[0])) }); // same id as ships[0]
  dup.state.nextId = 1; // behind the fleet: the next built ship would reuse a live id
  const { g: g2 } = deserialize(dup, world);
  const ids = g2.ships.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length, "ship ids are unique after the load");
  assert.ok(g2.nextId > Math.max(...ids), "nextId stays ahead of the fleet");
  play(g2, 3);
  // past the documented 1e9 ceiling the whole fleet renumbers dense and every stored reference remaps
  for (const edgeId of [Number.MAX_SAFE_INTEGER - 1001, Number.MAX_SAFE_INTEGER - 1, Number.MAX_SAFE_INTEGER]) {
    const edge = JSON.parse(JSON.stringify(serialize(newGame(world), "Casa Oro")));
    for (let i = 0; i < 2; i++) edge.state.ships.push(JSON.parse(JSON.stringify(edge.state.ships[0])));
    for (const s of edge.state.ships) s.id = edgeId;
    const { g: g4 } = deserialize(edge, world);
    assert.deepEqual(g4.ships.map((s) => s.id), [1, 2, 3], `id ${edgeId} renumbers the fleet dense`);
    assert.equal(g4.nextId, 4, "nextId follows the dense fleet");
    for (let i = 0; i < 1100; i++) g4.ships.push({ ...g4.ships[0], id: g4.nextId++ }); // far past any margin: constructions keep working
    const ids4 = g4.ships.map((s) => s.id);
    assert.equal(new Set(ids4).size, ids4.length, `constructions after id ${edgeId} stay unique`);
    assert.ok(ids4.every((id) => Number.isSafeInteger(id)), "constructions stay safe integers");
    play(g4, 3);
  }
  const giantCounter = JSON.parse(JSON.stringify(serialize(newGame(world), "Casa Oro")));
  giantCounter.state.ships[0].id = 1;
  giantCounter.state.nextId = Number.MAX_SAFE_INTEGER; // a counter past the ceiling is corrupt even over a healthy fleet
  const { g: g5 } = deserialize(giantCounter, world);
  assert.equal(g5.nextId, 2, "a corrupt nextId resets behind the dense fleet");
  for (let i = 0; i < 1100; i++) g5.ships.push({ ...g5.ships[0], id: g5.nextId++ });
  const ids5 = g5.ships.map((s) => s.id);
  assert.equal(new Set(ids5).size, ids5.length, "constructions after a giant nextId stay unique");
});

test("fleet renumbering maps duplicated ids to the first ship, like find-first did", () => {
  const data = JSON.parse(JSON.stringify(serialize(newGame(world), "Casa Oro")));
  data.state.ships.push(JSON.parse(JSON.stringify(data.state.ships[0])));
  data.state.ships[0].id = 42;
  data.state.ships[0].hull = 50; // the damaged one every find-first consumer would have picked
  data.state.ships[1].id = 42;
  data.state.ships[1].hull = 100;
  data.state.nextId = 1e9 + 1; // past the ceiling: compact
  data.state.repairs = [{ id: 1, at: "cadiz", ships: [42], cost: 100, days: 2, total: 50, left: 50, day: 0 }];
  data.state.pending = { event: "sea-pirates", ship: 42, day: 0, hour: 0, id: "sea-v2:0:42", escapeChance: 0.5 };
  const { g } = deserialize(data, world);
  assert.deepEqual(g.repairs[0].ships, [1], "a duplicated id maps to the first ship, not the last");
  assert.equal(g.pending.ship, 1, "the pending encounter maps to the first ship");
  g.pending = null;
  play(g, 1);
  assert.ok(g.ships[0].hull > 50, "the repair keeps working on the hull that owned it");
});

test("fleet renumbering remaps convoys, encounters and log references", () => {
  const data = JSON.parse(JSON.stringify(serialize(newGame(world), "Casa Oro")));
  data.state.ships.push(JSON.parse(JSON.stringify(data.state.ships[0])));
  const oldId = Number.MAX_SAFE_INTEGER;
  data.state.ships[0].id = oldId;
  data.state.ships[1].id = oldId + 1;
  data.state.convoys = { cv1: { id: "cv1", name: "Convoy 1", ships: [oldId, oldId + 1], since: 0 } };
  data.state.ships[0].convoy = "cv1";
  data.state.ships[1].convoy = "cv1";
  data.state.pending = { event: "sea-pirates", ship: oldId, day: 0, hour: 0, id: `sea-v2:0:${oldId}`, escapeChance: 0.5 };
  data.state.log = [{ day: 0, key: "event", txt: { es: "x", en: "x" }, ship: oldId }];
  data.state.ships[0].hull = 50;
  data.state.repairs = [{ id: 1, at: "cadiz", ships: [oldId], cost: 100, days: 2, total: 50, left: 50, day: 0 }];
  data.state.voyages = [{ ship: oldId, profit: 10 }];
  data.state.accrued = { ships: { [oldId]: 12 }, captains: { [oldId]: 3 }, buildings: { "cadiz:7": 5 } };
  data.state.inbox = [{ id: 1, day: 0, kind: "order", read: false, ship: oldId }, { id: 2, day: 0, kind: "order", read: false, ships: [oldId, oldId + 1] }];
  data.state.encounterReport = { id: "r", day: 0, ship: oldId + 1, prize: { shipId: oldId } };
  const { g } = deserialize(data, world);
  assert.deepEqual(g.convoys.cv1.ships, [1, 2], "convoy membership follows the new ids");
  assert.equal(g.pending.ship, 1, "the pending encounter follows its ship");
  assert.equal(g.log[0].ship, 1, "log references follow the new ids");
  assert.deepEqual(g.repairs[0].ships, [1], "the paid repair order follows its ship");
  assert.equal(g.voyages[0].ship, 1, "the voyage diary keeps its ship");
  assert.deepEqual(g.accrued.ships, { 1: 12 }, "accrued upkeep follows the new id");
  assert.deepEqual(g.accrued.captains, { 1: 3 }, "accrued captain wages follow the new id");
  assert.deepEqual(g.accrued.buildings, { "cadiz:7": 5 }, "plot keys are not ship ids and stay");
  assert.equal(g.inbox[0].ship, 1, "inbox payloads follow the new ids");
  assert.deepEqual(g.inbox[1].ships, [1, 2], "inbox ship lists follow the new ids");
  assert.equal(g.encounterReport.ship, 2, "the encounter report follows its ship");
  assert.equal(g.encounterReport.prize.shipId, 1, "the prize history entry follows its fleet ship");
  g.pending = null; // an open encounter pauses the days; clear it so the yard can work
  g.encounterReport = null;
  play(g, 1);
  assert.ok(g.ships[0].hull > 50, "the remapped repair order keeps working on the hull");
  play(g, 2);
});

test("non-finite cargo is still rejected, only finite negatives clamp", () => {
  const data = JSON.parse(JSON.stringify(serialize(newGame(world), "Casa Oro")));
  data.state.ships[0].cargo = { grain: -Infinity };
  assert.throws(() => deserialize(data, world), /damaged/, "-Infinity rejects like NaN");
  const bot = JSON.parse(JSON.stringify(serialize(newGame(world), "Casa Oro")));
  bot.state.ai[0].ship.cargo = { grain: -Infinity };
  const { g } = deserialize(bot, world);
  assert.equal(g.ai.length, 2, "a bot with -Infinity cargo is dropped, not clamped");
  play(g, 2);
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
