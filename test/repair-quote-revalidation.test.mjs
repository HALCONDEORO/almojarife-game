import test from 'node:test';
import assert from 'node:assert/strict';
import { loadWorld } from '../src/sim/world.mjs';
import { newGame, repairQuote, orderRepair, repairOf, processRepairs } from '../src/game/game.mjs';
import { serialize, deserialize } from '../src/game/gamesave.mjs';
const world = loadWorld();
function fixture() {
 const game = newGame(world, 'cadiz', { seed: 441, noGoal: true }); game.cash = 1000;
 const ship = game.ships[0]; ship.hull = 50;
 return { game, ship };
}

test('a viewed repair quote reserves no coins, hull progress, identity or queue slot', () => {
 const { game, ship } = fixture(), before = serialize(game, 'Quote only', 0);
 const quoted = repairQuote(game, [ship.id], ship.at);
 assert.ok(quoted.ok); assert.equal(quoted.cost, 200);
 assert.deepEqual(serialize(game, 'Quote only', 0), before);
 const loaded = deserialize(before, world).g;
 assert.equal(repairOf(loaded, ship.id), null);
 processRepairs(loaded);
 assert.deepEqual(serialize(loaded, 'Quote only', 0), before, 'opening a quote never scheduled delivery');
});

test('execution reprices changed hull damage and local reputation rather than trusting an old quote', () => {
 const { game, ship } = fixture();
 const quoted = repairQuote(game, [ship.id], ship.at); assert.equal(quoted.cost, 200);
 ship.hull = 25; game.portRep = { cadiz: 80 };
 const current = repairQuote(game, [ship.id], ship.at);
 assert.equal(current.cost, 240, '75 damage at the existing 20% reputation discount');
 assert.equal(current.days, 3);
 const before = game.cash, accepted = orderRepair(game, quoted.ships, quoted.at);
 assert.deepEqual(accepted, { ok: true, id: 1, cost: current.cost, days: current.days });
 assert.equal(game.cash, before - current.cost);
 assert.equal(ship.hull, 25, 'placing the order is not delivering a repair');
 assert.equal(repairOf(game, ship.id).total, 75);
});

test('a competing order can spend the quoted balance; stale unaffordable admission is atomic', () => {
 const { game, ship } = fixture(); game.cash = 200;
 const quoted = repairQuote(game, [ship.id], ship.at);
 const second = structuredClone(ship); second.id = 2; second.name = 'Segunda'; second.hull = 75;
 game.ships.push(second);
 assert.ok(orderRepair(game, [second.id], second.at).ok);
 assert.equal(game.cash, 100);
 const before = serialize(game, 'Competing repair', 0);
 assert.deepEqual(orderRepair(game, quoted.ships, quoted.at), { ok: false, reason: 'no cash' });
 assert.deepEqual(serialize(game, 'Competing repair', 0), before, 'no partial charge, new ID, normalization, queue or message');
 const loaded = deserialize(before, world).g;
 processRepairs(loaded);
 assert.equal(loaded.ships[0].hull, 50, 'the rejected ship was never queued');
 assert.equal(loaded.ships[1].hull, 100, 'the accepted independent order delivers');
});

for (const [label, mutate, reason] of [
 ['ownership changed', (game, ship) => { game.ships = game.ships.filter(entry => entry !== ship); }, 'unknown ship'],
 ['port changed', (game, ship) => { ship.at = 'huelva'; }, 'not in this port'],
 ['hull restored', (game, ship) => { ship.hull = 100; }, 'no damage'],
]) test(`a stale selection is rejected without any further mutation when ${label}`, () => {
 const { game, ship } = fixture(), quoted = repairQuote(game, [ship.id], ship.at);
 mutate(game, ship); const before = serialize(game, 'Stale selection', 0);
 assert.deepEqual(orderRepair(game, quoted.ships, quoted.at), { ok: false, reason });
 assert.deepEqual(serialize(game, 'Stale selection', 0), before);
});
