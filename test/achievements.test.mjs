import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, doBuy, doSell, doSellStored, doSellCombined, doSail, waitUntilArrival, advanceTick, buyWarehouse, storeGoods } from "../src/game/game.mjs";
import { achievementsTick, ensureAchievements } from "../src/game/achievements.mjs";
import { serialize, deserialize } from "../src/game/gamesave.mjs";
const world = loadWorld();

test("an old save without achievements initializes on the first tick and does not break", () => {
  const game = { }; // a pre-achievements state: no inbox, no voyages, nothing
  const unlocked = achievementsTick(game);
  assert.deepEqual(unlocked, {});
  assert.ok(game.achievements && typeof game.achievements.unlocked === "object");
  assert.equal(game.inbox?.length ?? 0, 0); // nothing unlocked, nothing posted
});

test("the first sale and a profitable voyage unlock once and post in ES and EN", () => {
  const game = { day: 4, salesMade: 1, voyages: [{ ship: 1, sold: 3, revenue: 30, profit: 5 }] };
  achievementsTick(game);
  assert.equal(game.achievements.unlocked.first_sale, 4);
  assert.equal(game.achievements.unlocked.profit_voyage, 4);
  const msgs = game.inbox.filter((msg) => msg.topic === "achievement");
  assert.equal(msgs.length, 2);
  assert.match(msgs[1].txt.es, /Primer trueque/);
  assert.match(msgs[1].txt.en, /First trade/);
  achievementsTick(game); // a later day does not unlock them again
  assert.equal(game.inbox.filter((msg) => msg.topic === "achievement").length, 2);
});

test("worth milestones need the caller's net worth and hold at their threshold", () => {
  const game = { day: 2 };
  achievementsTick(game, 9999);
  assert.ok(!Object.hasOwn(game.achievements.unlocked, "worth_10k"));
  achievementsTick(game, 10000);
  assert.equal(game.achievements.unlocked.worth_10k, 2);
  assert.ok(!Object.hasOwn(game.achievements.unlocked, "worth_50k"));
  achievementsTick(game, 50000);
  assert.equal(game.achievements.unlocked.worth_50k, 2);
});

test("fleet, convoy, warehouse, office, building, rank and respect milestones read plain state", () => {
  const game = { day: 7, world,
    ships: [{ id: 1 }, { id: 2 }],
    convoys: { c1: { ships: [1, 2] } },
    warehouses: { cadiz: { goods: {} } },
    offices: ["lisboa"],
    buildings: { cadiz: { "cadiz:1": { type: "fishery", state: "active", level: 1 } } },
    rankIdx: 1,
    repV: 2, rep: { cadiz: 40000 }, // 400 respect points: honoured
  };
  achievementsTick(game, 0);
  const unlocked = game.achievements.unlocked;
  for (const id of ["second_ship", "first_convoy", "first_warehouse", "first_office", "first_building", "first_rank", "honoured_port"])
    assert.equal(unlocked[id], 7, id);
  assert.ok(!Object.hasOwn(unlocked, "worth_10k")); // worth 0 passed: worth milestones stay locked
});

test("unlocked achievements survive the save round trip and never re-post", () => {
  const game = newGame(world);
  ensureAchievements(game); game.achievements.unlocked.first_sale = 2;
  const { g: reloaded } = deserialize(serialize(game, "Prueba"), world);
  assert.equal(reloaded.achievements.unlocked.first_sale, 2);
  const before = (reloaded.inbox ?? []).length;
  achievementsTick(reloaded, 0);
  assert.equal((reloaded.inbox ?? []).length, before); // nothing re-unlocked, nothing posted
  assert.deepEqual(Object.keys(reloaded.achievements.unlocked), ["first_sale"]);
});

test("a same-port sale without a voyage also unlocks First trade (audit probe)", () => {
  const game = newGame(world); game.eventsOn = false; const ship = game.ships[0];
  const good = Object.keys(world.goods)[0];
  assert.equal(doBuy(game, ship, good, 10).ok, true);
  assert.equal(doSell(game, ship, good, 10).ok, true); // bought and sold in the home port: no voyage ever opened
  assert.equal((game.voyages ?? []).some((voyage) => voyage.sold > 0), false); // voyage evidence alone would miss this sale
  const day = game.day; for (let tick = 0; tick < 500 && game.day === day && !game.over; tick++) advanceTick(game);
  assert.ok(game.day > day);
  assert.equal(game.achievements.unlocked.first_sale, game.day);
});

