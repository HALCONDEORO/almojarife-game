import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, doBuy } from "../src/game/game.mjs";
import { moodOutLine, arrivalMood } from "../src/game/moodout.mjs";
import { hallView } from "../src/view/townhallview.mjs";
import { serialize, deserialize } from "../src/game/gamesave.mjs";
const world = loadWorld();
const inbox = (g) => g.inbox ?? g.ledger?.inbox ?? [];
const mk = (opts) => newGame(world, "cadiz", { cityIdentity: false, cityMoodOut: false, citySeasons: false, cityCrafts: false, cityFestivals: false, cityMemory: false, cityRelations: false, cityGrowth: false, freePlay: true, seed: 5, ...opts });
test("flag off: no state, no notices, no tab field, trade unchanged", () => {
  const g = mk({});
  assert.equal(g.cityMoodOut, undefined); assert.equal(g.moodSeen, undefined);
  assert.equal(moodOutLine(g, "cadiz"), null); assert.equal(arrivalMood(g, "cadiz"), null);
  assert.equal(hallView(g, "cadiz").mood, undefined);
  const s = g.ships[0]; s.at = "cadiz"; s.voyage = null; g.cash = 1e6;
  assert.equal(doBuy(g, s, "salt", 1).ok, true);
});
test("mood flag on but citylife off: silence, no state", () => {
  const g = mk({ citylife: false, cityMoodOut: true }); // citylife OFF pinned explicitly (ships ON by default since 24/10)
  assert.equal(moodOutLine(g, "cadiz"), null); assert.equal(arrivalMood(g, "cadiz"), null);
  assert.equal(g.moodSeen, undefined); assert.equal(hallView(g, "cadiz").mood, undefined);
});
test("first visit tells the temper, a repeat visit with the same temper stays quiet", () => {
  const g = mk({ citylife: true, cityMoodOut: true });
  const band = arrivalMood(g, "cadiz");
  assert.ok(["contenta", "tranquila", "inquieta", "furiosa"].includes(band));
  const msgs = inbox(g).filter((m) => /gente está|folk of/.test(JSON.stringify(m)));
  assert.equal(msgs.length, 1);
  assert.match(JSON.stringify(msgs[0]), /gente está/); assert.match(JSON.stringify(msgs[0]), /folk of/);
  assert.equal(arrivalMood(g, "cadiz"), null); // same temper: nothing new to say
  assert.equal(inbox(g).filter((m) => /gente está/.test(JSON.stringify(m))).length, 1);
});
test("a change of temper talks again, and the tab carries the same words", () => {
  const g = mk({ citylife: true, cityMoodOut: true });
  arrivalMood(g, "cadiz");
  for (const cls of Object.keys(g.citylife.cities.cadiz.animo)) g.citylife.cities.cadiz.animo[cls] = 5; // the city turns furious
  assert.equal(arrivalMood(g, "cadiz"), "furiosa");
  const msgs = inbox(g).filter((m) => /gente está/.test(JSON.stringify(m)));
  assert.equal(msgs.length, 2); // the inbox is newest-first: order is not the assertion
  assert.ok(msgs.some((m) => /furiosa/.test(JSON.stringify(m)) && /furious/.test(JSON.stringify(m))), JSON.stringify(msgs));
  const tab = hallView(g, "cadiz").mood;
  assert.equal(tab.band, "furiosa"); assert.match(tab.txt.es, /furiosa/); assert.match(tab.txt.en, /furious/);
});
test("the seen temper survives a save and reload, and words move no money", () => {
  const g = mk({ citylife: true, cityMoodOut: true });
  arrivalMood(g, "cadiz");
  const h = deserialize(JSON.parse(JSON.stringify(serialize(g, "T"))), world).g;
  assert.equal(h.cityMoodOut, true);
  assert.equal(arrivalMood(h, "cadiz"), null); // same temper, already told
  const cash = h.cash; arrivalMood(h, "lisboa");
  assert.equal(h.cash, cash);
});
