import test from 'node:test';import assert from 'node:assert/strict';
import {stockLevel,STOCK_LEVELS} from '../src/game/stocklevel.mjs';
import {price,makeMarket,tickMarketCity} from '../src/sim/market.mjs';
import {loadWorld} from '../src/sim/world.mjs';
test('four levels at the price-curve thresholds, boundaries inclusive',()=>{
 assert.equal(stockLevel({stock:49,target:100}),'scarce');
 assert.equal(stockLevel({stock:50,target:100}),'short');
 assert.equal(stockLevel({stock:99,target:100}),'short');
 assert.equal(stockLevel({stock:100,target:100}),'normal');
 assert.equal(stockLevel({stock:199,target:100}),'normal');
 assert.equal(stockLevel({stock:200,target:100}),'plenty');
 assert.equal(stockLevel({stock:0,target:100}),'scarce');
});
test('malformed entries read as normal and never throw',()=>{
 assert.equal(stockLevel({}),'normal');assert.equal(stockLevel(null),'normal');
 assert.equal(stockLevel({stock:NaN,target:100}),'normal');assert.equal(stockLevel({stock:10,target:0}),'normal');
 assert.deepEqual(STOCK_LEVELS,['scarce','short','normal','plenty']);
});
test('indicator agrees with the price curve: scarcer is dearer, plenty is cheap',()=>{
 const w=loadWorld(),good=Object.keys(w.goods)[0],base=w.goods[good].base;
 const at=(lvl)=>{const target=100,stock={scarce:10,short:75,normal:150,plenty:300}[lvl];return price(w,{stock,target,makes:false,needs:true,rate:1,pop:100},good);};
 assert.ok(at('scarce')>at('short')&&at('short')>=base&&at('normal')<base&&at('plenty')<at('normal'));
 assert.ok(at('plenty')>=Math.round(base*0.4)); // clamp floor never crossed
});
test('a simulated year keeps every level meaningful and stocks non-negative',()=>{
 const w=loadWorld(),m=makeMarket(w),seen=new Set();
 for(let d=0;d<365;d++){tickMarketCity(m.cadiz,d,w);for(const e of Object.values(m.cadiz)){assert.ok(e.stock>=0);seen.add(stockLevel(e));}}
 assert.ok(seen.size>=3);
});
