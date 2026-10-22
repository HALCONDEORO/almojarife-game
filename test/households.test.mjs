import test from 'node:test';import assert from 'node:assert/strict';
import {quoteHouseholdDemand,settleHouseholdDemand} from '../src/sim/households.mjs';
const world={goods:{grain:{base:10},silk:{base:100}}};
const market=()=>({grain:{stock:100,target:100},silk:{stock:100,target:100}});
const policy={counts:{poor:1,middle:1,rich:1},incomePerPerson:{poor:10,middle:10,rich:10},demandBy:()=>({poor:1,middle:1,rich:1})};
test('one purse cannot pay independent full baskets for every good',()=>{const m=market(),meta={};const q=settleHouseholdDemand(world,m,meta,policy);assert.ok(q.retailRevenue<=30);for(const c of Object.values(q.byClass))assert.ok(c.cash>=0&&c.spent<=10);});
test('quotes preserve all source state and match execution',()=>{const m=market(),meta={},before=structuredClone(m);const q=quoteHouseholdDemand(world,m,{},policy);assert.deepEqual(m,before);assert.deepEqual(settleHouseholdDemand(world,m,meta,policy),q);});
test('retail units are exactly removed and cash is conserved across classes',()=>{const m=market(),meta={},p={...policy,incomePerPerson:{poor:1000,middle:1000,rich:1000}};const q=settleHouseholdDemand(world,m,meta,p);for(const k of Object.keys(m))assert.equal(100-m[k].stock,q.consumedByGood[k]);assert.equal(Object.values(meta.households).reduce((s,h)=>s+h.cash,0)+q.retailRevenue,3000);});
test('fractional small demand eventually consumes a whole unit',()=>{const m=market(),meta={},p={...policy,demandBy:()=>({poor:.1,middle:0,rich:0})};let n=0;for(let d=0;d<20;d++)n+=settleHouseholdDemand(world,m,meta,p).consumedByGood.grain;assert.ok(n>=1&&n<=2);});
test('invalid income is rejected before mutation',()=>{const m=market(),meta={};assert.throws(()=>settleHouseholdDemand(world,m,meta,{...policy,incomePerPerson:{poor:NaN}}));assert.deepEqual(meta,{});assert.equal(m.grain.stock,100);});
test('food has priority over an otherwise affordable luxury',()=>{
  const m=market(),meta={},p={...policy,food:['grain'],incomePerPerson:{poor:100,middle:0,rich:0}};
  const q=settleHouseholdDemand(world,m,meta,p);
  assert.equal(q.byClass.poor.units.grain,1);assert.equal(q.byClass.poor.units.silk,0);
});
test('affordable food leftovers are spent before luxury',()=>{
  const m=market(),meta={},p={...policy,food:['grain'],incomePerPerson:{poor:35,middle:0,rich:0},demandBy:()=>({poor:4,middle:0,rich:0})};
  const q=settleHouseholdDemand(world,m,meta,p);assert.equal(q.byClass.poor.units.grain,3);assert.equal(q.byClass.poor.cash,5);assert.equal(q.byClass.poor.units.silk,0);
});
test('good insertion order does not select the basket',()=>{
 const m=market(),rev=Object.fromEntries(Object.entries(m).reverse());assert.deepEqual(quoteHouseholdDemand(world,m,{},policy),quoteHouseholdDemand(world,rev,{},policy));
});
test('one shared purse persists over days without minting spending per good',()=>{
 const m=market(),meta={};let spent=0;for(let i=0;i<20;i++)spent+=settleHouseholdDemand(world,m,meta,policy).retailRevenue;
 assert.equal(spent+Object.values(meta.households).reduce((n,c)=>n+c.cash,0),600);
});