test("a real first voyage unlocks the milestone in the day tick", () => {
  const game = newGame(world); game.eventsOn = false; const ship = game.ships[0];
  const good = Object.keys(world.goods)[0];
  assert.equal(doBuy(game, ship, good, 10).ok, true);
  const to = world.cities.find((city) => city.id !== ship.at).id;
  assert.equal(doSail(game, ship, to).ok, true);
  waitUntilArrival(game, ship);
  assert.equal(doSell(game, ship, good, 10).ok, true);
  assert.ok(!Object.hasOwn(game.achievements?.unlocked ?? {}, "first_sale")); // not before the day turns
  const day = game.day; for (let tick = 0; tick < 500 && game.day === day && !game.over; tick++) advanceTick(game);
  assert.ok(game.day > day);
  assert.equal(typeof game.achievements.unlocked.first_sale, "number");
});

test("a merchant start's welcome respect never unlocks First trade; only a real sale does (audit probe)", () => {
  const game = newGame(world, "cadiz", { originConnections: true }); // the default profile is a merchant's child
  game.eventsOn = false;
  assert.ok((game.rep?.cadiz ?? 0) > 0); // the welcome respect really landed (the audit's false-positive path)
  const startDay = game.day; for (let tick = 0; tick < 500 && game.day === startDay && !game.over; tick++) advanceTick(game);
  assert.ok(game.day > startDay);
  assert.ok(!Object.hasOwn(game.achievements?.unlocked ?? {}, "first_sale")); // respect alone is not a sale
  const ship = game.ships[0], good = Object.keys(world.goods)[0];
  assert.equal(doBuy(game, ship, good, 10).ok, true);
  assert.equal(doSell(game, ship, good, 10).ok, true);
  const saleDay = game.day; for (let tick = 0; tick < 500 && game.day === saleDay && !game.over; tick++) advanceTick(game);
  assert.equal(game.achievements.unlocked.first_sale, game.day); // the first real sale unlocks it
});

test("warehouse and combined sales count as first sales too (audit probes)", () => {
  const stored = newGame(world); stored.eventsOn = false; stored.cash = 50000;
  buyWarehouse(stored, "cadiz");
  const storedShip = stored.ships[0];
  assert.equal(doBuy(stored, storedShip, "grain", 10).ok, true);
  storeGoods(stored, storedShip, "grain", 10);
  assert.equal(doSellStored(stored, "cadiz", "grain", 5).ok, true);
  const storedDay = stored.day; for (let tick = 0; tick < 500 && stored.day === storedDay && !stored.over; tick++) advanceTick(stored);
  assert.equal(stored.achievements.unlocked.first_sale, stored.day);

  const combined = newGame(world); combined.eventsOn = false; combined.cash = 50000;
  buyWarehouse(combined, "cadiz");
  const combinedShip = combined.ships[0];
  assert.equal(doBuy(combined, combinedShip, "grain", 10).ok, true);
  storeGoods(combined, combinedShip, "grain", 5); // leaves 5 in the hold and 5 in the warehouse
  const sale = doSellCombined(combined, combinedShip, "grain", 10, combined.warehouses.cadiz);
  assert.equal(sale.ok, true); assert.equal(sale.qty, 10);
  const combinedDay = combined.day; for (let tick = 0; tick < 500 && combined.day === combinedDay && !combined.over; tick++) advanceTick(combined);
  assert.equal(combined.achievements.unlocked.first_sale, combined.day);
});

test("a save from before the counter has no first sale until the next real sale (old-save probe)", () => {
  const { g: loaded } = deserialize(serialize(newGame(world), "Prueba"), world); // a fresh save never sold: the key is absent, as in pre-counter saves
  loaded.eventsOn = false;
  assert.equal(loaded.salesMade ?? 0, 0);
  achievementsTick(loaded, 0);
  assert.ok(!Object.hasOwn(loaded.achievements.unlocked, "first_sale"));
  const ship = loaded.ships[0], good = Object.keys(world.goods)[0];
  assert.equal(doBuy(loaded, ship, good, 10).ok, true);
  assert.equal(doSell(loaded, ship, good, 10).ok, true);
  assert.equal(loaded.salesMade, 1);
});
