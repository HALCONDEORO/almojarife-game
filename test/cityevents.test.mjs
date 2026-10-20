import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { loadWorld } from "../src/sim/world.mjs";
import { makeMarket, tickMarket, price } from "../src/sim/market.mjs";
import { newGame, advanceDay, buyRumor } from "../src/game/game.mjs";
import { serialize, deserialize } from "../src/game/gamesave.mjs";
import { validateCityEvents, attachTexts, rollCityEvents, updateCityEvents, noticeCityEvents, activeCityEvents, cityEventAt, cityMarketMods, knownCityEvents, cityEventText, MAX_ACTIVE, CITY_EVENT_CHANCE } from "../src/game/cityevents.mjs";
const texts = Object.fromEntries(["es", "en"].map((l) => [l, JSON.parse(readFileSync(new URL(`../locales/${l}.json`, import.meta.url), "utf8"))]));
const world = attachTexts(loadWorld(), texts);
const game = (seed = 0, opts = { events: true }) => { const g = newGame(world, "cadiz", opts); g.seed = seed; return g; };
/** A game with one event forced on a port, starting today. */
const forced = (id, city, days = 20) => { const g = game(); g.cityEvents = [{ id, city, start: g.day, end: g.day + days, seen: false }]; return g; };

test("the shipped city events are valid, with ES and EN texts for each", () => {
  assert.deepEqual(validateCityEvents(world.cityEvents, world.goods, texts), []);
  assert.deepEqual(world.cityEvents.map((e) => e.id).sort(), ["epidemic", "fair", "famine"]);
});
test("the validator catches bad ids, days, goods, modifiers and missing texts", () => {
  const bad = structuredClone(world.cityEvents);
  bad[0].days = [10, 5]; bad[1].mods = { gold: { use: 2 } }; bad[2].mods.cloth = { price: 2 }; bad.push({ ...bad[0], days: [5, 9] });
  const t = structuredClone(texts); delete t.en.cityEvents.fair.end; t.es.cityEvents.famine.start = "sin ciudad";
  const errs = validateCityEvents(bad, world.goods, t);
  for (const bit of ["days must be", 'unknown good "gold"', 'unknown modifier "price"', "duplicate id", 'end missing "en"', "must name the {city}"]) assert.ok(errs.some((e) => e.includes(bit)), bit);
  assert.deepEqual(validateCityEvents("nope", world.goods), ["cityEvents must be a list"]);
});
test("the same seed gives the same events; another seed gives others", () => {
  const run = (seed) => { const g = game(seed); for (let i = 0; i < 200; i++) advanceDay(g); return JSON.stringify(g.cityEvents); };
  assert.equal(run(7), run(7));
  const many = new Set([1, 2, 3, 4, 5].map(run));
  assert.ok(many.size > 1);
});
test("events happen at a modest rate, at most one per port and MAX_ACTIVE on the map", () => {
  let total = 0;
  for (let seed = 0; seed < 20; seed++) {
    const g = game(seed);
    for (let i = 0; i < 300; i++) {
      advanceDay(g);
      const act = activeCityEvents(g);
      assert.ok(act.length <= MAX_ACTIVE, `day ${g.day}: ${act.length} active`);
      assert.equal(new Set(act.map((e) => e.city)).size, act.length);
    }
    total += (g.cityEvents ?? []).length;
  }
  const perYear = total / 20 * 365 / 300;
  assert.ok(perYear > 1 && perYear < 15, `${perYear.toFixed(1)} events a year`);
  assert.ok(CITY_EVENT_CHANCE < 0.1);
});
test("events only roll on roll days and stop exactly on their last day", () => {
  const g = forced("fair", "sevilla", 8);
  for (let i = 0; i < 7; i++) { advanceDay(g); assert.ok(cityEventAt(g, "sevilla"), `day ${g.day}`); }
  advanceDay(g);
  assert.equal(cityEventAt(g, "sevilla"), null);
  assert.equal(cityMarketMods(g), null);
  for (let seed = 0; seed < 30; seed++) {
    const h = game(seed);
    for (let i = 0; i < 60; i++) { const n = (h.cityEvents ?? []).length; advanceDay(h); if ((h.cityEvents ?? []).length > n) assert.equal(h.day % 7, 0); }
  }
});
test("games without events (and old saves without the flag) get no city events", () => {
  const g = game(3, {});
  for (let i = 0; i < 300; i++) advanceDay(g);
  assert.equal((g.cityEvents ?? []).length, 0);
  assert.equal(rollCityEvents({ ...g, world: { ...world, cityEvents: [] } }).length, 0);
});
test("a famine drives grain up in that port, and prices return after it ends", () => {
  const run = (famine) => {
    const m = makeMarket(world), p = [];
    for (let d = 0; d < 90; d++) { tickMarket(m, 180 + d, famine && d < 25 ? { lisboa: { grain: { make: 0.3, use: 2.6 }, dried_fish: { use: 1.6 } } } : null); p.push(price(world, m.lisboa.grain, "grain")); }
    return p;
  };
  const calm = run(false), hit = run(true);
  assert.ok(hit[24] > calm[24] * 1.5, `during: ${hit[24]} vs ${calm[24]}`);
  assert.ok(Math.abs(hit[89] - calm[89]) <= calm[89] * 0.1, `after: ${hit[89]} vs ${calm[89]}`);
});
test("the modifiers reach the live market: fair drains cloth, epidemic slows production", () => {
  const fair = forced("fair", "sevilla", 10), calm = forced("fair", "sevilla", 0);
  for (let i = 0; i < 10; i++) { advanceDay(fair); advanceDay(calm); }
  assert.ok(fair.market.sevilla.cloth.stock < calm.market.sevilla.cloth.stock);
  const sick = forced("epidemic", "sevilla", 15), mods = cityMarketMods(sick);
  assert.equal(mods.sevilla.olive_oil.make, 0.55);
  assert.equal(Object.keys(mods.sevilla).length, Object.keys(world.goods).length);
  const fam = forced("famine", "lisboa"), fm = cityMarketMods(fam);
  assert.deepEqual(Object.keys(fm.lisboa).sort(), ["dried_fish", "grain"]);
});
test("you only hear of an event where you have a ship or warehouse, or after buying a rumour", () => {
  const g = forced("famine", "lisboa", 30);
  noticeCityEvents(g);
  assert.equal(g.cityEvents[0].seen, false);
  assert.deepEqual(knownCityEvents(g), []);
  assert.ok(!(g.inbox ?? []).some((m) => m.cityEvent));
  g.ships[0].at = "lisboa"; // as if it had just docked
  advanceDay(g);
  assert.equal(g.cityEvents[0].seen, true);
  const msgs = g.inbox.filter((m) => m.cityEvent === "famine");
  assert.equal(msgs.length, 1);
  assert.match(msgs[0].txt.es, /Hambruna en Lisboa/);
  assert.match(msgs[0].txt.en, /Famine in Lisboa/);
  advanceDay(g); assert.equal(g.inbox.filter((m) => m.cityEvent).length, 1); // told once
  const h = forced("fair", "barcelona", 10); h.cash = 1000;
  assert.ok(buyRumor(h, "barcelona").ok); // the same call the tavern button makes
  assert.equal(knownCityEvents(h).length, 1);
  assert.equal(h.inbox.filter((m) => m.cityEvent === "fair").length, 1); // told right away, not tomorrow
});
test("a rumour bought on an event's last day tells both its start and its end", () => {
  const g = forced("fair", "barcelona", 1); g.cash = 1000;
  assert.ok(buyRumor(g, "barcelona").ok);
  advanceDay(g);
  const ours = g.inbox.filter((m) => m.cityEvent === "fair").map((m) => m.txt.en);
  assert.equal(ours.length, 2);
  assert.ok(ours.some((t) => /Great fair in Barcelona/.test(t)) && ours.some((t) => /fair in Barcelona is over/.test(t)));
});
test("the end of a known event is told; an unknown one ends quietly", () => {
  const g = forced("epidemic", "cadiz", 3);
  for (let i = 0; i < 4; i++) advanceDay(g);
  const ours = g.inbox.filter((m) => m.cityEvent === "epidemic").map((m) => m.txt.en);
  assert.equal(ours.length, 2);
  assert.match(ours[0], /has eased/);
  const h = forced("epidemic", "bilbao", 3);
  for (let i = 0; i < 4; i++) advanceDay(h);
  assert.ok(!(h.inbox ?? []).some((m) => m.cityEvent));
});
test("labels fill in name, city and days left in both languages", () => {
  const e = { id: "fair", city: "valencia", start: 10, end: 18 };
  assert.equal(cityEventText(world, "es", e, "active", 12), "Feria en Valencia: quedan 6 días");
  assert.equal(cityEventText(world, "en", e, "banner", 12), "Fair: 6 days left");
  assert.match(cityEventText({ ...world, texts: undefined }, "es", e, "start"), /fair/); // no texts loaded: still something readable
});
test("old saves without cityEvents load and play; running events survive a save", () => {
  const g = game(5);
  const save = serialize(g, "Casa");
  delete save.state.cityEvents;
  const { g: old } = deserialize(save, world);
  for (let i = 0; i < 120; i++) advanceDay(old);
  assert.equal(old.day, 120);
  const f = forced("famine", "lisboa", 25); advanceDay(f);
  const { g: back } = deserialize(serialize(f, "Casa"), world);
  assert.deepEqual(activeCityEvents(back), activeCityEvents(f));
  updateCityEvents(back); assert.ok(cityMarketMods(back).lisboa.grain);
});
test("an event whose data was removed has no effect and does not crash", () => {
  const g = forced("plague_of_frogs", "cadiz", 10);
  assert.deepEqual(cityMarketMods(g), { cadiz: {} });
  advanceDay(g);
});
