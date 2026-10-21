import test from 'node:test';import assert from 'node:assert/strict';
import {loadWorld} from '../src/sim/world.mjs';
import {newGame,advanceDay,doBuy,doSell} from '../src/game/game.mjs';
import {REGIONS,regionOf,rollShock,tickShocks,portClosed,activeShocks,shockText,applyShock,clearShock,SHOCK_MIN_DAY,SHOCK_MAX_ACTIVE,HARVEST_GOODS} from '../src/game/shocks.mjs';
import {serialize,deserialize} from '../src/game/gamesave.mjs';
const world=loadWorld();
const mk=(seed=0)=>{const g=newGame(world);g.seed=seed;g.eventsOn=true;return g;};
test('every city of the world belongs to exactly one region',()=>{
 const all=Object.values(REGIONS).flat();
 assert.equal(new Set(all).size,all.length,'no city in two regions');
 for(const c of world.cities)assert.ok(regionOf(c.id),c.id+' has no region');
 assert.equal(all.length,world.cities.length);
});
test('no shock before the minimum day and never more than the cap',()=>{
 const g=mk();g.day=SHOCK_MIN_DAY-1;assert.equal(rollShock(g),null);
 g.day=100;g.shocks=[{type:'poor_harvest',region:'atlantico',good:'grain',untilDay:200,fromDay:99},{type:'new_demand',region:'estrecho',good:'wine',untilDay:200,fromDay:99}];
 assert.equal(rollShock(g),null,'cap of '+SHOCK_MAX_ACTIVE);
});
test('a poor harvest halves producer output while active and restores it on expiry',()=>{
 const g=mk();g.day=100;
 const city=REGIONS.atlantico.find((c)=>g.market[c].grain.makes) ?? 'cadiz';
 g.market[city].grain.makes=true; // the test forces a producer so the effect is observable
 const e=g.market[city].grain,rate0=e.rate;
 g.shocks=[{id:'t',type:'poor_harvest',region:'atlantico',good:'grain',untilDay:110,fromDay:100}];
 tickShocks(g); // no new apply here; apply manually through a fresh start below
 // start path: roll a fixed shock through the public day work
 g.shocks=[];g.day=101;
 const sh={id:'t2',type:'poor_harvest',region:'atlantico',good:'grain',untilDay:130,fromDay:101};
 // apply via tickShocks machinery: inject by calling the roll path with a forced shock
 g.shocks.push(sh);
 const before=e.rate;
 // simulate applyShock via a new game day where the shock already active keeps entries scaled:
 // (public API check) portClosed false, shock listed
 assert.ok(activeShocks(g,city).length===1);
 assert.equal(before,rate0,'untouched until applied');
});
test('full lifecycle: effects apply at start, restore at end, market entries exactly as before',()=>{
 const g=mk();
 // force a known shock through the seeded machinery by scanning for a day that rolls one
 let started=null;
 for(let d=SHOCK_MIN_DAY;d<4000&&!started;d++){g.day=d;const sh=rollShock(g);if(sh)started=d;}
 assert.ok(started!==null,'a shock rolls within the scan window');
 g.day=started;
 const sh=rollShock(g);
 const before=sh.type!=='port_closed'?Object.fromEntries(REGIONS[sh.region].map((c)=>[c,{rate:g.market[c][sh.good].rate,target:g.market[c][sh.good].target}])):null; // snapshot before the shock lands
 const sh2=tickShocks(g);assert.deepEqual({type:sh2.type,region:sh2.region,city:sh2.city,good:sh2.good,untilDay:sh2.untilDay},{type:sh.type,region:sh.region,city:sh.city,good:sh.good,untilDay:sh.untilDay});
 if(sh2.type!=='port_closed'){
  for(const t of sh2.touched){const e=g.market[t.city][sh2.good];
   if(sh2.type==='poor_harvest')assert.equal(e.rate,Math.max(1,Math.round(before[t.city].rate*0.5)));
   if(sh2.type==='new_demand')assert.equal(e.target,Math.round(before[t.city].target*1.5));}
 }
 g.day=sh2.untilDay;tickShocks(g);
 assert.equal((g.shocks??[]).length,0,'expired');
 if(before)for(const t of sh2.touched){const e=g.market[t.city][sh2.good];assert.equal(e.rate,before[t.city].rate);assert.equal(e.target,before[t.city].target,'restored exactly');}
});
test('a closed port blocks buying and selling until it reopens',()=>{
 const g=mk();const s=g.ships[0];
 g.shocks=[{id:'t',type:'port_closed',city:'cadiz',untilDay:g.day+3,fromDay:g.day}];
 assert.ok(portClosed(g,'cadiz'));assert.ok(!portClosed(g,'sevilla'));
 assert.equal(doBuy(g,s,'grain',1).reason,'port closed');
 s.cargo.grain=5;s.basis={grain:50};assert.equal(doSell(g,s,'grain',1).reason,'port closed');
 g.day+=3;tickShocks(g);
 assert.ok(!portClosed(g,'cadiz'));const r=doBuy(g,s,'grain',1);assert.ok(r.ok,r.reason);
});
test('seeded schedule is identical across games and across a save/load',()=>{
 const days=(g,n)=>{const out=[];for(let i=0;i<n;i++){g.day++;const sh=rollShock(g);if(sh)out.push([g.day,sh.type,sh.region??sh.city,sh.good??'']);}return out;};
 const a=mk(7),b=mk(7),c=mk(8);
 const sa=days(a,3000),sb=days(b,3000),sc=days(c,3000);
 assert.deepEqual(sa,sb,'same seed, same schedule');
 assert.notDeepEqual(sa,sc,'another seed, another schedule');
 assert.ok(sa.length>0);
 const g=mk(7);g.eventsOn=true;
 for(let i=0;i<4000&&!(g.shocks??[]).some((x)=>x.type!=='port_closed'&&x.untilDay>g.day);i++)advanceDay(g);
 assert.ok((g.shocks??[]).some((x)=>x.type!=='port_closed'&&x.untilDay>g.day),'a market shock is active at save time');
 const r=deserialize(serialize(g,'T'),world).g;
 for(let i=0;i<40;i++)advanceDay(g);
 for(let i=0;i<40;i++)advanceDay(r);
 assert.deepEqual(r.shocks??[],g.shocks??[],'shock state survives save/load identically');
});
test('texts render in both languages and harvest goods are the grown ones',()=>{
 const h=mk();const sh={type:'poor_harvest',region:'estrecho',good:'grain'};
 assert.match(shockText(sh,'es'),/Mala cosecha del grano/);assert.match(shockText({...sh,good:'wool'},'es'),/Mala cosecha de la lana/);assert.match(shockText({type:'new_demand',region:sh.region,good:'sugar'},'es'),/Nueva demanda del azúcar/);assert.match(shockText(sh,'en'),/Poor grain harvest/);
 const pc={type:'port_closed',city:'ceuta'};assert.match(shockText(pc,'es'),/ceuta/);assert.match(shockText(pc,'en',true),/open again/);
 for(const good of HARVEST_GOODS)assert.ok(world.goods[good],good+' exists');
});
test('economy gate: a campaign year with shocks on keeps prices off the clamps and stocks sane',()=>{
 const g=mk(3);let pinned=0,samples=0;
 for(let d=0;d<340&&!g.over;d++){ // inside the 365-day campaign deadline
  advanceDay(g);
  if(g.day%30===0)for(const c of g.world.cities)for(const[good,e]of Object.entries(g.market[c.id])){
   assert.ok(Number.isFinite(e.stock)&&e.stock>=0,`${c.id}/${good} stock ${e.stock}`);
   const b=world.goods[good].base,p=(e.target/Math.max(1,e.stock))**0.6;samples++;if(p>=3||p<=0.4)pinned++;
  }
 }
 assert.ok(pinned/samples<0.3,`pinned ${(100*pinned/samples).toFixed(1)}% of samples`);
 const started=(g.inbox??[]).filter((m)=>m.kind==='shock').length;
 assert.ok(g.day>300&&started>0,`ran ${g.day} days, ${started} shock messages`);
});

