import test from 'node:test';
import assert from 'node:assert/strict';
import {demandOf,demandBy,CLASSES,PER_1000} from '../src/sim/classes.mjs';
import {legacyNeedsPolicy,physicalNeeds,recordNeeds} from '../src/sim/needs.mjs';
import {recordLegacyConsumption} from '../src/sim/needs-telemetry.mjs';
import {tickMarketCity} from '../src/sim/market.mjs';
import {openCommerce,recordLocalSupply,recordWholesaleSale,recordMarketPurchase,recordRetailSale} from '../src/sim/procurement.mjs';
for(const id of ['constructor','__proto__','toString','hasOwnProperty']){
 test(`unknown good ${id} has finite zero needs and demand`,()=>{
  for(const value of Object.values(demandOf({poor:100,middle:100,rich:100},id)))assert.equal(value,0);
  for(const value of Object.values(demandBy(1000,id)))assert.equal(value,0);
  const policy=legacyNeedsPolicy([id]);assert.equal(policy[id].group,'other');
  const need=physicalNeeds({poor:100,middle:100,rich:100},policy);
  assert(Object.hasOwn(need.byGood,id));assert.equal(need.byGood[id],0);
  const receipt={byClass:Object.fromEntries(CLASSES.map(c=>[c,{units:{},spending:{},desired:{}}]))};
  const meta={};for(let day=0;day<2;day++)recordNeeds(meta,need,receipt);
  assert(Object.hasOwn(meta.needs.totals,id));
  for(const value of Object.values(meta.needs.totals[id]))assert.equal(value,0);
  assert.doesNotThrow(()=>structuredClone(meta));
 });
 test(`commerce basis stores ${id} as own data in fresh and JSON-loaded maps`,()=>{
  const goods={grain:{base:10}};Object.defineProperty(goods,id,{value:{base:5},enumerable:true});
  const city={grain:{stock:10,pop:1000}};Object.defineProperty(city,id,{value:{stock:4,pop:1000},enumerable:true});
  const a=openCommerce({goods},city);assert(Object.hasOwn(a.inventoryBasis,id));assert.equal(a.inventoryBasis[id],20);
  a.inventoryBasis=JSON.parse(JSON.stringify(a.inventoryBasis));delete a.inventoryBasis[id];
  recordLocalSupply(city,id,2,5);assert.equal(a.inventoryBasis[id],10);
  recordWholesaleSale(city,id,2,6);assert.equal(a.inventoryBasis[id],16);
  recordMarketPurchase(city,id,1,5,4);assert.equal(a.inventoryBasis[id],12);
  recordRetailSale(city,id,1,5,3);assert.equal(a.inventoryBasis[id],8);
  assert(Object.hasOwn(a.inventoryBasis,id));assert.equal(Object.getPrototypeOf(a.inventoryBasis),Object.prototype);
 });
}

for(const id of ['constructor','__proto__','toString','hasOwnProperty'])test(`own configured demand for ${id} is recorded, not lost to inheritance`,()=>{
 const prior=Object.getOwnPropertyDescriptor(PER_1000,id);
 Object.defineProperty(PER_1000,id,{value:{poor:1,middle:1,rich:1},enumerable:true,configurable:true});
 try{
  const city={grain:{stock:1000,target:1000,rate:1,pop:1000}};
  Object.defineProperty(city,id,{value:{stock:1000,target:1000,rate:1,pop:1000},enumerable:true});
  tickMarketCity(city,1,null,{commerceLedger:false});
  assert.equal(city.grain.needsLedger.daily.byGood[id].consumed,3);
  assert.equal(city[id].stock,997);
  assert.doesNotThrow(()=>structuredClone(city));
  const direct={grain:{pop:1000}};Object.defineProperty(direct,id,{value:{pop:1000},enumerable:true});
  const actual=Object.fromEntries([['grain',0],[id,3]]),desired=Object.fromEntries([['grain',{poor:0,middle:0,rich:0}],[id,{poor:1,middle:1,rich:1}]]);
  recordLegacyConsumption(direct,1,actual,desired,()=>1);
  assert.equal(direct.grain.needsLedger.daily.byGood[id].consumed,3);
 }finally{if(prior)Object.defineProperty(PER_1000,id,prior);else delete PER_1000[id];}
});
