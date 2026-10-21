import test from 'node:test';import assert from 'node:assert/strict';
import {loadWorld} from '../src/sim/world.mjs';
import {newGame} from '../src/game/game.mjs';
import {accrueBuildings,restartBuilding,jobsNeeded,staffingRatio,workshopTick,WAGE_PER_WORKER} from '../src/game/buildings.mjs';
import {buildingsRows,parseBldAct,buildingLabel} from '../src/view/buildingsview.mjs';
import {messageText} from '../src/view/ledgerview.mjs';
const world=loadWorld();
const T={bldTypes:{workshop:'Taller'},bldState:{plot:'solar',halted:'parado'}};

test('wages accrue with the upkeep: one coin per worker per day',()=>{
 const g=newGame(world);
 g.buildings={cadiz:{'cadiz:1':{type:'workshop',level:2,state:'active'},'cadiz:2':{type:'house',level:1,state:'active'}}};
 accrueBuildings(g);
 assert.equal(g.accrued.buildings['cadiz/cadiz:1'],3*2+8*2*WAGE_PER_WORKER,'upkeep plus sixteen workers');
 assert.equal(g.accrued.buildings['cadiz/cadiz:2'],1,'a house hires nobody: upkeep only');
});
test('a building that cannot be paid halts and posts a message',()=>{
 const g=newGame(world);g.cash=10;
 g.buildings={cadiz:{'cadiz:1':{type:'workshop',level:2,state:'active'}}}; // 22/day
 accrueBuildings(g);
 assert.equal(g.buildings.cadiz['cadiz:1'].halted,true,'no cash at charge time: the workers walk');
 assert.equal(g.accrued?.buildings?.['cadiz/cadiz:1']??0,0,'nothing accrues that day');
 const m=(g.inbox??[]).find((x)=>x.kind==='halt');
 assert.ok(m&&m.city==='cadiz'&&m.plot==='cadiz:1','the halt message names port and plot');
 assert.ok(messageText(m,'es',(x)=>x).includes('cadiz:1'),'and renders in the inbox');
});
test('the day’s charges commit in order across buildings',()=>{
 const g=newGame(world);g.cash=22.5;
 g.buildings={cadiz:{'cadiz:1':{type:'workshop',level:2,state:'active'},'cadiz:2':{type:'house',level:1,state:'active'}}}; // 22, then 1
 accrueBuildings(g);
 assert.equal(g.buildings.cadiz['cadiz:1'].halted??false,false,'the workshop still fits');
 assert.equal(g.buildings.cadiz['cadiz:2'].halted,true,'the house sees the workshop’s charge already committed');
 assert.equal(g.accrued.buildings['cadiz/cadiz:2']??0,0);
});
test('a halted building produces nothing, needs no workers and accrues nothing',()=>{
 const g=newGame(world);g.cash=100000;
 g.buildings={cadiz:{'cadiz:1':{type:'saltworks',level:2,state:'active',halted:true}}};
 assert.equal(jobsNeeded(g,'cadiz'),0,'out of the jobs count');
 assert.equal(staffingRatio(g,'cadiz'),1,'no shortage without jobs');
 g.tick=241;const before=g.market.cadiz.salt.stock;workshopTick(g,'cadiz');
 assert.equal(g.market.cadiz.salt.stock,before,'no production while halted');
 g.cash=0; // broke: no auto-restart either
 accrueBuildings(g);
 assert.equal(g.buildings.cadiz['cadiz:1'].halted,true,'stays halted while broke');
 assert.equal(g.accrued?.buildings?.['cadiz/cadiz:1']??0,0,'and no costs');
});
test('restartBuilding needs cash and clears the halt',()=>{
 const g=newGame(world);g.cash=0;
 g.buildings={cadiz:{'cadiz:1':{type:'workshop',level:1,state:'active',halted:true}}};
 assert.deepEqual(restartBuilding(g,'cadiz','cadiz:1'),{ok:false,reason:'no cash'});
 g.cash=50;
 assert.deepEqual(restartBuilding(g,'cadiz','cadiz:1'),{ok:true});
 assert.equal(g.buildings.cadiz['cadiz:1'].halted,false);
 assert.equal(restartBuilding(g,'cadiz','cadiz:1').ok,false,'cannot restart what is not halted');
});
test('a halted building auto-restarts with hysteresis: two days of cost, not one',()=>{
 const g=newGame(world);
 g.buildings={cadiz:{'cadiz:1':{type:'workshop',level:1,state:'active',halted:true}}}; // 11/day
 g.cash=1;
 accrueBuildings(g);
 assert.equal(g.buildings.cadiz['cadiz:1'].halted,true,'stays halted without cash');
 assert.equal((g.inbox??[]).filter((m)=>m.kind==='restart').length,0,'no restart message');
 g.cash=11; // one day of cost: not enough, hysteresis asks for two
 accrueBuildings(g);
 assert.equal(g.buildings.cadiz['cadiz:1'].halted,true,'one day of cash does not restart it (no daily flapping)');
 assert.equal((g.inbox??[]).filter((m)=>m.kind==='restart').length,0,'still no restart message');
 g.cash=22; // two days of cost
 accrueBuildings(g);
 accrueBuildings(g);
 assert.equal(g.buildings.cadiz['cadiz:1'].halted,false,'restarts on its own once cash covers two days');
 assert.equal((g.inbox??[]).filter((m)=>m.kind==='restart').length,1,'restart message posted');
 assert.ok((g.accrued?.buildings?.['cadiz/cadiz:1']??0)>0,'and accrues its cost again');
});
test('rows show wages and the halted state; parseBldAct reads restart',()=>{
 const g=newGame(world);
 g.buildings={cadiz:{'cadiz:1':{type:'workshop',level:2,state:'active'},'cadiz:2':{type:'mine',level:1,state:'active',halted:true}}};
 const rows=buildingsRows(g,'cadiz');
 const w=rows.find((r)=>r.plotId==='cadiz:1'),m=rows.find((r)=>r.plotId==='cadiz:2');
 assert.equal(w.wages,16*WAGE_PER_WORKER);assert.equal(w.halted,false);
 assert.equal(m.halted,true);assert.equal(m.upkeep,0,'no running costs while halted');assert.equal(m.jobs??0,0);
 assert.deepEqual(parseBldAct('restart|cadiz:1'),{kind:'restart',plotId:'cadiz:1'});
 assert.equal(parseBldAct('restart'),null);
 assert.ok(buildingLabel(T,m).includes('parado'),'the label flags the halt');
 assert.ok(!buildingLabel(T,w).includes('parado'));
});
