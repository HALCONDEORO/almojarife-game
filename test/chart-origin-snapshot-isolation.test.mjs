import test from 'node:test';
import assert from 'node:assert/strict';
import { loadWorld } from '../src/sim/world.mjs';
import { newGame, advanceDay } from '../src/game/game.mjs';
import { buyRouteRumor, ROUTE_RUMOR_PRICE } from '../src/game/charts.mjs';
import { defaultProfile, startOptions } from '../src/game/profile.mjs';
import { initOrigin } from '../src/game/origin.mjs';
import { serialize, deserialize } from '../src/game/gamesave.mjs';
import { seeded } from '../src/view/cityscene.mjs';

const world = loadWorld();
function make(kind) {
 if (kind === 'route') {
  const game = newGame(world, 'cadiz', { seed: 42 });
  const cash = game.cash, market = structuredClone(game.market);
  const result = buyRouteRumor(game, 'cadiz'); assert.ok(result.ok);
  assert.equal(game.cash, cash - ROUTE_RUMOR_PRICE);
  assert.deepEqual(game.market, market, 'buying information does not change real stock or accounts');
  return { game, city: result.city };
 }
 const profile = { ...defaultProfile('Casa del Alba'), background: 'scholar', home: 'cadiz' };
 const options = { ...startOptions(profile), profile, seed: 42 };
 const game = newGame(world, 'cadiz', options);
 const control = newGame(world, 'cadiz', { ...options, originConnections: false });
 assert.deepEqual(game.market, control.market);
 assert.equal(game.cash, control.cash);
 assert.deepEqual(game.ships, control.ships);
 assert.deepEqual(game.discovered, control.discovered);
 return { game, city: game.originStart.city };
}
for (const kind of ['route', 'scholar']) {
 test(`${kind} snapshot preserves seeded stock figures and owns nested commerce in both directions`, () => {
  const { game, city } = make(kind); assert.ok(city);
  const snapshot = game.intel[city], original = structuredClone(snapshot);
  assert.equal(snapshot.exact, false); assert.equal(snapshot.day, game.day);
  const random = seeded(kind === 'route' ? `route:${city}:${game.day}` : `origin:${city}:${game.seed}`);
  for (const [good, cell] of Object.entries(snapshot.cells)) {
   const actual = game.market[city][good];
   assert.equal(cell.stock, Math.max(0, Math.round(actual.stock * (1 + (random() * 2 - 1) * 0.25))));
   if (actual.commerce) {
    assert.notEqual(cell.commerce, actual.commerce);
    assert.notEqual(cell.commerce.households, actual.commerce.households);
    assert.notEqual(cell.commerce.inventoryBasis, actual.commerce.inventoryBasis);
   }
  }
  const live = game.market[city].grain.commerce;
  live.cash += 17; live.inventoryBasis.grain += 3; live.households.poor.cash += 11;
  assert.deepEqual(snapshot, original, 'live writes cannot change an old observation');
  const market = structuredClone(game.market);
  snapshot.cells.grain.commerce.cash += 19;
  snapshot.cells.grain.commerce.inventoryBasis.grain += 5;
  snapshot.cells.grain.commerce.households.poor.cash += 7;
  assert.deepEqual(game.market, market, 'observation writes cannot change public accounts');
 });
 test(`${kind} snapshot stays dated through real days and reload without replaying its purchase or grant`, () => {
  const { game, city } = make(kind), original = structuredClone(game.intel[city]);
  const loaded = deserialize(serialize(game, 'Dated observation', 0), world).g;
  assert.equal(loaded.cash, game.cash);
  assert.deepEqual(loaded.intel[city], original);
  for (let day = 0; day < 3; day++) advanceDay(loaded);
  assert.deepEqual(loaded.intel[city], original);
  const reopened = deserialize(serialize(loaded, 'Old observation', 0), world).g;
  assert.equal(reopened.cash, loaded.cash);
  assert.deepEqual(reopened.intel[city], original);
  const before = serialize(reopened, 'No replay', 0);
  if (kind === 'scholar') assert.equal(initOrigin(reopened), false);
  assert.deepEqual(serialize(reopened, 'No replay', 0), before);
 });
}
