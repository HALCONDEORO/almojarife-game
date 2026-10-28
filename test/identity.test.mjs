import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, doBuy } from "../src/game/game.mjs";
import { cityTraits, identityLine, arrivalIdentity, TRAITS, POP_PROUD } from "../src/game/identity.mjs";
import { hallView } from "../src/view/townhallview.mjs";
import { serialize, deserialize } from "../src/game/gamesave.mjs";
const world = loadWorld();
const inbox = (g) => g.inbox ?? g.ledger?.inbox ?? [];
test("every city has two distinct known traits, stable across games and seeds", () => {
  const first = Object.fromEntries(world.cities.map((c) => [c.id, cityTraits(world, c.id)]));
  for (const [id, t] of Object.entries(first)) {
    assert.equal(t.length, 2, id); assert.notEqual(t[0], t[1], id);
    for (const x of t) assert.ok(TRAITS[x], `${id}:${x}`);
  }
  assert.deepEqual(Object.fromEntries(world.cities.map((c) => [c.id, cityTraits(world, c.id)])), first);
});
test("traits read from what the city is: sea trades make a marinera city, size makes it orgullosa", () => {
  for (const c of world.cities) {
    const [work, temper] = cityTraits(world, c.id);
    if ((c.makes ?? []).some((m) => ["fish", "salt"].includes(m))) assert.equal(work, "marinera", c.id);
    if ((c.pop ?? 0) >= POP_PROUD) assert.equal(temper, "orgullosa", c.id);
  }
});
test("flag off: no state, no notices, no tab field, and the game trades as always", () => {
  const g = newGame(world, "cadiz", { cityIdentity: false, cityMoodOut: false, citySeasons: false, cityCrafts: false, cityFestivals: false, cityMemory: false, cityRelations: false, cityGrowth: false, freePlay: true, seed: 5 });
  assert.equal(g.cityIdentity, undefined); assert.equal(g.identitySeen, undefined);
  assert.equal(arrivalIdentity(g, "cadiz"), null);
  assert.equal(hallView(g, "cadiz").identity, undefined);
  const s = g.ships[0]; s.at = "cadiz"; s.voyage = null; g.cash = 1e6;
  assert.equal(doBuy(g, s, "salt", 1).ok, true);
});
test("flag on: the home port introduces itself on day one, and each new port only once", () => {
  const g = newGame(world, "cadiz", { cityIdentity: false, cityMoodOut: false, citySeasons: false, cityCrafts: false, cityFestivals: false, cityMemory: false, cityRelations: false, cityGrowth: false, freePlay: true, seed: 5, cityIdentity: true });
  assert.equal(g.cityIdentity, true);
  const home = inbox(g).filter((m) => /Cádiz/.test(JSON.stringify(m)));
  assert.equal(home.length, 1, JSON.stringify(inbox(g)));
  assert.match(JSON.stringify(home[0]), /marinera/); assert.match(JSON.stringify(home[0]), /seafaring/);
  assert.equal(arrivalIdentity(g, "cadiz"), null); // already greeted
  const n0 = inbox(g).length;
  assert.deepEqual(arrivalIdentity(g, "lisboa"), cityTraits(world, "lisboa"));
  assert.equal(inbox(g).length, n0 + 1);
  assert.equal(arrivalIdentity(g, "lisboa"), null); // once per city and game
  assert.equal(inbox(g).length, n0 + 1);
});
test("the Ayuntamiento tab carries one sentence of character, ES and EN, only with the flag on", () => {
  const g = newGame(world, "cadiz", { cityIdentity: false, cityMoodOut: false, citySeasons: false, cityCrafts: false, cityFestivals: false, cityMemory: false, cityRelations: false, cityGrowth: false, freePlay: true, seed: 5, cityIdentity: true });
  const id = hallView(g, "cadiz").identity;
  assert.deepEqual(id.traits, cityTraits(world, "cadiz"));
  assert.match(id.txt.es, /^Cádiz es una ciudad /); assert.match(id.txt.en, /^Cádiz is a /);
});
test("the greetings survive a save and reload: no repeat, and the flag persists", () => {
  const g = newGame(world, "cadiz", { cityIdentity: false, cityMoodOut: false, citySeasons: false, cityCrafts: false, cityFestivals: false, cityMemory: false, cityRelations: false, cityGrowth: false, freePlay: true, seed: 5, cityIdentity: true });
  arrivalIdentity(g, "lisboa");
  const h = deserialize(JSON.parse(JSON.stringify(serialize(g, "T"))), world).g;
  assert.equal(h.cityIdentity, true);
  assert.equal(arrivalIdentity(h, "lisboa"), null);
  assert.deepEqual(arrivalIdentity(h, "porto"), cityTraits(world, "porto"));
});
test("identityLine is null for an unknown city, and identity moves no money", () => {
  assert.equal(identityLine(world, "nowhere"), null);
  const g = newGame(world, "cadiz", { cityIdentity: false, cityMoodOut: false, citySeasons: false, cityCrafts: false, cityFestivals: false, cityMemory: false, cityRelations: false, cityGrowth: false, freePlay: true, seed: 5, cityIdentity: true });
  const cash = g.cash; arrivalIdentity(g, "porto");
  assert.equal(g.cash, cash);
});
