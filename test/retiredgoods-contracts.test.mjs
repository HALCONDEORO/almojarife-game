// Metamorphic contracts for save normalization: never mint goods, money, or mutate static data.
import test from 'node:test';
import assert from 'node:assert/strict';
import { migrateRetired, RETIRED_GOODS, RETIRED_BUILDINGS } from '../src/game/gamesave.mjs';
import { makeRng } from '../src/sim/rng.mjs';

function fixture(seed) {
  const rng = makeRng(seed);
  const count = () => rng.int(0, 10000);
  const pair = (from, to) => ({ [from]: count(), [to]: count(), grain: count() });
  const goods = Object.entries(RETIRED_GOODS);
  return {
    cash: -123.45, day: 88, tick: 900,
    world: { goods: Object.fromEntries(goods.map(([from]) => [from, { base: 7 }])) },
    market: { cadiz: Object.fromEntries(goods.flatMap(([from,to]) => [[from,{stock:count(),pop:100}],[to,{stock:count(),pop:100}]])) },
    ships: goods.map(([from,to]) => ({ cargo: pair(from,to), basis: pair(from,to) })),
    warehouses: { cadiz: Object.fromEntries(goods.flatMap(([from,to]) => [[from,{qty:count(),basis:count()}],[to,{qty:count(),basis:count()}]])) },
    orders: goods.map(([from]) => ({ good: from, qty: count() })),
    routes: goods.map(([from]) => [from, 'grain']),
    buildings: Object.keys(RETIRED_BUILDINGS).map(type => ({ type, level: 2 })),
  };
}

for (const seed of [0, 1, 42, 0xffffffff]) {
  test(`retired goods conserve cargo, cost basis, warehouses and cash (seed ${seed})`, () => {
    const g = fixture(seed), before = structuredClone(g), world = g.world;
    assert.strictEqual(migrateRetired(g), g, 'normalization returns its input');
    assert.strictEqual(g.world, world, 'static world reference is preserved');
    assert.deepEqual(g.world, before.world, 'static world content is not migrated');
    assert.equal(g.cash, before.cash, 'normalization is not a trade');
    assert.equal(g.day, before.day);
    assert.equal(g.tick, before.tick);
    for (const [i, [from,to]] of Object.entries(RETIRED_GOODS).entries()) {
      for (const field of ['cargo','basis']) {
        assert.equal(g.ships[i][field][to], before.ships[i][field][from] + before.ships[i][field][to]);
        assert.ok(!Object.hasOwn(g.ships[i][field], from));
        assert.equal(g.ships[i][field].grain, before.ships[i][field].grain);
      }
      for (const field of ['qty','basis']) assert.equal(g.warehouses.cadiz[to][field], before.warehouses.cadiz[from][field] + before.warehouses.cadiz[to][field]);
      assert.ok(!Object.hasOwn(g.warehouses.cadiz, from));
      assert.deepEqual(g.market.cadiz[to], before.market.cadiz[to], 'existing live market row wins; do not merge market stock');
      assert.ok(!Object.hasOwn(g.market.cadiz, from));
      assert.equal(g.orders[i].good, to);
      assert.equal(g.orders[i].qty, before.orders[i].qty);
      assert.deepEqual(g.routes[i], [to, 'grain']);
    }
    assert.deepEqual(g.buildings, before.buildings.map(b => ({...b, type: RETIRED_BUILDINGS[b.type]})));
  });
  test(`repeating retired-goods normalization cannot duplicate assets (seed ${seed})`, () => {
    const g = fixture(seed);
    migrateRetired(g);
    const once = structuredClone(g);
    migrateRetired(g);
    assert.deepEqual(g, once);
  });
}

test('a retired-only market row is preserved exactly under its replacement id', () => {
  for (const [from,to] of Object.entries(RETIRED_GOODS)) {
    const row = {stock: 0, pop: 321, target: 50, price: 12};
    const g = {market: {cadiz: {[from]: row}}};
    migrateRetired(g);
    assert.strictEqual(g.market.cadiz[to], row);
    assert.ok(!Object.hasOwn(g.market.cadiz, from));
  }
});

test('zero current holdings do not discard retired stock or cost basis', () => {
  for (const [from,to] of Object.entries(RETIRED_GOODS)) {
    const g = {ships: [{cargo: {[from]: 9, [to]: 0}, basis: {[from]: 12.5, [to]: 0}}]};
    migrateRetired(g);
    assert.equal(g.ships[0].cargo[to], 9);
    assert.equal(g.ships[0].basis[to], 12.5);
  }
});
