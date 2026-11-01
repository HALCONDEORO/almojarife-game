import test from 'node:test';
import assert from 'node:assert/strict';
import { loadWorld } from '../src/sim/world.mjs';
import { newGame, advanceDay } from '../src/game/game.mjs';
import { hireContact, tickContacts, CONTACT_EVERY } from '../src/game/contacts.mjs';
import { serialize, deserialize } from '../src/game/gamesave.mjs';

const world = loadWorld();
function report() {
 const game = newGame(world, 'cadiz', { seed: 97 });
 assert.ok(hireContact(game, 'cadiz').ok);
 game.ships[0].at = 'huelva';
 for (let day = 0; day < CONTACT_EVERY; day++) advanceDay(game);
 assert.equal(game.contacts[0].reports, 1);
 assert.equal(game.intel.cadiz.exact, false);
 assert.equal(game.intel.cadiz.day, CONTACT_EVERY);
 return game;
}
function verifyIsolation(game) {
 const snapshot = game.intel.cadiz.cells, original = structuredClone(snapshot);
 const live = game.market.cadiz.grain.commerce;
 assert.notEqual(snapshot.grain.commerce, live);
 assert.notEqual(snapshot.grain.commerce.households, live.households);
 assert.notEqual(snapshot.grain.commerce.inventoryBasis, live.inventoryBasis);
 live.cash += 17; live.inventoryBasis.grain += 3; live.households.poor.cash += 11;
 assert.deepEqual(snapshot, original, 'later public accounts cannot rewrite a dated report');
 const publicAccounts = structuredClone(game.market.cadiz);
 snapshot.grain.commerce.cash += 19;
 snapshot.grain.commerce.inventoryBasis.grain += 5;
 snapshot.grain.commerce.households.poor.cash += 7;
 assert.deepEqual(game.market.cadiz, publicAccounts, 'intel edits cannot mutate actual public accounts');
}

test('contact report delivered through advanceDay owns its nested commerce records', () => {
 verifyIsolation(report());
});

test('report date and nested snapshot survive real days and reload without another report', () => {
 const game = report(), snapshot = structuredClone(game.intel.cadiz), cash = game.cash;
 const loaded = deserialize(serialize(game, 'Contact snapshot', 0), world).g;
 assert.equal(loaded.cash, cash);
 assert.deepEqual(loaded.contacts, game.contacts);
 assert.deepEqual(loaded.intel.cadiz, snapshot);
 for (let day = 0; day < 3; day++) advanceDay(loaded);
 assert.equal(loaded.contacts[0].reports, 1);
 assert.deepEqual(loaded.intel.cadiz, snapshot, 'no weekly report means no refreshed commerce or date');
 const reopened = deserialize(serialize(loaded, 'Dated report', 0), world).g;
 assert.deepEqual(reopened.intel.cadiz, snapshot);
 assert.equal(reopened.cash, loaded.cash);
 verifyIsolation(reopened);
});

test('a repeated tick on the report day neither delivers nor charges again', () => {
 const game = report(), before = serialize(game, 'Same day', 0);
 tickContacts(game);
 assert.deepEqual(serialize(game, 'Same day', 0), before);
});
