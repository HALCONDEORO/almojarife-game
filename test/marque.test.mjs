import { readFileSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame } from "../src/game/game.mjs";
import { sameMonarch, realmOf, namableRealms, quintoSplit, buyLetter, activeLetter, coveredBy, validateRealms, LETTER_FEE, LETTER_DAYS, LETTER_MAX } from "../src/game/marque.mjs";
import { serialize, deserialize } from "../src/game/gamesave.mjs";
const world = loadWorld(), ids = world.cities.map((c) => c.id), data = JSON.parse(readFileSync(new URL("../data/realms.json", import.meta.url), "utf8"));
const mk = (o = {}) => { const g = newGame(world); g.cash = 5000; g.marque = o.marque ?? true; return g; };
test("the shipped realm data is valid", () => assert.deepEqual(validateRealms(data, ids), []));
test("realms change by date: Malaga, Ceuta, Melilla, Oran, Algiers", () => {
  assert.equal(realmOf(data, "malaga", 1486), "granada"); assert.equal(realmOf(data, "malaga", 1487), "castile");
  assert.equal(realmOf(data, "ceuta", 1500), "portugal"); assert.equal(realmOf(data, "ceuta", 1600), "portugal"); assert.equal(realmOf(data, "ceuta", 1667), "portugal"); assert.equal(realmOf(data, "ceuta", 1668), "castile");
  assert.equal(realmOf(data, "melilla", 1490), null); assert.equal(realmOf(data, "melilla", 1497), "castile");
  assert.equal(realmOf(data, "oran", 1500), "tlemcen"); assert.equal(realmOf(data, "oran", 1509), "castile");
  assert.equal(realmOf(data, "argel", 1500), null); assert.equal(realmOf(data, "argel", 1516), "algiers");
  assert.equal(realmOf(data, "tetuan", 1500), null);
});
test("only realms that hold a port that year can be named", () => {
  assert.ok(namableRealms(data, 1480).includes("granada")); assert.ok(!namableRealms(data, 1480).includes("algiers"));
  assert.ok(namableRealms(data, 1520).includes("algiers"));
});
test("quinto: one fifth, two thirds crown and one third admiral, nothing lost", () => {
  const s = quintoSplit(1000); assert.deepEqual(s, { crown: 133, admiral: 67, net: 800 });
  for (const v of [0, 1, 7, 999, 12345]) { const x = quintoSplit(v); assert.equal(x.crown + x.admiral + x.net, v); }
  assert.deepEqual(quintoSplit(-5), { crown: 0, admiral: 0, net: 0 });
});
test("flag off: nothing happens and nothing is charged", () => {
  const g = mk({ marque: false }), c = g.cash;
  assert.equal(buyLetter(g, data, "cadiz", "portugal").reason, "off"); assert.equal(g.cash, c); assert.equal(g.letters, undefined); assert.equal(coveredBy(g, "portugal"), false);
});
test("buy a letter: cost, expiry, cover, and the rules", () => {
  const g = mk(), c = g.cash, r = buyLetter(g, data, "cadiz", "portugal");
  assert.equal(r.ok, true); assert.equal(g.cash, c - LETTER_FEE); assert.equal(r.letter.until, g.day + LETTER_DAYS);
  assert.equal(coveredBy(g, "portugal"), true); assert.equal(coveredBy(g, "aragon"), false);
  assert.equal(buyLetter(g, data, "cadiz", "portugal").reason, "already held");
  assert.equal(buyLetter(g, data, "cadiz", "castile").reason, "own realm");
  assert.equal(buyLetter(g, data, "tetuan", "portugal").reason, "no council");
  assert.equal(buyLetter(g, data, "cadiz", "algiers").reason, "unknown realm");
  g.day += LETTER_DAYS; assert.equal(activeLetter(g, "portugal"), null); assert.equal(coveredBy(g, "portugal"), false);
});
test("cash and cap limits", () => {
  const g = mk(); g.cash = LETTER_FEE - 1; assert.equal(buyLetter(g, data, "cadiz", "portugal").reason, "no cash");
  g.cash = 1e6; assert.equal(buyLetter(g, data, "cadiz", "portugal").ok, true); assert.equal(buyLetter(g, data, "cadiz", "granada").ok, true);
  g.letters.push({ id: "x", realm: "other", issuer: "cadiz", from: 0, until: 999 }); assert.equal(g.letters.length, LETTER_MAX);
  assert.equal(buyLetter(g, data, "cadiz", "tlemcen").reason, "too many");
});
test("letters survive a save and reload", () => {
  const g = mk(); buyLetter(g, data, "cadiz", "portugal");
  const h = deserialize(JSON.parse(JSON.stringify(serialize(g, "T"))), world).g; assert.equal(h.letters?.length, 1); assert.equal(h.letters[0].realm, "portugal");
});
test("realms under one monarch cannot be named by each other: Castile and Aragon always, Portugal from 1580 to 1640", () => {
  assert.equal(sameMonarch(data, "castile", "aragon", 1480), true); assert.equal(sameMonarch(data, "castile", "portugal", 1579), false);
  assert.equal(sameMonarch(data, "castile", "portugal", 1580), true); assert.equal(sameMonarch(data, "portugal", "aragon", 1639), true); assert.equal(sameMonarch(data, "castile", "portugal", 1640), false);
  assert.equal(sameMonarch(data, "castile", "granada", 1480), false);
  const g = mk(); assert.equal(buyLetter(g, data, "cadiz", "aragon").reason, "own realm");
  g.day = 100 * 365; assert.equal(buyLetter(g, data, "cadiz", "portugal").reason, "own realm");
  g.day = 0; assert.equal(buyLetter(g, data, "cadiz", "portugal").ok, true);
});
test("the validator rejects a union without a source or with an unknown realm", () => {
  const bad = { ...data, unions: [{ realms: ["castile", "atlantis"], from: 1580, until: 1640 }] };
  const p = validateRealms(bad, ids).join("|"); assert.match(p, /union 0: missing https source/); assert.match(p, /union 0: unknown realm/);
});

test("map-only realms validate zones but cannot enter gameplay holdings or unions", () => {
  assert.ok(data.mapRealms.navarre);
  assert.equal(namableRealms(data, 1480).includes("navarre"), false);
  const bad = structuredClone(data);
  bad.holdings.push({ port: "cadiz", realm: "navarre", from: 1480, until: 1481, source: data.mapRealms.navarre.source });
  bad.unions.push({ realms: ["castile", "navarre"], from: 1480, until: 1481, source: data.mapRealms.navarre.source });
  const errors = validateRealms(bad, ids).join("|");
  assert.match(errors, /cadiz\/navarre\/1480: unknown realm/);
  assert.match(errors, /union \d+: unknown realm/);
  const unknown = structuredClone(data); unknown.zones.at(-1).realm = "atlantis";
  assert.match(validateRealms(unknown, ids).join("|"), /zone \d+: unknown realm/);
  const duplicate = structuredClone(data); duplicate.mapRealms.castile = duplicate.realms.castile;
  assert.match(validateRealms(duplicate, ids).join("|"), /duplicates gameplay realm/);
});
