import test from 'node:test';
import assert from 'node:assert/strict';
import { loadWorld } from '../src/sim/world.mjs';
import { newGame } from '../src/game/game.mjs';
import { hallView } from '../src/view/townhallview.mjs';
import { ensureRep, repOf, respectIndex, RESPECT } from '../src/game/rank.mjs';
import { serialize, deserialize } from '../src/game/gamesave.mjs';

const world = loadWorld();
for (const [label, rep, version] of [
 ['absent', null, null], ['legacy points', { cadiz: 25.6, sevilla: '101', huelva: -2 }, null],
 ['legacy invalid', { cadiz: 'bad', sevilla: 0 }, 1], ['current coins', { cadiz: 2560, sevilla: 10100 }, 2],
]) test(`opening and reopening hall keeps ${label} reputation and all state unchanged`, () => {
 const game = newGame(world, 'cadiz', { seed: 92 });
 if (rep === null) delete game.rep; else game.rep = structuredClone(rep);
 if (version === null) delete game.repV; else game.repV = version;
 const normalized = structuredClone(game); ensureRep(normalized);
 const before = JSON.stringify(game);
 for (const city of ['cadiz', 'sevilla', 'huelva', 'cadiz']) {
  const points = repOf(normalized, city), card = hallView(game, city);
  assert.equal(card.respectPts, Math.floor(points));
  assert.equal(card.respectId, RESPECT[respectIndex(points)].id);
  assert.equal(JSON.stringify(game), before, 'read does not create, convert or rewrite saved reputation');
 }
 const reopened = deserialize(serialize(game, 'Read only hall', 0), world).g;
 const saved = serialize(reopened, 'Read only hall', 0);
 hallView(reopened, 'cadiz'); hallView(reopened, 'sevilla');
 assert.deepEqual(serialize(reopened, 'Read only hall', 0), saved, 'reloading does not make reading a migration');
});

test('memory-adjusted respect keeps the existing display and discount without updating the record', () => {
 const game = newGame(world, 'cadiz', { seed: 92 });
 delete game.repV; game.rep = { cadiz: 100 };
 game.cityMemory = true;
 game.memoryDeeds = { cadiz: { favor: [{ day: 0, qty: 200 }], grievance: [], bots: [] } };
 const normalized = structuredClone(game); ensureRep(normalized);
 const expected = hallView(normalized, 'cadiz'), before = JSON.stringify(game);
 assert.deepEqual(hallView(game, 'cadiz'), expected);
 assert.equal(JSON.stringify(game), before);
});
