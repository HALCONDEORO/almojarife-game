// Preventive contracts for Almojarife's own repair refund and build-delivery rules.
// No external game's phase, material, cancellation or refund policy is imported.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadWorld } from '../src/sim/world.mjs';
import { newGame, orderRepair, processRepairs, cancelRepair, repairOf, orderShip, deliverOrders } from '../src/game/game.mjs';
import { serialize, deserialize } from '../src/game/gamesave.mjs';

const world = loadWorld();
const restored = game => deserialize(serialize(game, 'Yard settlement'), world).g;
function damagedShip() {
  const game = newGame(world);
  game.cash = 100000;
  const ship = game.ships[0];
  ship.hull = 0;
  ship.cargo = { salt: 8 };
  return { game, ship };
}

test('cancel after reload refunds undelivered work once, retains hull progress and never resumes it', () => {
  const { game, ship } = damagedShip();
  const ordered = orderRepair(game, [ship.id], ship.at);
  assert.ok(ordered.ok, 'repair accepted');
  processRepairs(game);
  const loaded = restored(game), hull = loaded.ships[0];
  const order = repairOf(loaded, hull.id);
  assert.ok(order.left > 0 && order.left < order.total, 'fixture has both delivered and undelivered work');
  const refund = Math.floor(order.cost * order.left / order.total), cash = loaded.cash;
  const progress = hull.hull, cargo = structuredClone(hull.cargo);
  assert.deepEqual(cancelRepair(loaded, order.id), { ok: true, refund });
  assert.equal(loaded.cash, cash + refund, 'only the undelivered share returns');
  assert.equal(hull.hull, progress, 'cancellation does not undo delivered work');
  assert.deepEqual(hull.cargo, cargo, 'repair does not consume trading cargo');
  const closed = restored(loaded), before = JSON.stringify(closed);
  assert.equal(cancelRepair(closed, order.id).reason, 'no order', 'closed order does not return with the save');
  processRepairs(closed);
  assert.equal(JSON.stringify(closed), before, 'replay refunds nothing, posts nothing and repairs nothing');
});

test('completed repairs cannot be cancelled for money after reload or post a second completion', () => {
  const { game, ship } = damagedShip();
  ship.hull = 80;
  const ordered = orderRepair(game, [ship.id], ship.at);
  assert.ok(ordered.ok, 'repair accepted');
  processRepairs(game);
  assert.equal(ship.hull, 100, 'the last daily delivery is clamped');
  assert.equal(repairOf(game, ship.id), null, 'completed order is removed');
  assert.equal(game.inbox.filter(message => message.kind === 'repairDone' && message.orderId === ordered.id).length, 1, 'one completion notice');
  const loaded = restored(game), before = JSON.stringify(loaded);
  assert.equal(cancelRepair(loaded, ordered.id).reason, 'no order', 'completion is not an unused refund');
  processRepairs(loaded);
  assert.equal(JSON.stringify(loaded), before, 'reloaded completion is final across cash, hull and inbox');
});

test('a due construction order materializes once, including saved-before and saved-after delivery', () => {
  const { game, ship } = damagedShip();
  const ordered = orderShip(game, 'barca', ship.at);
  assert.ok(ordered.ok, 'new hull ordered');
  game.day = ordered.readyDay;
  const loaded = restored(game), fleet = loaded.ships.length, nextId = loaded.nextId, cash = loaded.cash;
  deliverOrders(loaded);
  assert.equal(loaded.ships.length, fleet + 1, 'exactly one new hull');
  assert.equal(loaded.ships.at(-1).id, nextId, 'one fleet identity allocated');
  assert.equal(loaded.nextId, nextId + 1, 'the ID counter moves once');
  assert.equal(loaded.orders.length, 0, 'the due order is consumed');
  assert.equal(loaded.cash, cash, 'delivery does not charge the order again');
  const delivered = JSON.stringify(loaded);
  deliverOrders(loaded);
  assert.equal(JSON.stringify(loaded), delivered, 'repeated delivery is a full no-op');
  const closed = restored(loaded), before = JSON.stringify(closed);
  deliverOrders(closed);
  assert.equal(JSON.stringify(closed), before, 'reload cannot recreate a delivered hull or its messages');
});