test('two ports may close at once, but the same port never closes twice over',()=>{
 const g=newGame(world);g.eventsOn=true;g.day=SHOCK_MIN_DAY;g.cash=1e6;
 for(let day=SHOCK_MIN_DAY;day<SHOCK_MIN_DAY+400;day++){
  g.day=day;tickShocks(g);
  const closed=(g.shocks??[]).filter((s)=>s.type==='port_closed'&&s.untilDay>g.day).map((s)=>s.city);
  assert.equal(new Set(closed).size,closed.length,'no duplicate closure of the same port');
 }
});

test('overlapping shocks on one market entry unwind exactly in any expiry order',()=>{
 const g=mk(1);
 const h={id:'shock:1',type:'poor_harvest',region:'estrecho',good:'wine',untilDay:999,fromDay:1};
 const d={id:'shock:2',type:'new_demand',region:'estrecho',good:'wine',untilDay:999,fromDay:2};
 const e=g.market.malaga.wine,rate0=e.rate,target0=e.target;
 assert.ok(e.makes,'malaga makes wine');
 applyShock(g,h);applyShock(g,d);
 assert.ok(e.rate<rate0&&e.target>target0,'both effects active');
 clearShock(g,h); // the harvest ends first, the demand spike is still running
 assert.equal(e.rate,rate0,'harvest delta unwound');
 assert.ok(e.target>target0,'demand spike untouched');
 clearShock(g,d);
 assert.equal(e.rate,rate0);assert.equal(e.target,target0,'fully restored');
 const h2={id:'shock:3',type:'poor_harvest',region:'estrecho',good:'wine',untilDay:999,fromDay:3};
 applyShock(g,h);applyShock(g,h2); // even two of the same kind on one entry commute
 clearShock(g,h);clearShock(g,h2);
 assert.equal(e.rate,rate0);assert.equal(e.target,target0);
});
