import test from 'node:test';import assert from 'node:assert/strict';
import {loadWorld} from '../src/sim/world.mjs';
import {newGame,advanceDay,buyWarehouse,warehouseCap} from '../src/game/game.mjs';
import {setWatch,watchOf,watchKept,watchMaxFor,watchSecurity,watchFireWatch,accrueWatch,WH_WATCH_WAGE,WH_WATCH_FIRE_EVERY} from '../src/game/whwatch.mjs';
import {calamityChance} from '../src/game/calamities.mjs';
import {serialize,deserialize} from '../src/game/gamesave.mjs';
const world=loadWorld();
const mk=()=>{const gm=newGame(world);gm.cash=100000;gm.noGoal=true;assert.ok(buyWarehouse(gm,'cadiz').ok);return gm;};
const capOf=(gm)=>(cid)=>warehouseCap(gm,cid);
test('contract: warehouse and game-state validation, whole-number clamp to the live max',()=>{
 const gm=mk();const cap=warehouseCap(gm,'cadiz'),mx=watchMaxFor(cap);
 assert.equal(setWatch(gm,'sevilla',5,cap).reason,'no warehouse here','no warehouse: no watch');
 assert.equal(setWatch(gm,'cadiz',Number.NaN,cap).reason,'bad number');
 assert.equal(setWatch(gm,'cadiz',Number.POSITIVE_INFINITY,cap).reason,'bad number');
 assert.equal(setWatch(gm,'cadiz',3.9,cap).guards,3,'the request floors');
 assert.equal(setWatch(gm,'cadiz',-4,cap).guards,0,'a negative request clamps to 0');
 assert.equal(setWatch(gm,'cadiz',mx+50,cap).guards,mx,'an over-max request clamps to the live max');
 assert.equal(setWatch(gm,'cadiz',2,cap).guards,2,'lowering always applies, no residue');
 gm.over='lose';assert.equal(setWatch(gm,'cadiz',1,cap).reason,'game over');
});
test('the max follows the storage capacity and grade 2 stays reachable at full load',()=>{
 assert.equal(watchMaxFor(0),0,'no capacity: no watch');
 assert.equal(watchMaxFor(300),25); // trunc(sqrt(600)) + 1
 assert.equal(watchMaxFor(1800),61,'an exact-integer threshold still admits one guard above it (perfect square)');
 for(const cap of [300,600,1800]){
  assert.ok(watchMaxFor(cap)>Math.trunc(Math.sqrt(2*cap)),`one guard above the full-load threshold, cap ${cap}`);
 }
 assert.ok(watchMaxFor(600)>watchMaxFor(300),'the limit moves with the capacity');
});
test('classification: the sqrt shape and its edges',()=>{
 const gm=mk(),cap=warehouseCap(gm,'cadiz'),wh=gm.warehouses.cadiz;
 assert.equal(watchSecurity(gm,'cadiz',cap),1,'empty and unguarded: fair');
 assert.ok(setWatch(gm,'cadiz',3,cap).ok);
 assert.equal(watchSecurity(gm,'cadiz',cap),2,'empty and guarded: high');
 wh.goods.grain=50; // M=50, Q=trunc(sqrt(100))=10
 assert.equal(watchSecurity(gm,'cadiz',cap),0,'Q=10 > 2G=6: low');
 assert.ok(setWatch(gm,'cadiz',5,cap).ok);
 assert.equal(watchSecurity(gm,'cadiz',cap),1,'Q=10 == 2G: fair (strict thresholds)');
 assert.ok(setWatch(gm,'cadiz',10,cap).ok);
 assert.equal(watchSecurity(gm,'cadiz',cap),1,'Q=10 == G: fair');
 assert.ok(setWatch(gm,'cadiz',11,cap).ok);
 assert.equal(watchSecurity(gm,'cadiz',cap),2,'Q=10 < G=11: high');
 watchOf(gm,'cadiz').unkept=true; // mutating the saved record straight: an unpaid watch guards nothing
 assert.equal(watchSecurity(gm,'cadiz',cap),0,'unpaid: the watch counts as 0');
 assert.equal(watchKept(gm,'cadiz',cap),0);
});
test('the effective level re-clamps when the cap moves: no residue above a lowered limit',()=>{
 const gm=mk(),cap=warehouseCap(gm,'cadiz'),mx=watchMaxFor(cap);
 assert.ok(setWatch(gm,'cadiz',mx,cap).ok);
 assert.equal(watchKept(gm,'cadiz',cap),mx);
 assert.equal(watchKept(gm,'cadiz',1),watchMaxFor(1),'a shrunken depot re-clamps the effective level');
 assert.equal(watchOf(gm,'cadiz').guards,mx,'the stored contract is kept for when the depot grows back');
});
test('daily wage accrues once per day per city into the weekly book; unpaid stands down and resumes',()=>{
 const gm=mk(),cap=warehouseCap(gm,'cadiz');
 assert.ok(setWatch(gm,'cadiz',4,cap).ok);
 gm.accrued={ships:{}};
 const c1=accrueWatch(gm,capOf(gm),0);
 assert.equal(c1,4*WH_WATCH_WAGE);
 assert.equal(gm.accrued.buildings['whwatch:cadiz'],4*WH_WATCH_WAGE,'own line per city identifier');
 const c2=accrueWatch(gm,capOf(gm),0);
 assert.equal(c2,0,'a repeated call the same day charges nothing');
 assert.equal(gm.accrued.buildings['whwatch:cadiz'],4*WH_WATCH_WAGE,'the period cannot charge twice');
 const d0=gm.day;advanceDay(gm);
 assert.equal(gm.day,d0+1);
 assert.equal(gm.accrued.buildings['whwatch:cadiz'],2*4*WH_WATCH_WAGE,'one more day, one more charge');
 gm.cash=2*WH_WATCH_WAGE-1;advanceDay(gm); // cannot cover one day
 assert.ok(watchOf(gm,'cadiz').unkept,'unpaid: the watch stands down');
 assert.equal(gm.accrued.buildings['whwatch:cadiz'],2*4*WH_WATCH_WAGE,'no charge while unpaid');
 gm.cash=2*4*WH_WATCH_WAGE-1;advanceDay(gm);
 assert.ok(watchOf(gm,'cadiz').unkept,'hysteresis: two days of cost in hand before the watch returns');
 gm.cash=100000;advanceDay(gm);
 assert.ok(!watchOf(gm,'cadiz').unkept,'the watch resumes once the pay returns');
 assert.equal(gm.accrued.buildings['whwatch:cadiz'],3*4*WH_WATCH_WAGE,'and charges that day again');
});
test('no warehouse or no watch: nothing accrues; old saves load without a watch',()=>{
 const gm=mk();
 const cnt=accrueWatch(gm,capOf(gm),0);
 assert.equal(cnt,0);assert.equal(gm.accrued,undefined,'no watch: no book, no charge');
 const save=serialize(gm,'Casa');const g2=deserialize(save,world).g;
 assert.equal(watchOf(g2,'cadiz'),null,'an old save carries no watch');
 assert.equal(watchSecurity(g2,'cadiz',warehouseCap(g2,'cadiz')),1);
 assert.equal(accrueWatch(g2,capOf(g2),0),0);
});
test('save/load keeps the contract and the unkept flag',()=>{
 const gm=mk(),cap=warehouseCap(gm,'cadiz');
 assert.ok(setWatch(gm,'cadiz',7,cap).ok);watchOf(gm,'cadiz').unkept=true;
 const g2=deserialize(serialize(gm,"Casa"),world).g;
 assert.equal(watchOf(g2,'cadiz').guards,7);assert.ok(watchOf(g2,'cadiz').unkept);
});
test('the kept watch cuts the fire chance; no watch, no cut',()=>{
 const gm=mk(),cap=warehouseCap(gm,'cadiz');
 const base=calamityChance(gm,'cadiz','incendio');
 assert.equal(watchFireWatch(gm,'cadiz',cap),0);
 assert.ok(setWatch(gm,'cadiz',WH_WATCH_FIRE_EVERY,cap).ok);
 assert.equal(watchFireWatch(gm,'cadiz',cap),1,'five guards walk one fire round');
 assert.ok(calamityChance(gm,'cadiz','incendio')<base,'the fire chance drops');
 watchOf(gm,'cadiz').unkept=true;
 assert.equal(watchFireWatch(gm,'cadiz',cap),0,'an unpaid watch walks no rounds');
 assert.equal(calamityChance(gm,'cadiz','incendio'),base,'and the chance returns to base');
});
test('day-loop wiring: an upgraded depot pays its full watch through advanceDay',()=>{
 const gm=mk();
 gm.buildings={cadiz:{plot1:{type:'warehouse',state:'active',level:5}}}; // +1500: depot cap 300 -> 1800
 const cap=warehouseCap(gm,'cadiz');
 assert.equal(cap,1800,'the depot upgrade applies');
 assert.ok(setWatch(gm,'cadiz',60,cap).ok,'the live max admits 60 guards at cap 1800');
 assert.equal(watchKept(gm,'cadiz',cap),60);
 gm.accrued={ships:{}};
 advanceDay(gm);
 assert.equal(gm.accrued.buildings['whwatch:cadiz'],60*WH_WATCH_WAGE,'the day loop charges the full watch, not the base-cap clamp');
});
test('the estimate shown is the charge booked: exact integer arithmetic, no rounding drift',()=>{
 const gm=mk(),cap=warehouseCap(gm,'cadiz');
 for(const lvl of [1,3,7,25]){
  assert.ok(setWatch(gm,"cadiz",lvl,cap).ok);
  gm.accrued={ships:{}};gm.day+=1;accrueWatch(gm,capOf(gm),0);
  assert.equal(gm.accrued.buildings['whwatch:cadiz'],lvl*WH_WATCH_WAGE,'the booked charge is exactly guards x wage');
 }
});
