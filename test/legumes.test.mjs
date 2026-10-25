import test from 'node:test';import assert from 'node:assert/strict';
import {loadWorld} from '../src/sim/world.mjs';
import {newGame,advanceDay} from '../src/game/game.mjs';
import {serialize,deserialize} from '../src/game/gamesave.mjs';
import {withLegumes,LEGUMES} from '../src/sim/optional_goods.mjs';
import {PER_1000,OPTIONAL_PER_1000,demandBy} from '../src/sim/classes.mjs';
const world=loadWorld();
test('flag OFF path: no legumes in the world, markets or demand table (default ON; OFF stays available explicitly)',()=>{
 assert.equal('legumes' in world.goods,false);assert.equal('legumes' in PER_1000,false);
 const g=newGame(world,'cadiz',{freePlay:true,legumes:false,pottery:false});assert.equal(g.legumes,false); // isolated: the other optional goods default ON now and would wrap the world
 assert.equal(g.market.sevilla.legumes,undefined);assert.equal(g.world,world);
});
test('flag ON is the default',()=>{
 const g=newGame(world,'cadiz',{freePlay:true});assert.equal(g.legumes,true);assert.ok(g.market.sevilla.legumes);assert.notEqual(g.world,world);
});
test('flag OFF parity: false and 1 (not exactly true) play the same 120 days, byte for byte; absent plays exactly like true (both ON)',()=>{
 const run=(o)=>{const g=newGame(world,'cadiz',{freePlay:true,seed:5,...o});for(let d=0;d<120;d++)advanceDay(g);const {legumes,...r}=g;return JSON.stringify({...r,world:undefined});};
 assert.equal(run({legumes:false}),run({legumes:1}));assert.equal(run({}),run({legumes:true}));
});
test('withLegumes leaves the loaded world untouched; Sevilla is the only producer',()=>{
 const before=JSON.stringify(world);const w=withLegumes(world);assert.equal(JSON.stringify(world),before);
 assert.deepEqual(w.cities.filter(c=>c.makes.includes('legumes')).map(c=>c.id),['sevilla']);
 assert.ok(w.goods.legumes.base<=world.goods.grain.base);
 for(const id of LEGUMES.consumers)assert.ok(w.cities.find(c=>c.id===id).needs.includes('legumes'));
});
test('flag ON: poor eat most, both optional goods can be on together, save round trip',()=>{
 const k=OPTIONAL_PER_1000.legumes;assert.ok(k.poor>k.middle&&k.middle>k.rich&&k.rich>0);
 assert.ok(demandBy(40000,'legumes',1).poor>demandBy(40000,'legumes',1).rich);
 const g=newGame(world,'cadiz',{freePlay:true,legumes:true});
 for(const c of g.world.cities){assert.ok(g.market[c.id].legumes);}
 for(let d=0;d<30;d++)advanceDay(g);
 const back=deserialize(JSON.parse(JSON.stringify(serialize(g,{}))),world).g;
 assert.equal(back.legumes,true);assert.ok(back.world.goods.legumes);assert.ok(back.market.sevilla.legumes);
});
