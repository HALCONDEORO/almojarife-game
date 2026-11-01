import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { initTutorial, tutorialNote, tutorialStep, tutorialHint, quietly, reviewTutorialHull, restartTutorial, skipTutorial } from '../src/game/tutorial.mjs';
import { loadWorld } from '../src/sim/world.mjs';
import { newGame, orderRepair } from '../src/game/game.mjs';
import { serialize, deserialize } from '../src/game/gamesave.mjs';
const world = loadWorld();
const ready = () => { const game = newGame(world, 'cadiz', { tutorial: true }); Object.assign(game.tut, { bought: true, sold: true, sailed: true }); return game; };
test('v4 replaces the automatic route with a shipyard review in both languages', () => {
 const game = ready(); assert.equal(game.tut.v, 4); assert.equal(tutorialStep(game), 'yard');
 assert.match(tutorialHint(game, 'es'), /Astillero/); assert.match(tutorialHint(game, 'en'), /Shipyard/);
 tutorialNote(game, 'route'); assert.equal(tutorialStep(game), 'yard');
 tutorialNote(game, 'yard'); assert.equal(tutorialStep(game), 'hall'); tutorialNote(game, 'hall'); assert.equal(tutorialStep(game), 'contract');
});
test('the actual city panel binding reviews only a sound locally docked ship, without a fee or hull damage', () => {
 const source = readFileSync('web/main.mjs', 'utf8');
 const binding = source.split('\n').find(line => line.startsWith('  if (tb === "yard" &&'));
 assert.ok(binding);
 for (const [hull, at, voyage, expected] of [[100,'cadiz',null,'hall'],[99,'cadiz',null,'yard'],[100,'lisboa',null,'yard'],[100,'cadiz',{},'yard']]) {
  const game = ready(); Object.assign(game.ships[0], { hull, at, voyage }); const cash = game.cash; let saved = 0;
  vm.runInNewContext(binding, { g: game, reviewTutorialHull, sel: 0, tb: 'yard', city3dId: 'cadiz', tutorialNote, autosave: () => saved++ });
  assert.equal(tutorialStep(game), expected); assert.equal(game.cash, cash + (expected === 'hall' ? 25 : 0)); assert.equal(game.ships[0].hull, hull); assert.equal(saved, expected === 'hall' ? 1 : 0);
 }
});
test('a damaged hull advances only after a successful normal paid repair order', () => {
 const game = ready(), ship = game.ships[0]; ship.hull = 50; game.cash = 0;
 assert.equal(orderRepair(game,[ship.id],ship.at).ok, false); assert.equal(tutorialStep(game),'yard');
 game.cash = 2000; const before = game.cash; const result = orderRepair(game,[ship.id],ship.at);
 assert.equal(result.ok,true); assert.equal(game.cash,before-result.cost+25); assert.equal(ship.hull,50); assert.equal(tutorialStep(game),'hall');
});
test('automated repair and an early inspection cannot teach the shipyard step', () => {
 const game = ready(), ship = game.ships[0]; ship.hull = 50; game.cash = 2000;
 quietly(() => orderRepair(game,[ship.id],ship.at)); assert.equal(tutorialStep(game),'yard');
 const fresh = {}; initTutorial(fresh); assert.equal(tutorialNote(fresh,'yard'),false); assert.equal(tutorialStep(fresh),'buy');
});
test('existing v3 saves keep their route step and completed progress', () => {
 const game = ready(); game.tut.v = 3; assert.equal(tutorialStep(game),'route'); assert.equal(tutorialNote(game,'yard'),false);
 tutorialNote(game,'route'); assert.equal(tutorialStep(game),'hall');
});

test('v4 review survives save/load, replay resets it and skip releases the guide', () => {
 const game = ready(); tutorialNote(game, 'yard');
 const loaded = deserialize(JSON.parse(JSON.stringify(serialize(game, 'Casa'))), world).g;
 assert.equal(tutorialStep(loaded), 'hall');
 tutorialNote(loaded, 'hall'); tutorialNote(loaded, 'contract');
 assert.equal(restartTutorial(loaded), true); assert.equal(loaded.tut.v, 4); assert.equal(loaded.tut.reviewed, false);
 assert.equal(skipTutorial(loaded), true); assert.equal(tutorialStep(loaded), 'done');
});
