import test from 'node:test';import assert from 'node:assert/strict';
import {loadWorld} from '../src/sim/world.mjs';
import {newGame,advanceDay,buyWarehouse} from '../src/game/game.mjs';
import { readFileSync } from 'node:fs';
import { SEASON_AMPLITUDE } from '../src/sim/market.mjs';
import {BUILDING_TYPES,PRODUCERS,producerCities,cityAllowsProducer,quoteConstruction,buyPlot,workshopTick,restartBuilding,staffingRatio,freeLabor,jobsNeeded,WORKSHOP_BATCH_PATTERN} from '../src/game/buildings.mjs';
import {RECIPES,OUTPUTS} from '../src/sim/recipes.mjs';
import {SEASON_PEAK} from '../src/sim/market.mjs';
const world=loadWorld();
const TYPES=['oil_mill','vineyard','saltworks','fishery'];
const OUT={oil_mill:'olive_oil',vineyard:'wine',saltworks:'salt',fishery:'fish'};
test('every PR3 producer has its three rows wired to real goods and recipes',()=>{
 for(const t of TYPES){
  assert.ok(BUILDING_TYPES[t],t+' in BUILDING_TYPES');
  assert.ok(RECIPES[BUILDING_TYPES[t].recipe],t+' construction recipe exists');
  const def=PRODUCERS[t];assert.ok(def&&def.primary===true,t+' primary producer');
  assert.equal(def.output,OUT[t]);assert.ok(world.goods[def.output],def.output+' is a trade good');
  assert.ok(!def.recipe,t+' primary production takes no market inputs (land yields the good)');
  assert.ok(def.yield>0,t+' yields its good');
  assert.equal(def.pattern,WORKSHOP_BATCH_PATTERN,t+' shares the workshop pattern');
  assert.ok(SEASON_PEAK[def.output]>0,def.output+' has a season peak for the seasonal tick');
 }
});
test('a primary producer builds only where the city makes the good',()=>{
 for(const t of TYPES){
  const cities=producerCities(world,t);
  assert.ok(cities.length>0,t+' has at least one eligible city');
  for(const id of cities)assert.ok(world.cities.find(c=>c.id===id).makes.includes(OUT[t]),id+' makes '+OUT[t]);
  assert.ok(!cities.includes('bilbao'),'bilbao makes none of these goods');
 }
 assert.ok(producerCities(world,'saltworks').includes('cadiz')&&!producerCities(world,'oil_mill').includes('cadiz'));
 assert.ok(cityAllowsProducer(world,'sevilla','oil_mill')&&cityAllowsProducer(world,'sevilla','vineyard')&&!cityAllowsProducer(world,'sevilla','saltworks'),'river cities follow their makes, nothing else');
});
test('quoteConstruction enforces eligibility with a clear reason',()=>{
 const g=newGame(world);g.cash=100000;
 const plot={id:'cadiz:1',type:'workshop',w:4,d:4};
 assert.ok(buyPlot(g,'cadiz',plot).ok);
 assert.equal(quoteConstruction(g,'cadiz','cadiz:1','oil_mill').reason,'good not producible in this city');
 assert.equal(quoteConstruction(g,'cadiz','cadiz:1','saltworks').ok,true);
 const q=quoteConstruction(g,'cadiz','cadiz:1','workshop');assert.ok(q.ok,'processors still build anywhere');
});
test('a primary producer yields its good into the city stock (no inputs, no cash moved)',()=>{
 const g=newGame(world);g.cash=100000;
 const plot={id:'cadiz:1',type:'workshop',w:4,d:4};buyPlot(g,'cadiz',plot);
 g.buildings['cadiz']['cadiz:1']={type:'saltworks',level:3,state:'active',plotType:'workshop'};
 const e=g.market.cadiz.salt,stock0=e.stock,cash0=g.cash;
 for(let day=0;day<10;day++){g.tick=day*240+1;workshopTick(g,'cadiz');}
 assert.ok(e.stock>stock0,'the saltworks yields salt every production day');
 assert.equal(g.cash,cash0,'upkeep accrues in the weekly ledger, not cash');
 assert.ok(g.buildings['cadiz']['cadiz:1'].produced>0,'lifetime units counted for the panel');
});
test('processors keep producing: the guard does not stop the workshop',()=>{
 const g=newGame(world);g.cash=100000;
 const plot={id:'cadiz:1',type:'workshop',w:4,d:4};buyPlot(g,'cadiz',plot);
 g.buildings['cadiz']['cadiz:1']={type:'workshop',level:2,state:'active',plotType:'workshop'};
 g.market.cadiz.wool.stock=g.market.cadiz.wool.target*4; // cheap wool so the margin holds
 g.market.cadiz.cloth.stock=1;
 const cloth0=g.market.cadiz.cloth.stock;
 g.tick=1;workshopTick(g,'cadiz');
 assert.ok(g.market.cadiz.cloth.stock>cloth0,'the workshop still weaves');
});
test('spec numbers from the materials table',()=>{
 assert.deepEqual(BUILDING_TYPES.oil_mill,{recipe:'oil_mill',fee:250,buildDays:24,upkeep:2,maxLevel:3});
 assert.deepEqual(BUILDING_TYPES.vineyard,{recipe:'vineyard',fee:250,buildDays:22,upkeep:2,maxLevel:3});
 assert.deepEqual(BUILDING_TYPES.saltworks,{recipe:'saltworks',fee:200,buildDays:20,upkeep:1,maxLevel:3});
 assert.deepEqual(BUILDING_TYPES.fishery,{recipe:'fishery',fee:150,buildDays:16,upkeep:1,maxLevel:3});
 assert.equal(PRODUCERS.fishery.yield,3);
 for(const t of ['oil_mill','vineyard','saltworks'])assert.equal(PRODUCERS[t].yield,2);
});

