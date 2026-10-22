import { readFileSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame } from "../src/game/game.mjs";
import { cajaOf } from "../src/game/council.mjs";
import { infamyOf } from "../src/game/pardon.mjs";
import { courtOf, validateCourts, priorConvictions, RECIDIVISM_PRISON_AT, CHARGES, raiseCharge, officersAct, openCharges, sentenceTier, prisonDays, isHeld, catchChance, MAX_OPEN, MIN_FINE } from "../src/game/justice.mjs";
const world = loadWorld(), realms = JSON.parse(readFileSync(new URL("../data/realms.json", import.meta.url), "utf8"));
const mk = (o = {}) => { const g = newGame(world); g.justice = o.justice ?? true; g.cash = o.cash ?? 5000; g.seed = 1; const s = g.ships[0]; s.at = "cadiz"; s.voyage = null; s.cargo = { wool: 20, salt: 10 }; return g; };
const towns = (g) => (g.hallCaja?.cadiz ?? cajaOf(g, "cadiz"));
test("flag off: nothing is created, charged or seized", () => {
  const g = mk({ justice: false }), snap = JSON.stringify(g);
  assert.equal(raiseCharge(g, realms, "cadiz", "fraud", 500), null); assert.deepEqual(officersAct(g, realms, "cadiz", g.ships[0]), []); assert.equal(JSON.stringify(g), snap);
});
test("a charge raises infamy by its kind, names the realm of the port, and needs a council", () => {
  const g = mk(), c = raiseCharge(g, realms, "cadiz", "smuggling", 800);
  assert.equal(c.realm, "castile"); assert.equal(c.status, "open"); assert.equal(infamyOf(g), CHARGES.smuggling.infamy);
  assert.equal(raiseCharge(g, realms, "tetuan", "fraud", 100), null, "no council, no officers"); assert.equal(raiseCharge(g, realms, "cadiz", "treason", 100), null);
});
test("tiers by infamy: fine only, then seizure, then prison", () => {
  const g = mk(); g.infamy = 5; assert.equal(sentenceTier(g), 0); g.infamy = 20; assert.equal(sentenceTier(g), 1); g.infamy = 50; assert.equal(sentenceTier(g), 2);
  assert.equal(prisonDays(g), 5); g.infamy = 80; assert.equal(prisonDays(g), 10); g.infamy = 30; assert.equal(prisonDays(g), 0);
});
test("fine goes to the town chest: cash plus chest conserved, fine capped by cash", () => {
  const g = mk(); g.infamy = 0; const c = raiseCharge(g, realms, "cadiz", "fraud", 1000); g.infamy = 0;
  const before = g.cash + towns(g); let s = null; for (let d = 1; d < 60 && !s; d++) { g.day = d; s = officersAct(g, realms, "cadiz", g.ships[0])[0]; }
  assert.ok(s, "officers eventually try the charge"); assert.equal(s.fine, 1000); assert.equal(g.cash + towns(g), before); assert.equal(c.status, "tried"); assert.deepEqual(s.seized, {}); assert.equal(g.ships[0].heldUntil, undefined);
  const p = mk({ cash: 10 }); raiseCharge(p, realms, "cadiz", "fraud", 1000); p.infamy = 0; let s2 = null; for (let d = 1; d < 60 && !s2; d++) { p.day = d; s2 = officersAct(p, realms, "cadiz", p.ships[0])[0]; } assert.equal(s2.fine, 10); assert.equal(p.cash, 0);
});
test("seizure removes part of the cargo and counts it; prison holds the ship; tiers decide", () => {
  const g = mk(); raiseCharge(g, realms, "cadiz", "smuggling", 600); g.infamy = 55; const units = () => Object.values(g.ships[0].cargo).reduce((a, b) => a + b, 0), u0 = units();
  let s = null; for (let d = 1; d < 60 && !s; d++) { g.day = d; s = officersAct(g, realms, "cadiz", g.ships[0])[0]; }
  assert.ok(s); assert.equal(units() + g.seizedUnits, u0); assert.equal(g.seizedUnits, 10 + 5); assert.equal(s.prisonDays, 5);
  assert.ok(isHeld(g.ships[0], g.day)); assert.ok(isHeld(g.ships[0], g.day + 4)); assert.ok(!isHeld(g.ships[0], g.day + 5));
  const f = mk(); raiseCharge(f, realms, "cadiz", "fraud", 100); f.infamy = 90; let s3 = null; for (let d = 1; d < 60 && !s3; d++) { f.day = d; s3 = officersAct(f, realms, "cadiz", f.ships[0])[0]; } assert.deepEqual(s3.seized, {}, "fraud seizes nothing"); assert.equal(s3.prisonDays, 10);
});
test("officers act only on their realm's charges, only in port, once per charge, and are reproducible", () => {
  const g = mk(); raiseCharge(g, realms, "cadiz", "fraud", 100); g.infamy = 0;
  for (let d = 1; d < 80; d++) { g.day = d; assert.deepEqual(officersAct(g, realms, "valencia", g.ships[0]), [], "another realm"); }
  g.ships[0].voyage = { from: "cadiz", to: "malaga" }; for (let d = 1; d < 80; d++) { g.day = d; assert.deepEqual(officersAct(g, realms, "cadiz", g.ships[0]), [], "at sea"); }
  g.ships[0].voyage = null; let n = 0; for (let d = 1; d < 200; d++) { g.day = d; n += officersAct(g, realms, "cadiz", g.ships[0]).length; } assert.equal(n, 1);
  const a = mk(), b = mk(); raiseCharge(a, realms, "cadiz", "fraud", 100); raiseCharge(b, realms, "cadiz", "fraud", 100); a.infamy = b.infamy = 0;
  const run = (g) => { for (let d = 1; d < 200; d++) { g.day = d; if (officersAct(g, realms, "cadiz", g.ships[0]).length) return d; } return -1; }; assert.equal(run(a), run(b));
});
test("catch chance grows with a full town chest and with infamy, capped; the open list is bounded", () => {
  const g = mk(); g.hallCaja = { cadiz: 0 }; const low = catchChance(g, "cadiz"); g.hallCaja = { cadiz: 1e6 }; assert.ok(catchChance(g, "cadiz") > low);
  g.infamy = 100; assert.ok(catchChance(g, "cadiz") <= 0.9);
  const h = mk(); for (let i = 0; i < MAX_OPEN + 5; i++) raiseCharge(h, realms, "cadiz", "fraud", 10); assert.equal(openCharges(h).length, MAX_OPEN);
  assert.ok(MIN_FINE > 0);
});

