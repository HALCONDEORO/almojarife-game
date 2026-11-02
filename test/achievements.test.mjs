import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, doBuy, doSell, doSail, waitUntilArrival, advanceTick } from "../src/game/game.mjs";
import { ACHIEVEMENTS, achievementsTick, ensureAchievements } from "../src/game/achievements.mjs";
import { serialize, deserialize } from "../src/game/gamesave.mjs";
const world = loadWorld();

test("an old save without achievements initializes on the first tick and does not break", () => {
  const g = { }; // a pre-achievements state: no inbox, no voyages, nothing
  const unlocked = achievementsTick(g);
  assert.deepEqual(unlocked, {});
  assert.ok(g.achievements && typeof g.achievements.unlocked === "object");
  assert.equal(g.inbox?.length ?? 0, 0); // nothing unlocked, nothing posted
});

test("the first sale and a profitable voyage unlock once and post in ES and EN", () => {
  const g = { day: 4, voyages: [{ ship: 1, sold: 3, revenue: 30, profit: 5 }] };
  achievementsTick(g);
  assert.equal(g.achievements.unlocked.first_sale, 4);
  assert.equal(g.achievements.unlocked.profit_voyage, 4);
  const msgs = g.inbox.filter((m) => m.topic === "achievement");
  assert.equal(msgs.length, 2);
  assert.match(msgs[1].txt.es, /Primer trueque/);
  assert.match(msgs[1].txt.en, /First trade/);
  achievementsTick(g); // a later day does not unlock them again
  assert.equal(g.inbox.filter((m) => m.topic === "achievement").length, 2);
});

test("worth milestones need the caller's net worth and hold at their threshold", () => {
  const g = { day: 2 };
  achievementsTick(g, 9999);
  assert.equal(g.achievements.unlocked.worth_10k, undefined);
  achievementsTick(g, 10000);
  assert.equal(g.achievements.unlocked.worth_10k, 2);
  assert.equal(g.achievements.unlocked.worth_50k, undefined);
  achievementsTick(g, 50000);
  assert.equal(g.achievements.unlocked.worth_50k, 2);
});

test("fleet, convoy, warehouse, office, building, rank and respect milestones read plain state", () => {
  const g = { day: 7, world,
    ships: [{ id: 1 }, { id: 2 }],
    convoys: { c1: { ships: [1, 2] } },
    warehouses: { cadiz: { goods: {} } },
    offices: ["lisboa"],
    buildings: { cadiz: { "cadiz:1": { type: "fishery", state: "active", level: 1 } } },
    rankIdx: 1,
    repV: 2, rep: { cadiz: 40000 }, // 400 respect points: honoured
  };
  achievementsTick(g, 0);
  const u = g.achievements.unlocked;
  for (const id of ["second_ship", "first_convoy", "first_warehouse", "first_office", "first_building", "first_rank", "honoured_port"])
    assert.equal(u[id], 7, id);
  assert.equal(u.worth_10k, undefined); // worth 0 passed: worth milestones stay locked
});

test("unlocked achievements survive the save round trip and never re-post", () => {
  const g = newGame(world);
  ensureAchievements(g); g.achievements.unlocked.first_sale = 2;
  const { g: g2 } = deserialize(serialize(g, "Prueba"), world);
  assert.equal(g2.achievements.unlocked.first_sale, 2);
  const before = (g2.inbox ?? []).length;
  achievementsTick(g2, 0);
  assert.equal((g2.inbox ?? []).length, before); // nothing re-unlocked, nothing posted
  assert.deepEqual(Object.keys(g2.achievements.unlocked), ["first_sale"]);
});

test("a real first voyage unlocks the milestone in the day tick", () => {
  const g = newGame(world); g.eventsOn = false; const s = g.ships[0];
  const good = Object.keys(world.goods)[0];
  assert.equal(doBuy(g, s, good, 10).ok, true);
  const to = world.cities.find((c) => c.id !== s.at).id;
  assert.equal(doSail(g, s, to).ok, true);
  waitUntilArrival(g, s);
  assert.equal(doSell(g, s, good, 10).ok, true);
  assert.equal(g.achievements?.unlocked?.first_sale, undefined); // not before the day turns
  const day = g.day; for (let i = 0; i < 500 && g.day === day && !g.over; i++) advanceTick(g);
  assert.ok(g.day > day);
  assert.equal(typeof g.achievements.unlocked.first_sale, "number");
});
