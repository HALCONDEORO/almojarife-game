import test from 'node:test';import assert from 'node:assert/strict';
import {loadWorld} from '../src/sim/world.mjs';
import {newGame,advanceDay,buyWarehouse,warehouseCap} from '../src/game/game.mjs';
import {setWatch,watchOf,watchKept,watchMaxFor,watchSecurity,watchFireWatch,accrueWatch,WH_WATCH_WAGE,WH_WATCH_FIRE_EVERY} from '../src/game/whwatch.mjs';
import {calamityChance} from '../src/game/calamities.mjs';
import {serialize,deserialize} from '../src/game/gamesave.mjs';
const world=loadWorld();
const mk=()=>{const g=newGame(world);g.cash=100000;g.noGoal=true;assert.ok(buyWarehouse(g,'cadiz').ok);return g;};
const capOf=(g)=>(cid)=>warehouseCap(g,cid);
test('contract: warehouse and game-state validation, whole-number clamp to the live max',()=>{
 const g=mk();const cap=warehouseCap(g,'cadiz'),mx=watchMaxFor(cap);
 assert.equal(setWatch(g,'sevilla',5,cap).reason,'no warehouse here','no warehouse: no watch');
 assert.equal(setWatch(g,'cadiz',Number.NaN,cap).reason,'bad number');
 assert.equal(setWatch(g,'cadiz',Number.POSITIVE_INFINITY,cap).reason,'bad number');
 assert.equal(setWatch(g,'cadiz',3.9,cap).guards,3,'the request floors');
 assert.equal(setWatch(g,'cadiz',-4,cap).guards,0,'a negative request clamps to 0');
 assert.equal(setWatch(g,'cadiz',mx+50,cap).guards,mx,'an over-max request clamps to the live max');
 assert.equal(setWatch(g,'cadiz',2,cap).guards,2,'lowering always applies, no residue');
 g.over='lose';assert.equal(setWatch(g,'cadiz',1,cap).reason,'game over');
});
test('the max follows the storage capacity and grade 2 stays reachable at full load',()=>{
 assert.equal(watchMaxFor(0),0);
 assert.equal(watchMaxFor(300),25); // ceil(sqrt(600))
 assert.ok(watchMaxFor(300)>Math.trunc(Math.sqrt(2*300)),'one guard above the full-load threshold');
 assert.ok(watchMaxFor(600)>watchMaxFor(300),'the limit moves with the capacity');
});
test('classification: the sqrt shape and its edges',()=>{
 const g=mk(),cap=warehouseCap(g,'cadiz'),w=g.warehouses.cadiz;
 assert.equal(watchSecurity(g,'cadiz',cap),1,'empty and unguarded: fair');
 assert.ok(setWatch(g,'cadiz',3,cap).ok);
 assert.equal(watchSecurity(g,'cadiz',cap),2,'empty and guarded: high');
 w.goods.grain=50; // M=50, Q=trunc(sqrt(100))=10
 assert.equal(watchSecurity(g,'cadiz',cap),0,'Q=10 > 2G=6: low');
 assert.ok(setWatch(g,'cadiz',5,cap).ok);
 assert.equal(watchSecurity(g,'cadiz',cap),1,'Q=10 == 2G: fair (strict thresholds)');
 assert.ok(setWatch(g,'cadiz',10,cap).ok);
 assert.equal(watchSecurity(g,'cadiz',cap),1,'Q=10 == G: fair');
 assert.ok(setWatch(g,'cadiz',11,cap).ok);
 assert.equal(watchSecurity(g,'cadiz',cap),2,'Q=10 < G=11: high');
 watchOf(g,'cadiz').unkept=true; // mutating the saved record straight: an unpaid watch guards nothing
 assert.equal(watchSecurity(g,'cadiz',cap),0,'unpaid: the watch counts as 0');
 assert.equal(watchKept(g,'cadiz',cap),0);
});
test('the effective level re-clamps when the cap moves: no residue above a lowered limit',()=>{
 const g=mk(),cap=warehouseCap(g,'cadiz'),mx=watchMaxFor(cap);
 assert.ok(setWatch(g,'cadiz',mx,cap).ok);
 assert.equal(watchKept(g,'cadiz',cap),mx);
 assert.equal(watchKept(g,'cadiz',1),watchMaxFor(1),'a shrunken depot re-clamps the effective level');
 assert.equal(watchOf(g,'cadiz').guards,mx,'the stored contract is kept for when the depot grows back');
});
test('daily wage accrues once per day per city into the weekly book; unpaid stands down and resumes',()=>{
 const g=mk(),cap=warehouseCap(g,'cadiz');
 assert.ok(setWatch(g,'cadiz',4,cap).ok);
 g.accrued={ships:{}};
 const c1=accrueWatch(g,capOf(g),0);
 assert.equal(c1,4*WH_WATCH_WAGE);
 assert.equal(g.accrued.buildings['whwatch:cadiz'],4*WH_WATCH_WAGE,'own line per city identifier');
 const d0=g.day;advanceDay(g);
 assert.equal(g.day,d0+1);
 assert.equal(g.accrued.buildings['whwatch:cadiz'],2*4*WH_WATCH_WAGE,'one more day, one more charge');
 g.cash=2*WH_WATCH_WAGE-1;advanceDay(g); // cannot cover one day
 assert.ok(watchOf(g,'cadiz').unkept,'unpaid: the watch stands down');
 assert.equal(g.accrued.buildings['whwatch:cadiz'],2*4*WH_WATCH_WAGE,'no charge while unpaid');
 g.cash=2*4*WH_WATCH_WAGE-1;advanceDay(g);
 assert.ok(watchOf(g,'cadiz').unkept,'hysteresis: two days of cost in hand before the watch returns');
 g.cash=100000;advanceDay(g);
 assert.ok(!watchOf(g,'cadiz').unkept,'the watch resumes once the pay returns');
 assert.equal(g.accrued.buildings['whwatch:cadiz'],3*4*WH_WATCH_WAGE,'and charges that day again');
});
test('no warehouse or no watch: nothing accrues; old saves load without a watch',()=>{
 const g=mk();
 const c=accrueWatch(g,capOf(g),0);
 assert.equal(c,0);assert.equal(g.accrued,undefined,'no watch: no book, no charge');
 const save=serialize(g,'Casa');const g2=deserialize(save,world).g;
 assert.equal(watchOf(g2,'cadiz'),null,'an old save carries no watch');
 assert.equal(watchSecurity(g2,'cadiz',warehouseCap(g2,'cadiz')),1);
 assert.equal(accrueWatch(g2,capOf(g2),0),0);
});
test('save/load keeps the contract and the unkept flag',()=>{
 const g=mk(),cap=warehouseCap(g,'cadiz');
 assert.ok(setWatch(g,'cadiz',7,cap).ok);watchOf(g,'cadiz').unkept=true;
 const g2=deserialize(serialize(g,'Casa'),world).g;
 assert.equal(watchOf(g2,'cadiz').guards,7);assert.ok(watchOf(g2,'cadiz').unkept);
});
test('the kept watch cuts the fire chance; no watch, no cut',()=>{
 const g=mk(),cap=warehouseCap(g,'cadiz');
 const base=calamityChance(g,'cadiz','incendio');
 assert.equal(watchFireWatch(g,'cadiz',cap),0);
 assert.ok(setWatch(g,'cadiz',WH_WATCH_FIRE_EVERY,cap).ok);
 assert.equal(watchFireWatch(g,'cadiz',cap),1,'five guards walk one fire round');
 assert.ok(calamityChance(g,'cadiz','incendio')<base,'the fire chance drops');
 watchOf(g,'cadiz').unkept=true;
 assert.equal(watchFireWatch(g,'cadiz',cap),0,'an unpaid watch walks no rounds');
 assert.equal(calamityChance(g,'cadiz','incendio'),base,'and the chance returns to base');
});
test('the estimate shown is the charge booked: exact integer arithmetic, no rounding drift',()=>{
 const g=mk(),cap=warehouseCap(g,'cadiz');
 for(const n of [1,3,7,25]){
  assert.ok(setWatch(g,'cadiz',n,cap).ok);
  g.accrued={ships:{}};accrueWatch(g,capOf(g),0);
  assert.equal(g.accrued.buildings['whwatch:cadiz'],n*WH_WATCH_WAGE,'the booked charge is exactly guards x wage');
 }
});