const courts = JSON.parse(readFileSync(new URL("../data/courts.json", import.meta.url), "utf8"));
const trial = (g, port, courtsArg) => { for (let d = g.day + 1; d < g.day + 300; d++) { g.day = d; const s = officersAct(g, realms, port, g.ships[0], courtsArg)[0]; if (s) return s; } return null; };
test("courts data is valid; jurisdiction by port first, then realm, else general officers", () => {
  assert.deepEqual(validateCourts(courts, world.cities.map((c) => c.id), realms), []);
  assert.equal(courtOf(courts, "sevilla", "castile").name.es, "Casa de la Contratación"); assert.equal(courtOf(courts, "cadiz", "castile").name.es, "Alcalde de sacas");
  assert.equal(courtOf(courts, "barcelona", "aragon").name.es, "Consulado de Mar"); assert.equal(courtOf(courts, "lisboa", "portugal"), null); assert.equal(courtOf(null, "cadiz", "castile"), null);
});
test("the sentence and the message name the court that judged", () => {
  const g = mk(); g.ships[0].at = "sevilla"; raiseCharge(g, realms, "sevilla", "fraud", 100); g.infamy = 0;
  const s = trial(g, "sevilla", courts); assert.equal(s.court.es, "Casa de la Contratación"); assert.ok(g.inbox.some((m) => m.kind === "info" && m.txt.es.includes("Casa de la Contratación")));
  const h = mk(); raiseCharge(h, realms, "cadiz", "fraud", 100); h.infamy = 0; assert.equal(trial(h, "cadiz", null).court, null);
});
test("recidivism: each conviction in the realm raises the fine, tightens the seizure, and the third sends the ship to prison even at low infamy", () => {
  const g = mk({ cash: 100000 }); const fines = [], seized = [];
  for (let i = 0; i < 4; i++) { g.ships[0].cargo = { wool: 100 }; g.ships[0].heldUntil = 0; raiseCharge(g, realms, "cadiz", "smuggling", 1000); g.infamy = 25; const s = trial(g, "cadiz", courts); fines.push(s.fine); seized.push(s.seized.wool); assert.equal(s.prior, i); if (i < RECIDIVISM_PRISON_AT) assert.equal(s.prisonDays, 0); else assert.ok(s.prisonDays > 0); }
  assert.deepEqual(fines, [500, 750, 1000, 1250]); assert.ok(seized[3] > seized[0]); assert.equal(g.convictions.castile, 4); assert.equal(priorConvictions(g, "castile"), 4);
  g.convictions.castile = 99; assert.equal(priorConvictions(g, "castile"), 4, "capped");
  assert.equal(priorConvictions(g, "aragon"), 0, "another realm keeps its own record");
});
test("fraud never seizes, even for a repeat offender", () => {
  const g = mk({ cash: 100000 }); g.convictions = { castile: 4 }; raiseCharge(g, realms, "cadiz", "fraud", 100); g.infamy = 30; assert.deepEqual(trial(g, "cadiz", courts).seized, {});
});
