import test from 'node:test';
import assert from 'node:assert/strict';
import { loadWorld } from '../src/sim/world.mjs';
import { newGame, doSail, doGoTo, formConvoy, sailConvoy } from '../src/game/game.mjs';
import { travelEstimate } from '../src/view/nav.mjs';
import { routePreview, previewWind, previewText } from '../src/view/routepreview.mjs';
const world = loadWorld();
const pairs = [['cadiz','huelva'],['cadiz','lisboa'],['lisboa','porto'],['sevilla','cadiz'],['barcelona','valencia']];
for (const [from,to] of pairs) for (const hull of [100,40]) test(`preview equals actual departure ${from}-${to}, hull ${hull}`, () => {
  const g = newGame(world,from,{seed:17}), s=g.ships[0]; s.hull=hull;
  const before=JSON.stringify(g), p=routePreview(g,s,{port:to});
  assert.equal(JSON.stringify(g),before,'preview must not mutate game');
  assert.equal(p.ok,true);
  const e=travelEstimate(world,s,to,previewWind(g,s,from,to));
  assert.equal(p.ticks,e.ticks); assert.equal(p.km,e.km);
  const r=doSail(g,s,to);assert.equal(r.ok,true);assert.equal(p.ticks,r.ticks);assert.equal(p.km,r.km);
});
test('free port preview equals doGoTo including damaged hull',()=>{
  const g=newGame(world,'cadiz',{seed:2,freeNav:true}),s=g.ships[0];s.hull=32;
  const p=routePreview(g,s,{port:'lisboa'}),to=world.nodes.lisboa;
  const r=doGoTo(g,s,to.lat,to.lon);assert.equal(r.ok,true);assert.equal(p.ticks,s.voyage.totalTicks);assert.equal(p.km,r.km);
});
test('open sea preview and underway redirect equal actual orders without mutation',()=>{
  const g=newGame(world,'cadiz',{seed:2,freeNav:true}),s=g.ships[0],pt=Object.values(world.waypoints)[3];
  const before=JSON.stringify(g),p=routePreview(g,s,pt);assert.equal(JSON.stringify(g),before);assert.equal(p.ok,true);
  const r=doGoTo(g,s,pt.lat,pt.lon);assert.equal(r.ok,true);assert.equal(p.ticks,r.ticks);assert.equal(p.km,r.km);
  const other=Object.values(world.waypoints)[8],q=routePreview(g,s,other),r2=doGoTo(g,s,other.lat,other.lon);
  assert.equal(q.ok,true);assert.equal(q.ticks,r2.ticks);assert.equal(q.km,r2.km);
});
test('far from lanes is invalid, not a claim of land classification',()=>{
  const g=newGame(world,'cadiz',{freeNav:true});const p=routePreview(g,g.ships[0],{lat:50,lon:-30});
  assert.equal(p.ok,false);assert.equal(p.reason,'no sea there');assert.match(previewText(p),/Sin ruta navegable cerca/);
  assert.doesNotMatch(previewText(p),/tierra/i);
});
test('port-only mode has no open-sea ETA; no internal identifiers in labels',()=>{
  const g=newGame(world,'cadiz',{}),p=routePreview(g,g.ships[0],{lat:36.4,lon:-6.6});assert.equal(p.reason,'port only');
  const q={ok:true,to:'pt:36.123,-6.456',days:2,km:18};
  assert.equal(previewText(q,{lang:'es'}),'Mar abierto · 2 días · 18 km');
  assert.equal(previewText(q,{lang:'en',destination:'Lisbon'}),'Lisbon · 2 days · 18 km');
});
test('convoy preview uses slowest member and refuses underway course changes',()=>{
  const g=newGame(world,'cadiz',{freeNav:true}),s=g.ships[0];const s2=structuredClone(s);s2.id=2;s2.hull=35;g.ships.push(s2);
  const cv=formConvoy(g,[1,2]);assert.equal(cv.ok,true);
  const p=routePreview(g,s,{port:'lisboa'});assert.equal(p.ok,true);
  assert.equal(sailConvoy(g,cv.convoy.id,'lisboa',{doSail}).ok,true);assert.equal(p.ticks,s.voyage.totalTicks);
  assert.equal(routePreview(g,s,{port:'huelva'}).reason,'convoy');
});
test('under-crewed ship and unknown type fail safely without issuing orders',()=>{
  const g=newGame(world,'cadiz',{freeNav:true}),s=g.ships[0];s.crew=0;
  assert.equal(routePreview(g,s,{port:'lisboa'}).ok,false);
  s.type='unknown';assert.equal(routePreview(g,s,{lat:36,lon:-7}).reason,'unavailable');
});
test('one-day preview uses singular units in both locales',()=>{
  const p={ok:true,days:1,km:76};
  assert.equal(previewText(p,{lang:'es',destination:'Cádiz'}),'Cádiz · 1 día · 76 km');
  assert.equal(previewText(p,{lang:'en',destination:'Cadiz'}),'Cadiz · 1 day · 76 km');
});
