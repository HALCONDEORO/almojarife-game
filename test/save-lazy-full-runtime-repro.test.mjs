import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildWorld} from '../src/sim/world.mjs';
import {newGame,recordPrices,advanceDay} from '../src/game/game.mjs';
import {serialize,deserialize} from '../src/game/gamesave.mjs';
import {isDiscovered,discover} from '../src/game/fog.mjs';
const data=JSON.parse(fs.readFileSync(new URL('../data/world.json',import.meta.url)));
const world=buildWorld(data);
const own=(o,k,v)=>Object.defineProperty(o,k,{value:v,writable:true,enumerable:true,configurable:true});
const clone=v=>JSON.parse(JSON.stringify(v));
function assertFiniteData(value,path='market',seen=new Set()){
 assert.notEqual(typeof value,'function',path+' must not hold inherited functions');
 if(typeof value==='number')assert(Number.isFinite(value),path+' must be finite');
 if(!value||typeof value!=='object'||seen.has(value))return;
 seen.add(value);for(const [key,item]of Object.entries(value))assertFiniteData(item,path+'.'+key,seen);
}

for(const id of ['constructor','__proto__','toString','hasOwnProperty']){
 test(`legacy discovery without saved map does not inherit ${id}`,()=>{
  const source=serialize(newGame(world),'Legacy',1);delete source.state.discovered;
  const g=deserialize(source,world).g;
  assert.equal(isDiscovered(g,id),false);
  assert.equal(discover(g,id),false,'nonexistent ports must remain undiscovered');
  assert.equal(Object.getPrototypeOf({}),Object.prototype);
 });
 for(const mode of ['direct recorder','daily runtime'])test(`lazy history child supports own good ${id} through ${mode}`,()=>{
  const goods={...data.goods};own(goods,id,{...data.goods.grain});
  const custom=buildWorld({...data,goods});
  const source=serialize(newGame(world),'Legacy',1);source.state.hist={};
  own(source.state.market.cadiz,id,clone(source.state.market.cadiz.grain));
  const g=deserialize(source,custom).g;g.eventsOn=false;g.noGoal=true;
  assert.doesNotThrow(()=>{if(mode==='direct recorder')recordPrices(g.world,g.market,g.hist);else advanceDay(g);});
  assert(Array.isArray(g.hist.cadiz[id]));assert(g.hist.cadiz[id].length>0);
  assert(g.hist.cadiz[id].every(Number.isFinite));assertFiniteData(g.market);
  const again=deserialize(clone(serialize(g,'Legacy',1)),custom).g;
  assert.deepEqual(again.hist.cadiz[id],g.hist.cadiz[id]);
  assert.equal(Object.getPrototypeOf({}),Object.prototype);
 });
}
