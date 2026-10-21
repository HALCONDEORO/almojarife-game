import test from 'node:test';
import assert from 'node:assert/strict';
import { loadWorld } from '../src/sim/world.mjs';
import { newGame, buyWarehouse, doBuy, storeGoods } from '../src/game/game.mjs';
import { buyPlot, quoteConstruction, startConstruction } from '../src/game/buildings.mjs';
import { RECIPES } from '../src/sim/recipes.mjs';
const world = loadWorld();
function setup() {
  const g = newGame(world, 'cadiz', { cash: 50000, freePlay: true });
  assert.ok(buyWarehouse(g, 'cadiz').ok);
  assert.ok(buyPlot(g, 'cadiz', { id: 'cadiz:7', type: 'workshop', w: 4, d: 4 }).ok);
  return g;
}
function stock(g, good, qty) {
  assert.ok(doBuy(g, g.ships[0], good, qty).ok);
  assert.ok(storeGoods(g, g.ships[0], good, qty).ok);
}
test('construction consumes warehouse materials through player purchase/storage routes', () => {
  const g = setup();
  for (const [good, qty] of Object.entries(RECIPES.workshop)) stock(g, good, qty);
  const before = structuredClone(g.market.cadiz), cash = g.cash;
  const q = quoteConstruction(g, 'cadiz', 'cadiz:7', 'workshop');
  assert.ok(q.ok); assert.equal(q.materials, 0); assert.deepEqual(q.inputs, RECIPES.workshop);
  assert.ok(startConstruction(g, 'cadiz', 'cadiz:7', 'workshop').ok);
  assert.equal(g.cash, cash - q.fee);
  assert.deepEqual(g.market.cadiz, before);
  assert.deepEqual(g.warehouses.cadiz.goods, {});
  assert.deepEqual(g.warehouses.cadiz.basis, {});
});
test('partial warehouse supply pays only missing market units and keeps proportional basis', () => {
  const g = setup(); stock(g, 'timber', 15);
  const basis = g.warehouses.cadiz.basis.timber, m = g.market.cadiz.timber.stock;
  const q = quoteConstruction(g, 'cadiz', 'cadiz:7', 'workshop');
  assert.equal(q.fromStore.timber, 10); assert.equal(q.missing.timber, 0);
  assert.equal(q.missing.bricks, 10);
  assert.ok(startConstruction(g, 'cadiz', 'cadiz:7', 'workshop').ok);
  assert.equal(g.market.cadiz.timber.stock, m); assert.equal(g.warehouses.cadiz.goods.timber, 5);
  assert.equal(g.warehouses.cadiz.basis.timber, basis - Math.round(basis * 10 / 15));
});
test('insufficient cash or market materials consumes neither warehouse nor market', () => {
  const g = setup(); stock(g, 'timber', 8);
  g.cash = 1;
  const snapshot = JSON.stringify([g.market, g.warehouses, g.buildings, g.cash]);
  assert.equal(startConstruction(g, 'cadiz', 'cadiz:7', 'workshop').ok, false);
  assert.equal(JSON.stringify([g.market, g.warehouses, g.buildings, g.cash]), snapshot);
  g.cash = 50000; g.market.cadiz.bricks.stock = 0;
  // Since the materials-import change, empty shelves no longer block the works: the shortfall is imported at a premium.
  const cash0 = g.cash;
  const q = quoteConstruction(g, 'cadiz', 'cadiz:7', 'workshop');
  assert.ok(q.ok, 'import covers the missing bricks');
  assert.ok((q.imported?.bricks ?? 0) > 0, 'bricks are the imported part');
  assert.ok(startConstruction(g, 'cadiz', 'cadiz:7', 'workshop').ok);
  assert.equal(g.market.cadiz.bricks.stock, 0, 'imported bricks never touch the market');
  assert.equal(g.cash, cash0 - q.cost, 'pays the quoted import-inclusive price, not more');
});
test('construction requotes warehouse stock, never trusting a stale quote', () => {
  const g = setup(); stock(g, 'timber', 10);
  const q = quoteConstruction(g, 'cadiz', 'cadiz:7', 'workshop'); assert.ok(q.ok);
  g.warehouses.cadiz.goods.timber = 0; g.market.cadiz.timber.stock = 0;
  // With imports the works still start, but the price must be the FRESH re-quote (warehouse gone, timber imported), not the stale cheap one.
  const fresh = quoteConstruction(g, 'cadiz', 'cadiz:7', 'workshop'); assert.ok(fresh.ok);
  assert.ok(fresh.cost > q.cost, 'the fresh quote sees the empty warehouse and market');
  const cash0 = g.cash;
  assert.ok(startConstruction(g, 'cadiz', 'cadiz:7', 'workshop').ok);
  assert.equal(g.cash, cash0 - fresh.cost, 'pays the re-quoted price, never the stale one');
});
