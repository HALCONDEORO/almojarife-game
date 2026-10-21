import test from 'node:test';import assert from 'node:assert/strict';
import {loadWorld} from '../src/sim/world.mjs';
import {newGame} from '../src/game/game.mjs';
import {COASTS,coastOf,chartPrice,chartOffers,buyChart,routeRumorTarget,buyRouteRumor,CHART_BASE,CHART_PER_PORT,ROUTE_RUMOR_PRICE} from '../src/game/charts.mjs';
import {isDiscovered,startingChart} from '../src/game/fog.mjs';
const world=loadWorld();

test('every city belongs to exactly one coast',()=>{
 const seen=new Map();
 for(const [k,c] of Object.entries(COASTS))for(const p of c.ports){
  assert.ok(world.cities.some(x=>x.id===p),p+' exists in the world');
  assert.ok(!seen.has(p),p+' in two coasts');seen.set(p,k);
 }
 assert.equal(seen.size,world.cities.length,'all '+world.cities.length+' cities charted');
});
test('chartPrice is the base plus a per-port rate',()=>{
 for(const [k,c] of Object.entries(COASTS))assert.equal(chartPrice(k),CHART_BASE+CHART_PER_PORT*c.ports.length,k);
});
test('chartOffers hides the home coast and any fully discovered coast',()=>{
 const g=newGame(world); // startingChart already knows the home coast
 const home=g.profile.home,own=coastOf(home);
 const offers=chartOffers(g,home);
 assert.ok(!offers.includes(own),'never sells your own coast');
 for(const k of offers)assert.ok(COASTS[k].ports.some(c=>!isDiscovered(g,c)),k+' still hides a port');
});
test('buyChart puts the whole coast on the map, charges once and refuses a re-buy',()=>{
 const g=newGame(world);g.cash=100000;
 const home=g.profile.home,coast='berberia';
 assert.ok(!isDiscovered(g,'oran'),'unknown before');
 const r=buyChart(g,coast,home);
 assert.ok(r.ok,'purchase works');
 assert.equal(r.cost,chartPrice(coast));
 for(const c of COASTS[coast].ports)assert.ok(isDiscovered(g,c),c+' on the chart');
 assert.equal(g.cash,100000-chartPrice(coast));
 const again=buyChart(g,coast,home);
 assert.equal(again.reason,'already charted','idempotent');
});
test('buyChart refuses without cash and without a ship in port',()=>{
 const g=newGame(world);g.cash=10;
 assert.equal(buyChart(g,'baleares',g.profile.home).reason,'no cash');
 const g2=newGame(world);
 assert.equal(buyChart(g2,'baleares','lisboa').reason,'no ship here');
 assert.ok(!isDiscovered(g2,'ibiza'),'nothing discovered on a refused sale');
});
test('routeRumorTarget is the nearest undiscovered port',()=>{
 const g=newGame(world);
 startingChart(g,g.profile.home);
 const t=routeRumorTarget(g,g.profile.home);
 assert.ok(t,'there is an unknown port');
 assert.ok(!isDiscovered(g,t),'and it is undiscovered');
 const d=(c)=>Math.hypot(world.nodes[c].lat-world.nodes[g.profile.home].lat,world.nodes[c].lon-world.nodes[g.profile.home].lon);
 for(const c of world.cities)if(!isDiscovered(g,c.id))assert.ok(d(c.id)>=d(t)-1e-9,c.id+' is not closer');
});
test('buyRouteRumor discovers the target and leaves an inexact market snapshot',()=>{
 const g=newGame(world);g.cash=1000;
 startingChart(g,g.profile.home);
 const r=buyRouteRumor(g,g.profile.home);
 assert.ok(r.ok);
 assert.equal(r.cost,ROUTE_RUMOR_PRICE);
 assert.ok(isDiscovered(g,r.city),'on the chart');
 const i=g.intel[r.city];
 assert.ok(i&&i.exact===false&&i.day===g.day,'inexact snapshot recorded');
 assert.equal(Object.keys(i.cells).length,Object.keys(g.market[r.city]).length,'full market snapshot');
 assert.equal(g.cash,1000-ROUTE_RUMOR_PRICE);
});
test('buyRouteRumor refuses when the map is complete',()=>{
 const g=newGame(world);g.cash=1000;
 for(const c of world.cities)g.discovered??={},g.discovered[c.id]=g.day;
 assert.equal(routeRumorTarget(g,g.profile.home),null);
 assert.equal(buyRouteRumor(g,g.profile.home).reason,'nothing to discover');
});
