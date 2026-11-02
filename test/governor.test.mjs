import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, doBuy, advanceTick, buyWarehouse, storeGoods } from "../src/game/game.mjs";
import { setStewardRule } from "../src/game/steward.mjs";
import { governorOf, governorWorks, hireGovernor, dismissGovernor, governorDay, GOVERNOR_LEVELS } from "../src/game/governor.mjs";
import { serialize, deserialize } from "../src/game/gamesave.mjs";
const world = loadWorld();

function houseWithWarehouse() {
  const game = newGame(world); game.eventsOn = false; game.cash = 50000;
  buyWarehouse(game, "cadiz");
  return game;
}

test("hiring needs a warehouse, a valid level, the fee and no sitting governor", () => {
  const noWarehouse = newGame(world);
  assert.equal(hireGovernor(noWarehouse, "cadiz", 1).reason, "no warehouse here");
  const game = houseWithWarehouse();
  assert.equal(hireGovernor(game, "cadiz", 0).reason, "bad level");
  assert.equal(hireGovernor(game, "cadiz", 4).reason, "bad level");
  assert.equal(hireGovernor(game, "cadiz", 1.5).reason, "bad level");
  game.cash = GOVERNOR_LEVELS[1].fee - 1;
  assert.equal(hireGovernor(game, "cadiz", 1).reason, "no cash");
  game.cash = 50000;
  const hired = hireGovernor(game, "cadiz", 1);
  assert.equal(hired.ok, true);
  assert.equal(hired.cost, 100);
  assert.equal(game.cash, 50000 - 100);
  assert.deepEqual(governorOf(game, "cadiz"), { level: 1, state: "active", hiredDay: 0, budget: 0, goal: null, fee: 100, wage: 2 });
  assert.equal(hireGovernor(game, "cadiz", 2).reason, "governor hired"); // one at a time
});

test("the daily wage leaves the cash box each day and orders keep running", () => {
  const game = houseWithWarehouse();
  hireGovernor(game, "cadiz", 1);
  const cash = game.cash;
  assert.deepEqual(governorDay(game, "cadiz"), { paid: 2 });
  assert.equal(game.cash, cash - 2);
  assert.equal(governorWorks(game, "cadiz"), true);
});

test("short cash suspends with one notice and no debt; money again resumes with one notice", () => {
  const game = houseWithWarehouse();
  hireGovernor(game, "cadiz", 1);
  game.cash = 1; // below the 2-coin wage
  const inboxBefore = (game.inbox ?? []).length;
  assert.deepEqual(governorDay(game, "cadiz"), { suspended: true });
  assert.equal(game.cash, 1); // never a debt
  assert.equal(governorOf(game, "cadiz").state, "suspended");
  assert.equal(governorWorks(game, "cadiz"), false); // his standing orders pause
  assert.equal((game.inbox ?? []).length, inboxBefore + 1); // one notice
  assert.match(game.inbox[0].txt.es, /suspende por impago/);
  assert.equal(governorDay(game, "cadiz"), null); // still short: no charge, no repeated notice
  assert.equal((game.inbox ?? []).length, inboxBefore + 1);
  game.cash = 100;
  assert.deepEqual(governorDay(game, "cadiz"), { resumed: true, paid: 2 });
  assert.equal(game.cash, 98); // the resuming day pays its wage
  assert.equal(governorWorks(game, "cadiz"), true);
  assert.match(game.inbox[0].txt.es, /vuelve al cargo/);
});

test("a suspended governor stops the standing orders in the real day tick (audit probe)", () => {
  const game = houseWithWarehouse();
  const ship = game.ships[0];
  assert.equal(doBuy(game, ship, "grain", 10).ok, true);
  storeGoods(game, ship, "grain", 10);
  setStewardRule(game, "cadiz", "grain", { buyBelow: 0, buyTo: 0, sellAbove: 1, sellKeep: 0 }); // sell at any price
  hireGovernor(game, "cadiz", 1);
  game.cash = 0; // cannot pay tomorrow's wage
  const day = game.day; for (let tick = 0; tick < 500 && game.day === day && !game.over; tick++) advanceTick(game);
  assert.ok(game.day > day);
  assert.equal(governorOf(game, "cadiz").state, "suspended");
  assert.equal(game.warehouses.cadiz.goods.grain, 10); // nothing sold while suspended
  game.cash = 1000;
  const day2 = game.day; for (let tick = 0; tick < 500 && game.day === day2 && !game.over; tick++) advanceTick(game);
  assert.ok(game.day > day2);
  assert.equal(governorOf(game, "cadiz").state, "active");
  assert.equal(game.warehouses.cadiz.goods.grain ?? 0, 0); // the order ran once he was back
});

test("dismissing hands the orders back to the free administrator, without refund", () => {
  const game = houseWithWarehouse();
  assert.equal(dismissGovernor(game, "cadiz").reason, "no governor");
  hireGovernor(game, "cadiz", 1);
  assert.deepEqual(dismissGovernor(game, "cadiz"), { ok: true, refund: 0 });
  assert.equal(governorOf(game, "cadiz"), null);
  assert.equal(governorWorks(game, "cadiz"), true); // level 0 keeps working
  assert.equal(hireGovernor(game, "cadiz", 1).ok, true); // and you can hire again
});

test("an old save without governor pays nothing and runs its orders (level 0)", () => {
  const game = houseWithWarehouse();
  const ship = game.ships[0];
  assert.equal(doBuy(game, ship, "grain", 10).ok, true);
  storeGoods(game, ship, "grain", 10);
  setStewardRule(game, "cadiz", "grain", { buyBelow: 0, buyTo: 0, sellAbove: 1, sellKeep: 0 });
  const { g: loaded } = deserialize(serialize(game, "Prueba"), world);
  assert.equal(loaded.warehouses.cadiz.governor ?? null, null); // key absent in the old save
  const cash = loaded.cash;
  const day = loaded.day; for (let tick = 0; tick < 500 && loaded.day === day && !loaded.over; tick++) advanceTick(loaded);
  assert.ok(loaded.day > day);
  assert.equal(loaded.cash > cash - 1, true); // no wage left the box (sales may add cash)
  assert.equal(loaded.warehouses.cadiz.goods.grain ?? 0, 0); // the free administrator sold as always
});

test("a hired governor survives the save round trip", () => {
  const game = houseWithWarehouse();
  hireGovernor(game, "cadiz", 2);
  const { g: loaded } = deserialize(serialize(game, "Prueba"), world);
  assert.deepEqual(governorOf(loaded, "cadiz"), { level: 2, state: "active", hiredDay: 0, budget: 0, goal: null, fee: 200, wage: 4 });
  assert.deepEqual(governorDay(loaded, "cadiz"), { paid: 4 });
});
