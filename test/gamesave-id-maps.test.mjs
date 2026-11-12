import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildWorld} from '../src/sim/world.mjs';
import {newGame,recordPrices} from '../src/game/game.mjs';
import {serialize,deserialize} from '../src/game/gamesave.mjs';
import {isDiscovered,discover} from '../src/game/fog.mjs';
import {isLive} from '../src/game/intel.mjs';
const data=JSON.parse(fs.readFileSync(new URL('../data/world.json',import.meta.url)));
const world=buildWorld(data);
const json=v=>JSON.parse(JSON.stringify(v));
const own=(o,k,v)=>Object.defineProperty(o,k,{value:v,writable:true,enumerable:true,configurable:true});
const fresh=()=>json(serialize(newGame(world), 'Map test', 1));
for(const id of ['constructor','__proto__','toString','hasOwnProperty']){
 test(`loaded unknown city ${id} is neither discovered nor live by inheritance`,()=>{
  const source=fresh();source.state.discovered={};source.state.intel={};source.state.warehouses={};
  const custom=buildWorld({...data,cities:[...data.cities,{...data.cities[0],id,name:id}],lanes:[...data.lanes,['cadiz',id]]});
  own(source.state.market,id,json(source.state.market.cadiz));
  const {g}=deserialize(source,custom);
  assert.equal(isDiscovered(g,id),false);assert.equal(isLive(g,id),false);
  assert.equal(discover(g,id),true);assert.equal(discover(g,id),false);assert.equal(isDiscovered(g,id),true);
  assert.equal(Object.getPrototypeOf(g.market),null);assert.equal(Object.getPrototypeOf(g.market[id]),null);
  assert.equal(g.market[id].grain.stock,source.state.market[id].grain.stock);
  recordPrices(g.world,g.market,g.hist);assert(Array.isArray(g.hist[id].grain));
  const {g:again}=deserialize(json(serialize(g,'Map test',1)),custom);
  assert.equal(Object.getPrototypeOf(again.discovered),null);assert.equal(isDiscovered(again,id),true);
  assert.equal(Object.getPrototypeOf({}),Object.prototype);
 });
 test(`own saved goods keys ${id} survive in warehouse, history and intel maps`,()=>{
  const source=fresh();source.state.warehouses={cadiz:{goods:{},basis:{}}};source.state.intel={cadiz:{day:0,exact:true,cells:{}}};source.state.hist={cadiz:{}};
  own(source.state.warehouses.cadiz.goods,id,7);own(source.state.warehouses.cadiz.basis,id,21);own(source.state.intel.cadiz.cells,id,{stock:7});own(source.state.hist.cadiz,id,[1,2]);
  const {g}=deserialize(source,world);
  assert.equal(g.warehouses.cadiz.goods[id],7);assert.equal(g.warehouses.cadiz.basis[id],21);assert.equal(g.intel.cadiz.cells[id].stock,7);assert.deepEqual(g.hist.cadiz[id],[1,2]);
  for(const map of [g.warehouses,g.warehouses.cadiz.goods,g.warehouses.cadiz.basis,g.intel,g.intel.cadiz.cells,g.hist,g.hist.cadiz])assert.equal(Object.getPrototypeOf(map),null);
 });
}
test('bot dictionaries and voyage points are normalized; records and arrays are not',()=>{
 const source=fresh(),bot=source.state.ai[0];bot.intel={};bot.discovered={};bot.warehouses={cadiz:{goods:{grain:1},basis:{grain:4}}};
 source.state.ships[0].voyage={from:'cadiz',to:'cadiz',path:['cadiz'],km:0,totalTicks:1,ticksLeft:1,pts:{}};
 const {g}=deserialize(source,world);
 for(const map of [g.ai[0].intel,g.ai[0].discovered,g.ai[0].warehouses,g.ai[0].warehouses.cadiz.goods,g.ships[0].cargo,g.ships[0].voyage.pts])assert.equal(Object.getPrototypeOf(map),null);
 assert.equal(Object.getPrototypeOf(g.market.cadiz.grain),Object.prototype);assert(Array.isArray(g.ships));assert(Array.isArray(g.ships[0].voyage.path));
});
test('normal save payload remains equal after loading; caller data is not given null prototypes',()=>{
 const source=fresh();const before=json(source);const {g}=deserialize(source,world);
 assert.deepEqual(serialize(g,'Map test',1),before);assert.equal(Object.getPrototypeOf(source.state.market),Object.prototype);
});
