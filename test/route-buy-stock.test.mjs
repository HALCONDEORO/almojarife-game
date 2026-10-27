import test from 'node:test';
import assert from 'node:assert/strict';
import { loadWorld } from '../src/sim/world.mjs';
import { newGame, doBuy, doSell, doSail, setRouteAdv } from '../src/game/game.mjs';
import { processRoutes } from '../src/game/routes.mjs';
import { shipCapacity } from '../src/sim/trade.mjs';
const world = loadWorld();
function setup(stock) {
  const g = newGame(world), s = g.ships[0], a = s.at;
  const b = world.cities.find(c => c.id !== a).id;
  g.eventsOn = false; g.cash = 1e7; s.cargo = {};
  g.market[a].grain.stock = stock;
  assert.ok(setRouteAdv(g, s, [{city:a,buy:[{good:'grain'}]}, {city:b,sell:[{good:'grain'}]}]).ok);
  return {g,s,a};
}
for (const stock of [1, 2, 5, 10]) test(`advanced route buys all ${stock} available units when room and cash allow`, () => {
  const {g,s,a} = setup(stock);
  processRoutes(g, {doBuy,doSell,doSail});
  assert.equal(s.cargo.grain, stock);
  assert.equal(g.market[a].grain.stock, 0);
});
test('advanced route still respects hold capacity when stock exceeds it', () => {
  const {g,s,a} = setup(1000), cap = shipCapacity(s);
  processRoutes(g, {doBuy,doSell,doSail});
  assert.equal(s.cargo.grain, cap);
  assert.equal(g.market[a].grain.stock, 1000-cap);
});
test('empty stock neither buys nor sails an empty ship', () => {
  const {g,s,a} = setup(0), cash = g.cash;
  processRoutes(g, {doBuy,doSell,doSail});
  assert.equal(s.cargo.grain ?? 0, 0);
  assert.equal(g.cash, cash);
  assert.equal(s.at,a); assert.equal(s.voyage,null);
});
