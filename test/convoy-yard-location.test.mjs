import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { newGame, orderRepair, repairOf } from '../src/game/game.mjs';
import { formConvoy, convoyOf } from '../src/game/convoys.mjs';
import { loadWorld } from '../src/sim/world.mjs';
const source = readFileSync(new URL('../web/main.mjs', import.meta.url), 'utf8');
const binding = source.split('\n').find(line => line.includes('P.querySelectorAll("[data-cvrepair]")'));
const disabled = source.match(/data-cvrepair="1" \$\{([^}]+)\}/)[1];
function fixture(inCity, city3dId, cash = 20000) {
 const game = newGame(loadWorld(), 'cadiz', { seed: 442 }); game.cash = cash;
 const ship = game.ships[0]; ship.hull = 50;
 const mate = structuredClone(ship); mate.id = 2; mate.hull = 75; game.ships.push(mate);
 assert.ok(formConvoy(game, [ship.id, mate.id]).ok);
 const button = {}, context = vm.createContext({ g: game, s: ship, inCity, city3dId, orderRepair, repairOf, convoyOf,
  P: { querySelectorAll: () => [button] }, act: callback => callback() });
 vm.runInContext(binding, context);
 return { game, ship, mate, button };
}

test('the actual convoy repair button is disabled in another city, even with enough cash', () => {
 assert.equal(vm.runInNewContext(disabled, { away: true, g: { cash: 20000 }, cvrCost: 300 }), 'disabled');
 assert.equal(vm.runInNewContext(disabled, { away: false, g: { cash: 299 }, cvrCost: 300 }), 'disabled');
 assert.equal(vm.runInNewContext(disabled, { away: false, g: { cash: 300 }, cvrCost: 300 }), '');
});

test('the actual handler refuses another city without charging, queuing or posting', () => {
 const { game, button } = fixture(true, 'lisboa'), before = JSON.stringify(game);
 button.onclick();
 assert.equal(JSON.stringify(game), before);
});

for (const [label, inCity, city] of [['local city', true, 'cadiz'], ['map', false, null]]) {
 test(`the actual ${label} handler still orders all eligible convoy repairs for the current price`, () => {
  const { game, ship, mate, button } = fixture(inCity, city), cash = game.cash;
  button.onclick();
  assert.equal(game.cash, cash - 300);
  assert.deepEqual(repairOf(game, ship.id).ships, [ship.id, mate.id]);
  assert.equal(repairOf(game, ship.id), repairOf(game, mate.id));
  assert.equal(ship.hull, 50); assert.equal(mate.hull, 75);
  const before = JSON.stringify(game); button.onclick();
  assert.equal(JSON.stringify(game), before, 'repeated click never charges twice');
 });
}
