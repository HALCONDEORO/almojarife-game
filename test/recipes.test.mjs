import test from 'node:test';import assert from 'node:assert/strict';
import {loadWorld} from '../src/sim/world.mjs';import {makeMarket} from '../src/sim/market.mjs';
import {quoteRecipe,consumeRecipe,RECIPES} from '../src/sim/recipes.mjs';
const w=loadWorld();
test('recipe quote is pure and successful consumption removes exactly quoted stock',()=>{
 const m=makeMarket(w),before=structuredClone(m),q=quoteRecipe(w,m,'cadiz','cog');
 assert.ok(q.ok);assert.deepEqual(m,before);const r=consumeRecipe(w,m,'cadiz','cog',q.cost);assert.deepEqual(r,q);
 for(const [g,n]of Object.entries(q.inputs))assert.equal(m.cadiz[g].stock,before.cadiz[g].stock-n);
 assert.ok(q.cost>0&&Number.isFinite(q.cost)&&Math.abs(q.cost*100-Math.round(q.cost*100))<1e-6,'positive cent-precise cost'); // decimals PR: quotes settle to cents, integer forcing removed
});
test('shortage, insufficient cash and invalid requests do not consume any goods',()=>{
 for(const args of [['cog',0,1],['cog',1e6,0],['cog',1e6,1.5],['unknown',1e6,1],['__proto__',1e6,1],['cog',NaN,1]]){
 const m=makeMarket(w),before=structuredClone(m);assert.equal(consumeRecipe(w,m,'cadiz',...args).ok,false);assert.deepEqual(m,before);}
 const m=makeMarket(w);m.cadiz.cloth.stock=0;const before=structuredClone(m);assert.equal(consumeRecipe(w,m,'cadiz','cog',1e6).ok,false);assert.deepEqual(m,before);
});
test('weaving consumes wool and creates cloth, not cash or extra input stock',()=>{
 const m=makeMarket(w),before=structuredClone(m),r=consumeRecipe(w,m,'cadiz','weave',1e6,3);assert.ok(r.ok);
 assert.equal(m.cadiz.wool.stock,before.cadiz.wool.stock-12);assert.equal(m.cadiz.cloth.stock,before.cadiz.cloth.stock+6);
});
test('every recipe uses defined positive integer goods and fresh rechecks prevent stale quote execution',()=>{
 for(const recipe of Object.values(RECIPES))for(const [good,n]of Object.entries(recipe)){assert.ok(w.goods[good]);assert.ok(Number.isSafeInteger(n)&&n>0);}
 const m=makeMarket(w),q=quoteRecipe(w,m,'cadiz','nao');assert.ok(q.ok);m.cadiz.timber.stock=0;
 assert.equal(consumeRecipe(w,m,'cadiz','nao',q.cost).ok,false);
});
