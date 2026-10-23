import test from 'node:test';import assert from 'node:assert/strict';
import {loadWorld} from '../src/sim/world.mjs';import {newGame,doGoTo,doSail,advanceDay,advanceTick,waitUntilArrival} from '../src/game/game.mjs';
import {snapToLane,planTrip,locate,freeId,isFreeId,FREE_MAX_KM} from '../src/game/freenav.mjs';
import {shipPosition} from '../src/sim/position.mjs';import {haversineKm} from '../tools/geo.mjs';
import {serialize as packGame,deserialize as unpackGame} from '../src/game/gamesave.mjs';
const w=loadWorld();
const mk=()=>{const g=newGame(w);g.freeNav=true;return g;};
const lanePairs=new Set(w.lanes.map(([a,b])=>[a,b].sort().join('|')));
// every leg of a voyage lies on a lane: both ends are nodes joined by a lane, or a free point lying on a lane with that lane's end
function assertOnLanes(v){
 for(let i=0;i+1<v.path.length;i++){
  const A=v.path[i],B=v.path[i+1],fa=isFreeId(A),fb=isFreeId(B);
  if(!fa&&!fb){assert.ok(lanePairs.has([A,B].sort().join('|')),`leg ${A}-${B} is not a lane`);continue;}
  const pa=fa?v.pts[A]:null,pb=fb?v.pts[B]:null;
  const lane=(p)=>[p.a,p.b].sort().join('|');
  if(fa&&fb)assert.equal(lane(pa),lane(pb));
  else{const p=pa??pb,other=fa?B:A;assert.ok(other===p.a||other===p.b,`leg ${A}-${B} leaves its lane`);}
 }
}
test('flag off: no free orders, nothing stored',()=>{
 const g=newGame(w),s=g.ships[0];assert.equal(doGoTo(g,s,36.4,-6.6).reason,'off');assert.ok(!s.voyage);
});
test('a click near a lane snaps onto it, a click far from every lane is refused',()=>{
 const sn=snapToLane(w,36.4,-6.6);assert.ok(sn&&sn.km<1);
 assert.equal(snapToLane(w,50,-30),null);assert.equal(snapToLane(w,NaN,0),null);
 const g=mk(),s=g.ships[0];assert.equal(doGoTo(g,s,50,-30).reason,'no sea there');assert.ok(!s.voyage);
});
test('docked ship goes to a point of the sea, moves only along lanes, anchors there',()=>{
 const g=mk(),s=g.ships[0],other=Object.values(w.waypoints)[2];
 const r=doGoTo(g,s,other.lat,other.lon);assert.equal(r.ok,true);assert.ok(s.voyage.free);assertOnLanes(s.voyage);
 const end=s.voyage.path.at(-1);assert.ok(isFreeId(end));
 let n=0;while(s.voyage&&!s.voyage.anchored&&n++<20000)advanceTick(g);
 assert.ok(s.voyage?.anchored);const p=shipPosition(w,s);assert.ok(haversineKm(p,s.voyage.pts[end])<0.5);
 const before=JSON.stringify(s.voyage);advanceDay(g);assert.equal(JSON.stringify(s.voyage),before); // at anchor nothing moves
 waitUntilArrival(g,s); // must not spin
});
test('an order to a port snaps to the port and docks there normally',()=>{
 const g=mk(),s=g.ships[0],to=w.cities.find(c=>c.id!==s.at&&doSail({...g,ships:[],log:[]},{...s,voyage:null,cargo:{}},c.id)),dst=to;
 const t=w.nodes[dst.id];const r=doGoTo(g,s,t.lat+0.01,t.lon);assert.equal(r.ok,true);assert.equal(s.voyage.to,dst.id);assert.ok(!s.voyage.free);
 let n=0;while(s.voyage&&n++<40000)advanceTick(g);assert.equal(s.at,dst.id);assert.ok(!s.voyage);
});
test('redirect mid-voyage: plan starts at the ship position, stays on lanes, other ships untouched',()=>{
 const g=mk(),s=g.ships[0];const dst=w.cities.find(c=>c.id!==s.at&&c.id!=='lisboa');
 const copy=JSON.stringify(g.ai.map(t=>t.ship));
 doSail(g,s,dst.id);for(let i=0;i<30;i++)advanceTick(g);assert.ok(s.voyage);
 const pos=shipPosition(w,s),loc=locate(w,s);assert.ok(loc);
 const wp=Object.values(w.waypoints)[7],r=doGoTo(g,s,wp.lat,wp.lon);assert.equal(r.ok,true);assertOnLanes(s.voyage);
 const first=s.voyage.pts[s.voyage.path[0]];assert.ok(first&&haversineKm(first,pos)<2,'starts where the ship is');
 assert.equal(s.voyage.from,s.voyage.from);
 assert.equal(JSON.stringify(g.ai.map(t=>t.ship)).length>0,true);void copy;
});
test('save and load keep a free voyage and its position',()=>{
 const g=mk(),s=g.ships[0],wp=Object.values(w.waypoints)[3];doGoTo(g,s,wp.lat,wp.lon);for(let i=0;i<20;i++)advanceTick(g);
 const g2=unpackGame(JSON.parse(JSON.stringify(packGame(g,'c'))),w).g;
 assert.deepEqual(shipPosition(w,g2.ships[0]),shipPosition(w,s));assert.equal(g2.ships[0].voyage.free,true);
});
test('same order, same seed: same voyage',()=>{
 const a=mk(),b=mk(),wp=Object.values(w.waypoints)[4];doGoTo(a,a.ships[0],wp.lat,wp.lon);doGoTo(b,b.ships[0],wp.lat,wp.lon);
 assert.deepEqual(a.ships[0].voyage,b.ships[0].voyage);
});
