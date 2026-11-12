// Branch-pinning tests for src/game/game.mjs: they lock the CURRENT behavior on the
// edge paths the main suites leave uncovered (doGoTo refusals, courseOrigin at sea,
// buyCaravel/sellShip guards, trendPct history rule, resolveBankruptcy seizure).
// No production behavior is changed.
import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, doGoTo, doSail, buyCaravel, sellShip, trendPct, priceHistory, resolveBankruptcy, orderShip, deliverOrders, CARAVEL_PRICE, START_CASH } from "../src/game/game.mjs";
import { makeShip } from "../src/sim/trade.mjs";
const world = loadWorld();
const [A, B] = [world.cities[0].id, world.cities[1].id];

test("doGoTo refuses when free navigation is off, the game is over, or the ship is foreign", () => {
  const g = newGame(world, A, { freeNav: false });
  const s = g.ships[0];
  assert.deepEqual(doGoTo(g, s, 36.5, -6.3), { ok: false, reason: "off" });
  const g2 = newGame(world, A, { freeNav: true });
  g2.over = "lost";
  assert.deepEqual(doGoTo(g2, g2.ships[0], 36.5, -6.3), { ok: false, reason: "game over" });
  const g3 = newGame(world, A, { freeNav: true });
  const foreign = makeShip(99, "cog", A);
  assert.deepEqual(doGoTo(g3, foreign, 36.5, -6.3), { ok: false, reason: "foreign ship" });
});
test("doGoTo refuses a mid-leg course change for a convoy ship and records the reason", () => {
  const g = newGame(world, A, { freeNav: true, cash: 1e6 });
  const s = g.ships[0];
  const r = doSail(g, s, B);
  assert.ok(r.ok, "ship sails out first");
  s.convoy = "c1"; g.convoys = { c1: { id: "c1", ships: [s.id] } };
  const res = doGoTo(g, s, 36.5, -6.3);
  assert.equal(res.ok, false);
  assert.equal(res.reason, "convoy");
  assert.equal(s.navError, "convoy", "the refusal stays on the ship for the voyage card");
});
test("doGoTo refuses when the ship has no crew and records the reason", () => {
  const g = newGame(world, A, { freeNav: true });
  const s = g.ships[0];
  s.crew = 0; s.sailors = 0; s.captain = null; s.officers = [];
  const res = doGoTo(g, s, 36.5, -6.3);
  assert.equal(res.ok, false);
  assert.equal(res.reason, "crew");
  assert.equal(s.navError, "crew");
});
test("buyCaravel refuses without cash and pays exactly CARAVEL_PRICE on success", () => {
  const g = newGame(world, A);
  g.cash = CARAVEL_PRICE - 1;
  assert.deepEqual(buyCaravel(g, A), { ok: false, reason: "no cash" });
  g.cash = CARAVEL_PRICE;
  const r = buyCaravel(g, A);
  assert.ok(r.ok);
  assert.equal(g.cash, 0);
  assert.equal(r.ship.type, "caravel");
  assert.equal(g.ships.length, 2);
  g.over = "lost";
  assert.deepEqual(buyCaravel(g, A), { ok: false, reason: "game over" });
});
test("sellShip refuses the game-over, foreign, loaded and at-sea cases", () => {
  const g = newGame(world, A, { cash: 1e6 });
  const extra = makeShip(2, "barca", A, g.ships); g.ships.push(extra);
  g.over = "lost";
  assert.equal(sellShip(g, extra).ok, false);
  g.over = null;
  const foreign = makeShip(99, "barca", A);
  assert.deepEqual(sellShip(g, foreign), { ok: false, reason: "not an active owned ship" });
  extra.cargo.grain = 5;
  assert.equal(sellShip(g, extra).reason, "hold not empty");
  extra.cargo = {};
  extra.voyage = { from: A, to: B, ticksLeft: 5, totalTicks: 5 };
  assert.equal(sellShip(g, extra).reason, "at sea");
  g.ships = g.ships.filter((x) => x !== extra);
  assert.equal(sellShip(g, extra).ok, false, "not in fleet");
});
test("trendPct returns null without enough history and a rounded percent otherwise", () => {
  const g = { hist: { cadiz: { grain: [100, 100, 100, 120] } } };
  assert.equal(trendPct(g, "cadiz", "grain", 7), null, "not enough days of history");
  assert.equal(trendPct(g, "cadiz", "grain", 2), 20, "(120-100)/100 over the window");
  assert.equal(trendPct(g, "cadiz", "pepper", 2), null, "unknown good has no history");
  assert.deepEqual(priceHistory(g, "cadiz", "grain"), [100, 100, 100, 120]);
  assert.deepEqual(priceHistory(g, "cadiz", "pepper"), []);
});
test("resolveBankruptcy seizes cargo, stock and buildings at half value and writes off the rest", () => {
  const g = newGame(world, A, { freePlay: true });
  const s = g.ships[0];
  s.cargo = { grain: 10 }; s.basis = { grain: 500 };
  g.warehouses = { cadiz: { goods: { salt: 8 }, basis: { salt: 80 } } };
  g.buildings = { cadiz: { p1: { type: "house", level: 2 } } };
  g.cash = -100; g.loans = [{ id: 1, owed: 1e5, city: A, rate: 0.1, day: 0 }];
  resolveBankruptcy(g);
  assert.equal(s.cargo.grain, undefined, "cargo seized");
  assert.equal(s.basis.grain, undefined, "its basis seized too");
  assert.equal(g.warehouses.cadiz.goods.salt, undefined, "warehouse stock seized");
  assert.equal(g.buildings.cadiz.p1, undefined, "buildings seized");
  const recovered = 10 * g.world.goods.grain.base / 2 + 8 * g.world.goods.salt.base / 2 + 150 * 2 / 2;
  assert.equal(g.cash, Math.max(0, Math.round(-100 + recovered)), "cash is what the seizure recovered minus the debt");
  assert.deepEqual(g.loans, [], "loans forgiven");
  assert.equal(g.bankruptcies, 1);
});
test("deliverOrders ignores orders not yet due and delivers due ones", () => {
  const g = newGame(world, A, { cash: 1e6 });
  const r = orderShip(g, "barca", A);
  assert.ok(r.ok);
  deliverOrders(g);
  assert.equal(g.ships.length, 1, "nothing delivered before readyDay");
  g.day = r.readyDay;
  deliverOrders(g);
  assert.equal(g.ships.length, 2, "the finished order arrives");
  assert.equal(g.orders.length, 0);
});
