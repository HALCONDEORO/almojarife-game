import test from 'node:test';import assert from 'node:assert/strict';
import {loadWorld}from '../src/sim/world.mjs';import{makeMarket,tickMarket}from '../src/sim/market.mjs';
import{procurementOf,openProcurement,quoteProcurement,receiveProcurement}from '../src/sim/procurement.mjs';
import{buy,sell,previewSell,makeShip}from '../src/sim/trade.mjs';
import{consumeUnits}from '../src/sim/recipes.mjs';
const w=loadWorld();
test('all competing sellers draw the same purse and preview is pure',()=>{
 const m=makeMarket(w),city=m.cadiz,a=openProcurement(w,city);a.cash=100;
 const ship=makeShip(1,'cog','cadiz');ship.cargo={silk:20};const before=structuredClone(m);
 const q=previewSell(w,m,ship,'silk',20);assert.deepEqual(m,before);
 const r=sell(w,m,ship,'silk',20);if(q.qty){assert.equal(r.qty,q.qty);assert.equal(r.revenue,q.revenue);}else assert.equal(r.ok,false);
 assert.ok(a.cash>=0);const second=receiveProcurement(w,city,'silk',20);assert.ok(second.revenue<=a.cash+second.revenue);assert.ok(a.paid<=100);
});
test('merchant inputs replenish the common purse exactly once',()=>{
 const m=makeMarket(w),city=m.cadiz,a=openProcurement(w,city),cash=a.cash,ship=makeShip(1,'cog','cadiz');
 const b=buy(w,m,ship,10000,'grain',3);assert.equal(a.cash,cash+b.cost);
 const x=consumeUnits(w,m,'cadiz',{timber:2},10000);assert.equal(a.cash,cash+b.cost+x.cost);
});
test('household income, consumption and wholesale cash reconcile over save/load',()=>{
 let m=makeMarket(w);tickMarket(m,0,w);m=JSON.parse(JSON.stringify(m));
 for(let d=1;d<60;d++)tickMarket(m,d,w);
 for(const city of Object.values(m)){const a=procurementOf(city);assert.equal(a.cash,a.openingCapital+a.retail+a.received-a.paid);assert.ok(a.cash>=0);for(const n of Object.values(a.inventoryBasis))assert.ok(Number.isFinite(n)&&n>=0);}
});
test('market remains deterministic with or without explicit world and good order',()=>{
 const a=makeMarket(w),b=makeMarket(w);for(let d=0;d<20;d++){tickMarket(a,d,w);tickMarket(b,d);}assert.deepEqual(a,b);
});
test('dry wholesale purse never consumes a seller cargo or cost basis',()=>{
 const m=makeMarket(w);openProcurement(w,m.cadiz).cash=0;const ship=makeShip(1,'cog','cadiz');ship.cargo={grain:3};ship.basis={grain:100};const before=structuredClone(ship);
 assert.equal(sell(w,m,ship,'grain',3).ok,false);assert.deepEqual(ship,before);assert.equal(quoteProcurement(w,m.cadiz,'grain',3).qty,0);
});
import{newGame}from '../src/game/game.mjs';
import{workshopTick,sellQuote}from '../src/game/buildings.mjs';
import{stewardTick}from '../src/game/steward.mjs';
test('dry purse blocks workshops and warehouse sales as well as ships',()=>{
 const g=newGame(w);g.cash=100000;const city=g.ships[0].at;const a=procurementOf(g.market[city]);a.cash=0;
 g.buildings={[city]:{a:{type:'workshop',level:2,state:'active'}}};const before=JSON.stringify(g.market[city]);
 workshopTick(g,city);assert.equal(JSON.stringify(g.market[city]),before);assert.equal(sellQuote(w,g.market,city,'cloth',2),0);
 g.warehouses={[city]:{goods:{silk:5},basis:{silk:50},admin:{rules:{silk:{sellAbove:1,sellKeep:0}},reserve:0}}};
 stewardTick(g,city,500);assert.equal(g.warehouses[city].goods.silk,5);assert.equal(a.cash,0);
});
test('fully paid output quote is the same for workshop and ship sellers',()=>{
 const m=makeMarket(w),ship=makeShip(1,'cog','cadiz');ship.cargo={cloth:2};
 const q=previewSell(w,m,ship,'cloth',2);assert.equal(sellQuote(w,m,'cadiz','cloth',2),q.revenue);
});
test('local primary production adds recorded inventory but no wholesale cash',()=>{
 const g=newGame(w);g.cash=100000;const city='cadiz';g.buildings={[city]:{a:{type:'saltworks',level:2,state:'active'}}};const a=procurementOf(g.market[city]),cash=a.cash,basis=a.inventoryBasis.salt;
 g.tick=1;workshopTick(g,city);assert.equal(a.cash,cash);assert.ok(a.inventoryBasis.salt>basis);
});
test('opening capital cannot be recreated by save/load or another seller',()=>{
 const m=makeMarket(w),a=procurementOf(m.cadiz);a.cash=7;const copy=JSON.parse(JSON.stringify(m));assert.equal(openProcurement(w,copy.cadiz).cash,7);assert.equal(openProcurement(w,copy.cadiz).openingCapital,a.openingCapital);
});
test('inventory and both cash owners conserve under purchases, partial sales and retail',()=>{
 const m=makeMarket(w),a=procurementOf(m.cadiz),ship=makeShip(1,'cog','cadiz');let cash=5000;
 const total=()=>cash+a.cash+Object.values(a.households).reduce((n,h)=>n+h.cash,0)-a.householdIncome;
 const initial=total(),b=buy(w,m,ship,cash,'grain',9);cash-=b.cost;assert.equal(total(),initial);
 const r=sell(w,m,ship,'grain',9);cash+=r.revenue;assert.equal(total(),initial);
 for(let d=0;d<30;d++)tickMarket(m,d,w);assert.ok(Math.abs(total()-initial)<1e-5);
 assert.equal(Object.values(a.inventoryBasis).reduce((n,x)=>n+x,0),a.openingInventory+a.localSupplyValue+a.paid-a.consumedBasis-a.releasedBasis);
});
