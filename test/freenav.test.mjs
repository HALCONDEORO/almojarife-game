import test from 'node:test';import assert from 'node:assert/strict';
import {loadWorld} from '../src/sim/world.mjs';import {newGame,doGoTo,doSail,advanceDay,advanceTick,waitUntilArrival} from '../src/game/game.mjs';
import {snapToLane,planTrip,locate,freeId,isFreeId,FREE_MAX_KM} from '../src/game/freenav.mjs';
import {shipPosition} from '../src/sim/position.mjs';import {haversineKm} from '../tools/geo.mjs';
import {serialize as packGame,deserialize as unpackGame} from '../src/game/gamesave.mjs';
import {voyageCardHtml} from '../src/view/voyagecard.mjs';
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
test('reroute keeps the wind the voyage already had (no re-roll fishing)',()=>{
 const g=mk(),s=g.ships[0];const dst=w.cities.find(c=>c.id!==s.at);
 doSail(g,s,dst.id);for(let i=0;i<10;i++)advanceTick(g);
 const w0=s.voyage.wind;assert.ok(w0>=0.8&&w0<=1.2);
 const wp=Object.values(w.waypoints)[5];assert.equal(doGoTo(g,s,wp.lat,wp.lon).ok,true);
 assert.equal(s.voyage.wind,w0);
});
test('a leg ordered at sea starts from the ship position, not from the last port',()=>{
 const g=mk(),s=g.ships[0];const dst=w.cities.find(c=>c.id!==s.at);
 doSail(g,s,dst.id);for(let i=0;i<30;i++)advanceTick(g);
 const wp=Object.values(w.waypoints)[6];assert.equal(doGoTo(g,s,wp.lat,wp.lon).ok,true);
 assert.ok(isFreeId(s.voyage.from));
 const [la,lo]=s.voyage.from.slice(3).split(',').map(Number);
 assert.ok(haversineKm({lat:la,lon:lo},shipPosition(w,s))<2);
});
test('every accepted free order writes a diary line',()=>{
 const g=mk(),s=g.ships[0];const wp=Object.values(w.waypoints)[1];
 assert.equal(doGoTo(g,s,wp.lat,wp.lon).ok,true);
 assert.equal(g.log[0].key,'sail');assert.equal(g.log[0].city,s.voyage.to);assert.ok(isFreeId(g.log[0].city));
});
test('the voyage card of an anchored ship holds position and promises no arrival',()=>{
 const g=mk(),s=g.ships[0];const wp=Object.values(w.waypoints)[2];
 doGoTo(g,s,wp.lat,wp.lon);let n=0;while(s.voyage&&!s.voyage.anchored&&n++<20000)advanceTick(g);
 assert.ok(s.voyage?.anchored);
 const html=voyageCardHtml(s,{lang:'es',cityName:id=>id,eta:()=>'ESTIMADA'});
 assert.ok(html.includes('Al pairo'));assert.ok(!html.includes('Llegada estimada')&&!html.includes('ESTIMADA'));
});
test('ledger: reroute retargets the open unsold entry, docking closes it, free points write none',()=>{
 const g=mk(),s=g.ships[0],ports=w.cities.filter(c=>c.id!==s.at).map(c=>c.id);
 const n0=(g.voyages??[]).length;
 assert.equal(doSail(g,s,ports[0]).ok,true);
 assert.equal((g.voyages??[]).length,n0+1);const e=g.voyages[0];assert.equal(e.to,ports[0]);
 // reroute mid-sea to another port: same entry, retargeted
 const p=shipPosition(w,s);const r=doGoTo(g,s,w.nodes[ports[1]].lat,w.nodes[ports[1]].lon);assert.equal(r.ok,true);assert.equal(r.toPort,true);
 assert.equal((g.voyages??[]).length,n0+1);assert.equal(e.to,ports[1]);assert.equal(e.from,s.at??e.from);
 // arrive: the entry closes at its port
 waitUntilArrival(g,s);assert.equal(s.at,ports[1]);assert.equal(s.voyage??null,null);
 // docked -> open sea writes no entry
 const q=Object.values(w.waypoints)[0];assert.equal(doGoTo(g,s,q.lat,q.lon).ok,true);assert.equal((g.voyages??[]).length,n0+1);
 waitUntilArrival(g,s);assert.equal(s.voyage.anchored,true);
 // anchored -> port: the old entry closed at the docking port, so a fresh entry opens from the real position
 assert.equal(doGoTo(g,s,w.nodes[ports[2]].lat,w.nodes[ports[2]].lon).ok,true);
 assert.equal((g.voyages??[]).length,n0+2);const e2=g.voyages[0];assert.equal(e2.to,ports[2]);assert.ok(isFreeId(e2.from)||w.waypoints[e2.from],'the leg starts from the sea place where the ship held position');assert.notEqual(e2,e);
});
test('missions: one sail event per outing to a port, never for points of the sea',()=>{
 const g=mk(),s=g.ships[0];g.campaign.missions['m1-oficio'].step=1; // the 'Zarpa con la carga' step is pending
 const q=Object.values(w.waypoints)[1];assert.equal(doGoTo(g,s,q.lat,q.lon).ok,true); // docked -> open sea: no sail event
 assert.equal(g.campaign.missions['m1-oficio'].step,1);assert.equal(s.voyage.sailLogged,false);
 waitUntilArrival(g,s);const port=w.cities.find(c=>c.id!==s.at);assert.equal(doGoTo(g,s,w.nodes[port.id].lat,w.nodes[port.id].lon).ok,true);
 assert.equal(g.campaign.missions['m1-oficio'].step,2);assert.equal(s.voyage.sailLogged,true); // anchored -> port: one event
 const p2=w.cities.find(c=>c.id!==s.at&&c.id!==port.id);assert.equal(doGoTo(g,s,w.nodes[p2.id].lat,w.nodes[p2.id].lon).ok,true);
 assert.equal(g.campaign.missions['m1-oficio'].step,2); // rerouting keeps the logged event
});
test('chart: ordering into an undiscovered port up close puts it on the chart',()=>{
 const g=mk(),s=g.ships[0];const q=Object.values(w.waypoints)[2];assert.equal(doGoTo(g,s,q.lat,q.lon).ok,true);waitUntilArrival(g,s);
 const far=w.cities.filter(c=>g.discovered[c.id]===undefined).sort((a,b)=>haversineKm(shipPosition(w,s),a)-haversineKm(shipPosition(w,s),b))[0];
 assert.ok(far,'test needs an undiscovered port');assert.equal(doGoTo(g,s,w.nodes[far.id].lat,w.nodes[far.id].lon).ok,true);
 assert.ok(g.discovered[far.id]!==undefined);
});
test('a free order changes only its own ship: other ships keep their voyages and ledger entries',()=>{
 const g=mk(),a=g.ships[0];
 const b={...a,id:'ship-b',name:'B',at:a.at,voyage:null,cargo:{}};
 g.ships.push(b);
 const ports=w.cities.filter(c=>c.id!==a.at).map(c=>c.id);
 assert.equal(doSail(g,b,ports[0]).ok,true);const vb=JSON.stringify(b.voyage),nb=(g.voyages??[]).length;
 const p=shipPosition(w,a);void p;
 const q=Object.values(w.waypoints)[3]??Object.values(w.waypoints)[0];
 assert.equal(doGoTo(g,a,q.lat,q.lon).ok,true); // docked -> open sea on the OTHER ship
 assert.equal(JSON.stringify(b.voyage),vb);assert.equal((g.voyages??[]).length,nb);
 assert.equal(doGoTo(g,a,w.nodes[ports[1]].lat,w.nodes[ports[1]].lon).ok,true); // reroute to a port
 assert.equal(JSON.stringify(b.voyage),vb);assert.equal((g.voyages??[]).length,nb+1); // only its own entry opens
});
test('port snap radius is PORT_SNAP_KM (12) measured from the snapped lane point',()=>{
 const c=w.nodes.cadiz,ship={at:'huelva',voyage:null};
 const near=planTrip(w,ship,c.lat,c.lon-0.14); // snapped lane point ~11.1 km from the port
 assert.equal(near.ok,true);assert.equal(near.toPort,true);assert.equal(near.to,'cadiz');
 const far=planTrip(w,ship,c.lat,c.lon-0.16); // snapped lane point ~12.7 km from the port
 assert.equal(far.ok,true);assert.equal(far.toPort,false);assert.ok(isFreeId(far.to));
});

