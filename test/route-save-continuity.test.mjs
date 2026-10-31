// Preventive continuity checks for Almojarife's own route scheduler and save format.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadWorld } from '../src/sim/world.mjs';
import { newGame, advanceDay, setRouteAdv, repairOf } from '../src/game/game.mjs';
import { serialize, deserialize } from '../src/game/gamesave.mjs';

const world = loadWorld();
const restored = game => deserialize(serialize(game, 'Route continuity fixture'), world).g;
function fixture(hull = 100) {
  const game = newGame(world, 'cadiz', { embargo: false });
  game.eventsOn = false;
  game.noGoal = true;
  game.cash = 100000;
  const ship = game.ships[0];
  ship.hull = hull;
  ship.cargo = {};
  assert.ok(setRouteAdv(game, ship, [
    { city: 'cadiz', buy: [{ good: 'grain' }], sell: [{ good: 'wine' }] },
    { city: 'huelva', buy: [{ good: 'wine' }], sell: [{ good: 'grain' }] },
  ], { minCash: 500 }).ok);
  return { game, ship };
}

function compareContinuation(game, days) {
  let loaded = restored(game);
  for (let day = 0; day < days; day++) {
    advanceDay(game);
    advanceDay(loaded);
    assert.equal(JSON.stringify(loaded), JSON.stringify(game), `whole state after continuation day ${day + 1}`);
    loaded = restored(loaded);
  }
  return loaded;
}

test('a bought outbound voyage continues identically when reloaded every day', () => {
  const { game, ship } = fixture();
  const stock = game.market.cadiz.grain.stock;
  advanceDay(game);
  assert.ok(ship.cargo.grain > 0, 'real scheduler bought outbound cargo');
  assert.ok(game.market.cadiz.grain.stock < stock, 'origin market was debited');
  assert.equal(ship.voyage?.to, 'huelva');
  assert.equal(ship.route.idx, 1, 'next stop already recorded before saving');
  const loaded = compareContinuation(game, 24);
  assert.ok(loaded.inbox.some(message => message.kind === 'routeLeg'), 'continued route made a real sale');
  assert.ok(loaded.ships[0].route.legs >= 1, 'continued route completed a circuit');
});

test('a route saved in the repair queue resumes without an extra order or charge', () => {
  const { game, ship } = fixture(40);
  advanceDay(game);
  assert.ok(repairOf(game, ship.id), 'actual scheduler placed repair before loading');
  assert.equal(ship.voyage, null);
  assert.deepEqual(ship.cargo, {});
  const loaded = compareContinuation(game, 8);
  assert.equal(loaded.inbox.filter(message => message.kind === 'routeRepair').length, 1);
  assert.equal(loaded.inbox.filter(message => message.kind === 'repairDone').length, 1);
  assert.equal(repairOf(loaded, ship.id), null);
  assert.ok(loaded.ships[0].cargo.grain > 0 || loaded.inbox.some(message => message.kind === 'routeLeg'), 'resumed loading or sale after repair');
});
