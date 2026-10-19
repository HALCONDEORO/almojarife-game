import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { makeMarket } from "../src/sim/market.mjs";
import { makeShip, sail, tickShip, buy, sell, cargoUsed, SHIP_TYPES } from "../src/sim/trade.mjs";
const world = loadWorld();
const [A, B] = [world.cities[0].id, world.cities[1].id];

test("a voyage takes whole days and ends in the destination", () => {
  const s = makeShip(1, "cog", A);
  const r = sail(world, s, B);
  assert.ok(r.ok && r.days >= 1);
  for (let i = 0; i < r.days - 1; i++) { tickShip(s); assert.equal(s.at, A); }
  tickShip(s);
  assert.equal(s.at, B); assert.equal(s.voyage, null);
});
test("a ship at sea cannot sail or trade", () => {
  const s = makeShip(1, "cog", A), m = makeMarket(world);
  sail(world, s, B);
  assert.equal(sail(world, s, A).ok, false);
  assert.equal(buy(world, m, s, 1e6, "salt", 1).ok, false);
});
test("caravel is faster than cog on the same route", () => {
  const c = sail(world, makeShip(1, "cog", A), B), v = sail(world, makeShip(2, "caravel", A), B);
  assert.ok(v.days <= c.days);
});
test("buying respects stock, capacity and cash; selling returns less than buying cost (fees)", () => {
  const m = makeMarket(world), s = makeShip(1, "cog", A);
  const good = world.cities[0].makes[0];
  const stock0 = m[A][good].stock;
  const b = buy(world, m, s, 1e9, good, 1e6);
  assert.ok(b.ok && b.qty <= stock0 && cargoUsed(s) <= SHIP_TYPES.cog.capacity);
  assert.equal(m[A][good].stock, stock0 - b.qty);
  const r = sell(world, m, s, good, b.qty);
  assert.ok(r.ok && r.revenue < b.cost, "round trip in one port must lose to fees");
  assert.equal(cargoUsed(s), 0);
  assert.equal(buy(world, m, s, 0, good, 5).ok, false);
});
test("stock never goes negative via trading", () => {
  const m = makeMarket(world), s = makeShip(1, "cog", A);
  const good = world.cities[0].makes[0];
  for (let i = 0; i < 20; i++) { buy(world, m, s, 1e9, good, 100); sell(world, m, s, good, 100); }
  assert.ok(m[A][good].stock >= 0);
});
test("invalid quantity or cash is rejected and changes nothing", () => {
  const m = makeMarket(world), s = makeShip(1, "cog", A);
  const good = world.cities[0].makes[0];
  buy(world, m, s, 1e9, good, 10);
  const before = JSON.stringify([m, s]);
  for (const q of [0.5, -1, NaN, Infinity, "3", undefined, 2 ** 60]) {
    assert.equal(buy(world, m, s, 1e9, good, q).ok, false);
    assert.equal(sell(world, m, s, good, q).ok, false);
  }
  for (const c of [NaN, undefined, -5, Infinity, "9"]) assert.equal(buy(world, m, s, c, good, 1).ok, false);
  assert.equal(JSON.stringify([m, s]), before);
});
test("inherited names are not ship types", () => {
  for (const t of ["constructor", "toString", "__proto__", "hasOwnProperty"]) assert.throws(() => makeShip(1, t, A));
});
test("partly affordable order never spends more than cash; marginal price rises on buy and falls on sell", () => {
  const m = makeMarket(world), s = makeShip(1, "cog", A);
  const good = world.cities[0].makes[0];
  const b = buy(world, m, s, 100, good, 50);
  assert.ok(b.ok && b.cost <= 100 && b.qty < 50);
  const m2 = makeMarket(world), s2 = makeShip(2, "cog", A);
  const one = buy(world, m2, s2, 1e9, good, 1).cost;
  const ten = buy(world, m2, s2, 1e9, good, 10);
  assert.ok(ten.cost / 10 >= one, "average price of later units is not lower");
  const sells = [];
  for (let i = 0; i < 4; i++) sells.push(sell(world, m2, s2, good, 1).revenue);
  assert.ok(sells.every((v, i) => i === 0 || v <= sells[i - 1]), "marginal sell price never rises");
});
