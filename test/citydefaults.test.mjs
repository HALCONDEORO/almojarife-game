import test from 'node:test';import assert from 'node:assert/strict';
import {newGame} from '../src/game/game.mjs';import{loadWorld}from'../src/sim/world.mjs';
import{serialize,deserialize}from'../src/game/gamesave.mjs';import{hallView}from'../src/view/townhallview.mjs';
const flags=['cityIdentity','cityMoodOut','citySeasons','cityCrafts','cityFestivals','cityMemory','cityRelations','cityGrowth'];
test('normal new games enable all eight living-city modules with real hall output and save persistence',()=>{const world=loadWorld(),g=newGame(world);for(const k of flags)assert.equal(g[k],true,k);assert.equal(g.seasonSeen.season,'winter');assert.ok(hallView(g,'cadiz').identity);const h=deserialize(serialize(g,'T'),world).g;for(const k of flags)assert.equal(h[k],true,k);});
test('explicit off remains available for controlled simulations',()=>{const g=newGame(loadWorld(),'cadiz',Object.fromEntries(flags.map(k=>[k,false])));for(const k of flags)assert.equal(g[k],undefined,k);assert.equal(g.identitySeen,undefined);assert.equal(g.seasonSeen,undefined);});

import {execFileSync} from 'node:child_process';
test('preview-based merchant policy still wins with all living-city flags ON',()=>{const report=JSON.parse(execFileSync(process.execPath,['tools/sim_player.mjs','1'],{encoding:'utf8'}));const merchant=report.results.find(r=>r.strategy==='greedy-preview');assert.equal(merchant.start,'cadiz');assert.equal(merchant.outcome,'win');assert.ok(merchant.day<=365);assert.ok(merchant.cash>=50000);assert.equal(report.summaries['greedy-preview'].bankrupt,0);});
