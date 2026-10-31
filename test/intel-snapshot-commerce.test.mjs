import test from 'node:test';
import assert from 'node:assert/strict';
import { loadWorld } from '../src/sim/world.mjs';
import { newGame } from '../src/game/game.mjs';
import { refreshIntel, buyRumor } from '../src/game/intel.mjs';
import { refreshBotKnowledge } from '../src/game/botintel.mjs';
import { serialize, deserialize, SAVE_VERSION } from '../src/game/gamesave.mjs';

const world = loadWorld();
function snapshotOwnsCommerce(game, city, snapshot) {
  const original = JSON.stringify(snapshot);
  const commerce = game.market[city].grain.commerce;
  assert.notEqual(snapshot.grain.commerce, commerce);
  assert.notEqual(snapshot.grain.commerce.households, commerce.households);
  commerce.cash += 17;
  commerce.inventoryBasis.grain += 3;
  commerce.households.poor.cash += 11;
  assert.equal(JSON.stringify(snapshot), original, 'live nested writes cannot rewrite an observation');
}

test('exact player and bot snapshots own nested commerce records', () => {
  const game = newGame(world);
  refreshIntel(game);
  snapshotOwnsCommerce(game, 'cadiz', game.intel.cadiz.cells);
  const bot = game.ai[0];
  refreshBotKnowledge(game, bot);
  snapshotOwnsCommerce(game, bot.ship.at, bot.intel[bot.ship.at].cells);
});

test('paid rumour owns its commerce snapshot and cannot write back into live accounts', () => {
  const game = newGame(world);
  assert.ok(buyRumor(game, 'huelva').ok);
  snapshotOwnsCommerce(game, 'huelva', game.intel.huelva.cells);
  const before = JSON.stringify(game.market.huelva);
  game.intel.huelva.cells.grain.commerce.cash += 19;
  game.intel.huelva.cells.grain.commerce.households.poor.cash += 7;
  assert.equal(JSON.stringify(game.market.huelva), before);
});

test('existing version-3 save data loads unchanged and stays detached without migration', () => {
  const game = newGame(world);
  const save = serialize(game, 'Existing save fixture', 0);
  assert.equal(save.version, SAVE_VERSION);
  assert.equal(save.version, 3);
  const loaded = deserialize(save, world).g;
  assert.equal(JSON.stringify(loaded), JSON.stringify(game), 'no data or schema change at load');
  snapshotOwnsCommerce(loaded, 'cadiz', loaded.intel.cadiz.cells);
});
