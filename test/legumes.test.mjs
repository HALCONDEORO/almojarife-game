import test from 'node:test';import assert from 'node:assert/strict';
import {loadWorld} from '../src/sim/world.mjs';
import {newGame,advanceDay} from '../src/game/game.mjs';
import {serialize,deserialize} from '../src/game/gamesave.mjs';
import {withLegumes,LEGUMES} from '../src/sim/optional_goods.mjs';
import {PER_1000,OPTIONAL_PER_1000,demandBy} from '../src/sim/classes.mjs';
const world=loadWorld();
test('flag OFF is the default: no legumes in the world, markets or demand table',()=>{
 assert.equal('legumes' in world.goods,false);assert.equal('legumes' in PER_1000,false);
 const g=newGame(world,'cadiz',{freePlay:true});assert.equal(g.legumes,false);assert.equal(g.market.sevilla.legumes,undefined);assert.equal(g.world,world);
});
test('flag OFF parity: absent, false and 1 play the same 120 days, byte for byte',()=>{
 const run=(o)=>{const g=newGame(world,'cadiz',{freePlay:true,seed:5,...o});for(let d=0;d<120;d++)advanceDay(g);const {kidMeat,legumes,...r}=g;return JSON.stringify({...r,world:undefined});};
 assert.equal(run({}),run({legumes:false}));assert.equal(run({}),run({legumes:1}));
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
 const g=newGame(world,'cadiz',{freePlay:true,legumes:true,kidMeat:true});
 for(const c of g.world.cities){assert.ok(g.market[c.id].legumes);assert.ok(g.market[c.id].kid_meat);}
 for(let d=0;d<30;d++)advanceDay(g);
 const back=deserialize(JSON.parse(JSON.stringify(serialize(g,{}))),world).g;
 assert.equal(back.legumes,true);assert.ok(back.world.goods.legumes&&back.world.goods.kid_meat);assert.ok(back.market.sevilla.legumes);
});
