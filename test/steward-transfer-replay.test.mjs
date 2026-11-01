import test from 'node:test';
import assert from 'node:assert/strict';
import { loadWorld } from '../src/sim/world.mjs';
import { newGame, advanceDay, buyWarehouse, warehouseCap, takeGoods, storeGoods } from '../src/game/game.mjs';
import { setStewardRule, setStewardReserve } from '../src/game/steward.mjs';
import { setWarehouseLock } from '../src/game/whlock.mjs';
import { serialize, deserialize } from '../src/game/gamesave.mjs';

const world = loadWorld();
const pack = game => serialize(game, 'Transfer replay', 0);
const reload = game => deserialize(pack(game), world).g;
function fixture() {
  const game = newGame(world, 'cadiz', { seed: 73 });
  game.cash = 20000;
  assert.ok(buyWarehouse(game, 'cadiz').ok);
  const entry = game.market.cadiz.grain;
  entry.stock = entry.target * 4;
  const cap = warehouseCap(game, 'cadiz');
  assert.ok(setStewardRule(game, 'cadiz', 'grain', { buyBelow: 999, buyTo: 20 }, cap).ok);
  assert.ok(setStewardReserve(game, 'cadiz', 1000).ok);
  return game;
}
const quantities = game => {
  const store = game.warehouses.cadiz, ship = game.ships[0];
  return { units: (store.goods.grain ?? 0) + (ship.cargo.grain ?? 0), basis: (store.basis.grain ?? 0) + (ship.basis?.grain ?? 0) };
};

test('real daily auto-buy replenishes only transferred deficit, not the whole target', () => {
  const game = fixture();
  advanceDay(game);
  assert.equal(game.warehouses.cadiz.goods.grain, 20);
  const initial = quantities(game), cash = game.cash;
  assert.deepEqual(takeGoods(game, game.ships[0], 'grain', 7), { ok: true, qty: 7 });
  assert.deepEqual(quantities(game), initial, 'loading conserves goods and paid basis');
  assert.equal(game.cash, cash, 'transfer is not a purchase');
  advanceDay(game);
  assert.equal(game.warehouses.cadiz.goods.grain, 20);
  assert.equal(game.ships[0].cargo.grain, 7);
  assert.equal(quantities(game).units, 27, 'only seven new market units entered the house');
  const filled = quantities(game), filledCash = game.cash;
  advanceDay(game);
  assert.deepEqual(quantities(game), filled, 'target reached: no repeated purchase or invented basis');
  assert.equal(game.cash, filledCash, 'no daily upkeep payment or new buy before settlement');
  assert.ok(game.cash >= 1000, 'cash reserve remains intact');
});

test('mixed loading, restocking, lock and unlock replay identically across daily reload', () => {
  const uninterrupted = fixture(); let resumed = reload(uninterrupted);
  for (let day = 0; day < 12; day++) {
    for (const game of [uninterrupted, resumed]) {
      const ship = game.ships[0];
      if (day === 2) {
        const before = quantities(game);
        assert.ok(takeGoods(game, ship, 'grain', 7).ok);
        assert.deepEqual(quantities(game), before);
      }
      if (day === 4) {
        assert.ok(setWarehouseLock(game, 'cadiz', 'grain', 'outflow', true).ok);
        const before = JSON.stringify(game);
        assert.equal(takeGoods(game, ship, 'grain', 1).reason, 'locked');
        assert.equal(JSON.stringify(game), before, 'rejected transfer does not touch accounts');
        const quantity = quantities(game);
        assert.ok(storeGoods(game, ship, 'grain', 3).ok, 'inflow remains open under lock');
        assert.deepEqual(quantities(game), quantity);
      }
      if (day === 6) {
        assert.ok(setWarehouseLock(game, 'cadiz', 'grain', 'outflow', false).ok);
        assert.ok(takeGoods(game, ship, 'grain', 5).ok);
      }
      if (day === 8) assert.ok(storeGoods(game, ship, 'grain', Infinity).ok);
      advanceDay(game);
    }
    resumed = reload(resumed);
    assert.deepEqual(pack(resumed), pack(uninterrupted), `entire saved state after day ${day + 1}`);
  }
});
