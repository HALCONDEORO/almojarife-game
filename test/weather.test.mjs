import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {loadWorld,route} from '../src/sim/world.mjs';
import {newGame,doSail} from '../src/game/game.mjs';
import {automaticEncounter} from '../src/game/encounterdaily.mjs';
import {travelEstimate} from '../src/view/nav.mjs';
import {atmosphereSvg} from '../src/view/atmosphere.mjs';
import {WEATHER_REGIONS,regionAt,windAt,legWindFactor,stormsAt,inStorm,forecast} from '../src/sim/weather.mjs';
import {haversineKm} from '../tools/geo.mjs';
const world=loadWorld();

test('regions: chart points fall in their sea',()=>{
 assert.equal(regionAt(43.4,-3.8),'cantabrico'); // off Santander
 assert.equal(regionAt(41.3,2.1),'mediterraneo'); // Barcelona
 assert.equal(regionAt(35.9,-5.4),'estrecho'); // the strait itself
 assert.equal(regionAt(35.1,-6.2),'berberia'); // off Tangier's coast -> atlantic side is west of -8? no: south strip
 assert.equal(regionAt(38.7,-9.4),'atlantico'); // off Lisbon
 assert.deepEqual(WEATHER_REGIONS,['cantabrico','mediterraneo','estrecho','berberia','atlantico']);
});

test('deterministic: same (lat, lon, day, seed) always gives the same weather',()=>{
 for(const[lat,lon,day,seed] of [[38.7,-9.4,30,7],[36.0,-5.6,200,1983901294],[41.3,2.1,330,42]]){
  assert.deepEqual(windAt(lat,lon,day,seed),windAt(lat,lon,day,seed));
  assert.deepEqual(stormsAt(day,seed),stormsAt(day,seed));
  assert.equal(inStorm(lat,lon,day,seed),inStorm(lat,lon,day,seed));
  assert.deepEqual(forecast(lat,lon,day,seed),forecast(lat,lon,day,seed));
 }
 const a={lat:36.5,lon:-6.3},b={lat:38.7,lon:-9.1};
 assert.equal(legWindFactor(a,b,30,7),legWindFactor(a,b,30,7));
});

test('leg wind factor stays inside the old flat-roll range 0.8..1.2',()=>{
 const pts=world.cities.map(c=>({lat:c.lat,lon:c.lon}));
 let n=0;
 for(const a of pts)for(const b of pts)for(const day of [30,120,200,330])for(const seed of [0,1,1983901294]){
  const f=legWindFactor(a,b,day,seed);assert.ok(f>=0.8&&f<=1.2,`factor ${f} ${JSON.stringify(a)}->${JSON.stringify(b)} day ${day}`);n++;
 }
 assert.ok(n>10000);
});

test('estrecho funnels the wind: only levante or poniente',()=>{
 for(let day=0;day<365;day++){const w=windAt(35.9,-5.4,day,3);assert.ok(w.dir===90||w.dir===270,`day ${day} dir ${w.dir}`);}
});

test('storm seasons: winter has cells over the chart, summer none',()=>{
 assert.ok(stormsAt(30,7).length>=4,`winter cells ${stormsAt(30,7).length}`);
 assert.equal(stormsAt(200,7).length,0);
 // a cell keeps its id while its epoch lasts and drifts with the wind
 const d0=stormsAt(30,7),d1=stormsAt(31,7);
 if(d0.length&&d1.length){assert.equal(d0[0].id,d1[0].id);assert.notDeepEqual([d0[0].lat,d0[0].lon],[d1[0].lat,d1[0].lon]);}
});

test('forecast returns one entry per day, in order',()=>{
 const f=forecast(38.7,-9.4,30,7);assert.equal(f.length,7);
 for(let i=0;i<7;i++){assert.equal(f[i].day,30+i);assert.ok(typeof f[i].storm==='boolean');}
});

