import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, advanceDay, doBuy } from "../src/game/game.mjs";
import { festivalDay, isFestival, festivalDemandMul, festivalsTick, festivalLine } from "../src/game/festivals.mjs";
import { hallView } from "../src/view/townhallview.mjs";
import { serialize, deserialize } from "../src/game/gamesave.mjs";
const world = loadWorld();
const inbox = (g) => g.inbox ?? g.ledger?.inbox ?? [];
const mk = (opts) => newGame(world, "cadiz", { cityIdentity: false, cityMoodOut: false, citySeasons: false, cityCrafts: false, cityFestivals: false, cityMemory: false, cityRelations: false, cityGrowth: false, freePlay: true, seed: 5, ...opts });
const partyNotices = (g) => inbox(g).filter((m) => /la fiesta de|festival/.test(JSON.stringify(m)));
test("every city keeps one stable festival day of the year", () => {
  for (const c of world.cities) {
    const d = festivalDay(world, c.id);
    assert.ok(d >= 1 && d <= 365, `${c.id}:${d}`);
    assert.equal(festivalDay(world, c.id), d); // stable
  }
  assert.ok(new Set(world.cities.map((c) => festivalDay(world, c.id))).size > 10); // not all the same day
});
test("flag off: no festival, no demand change, no notice, no tab field", () => {
  const g = mk({});
  assert.equal(g.cityFestivals, undefined);
  assert.equal(isFestival(g, "cadiz"), false);
  assert.equal(festivalDemandMul(g, "cadiz", "wine"), 1);
  festivalsTick(g);
  assert.equal(partyNotices(g).length, 0);
  assert.equal(hallView(g, "cadiz").festival, undefined);
  const s = g.ships[0]; s.at = "cadiz"; s.voyage = null; g.cash = 1e6;
  assert.equal(doBuy(g, s, "salt", 1).ok, true);
});
test("on the day, the festival doubles the thirst for wine and beer only, exactly x2 vs flag off", () => {
  const fd = festivalDay(world, "cadiz");
  const on = mk({ cityFestivals: true }), off = mk({});
  while (on.day < fd - 1 && !on.over) { advanceDay(on); advanceDay(off); }
  assert.equal(isFestival(on, "cadiz"), true);
  assert.equal(festivalDemandMul(on, "cadiz", "wine"), 2);
  assert.equal(festivalDemandMul(on, "cadiz", "grain"), 1);
  assert.equal(on.market.cadiz.wine.pop, off.market.cadiz.wine.pop * 2, `day ${on.day}`);
  assert.equal(on.market.cadiz.beer.pop, off.market.cadiz.beer.pop * 2);
  assert.equal(on.market.cadiz.grain.pop, off.market.cadiz.grain.pop); // the rest of the market: untouched
});
test("a docked ship hears the festival once per year, ES and EN, and the mood lifts with citylife", () => {
  const g = mk({ cityFestivals: true, citylife: true });
  const fd = festivalDay(world, "cadiz");
  g.day = fd - 1; g.tick = g.day * 24 * 60;
  const before = g.citylife.cities.cadiz.animo.poor;
  festivalsTick(g);
  assert.equal(partyNotices(g).length, 1);
  assert.match(JSON.stringify(partyNotices(g)[0]), /la fiesta de Cádiz/); assert.match(JSON.stringify(partyNotices(g)[0]), /Cádiz's festival/);
  assert.equal(g.citylife.cities.cadiz.animo.poor, before + 8);
  festivalsTick(g); // same year: no repeat, no second lift
  assert.equal(partyNotices(g).length, 1);
  assert.equal(g.citylife.cities.cadiz.animo.poor, before + 8);
  g.day += 365; festivalsTick(g); // next year it celebrates again
  assert.equal(partyNotices(g).length, 2);
});
test("the tab tells the festival day, and the seen year survives a save", () => {
  const g = mk({ cityFestivals: true });
  const line = hallView(g, "cadiz").festival;
  assert.equal(line.day, festivalDay(world, "cadiz"));
  assert.match(line.txt.es, /La fiesta de Cádiz/); assert.match(line.txt.en, /Cádiz's festival/);
  g.day = festivalDay(world, "cadiz") - 1; g.tick = g.day * 24 * 60;
  festivalsTick(g);
  const h = deserialize(JSON.parse(JSON.stringify(serialize(g, "T"))), world).g;
  festivalsTick(h); // same year after reload: quiet
  const hh = deserialize(JSON.parse(JSON.stringify(serialize(h, "T"))), world).g;
  assert.equal((hh.inbox ?? []).filter((m) => /la fiesta de/.test(JSON.stringify(m))).length, 1);
});