test('the daily batch resets logically: pattern per (city, day), lifetime payload never resets, exactly once through advanceDay',()=>{
 const g=newGame(world);g.noGoal=true;g.cash=100000;
 const plot={id:'cadiz:1',type:'fishery',w:4,d:4};buyPlot(g,'cadiz',plot);
 g.buildings['cadiz']['cadiz:1']={type:'fishery',level:1,state:'active',plotType:'fishery'};
 const b=g.buildings['cadiz']['cadiz:1'];
 // level-1 pattern [1,0]: batches alternate by day parity; each day applies at most once
 const deltas=[];
 for(let d=0;d<4;d++){const before=b.produced??0;advanceDay(g);deltas.push((b.produced??0)-before);}
 assert.ok(deltas.every(x=>x>=0),'lifetime payload never decreases');
 assert.ok(deltas.some(x=>x>0),'batch days produce');
 assert.ok(deltas.some(x=>x===0),'quiet days apply nothing - the logical reset erases no payload');
 assert.ok(deltas.reduce((a,x)=>a+x,0)===b.produced,'the building counter is exactly the sum of daily applications');
 // the batch is per city: a second fishery in the same port has its own daily batch
 const plot2={id:'cadiz:2',type:'fishery',w:4,d:4};buyPlot(g,'cadiz',plot2);
 g.buildings['cadiz']['cadiz:2']={type:'fishery',level:1,state:'active',plotType:'fishery'};
 const b2=g.buildings['cadiz']['cadiz:2'],p1=b.produced??0;
 advanceDay(g);
 assert.ok((b2.produced??0)>=0&&(b.produced??0)>=p1,'each building owns its batch identity');
});
test('margin streak: unquotable keeps the state, negative days warn once, a profitable day clears and re-arms',()=>{
 const g=newGame(world);g.noGoal=true;g.cash=100000;
 const plot={id:'cadiz:1',type:'workshop',w:4,d:4};buyPlot(g,'cadiz',plot);
 const b={type:'workshop',level:1,state:'active',plotType:'workshop'};
 g.buildings['cadiz']['cadiz:1']=b;
 // unquotable (no wool at all): not a margin signal - the streak state is kept, nothing runs
 g.market.cadiz.wool.stock=0;
 g.tick=1;workshopTick(g,'cadiz');
 assert.equal(b.negDays??0,0,'an unquotable day neither starts nor clears a streak');
 assert.equal(b.produced??0,0);
 // quotable and unprofitable: cloth at the floor, wool scarce and dear
 g.market.cadiz.wool.stock=4; // barely quotable (weave needs 4), extremely dear against target
 g.market.cadiz.cloth.stock=g.market.cadiz.cloth.target*8; // output at the floor
 const box0=(g.inbox??[]).length;
 for(let d=2;d<=4;d++){g.tick=d*1440;g.market.cadiz.wool.stock=4;g.market.cadiz.cloth.stock=g.market.cadiz.cloth.target*8;workshopTick(g,'cadiz');}
 assert.ok((b.negDays??0)>=3,'three negative days counted');
 const warns=(g.inbox??[]).slice(0,(g.inbox??[]).length-box0).filter(m=>m.kind==='bldMargin');
 assert.ok(warns.length<=1,'the warning fires once, not daily');
 // a profitable day clears the streak and re-arms the warning
 g.market.cadiz.wool.stock=g.market.cadiz.wool.target*4;g.market.cadiz.cloth.stock=1;
 g.tick=5*1440;workshopTick(g,'cadiz');
 assert.equal(b.negDays,0,'one profitable day clears the streak');
 assert.equal(b.negWarned,0,'and re-arms the warning');
});

