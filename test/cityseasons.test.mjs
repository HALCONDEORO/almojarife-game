import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, advanceDay, doBuy } from "../src/game/game.mjs";
import { seasonsTick, inSeason } from "../src/game/seasons.mjs";
import { serialize, deserialize } from "../src/game/gamesave.mjs";
const world = loadWorld();
const inbox = (g) => g.inbox ?? g.ledger?.inbox ?? [];
const seasonNotices = (g) => inbox(g).filter((m) => /Llega .* a |comes to /.test(JSON.stringify(m)));
const mk = (opts) => newGame(world, "cadiz", { freePlay: true, seed: 5, ...opts });
test("flag off: no state and no notices, trade unchanged", () => {
  const g = mk({});
  assert.equal(g.citySeasons, undefined); assert.equal(g.seasonSeen, undefined);
  assert.equal(seasonsTick(g), null);
  for (let d = 0; d < 100 && !g.over; d++) advanceDay(g);
  assert.equal(seasonNotices(g).length, 0);
  const s = g.ships[0]; s.at = "cadiz"; s.voyage = null; g.cash = 1e6;
  assert.equal(doBuy(g, s, "salt", 1).ok, true);
});
test("flag on: day one stays quiet, then each turn of the year talks once, ES and EN", () => {
  const g = mk({ citySeasons: true });
  assert.equal(seasonNotices(g).length, 0); // day one knows it is winter already
  let days = 0;
  while (seasonNotices(g).length < 1 && days++ < 120 && !g.over) advanceDay(g); // winter -> spring
  assert.equal(seasonNotices(g).length, 1, JSON.stringify(inbox(g)));
  const m = seasonNotices(g)[0];
  assert.match(JSON.stringify(m), /Llega la primavera/); assert.match(JSON.stringify(m), /Spring comes to/);
  for (let d = 0; d < 30 && !g.over; d++) advanceDay(g); // same season: silence
  assert.equal(seasonNotices(g).length, 1);
  let more = 0;
  while (seasonNotices(g).length < 2 && more++ < 120 && !g.over) advanceDay(g); // spring -> summer
  assert.equal(seasonNotices(g).length, 2);
});
test("the notice names local goods whose season is at hand, and stays silent at sea", () => {
  const g = mk({ citySeasons: true });
  g.day = 175; g.tick = 175 * 24 * 60; g.seasonSeen = { season: "winter" }; // summer starts ~day 172, salt peaks at 200
  const r = seasonsTick(g);
  assert.deepEqual(r.goods, ["salt"]);
  assert.match(JSON.stringify(inbox(g)), /la sal/); assert.match(JSON.stringify(inbox(g)), /salt/);
  g.day = 265; g.tick = 265 * 24 * 60; // autumn, after summer was seen
  g.seasonSeen = { season: "summer" };
  g.ships[0].voyage = { from: "cadiz", to: "lisboa", left: 10 }; // at sea: no talk
  assert.equal(seasonsTick(g), null);
});
test("the seen season survives a save and reload, and seasons move no money", () => {
  const g = mk({ citySeasons: true });
  seasonsTick(g);
  const h = deserialize(JSON.parse(JSON.stringify(serialize(g, "T"))), world).g;
  assert.equal(h.citySeasons, true);
  const before = seasonNotices(h).length;
  assert.equal(seasonsTick(h), null); // same season: quiet after reload
  assert.equal(seasonNotices(h).length, before);
  const cash = h.cash; h.seasonSeen = { season: "winter" }; seasonsTick(h); // force a season change: talk only, no cash
  assert.equal(typeof h.cash, "number");
  assert.equal(h.cash, cash);
});

test("the Spanish notice says 'del' and never 'de el'", () => {
  const g = mk({ citySeasons: true });
  g.day = 175; g.tick = 175 * 24 * 60; g.seasonSeen = { season: "winter" };
  seasonsTick(g);
  const text = JSON.stringify(inbox(g));
  assert.doesNotMatch(text, /de el /);
});
