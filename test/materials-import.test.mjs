// Materials import: what the local market cannot supply is imported at a premium instead of blocking the works.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loadWorld} from '../src/sim/world.mjs';
import {newGame} from '../src/game/game.mjs';
import {quoteUnits, quoteUnitsImport, consumeUnitsImport, IMPORT_MUL, RECIPES} from '../src/sim/recipes.mjs';
import {quoteConstruction, startConstruction} from '../src/game/buildings.mjs';
import {FEE} from '../src/sim/trade.mjs';
const world = loadWorld();
const recipe = RECIPES.house, good = Object.keys(recipe)[0]; // the house recipe and its first material

test('full local stock: import quote matches the plain quote and imports nothing',()=>{
 const g = newGame(world, 'cadiz');
 const a = quoteUnits(world, g.market, 'cadiz', recipe), b = quoteUnitsImport(world, g.market, 'cadiz', recipe);
 assert.ok(a.ok && b.ok);
 assert.equal(b.cost, a.cost, 'same price when nothing is imported');
 assert.deepEqual(b.imported, {}, 'nothing imported');
 assert.deepEqual(b.local, recipe, 'everything comes from the market');
});

test('short stock: the shortfall is imported at the premium, never below zero stock',()=>{
 const g = newGame(world, 'cadiz');
 const need = recipe[good];
 g.market.cadiz[good].stock = need - 2; // two short
 const q = quoteUnitsImport(world, g.market, 'cadiz', recipe);
 assert.ok(q.ok, 'the quote no longer fails');
 assert.deepEqual(q.imported, {[good]: 2});
 assert.equal(q.local[good], need - 2, 'local part is what the market has');
 const plain = quoteUnits(world, {cadiz: {...g.market.cadiz, [good]: {...g.market.cadiz[good], stock: 999}}}, 'cadiz', recipe);
 assert.ok(q.cost > plain.cost, 'importing costs more than a stocked market');
 // The imported units are priced at exactly the premium each: quoting with zero stock imports all.
 const zeroed = Object.fromEntries(Object.entries(g.market.cadiz).map(([k, e]) => [k, {...e, stock: 0}]));
 const qAll = quoteUnitsImport(world, {cadiz: zeroed}, 'cadiz', recipe);
 assert.deepEqual(Object.keys(qAll.imported).sort(), Object.keys(recipe).sort(), 'zero stock imports the whole recipe');
 const expectedAll = Object.entries(recipe).reduce((a, [gd, n]) => a + n * Math.ceil(world.goods[gd].base * (1 + FEE) * IMPORT_MUL), 0);
 assert.equal(qAll.cost, expectedAll, 'with empty shelves the whole recipe is priced at the premium');
 const stock0 = g.market.cadiz[good].stock;
 consumeUnitsImport(world, g.market, 'cadiz', recipe, 10 ** 9);
 assert.equal(g.market.cadiz[good].stock, stock0 - (need - 2), 'only the local part leaves the market');
});

test('a port with zero stock can build now, paying the premium',()=>{
 const g = newGame(world, 'casablanca'); // the sim city that could never upgrade
 g.cash = 100000;
 for (const e of Object.values(g.market.casablanca)) e.stock = 0; // nothing on the shelves
 const q0 = quoteUnits(world, g.market, 'casablanca', recipe);
 assert.equal(q0.ok, false, 'the old path still reports missing materials');
 g.offices = ['casablanca']; // construction is office-gated
 g.buildings = {casablanca: {'casablanca:1': {type: null, level: 0, state: 'plot', plotType: 'urban', paidPlot: 100}}}; // an owned empty plot, like buyPlot makes
 const q = quoteConstruction(g, 'casablanca', 'casablanca:1', 'house');
 assert.ok(q.ok, 'construction quote works via import');
 assert.ok(Object.keys(q.imported ?? {}).length > 0, 'and says what is imported');
 const r = startConstruction(g, 'casablanca', 'casablanca:1', 'house');
 assert.ok(r.ok, 'the works start');
 assert.equal(g.market.casablanca[good].stock, 0, 'no phantom stock consumed');
});

test('the warehouse is spent first: only what neither store nor market has is imported',()=>{
 const g = newGame(world, 'cadiz');
 g.cash = 100000;
 g.offices = ['cadiz'];
 g.buildings = {cadiz: {'cadiz:9': {type: null, level: 0, state: 'plot', plotType: 'urban', paidPlot: 100}}};
 const need = recipe[good], marketHas = g.market.cadiz[good].stock;
 g.warehouses = {cadiz: {goods: {[good]: 3}, basis: {[good]: 50}}}; // three units at home
 const q = quoteConstruction(g, 'cadiz', 'cadiz:9', 'house');
 assert.ok(q.ok);
 assert.equal(q.fromStore[good], 3, 'three from the warehouse');
 assert.equal(q.missing[good], need - 3, 'the rest is asked around');
 const abroad = Math.max(0, need - 3 - marketHas);
 assert.deepEqual(q.imported, abroad ? {[good]: abroad} : {}, 'only the true shortfall is imported');
});
