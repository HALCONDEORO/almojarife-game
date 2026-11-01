import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { initTutorial, tutorialNote, tutorialStep, tutorialHint, quietly, reviewTutorialHull, restartTutorial, skipTutorial } from '../src/game/tutorial.mjs';
import { loadWorld } from '../src/sim/world.mjs';
import { newGame, orderRepair } from '../src/game/game.mjs';
import { serialize, deserialize } from '../src/game/gamesave.mjs';
const world = loadWorld();
const ready = () => { const g = newGame(world, 'cadiz', { tutorial: true }); Object.assign(g.tut, { bought: true, sold: true, sailed: true }); return g; };
test('v4 replaces the automatic route with a shipyard review in both languages', () => {
 const g = ready(); assert.equal(g.tut.v, 4); assert.equal(tutorialStep(g), 'yard');
 assert.match(tutorialHint(g, 'es'), /Astillero/); assert.match(tutorialHint(g, 'en'), /Shipyard/);
 tutorialNote(g, 'route'); assert.equal(tutorialStep(g), 'yard');
 tutorialNote(g, 'yard'); assert.equal(tutorialStep(g), 'hall'); tutorialNote(g, 'hall'); assert.equal(tutorialStep(g), 'contract');
});
test('the actual city panel binding reviews only a sound locally docked ship, without changing cash or hull', () => {
 const source = readFileSync('web/main.mjs', 'utf8');
 const binding = source.split('\n').find(line => line.startsWith('  if (tb === "yard" &&'));
 assert.ok(binding);
 for (const [hull, at, voyage, expected] of [[100,'cadiz',null,'hall'],[99,'cadiz',null,'yard'],[100,'lisboa',null,'yard'],[100,'cadiz',{},'yard']]) {
  const g = ready(); Object.assign(g.ships[0], { hull, at, voyage }); const cash = g.cash; let saved = 0;
  vm.runInNewContext(binding, { g, reviewTutorialHull, sel: 0, tb: 'yard', city3dId: 'cadiz', tutorialNote, autosave: () => saved++ });
  assert.equal(tutorialStep(g), expected); assert.equal(g.cash, cash); assert.equal(g.ships[0].hull, hull); assert.equal(saved, expected === 'hall' ? 1 : 0);
 }
});
test('a damaged hull advances only after a successful normal paid repair order', () => {
 const g = ready(), sh = g.ships[0]; sh.hull = 50; g.cash = 0;
 assert.equal(orderRepair(g,[sh.id],sh.at).ok, false); assert.equal(tutorialStep(g),'yard');
 g.cash = 2000; const before = g.cash; const r = orderRepair(g,[sh.id],sh.at);
 assert.equal(r.ok,true); assert.equal(g.cash,before-r.cost); assert.equal(sh.hull,50); assert.equal(tutorialStep(g),'hall');
});
test('automated repair and an early inspection cannot teach the shipyard step', () => {
 const g = ready(), sh = g.ships[0]; sh.hull = 50; g.cash = 2000;
 quietly(() => orderRepair(g,[sh.id],sh.at)); assert.equal(tutorialStep(g),'yard');
 const fresh = {}; initTutorial(fresh); assert.equal(tutorialNote(fresh,'yard'),false); assert.equal(tutorialStep(fresh),'buy');
});
test('existing v3 saves keep their route step and completed progress', () => {
 const g = ready(); g.tut.v = 3; assert.equal(tutorialStep(g),'route'); assert.equal(tutorialNote(g,'yard'),false);
 tutorialNote(g,'route'); assert.equal(tutorialStep(g),'hall');
});

test('v4 review survives save/load, replay resets it and skip releases the guide', () => {
 const g = ready(); tutorialNote(g, 'yard');
 const loaded = deserialize(JSON.parse(JSON.stringify(serialize(g, 'Casa'))), world).g;
 assert.equal(tutorialStep(loaded), 'hall');
 tutorialNote(loaded, 'hall'); tutorialNote(loaded, 'contract');
 assert.equal(restartTutorial(loaded), true); assert.equal(loaded.tut.v, 4); assert.equal(loaded.tut.reviewed, false);
 assert.equal(skipTutorial(loaded), true); assert.equal(tutorialStep(loaded), 'done');
});
