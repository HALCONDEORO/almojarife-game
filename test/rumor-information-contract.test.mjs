import test from 'node:test';
import assert from 'node:assert/strict';
import { loadWorld } from '../src/sim/world.mjs';
import { newGame, buyRumor, RUMOR_PRICE, advanceDay } from '../src/game/game.mjs';
import { knownMarket } from '../src/game/intel.mjs';
import { serialize, deserialize } from '../src/game/gamesave.mjs';

const world = loadWorld();
const fresh = () => newGame(world, 'cadiz', { seed: 491 });
const state = game => serialize(game, 'Rumour contract', 0).state;

for (const [label, prepare, target, at, reason] of [
 ['game over', game => { game.over = 'win'; }, 'huelva', 'cadiz', 'game over'],
 ['unknown destination', () => {}, 'atlantis', 'cadiz', 'unknown city'],
 ['no local ship', () => {}, 'huelva', 'malaga', 'no ship here'],
 ['ship underway', game => { game.ships[0].voyage = { path: ['cadiz', 'huelva'], km: 100, totalTicks: 20, ticksLeft: 20 }; }, 'huelva', 'cadiz', 'no ship here'],
 ['live destination', () => {}, 'cadiz', 'cadiz', 'already known'],
 ['insufficient coins', game => { game.cash = RUMOR_PRICE - 1; }, 'huelva', 'cadiz', 'no cash'],
]) test(`rejected tavern information changes no game state: ${label}`, () => {
 const game = fresh(); prepare(game); const before = state(game);
 assert.deepEqual(buyRumor(game, target, at), { ok: false, reason });
 assert.deepEqual(state(game), before, 'no payment, discovery, log, delivery or order on rejection');
});

test('paying exactly the price delivers information and discovery, never cargo or an accepted order', () => {
 const game = fresh(), city = 'barcelona'; game.cash = RUMOR_PRICE;
 assert.ok(!Object.hasOwn(game.discovered, city));
 const before = state(game);
 assert.deepEqual(buyRumor(game, city, 'cadiz'), { ok: true });
 assert.equal(game.cash, 0);
 assert.equal(game.discovered[city], game.day);
 assert.equal(game.intel[city].day, game.day); assert.equal(game.intel[city].exact, false);
 assert.equal(game.log.filter(row => row.key === 'rumor').length, 1);
 assert.equal(game.log.filter(row => row.key === 'discovered' && row.city === city).length, 1);
 const after = state(game);
 for (const key of ['cash', 'intel', 'discovered', 'log']) { delete before[key]; delete after[key]; }
 assert.deepEqual(after, before, 'all non-information state is unchanged, including orders, contracts, campaign, cargo, warehouses and market');
});

test('paid information remains dated and stale through real days and reload without replaying a payment or delivery', () => {
 const game = fresh(), city = 'barcelona';
 assert.ok(buyRumor(game, city, 'cadiz').ok);
 const snapshot = structuredClone(game.intel[city]), cash = game.cash;
 const loaded = deserialize(serialize(game, 'Paid information', 0), world).g;
 assert.equal(loaded.cash, cash);
 assert.deepEqual(loaded.intel[city], snapshot);
 assert.equal(loaded.log.filter(row => row.key === 'rumor').length, 1);
 for (let day = 0; day < 3; day++) advanceDay(loaded);
 assert.deepEqual(loaded.intel[city], snapshot, 'today\'s market does not replace the paid observation');
 assert.deepEqual(knownMarket(loaded).age[city], { days: 3, exact: false });
 assert.equal(loaded.log.filter(row => row.key === 'rumor').length, 1, 'clock and reload do not buy another rumour');
 const final = deserialize(serialize(loaded, 'Stale information', 0), world).g;
 assert.deepEqual(final.intel[city], snapshot);
 assert.deepEqual(knownMarket(final).age[city], { days: 3, exact: false });
 assert.equal(final.cash, loaded.cash, 'reload adds no extra charge');
});