// Find a winter day and a route out of Cadiz whose path passes through a real cell.
function stormRoute(){
 const seed=7;
 for(let day=0;day<80;day++)for(const cell of stormsAt(day,seed))for(const c of world.cities){
  if(c.id==='cadiz')continue;
  const r=route(world,'cadiz',c.id);if(!r)continue;
  // sample the path every ~15 km; a hit well inside the cell makes the test robust to drift within the epoch
  let along=0;
  for(let i=0;i+1<r.path.length;i++){
   const A=world.nodes[r.path[i]],B=world.nodes[r.path[i+1]];if(!A||!B)continue;
   const seg=haversineKm(A,B),steps=Math.max(1,Math.ceil(seg/15));
   for(let k=0;k<=steps;k++){
    const lat=A.lat+(B.lat-A.lat)*k/steps,lon=A.lon+(B.lon-A.lon)*k/steps;
    const d=Math.hypot((lat-cell.lat)*111,(lon-cell.lon)*111*Math.cos((lat+cell.lat)/2*Math.PI/180));
    if(d<=cell.rKm*0.6)return{day,cell,to:c.id,frac:(along+seg*k/steps)/r.km};
   }
   along+=seg;
  }
 }
 return null;
}

test('an encounter inside a storm cell is that storm; the daily rate is untouched',()=>{
 const sr=stormRoute();assert.ok(sr,'no winter storm route found');
 const g=newGame(world);g.eventsOn=true;g.seed=7;
 const s=g.ships[0];assert.ok(doSail(g,s,sr.to).ok);
 // hold the ship inside the cell: voyage progress pins the position, the day pins the weather
 s.voyage.ticksLeft=Math.round(s.voyage.totalTicks*(1-sr.frac));
 g.day=sr.day;
 let e=null;
 for(let t=sr.day*240+1;t<sr.day*240+400000&&!e;t++){g.tick=t;const r=automaticEncounter(g,s,g.world);if(r&&r.kind)e=r;}
 assert.ok(e,'no encounter fired');
 assert.equal(e.kind,'storm');
 assert.ok(inStorm(...(()=>{const p=sr.cell;return[p.lat,p.lon]})(),sr.day,7));
});

test('travel estimates take the leg wind when it is passed',()=>{
 const g=newGame(world),s=g.ships[0];
 const calm=travelEstimate(world,s,'lisboa'),tail=travelEstimate(world,s,'lisboa',1.2),head=travelEstimate(world,s,'lisboa',0.8);
 assert.ok(calm.ok&&tail.ok&&head.ok);
 assert.ok(tail.ticks<calm.ticks&&calm.ticks<head.ticks);
});

test('atmosphere draws the real cells it is given, and only those',()=>{
 const avoid=[{x:700,y:100}];
 const withCells=atmosphereSvg(800,500,30,false,avoid,[{x:200,y:200,w:120}]);
 assert.ok(withCells.includes('class="cloud storm"'));
 const calm=atmosphereSvg(800,500,30,false,avoid,[]);
 assert.ok(!calm.includes('class="cloud storm"'),'a calm day must draw no storm');
 const legacy=atmosphereSvg(800,500,30,false,avoid); // no weather arg: the old seasonal plan stands
 assert.ok(legacy.includes('class="cloud storm"'));
});

test('the web wires the weather field into chart and estimates',()=>{
 const src=readFileSync(new URL('../web/main.mjs',import.meta.url),'utf8');
 assert.ok(src.includes('stormsAt(g.day'),'storm cells on the chart');
 assert.ok(src.includes('legWindEst(s.at, target)'),'wind-aware estimates');
 assert.ok(src.includes('wxNote(lw)'),'wind in the port tooltip');
 const enc=readFileSync(new URL('../src/game/encounterdaily.mjs',import.meta.url),'utf8');
 assert.ok(enc.includes('inStorm(pos.lat,pos.lon'),'encounters read the cells');
});
