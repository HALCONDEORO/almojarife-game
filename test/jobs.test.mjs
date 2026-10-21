import test from 'node:test';import assert from 'node:assert/strict';
import {loadWorld} from '../src/sim/world.mjs';
import {newGame} from '../src/game/game.mjs';
import {BUILDING_TYPES,JOBS_PER_LEVEL,TOWN_JOBS_SHARE,jobsNeeded,freeLabor,staffingRatio,buyPlot,workshopTick} from '../src/game/buildings.mjs';
const world=loadWorld();

test('every buildable type has a jobs row; houses need none',()=>{
 for(const t of Object.keys(BUILDING_TYPES))assert.ok(Number.isInteger(JOBS_PER_LEVEL[t]),t+' has a jobs row');
 assert.equal(JOBS_PER_LEVEL.house,0,'houses need no workers');
 assert.ok(JOBS_PER_LEVEL.mine>JOBS_PER_LEVEL.saltworks,'heavy industry needs the most hands');
});
test('jobsNeeded sums active building levels only',()=>{
 const g=newGame(world);
 g.buildings={cadiz:{'cadiz:1':{type:'workshop',level:2,state:'active'},'cadiz:2':{type:'mine',level:1,state:'construction'},'cadiz:3':{type:'warehouse',level:3,state:'plot'}}};
 assert.equal(jobsNeeded(g,'cadiz'),8*2,'only the active workshop counts');
 assert.equal(jobsNeeded(g,'lisboa'),0,'a port with no buildings needs nobody');
});
test('freeLabor is the effective population minus the town\'s own jobs, houses count in full',()=>{
 const g=newGame(world);
 const pop=g.world.nodes.cadiz.pop;
 assert.equal(freeLabor(g,'cadiz'),Math.max(0,pop-Math.round(pop*TOWN_JOBS_SHARE)),'base inhabitants minus the town economy');
 g.buildings={cadiz:{'cadiz:1':{type:'house',level:2,state:'active'}}};
 assert.equal(freeLabor(g,'cadiz'),Math.max(0,pop-Math.round(pop*TOWN_JOBS_SHARE))+100,'every house inhabitant can be hired');
});
test('staffingRatio: 1 with no jobs or enough hands, free/needed in a shortage',()=>{
 const g=newGame(world);
 assert.equal(staffingRatio(g,'cadiz'),1,'no jobs, full ratio');
 g.buildings={cadiz:{'cadiz:1':{type:'workshop',level:2,state:'active'}}};
 assert.equal(staffingRatio(g,'cadiz'),1,'a real port staffs a single workshop');
 const pop=g.world.nodes.cadiz.pop;
 try{
  g.world.nodes.cadiz.pop=50; // hamlet: town jobs 45, free inhabitants 5, needed 16
  assert.equal(staffingRatio(g,'cadiz'),5/16,'the whole port shares the shortage');
 }finally{g.world.nodes.cadiz.pop=pop;}
});
test('a shortage of inhabitants slows the whole port instead of stopping one building',()=>{
 const run=(pop)=>{
  const g=newGame(world);g.cash=100000;
  const node=g.world.nodes.cadiz,orig=node.pop;node.pop=pop;
  try{
   const plot={id:'cadiz:1',type:'workshop',w:4,d:4};buyPlot(g,'cadiz',plot);
   g.buildings['cadiz']['cadiz:1']={type:'saltworks',level:2,state:'active',plotType:'workshop'};
   let produced=0;
   for(let day=0;day<12;day++){g.tick=day*240+1;const b4=g.market.cadiz.salt.stock;workshopTick(g,'cadiz');produced+=Math.max(0,g.market.cadiz.salt.stock-b4);}
   return produced;
  }finally{node.pop=orig;}
 };
 const full=run(world.nodes.cadiz.pop);
 const short=run(17); // town jobs 15, free inhabitants 2, needed 12, staffing 1/6
 assert.ok(full>0,'a fully staffed saltworks yields salt');
 assert.ok(short>0,'a short-staffed one still yields some days');
 assert.ok(short<full,'but clearly less than fully staffed');
 assert.ok(short<=Math.ceil(full/2),'far less at one-sixth staffing');
});
test('staffing of 1 reproduces the pre-jobs pattern exactly',()=>{
 const g=newGame(world);g.cash=100000;
 const plot={id:'cadiz:1',type:'workshop',w:4,d:4};buyPlot(g,'cadiz',plot);
 g.buildings['cadiz']['cadiz:1']={type:'saltworks',level:1,state:'active',plotType:'workshop'};
 // level 1 pattern [1,0]: produces on even days only, with full staffing as before
 const days=[];
 for(let day=0;day<6;day++){g.tick=day*240+1;const b4=g.market.cadiz.salt.stock;workshopTick(g,'cadiz');if(g.market.cadiz.salt.stock>b4)days.push(day);}
 assert.deepEqual(days,[1,3,5],'the old alternate-day rhythm is untouched at full staffing');
});