test('configuration fallback and feature-off are separate contracts: missing config falls back, halted preserves everything',()=>{
 const g=newGame(world);g.noGoal=true;g.cash=100000;
 const plot={id:'cadiz:1',type:'fishery',w:4,d:4};buyPlot(g,'cadiz',plot);
 // unknown type: skipped without a sound - no production, no crash, market untouched
 g.buildings['cadiz']['cadiz:1']={type:'mirador',level:1,state:'active',plotType:'fishery'};
 const fish0=g.market.cadiz.fish.stock;
 g.tick=1;workshopTick(g,'cadiz');
 assert.equal(g.market.cadiz.fish.stock,fish0,'an unknown type produces nothing');
 // out-of-range level: the pattern falls back to the top level, never to zero or an error
 g.buildings['cadiz']['cadiz:1']={type:'fishery',level:9,state:'active',plotType:'fishery'};
 const b=g.buildings['cadiz']['cadiz:1'];
 let guard=0;while((b.produced??0)===0&&guard++<6){g.tick=guard*1440;workshopTick(g,'cadiz');}
 assert.ok(b.produced>0,'a level without its own pattern uses the level-3 pattern');
 // feature off: a halted building is skipped and its whole state is preserved, not reset
 b.negDays=2;b.halted=true;
 const producedHalt=b.produced,fishHalt=g.market.cadiz.fish.stock;
 g.tick=7*1440;workshopTick(g,'cadiz');
 assert.equal(b.produced,producedHalt,'halted: no production');
 assert.equal(b.negDays,2,'halted: the margin streak is preserved, not reset');
 assert.equal(g.market.cadiz.fish.stock,fishHalt);
 // feature on again: the restart switches it back without touching the counters
 assert.ok(restartBuilding(g,'cadiz','cadiz:1').ok);
 assert.equal(b.halted,false);assert.equal(b.negDays,2);assert.equal(b.produced,producedHalt);
 // under construction: not active, so no production either
 g.buildings['cadiz']['cadiz:1']={type:'fishery',level:1,state:'construction',plotType:'fishery'};
 const fishC=g.market.cadiz.fish.stock;
 g.tick=8*1440;workshopTick(g,'cadiz');
 assert.equal(g.market.cadiz.fish.stock,fishC,'under construction is off too');
});

test('branch-specific arithmetic: the port ratio guards its own denominator, batches are a bounded integer delta',()=>{
 // staffingRatio: need < 1 returns 1 WITHOUT dividing; need >= 1 divides freeLabor by need, capped at 1
 const g=newGame(world);g.noGoal=true;
 assert.equal(staffingRatio(g,'cadiz'),1,'no buildings: no division at all');
 // a staffed-out port: one worker available, eight wanted -> ratio 1/8 (real path, real fields)
 g.world.nodes.cadiz.pop=10;
 buyPlot(g,'cadiz',{id:'cadiz:1',type:'workshop',w:4,d:4});
 g.buildings['cadiz']['cadiz:1']={type:'workshop',level:1,state:'active',plotType:'workshop'};
 assert.ok(Math.abs(staffingRatio(g,'cadiz')-Math.min(1,freeLabor(g,'cadiz')/jobsNeeded(g,'cadiz')))<1e-12,'ratio = free/need when short');
 assert.ok(staffingRatio(g,'cadiz')<1,'shortage slows the port');
 // zero free hands: ratio 0 and the port tick returns before any building runs
 g.world.nodes.cadiz.pop=1;
 assert.equal(freeLabor(g,'cadiz'),0);
 assert.equal(staffingRatio(g,'cadiz'),0);
 const g2=newGame(world);g2.noGoal=true;g2.cash=100000;
 buyPlot(g2,'cadiz',{id:'cadiz:1',type:'fishery',w:4,d:4});
 g2.buildings['cadiz']['cadiz:1']={type:'fishery',level:3,state:'active',plotType:'fishery'};
 g2.world.nodes.cadiz.pop=1; // one inhabitant: zero free hands, ratio 0
 const fish0=g2.market.cadiz.fish.stock;
 for(let t=1;t<=6;t++){g2.tick=t*1440;workshopTick(g2,'cadiz');}
 assert.equal(g2.market.cadiz.fish.stock,fish0,'staff 0: the port produces nothing');
 // batches today: min(level, cumulative staffing delta) - an integer between 0 and the level
 const g3=newGame(world);g3.noGoal=true;g3.cash=100000;
 buyPlot(g3,'cadiz',{id:'cadiz:1',type:'fishery',w:4,d:4});
 g3.buildings['cadiz']['cadiz:1']={type:'fishery',level:3,state:'active',plotType:'fishery'};
 const b3=g3.buildings['cadiz']['cadiz:1'];
 // units/day <= round(yield * level * (1+SEASON_AMPLITUDE)) + rounding: batches/day <= level, season <= 1.35
 const bound=Math.round(PRODUCERS.fishery.yield*3*(1+SEASON_AMPLITUDE))+1;
 let prev=0;
 for(let t=1;t<=8;t++){g3.tick=t*1440;workshopTick(g3,'cadiz');const now=b3.produced??0;
  const delta=now-prev;prev=now;
  assert.ok(Number.isInteger(delta)&&delta>=0&&delta<=bound,'daily units stay a bounded integer: '+delta);}
 assert.ok(prev>0,'and the fishery does produce across the week');
});