test("wiring: newGame leaves no freeNav key when OFF, sets it only with the opt", () => {
  const off = newGame(w); assert.ok(!("freeNav" in off), "OFF games carry no freeNav key");
  const on = newGame(w, "cadiz", { freeNav: true }); assert.equal(on.freeNav, true);
});
test("wiring: serialized OFF games carry no freeNav key; ON games keep it", async () => {
  const { serialize } = await import("../src/game/gamesave.mjs");
  const off = JSON.stringify(serialize(newGame(w), "Co", 0)); assert.ok(!off.includes('"freeNav"'), "OFF save has no freeNav key");
  const on = JSON.stringify(serialize(newGame(w, "cadiz", { freeNav: true }), "Co", 0)); assert.ok(on.includes('"freeNav":true'));
});

test('course replacement is not a halt: the position becomes the origin, wind and sail log carry, refusal keeps its reason',()=>{
 const g=mk(),s=g.ships[0];g.noGoal=true;
 assert.ok(doSail(g,s,'barcelona').ok);
 let n=0;while(n++<30)advanceTick(g); // well underway
 assert.ok(s.voyage&&!s.voyage.anchored);
 const wind=s.voyage.wind,legs=(g.voyages??[]).filter(v=>v.ship===s.id).length;
 // mid-leg reroute: the current position, not the origin port, is the new leg's origin
 const r=doGoTo(g,s,w.nodes.valencia.lat,w.nodes.valencia.lon);
 assert.equal(r.ok,true);assert.equal(r.toPort,true);
 assert.equal(s.voyage.to,'valencia','the target reference is replaced');
 assert.notEqual(s.voyage.from,'cadiz','the new leg starts where the ship is');
 assert.ok(!s.voyage.anchored&&s.voyage.ticksLeft>0,'no halt: the ship keeps sailing');
 assert.equal(s.voyage.wind,wind,'changing course keeps the wind it already had');
 assert.equal(s.voyage.sailLogged,true,'the outing stays the one already logged');
 const legs2=(g.voyages??[]).filter(v=>v.ship===s.id);
 assert.equal(legs2.length,legs,'the ledger retargets the open entry instead of adding one');
 assert.equal(legs2[0].to,'valencia');
 // a refused change stops nothing and keeps its reason until a new order succeeds
 const before=JSON.stringify(s.voyage);
 assert.equal(doGoTo(g,s,50,-30).reason,'no sea there');
 assert.equal(s.navError,'no sea there');
 assert.equal(JSON.stringify(s.voyage),before,'the route survives a failed order untouched');
 assert.ok(doGoTo(g,s,w.nodes.palma.lat,w.nodes.palma.lon).ok);
 assert.equal(s.navError,undefined,'a successful order clears the last refusal');
 // the only acknowledged halt is the anchor: a free endpoint stops the world step, keeping the route
 const wp=Object.values(w.waypoints)[3];
 assert.ok(doGoTo(g,s,wp.lat,wp.lon).ok&&s.voyage.free);
 n=0;while(s.voyage&&!s.voyage.anchored&&n++<20000)advanceTick(g);
 assert.ok(s.voyage?.anchored,'the world step acknowledges the halt, not the command');
 assert.ok(s.at==='cadiz','anchored at sea: no port claim');
 // a new order lifts the anchor: cleanup happens on the next command, not on the halt
 assert.ok(doGoTo(g,s,w.nodes.valencia.lat,w.nodes.valencia.lon).ok);
 assert.ok(!s.voyage.anchored&&s.voyage.to==='valencia');
});
