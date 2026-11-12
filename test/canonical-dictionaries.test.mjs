import test from 'node:test';
import assert from 'node:assert/strict';
import {canonicalDictionaries as canonical} from './helpers/canonical-dictionaries.mjs';
import {loadWorld} from '../src/sim/world.mjs';
import {newGame} from '../src/game/game.mjs';
import {serialize,deserialize} from '../src/game/gamesave.mjs';
test('comparison ignores only plain dictionary prototype, retaining unusual keys and values',()=>{
 const symbol=Symbol('kept'),a=Object.create(null);Object.defineProperty(a,'__proto__',{value:{x:undefined,n:NaN},enumerable:true});a[symbol]=Infinity;
 const b=Object.create(Object.prototype,Object.getOwnPropertyDescriptors(a));assert.deepEqual(canonical(a),canonical(b));
 assert(Object.hasOwn(canonical(a).__proto__,'x'));assert.equal(canonical(a)[symbol],Infinity);assert(Number.isNaN(canonical(a).__proto__.n));
 const array=[];array.length=3;array[1]=undefined;const output=canonical(array);assert.equal(output.length,3);assert(!Object.hasOwn(output,0));assert(Object.hasOwn(output,1));
});
test('runtime world mutation is killed, not hidden by save serialization',()=>{
 const original=newGame(loadWorld()),loaded=deserialize(serialize(original,'Test',1),original.world).g;
 assert.deepEqual(canonical(loaded),canonical(original));loaded.world={...loaded.world,cities:[]};assert.throws(()=>assert.deepEqual(canonical(loaded),canonical(original)),assert.AssertionError);
});
test('extra undefined and missing own keys are killed',()=>{
 const original=newGame(loadWorld()),loaded=deserialize(serialize(original,'Test',1),original.world).g;
 loaded.runtimeReviewOnly=undefined;assert.throws(()=>assert.deepEqual(canonical(loaded),canonical(original)),assert.AssertionError);delete loaded.runtimeReviewOnly;
 original.runtimeReviewOnly=undefined;assert.throws(()=>assert.deepEqual(canonical(loaded),canonical(original)),assert.AssertionError);
});
test('nested number changes and null vs undefined are killed',()=>{
 const a={map:Object.assign(Object.create(null),{x:undefined,n:NaN})},b={map:{x:null,n:NaN}};
 assert.throws(()=>assert.deepEqual(canonical(a),canonical(b)),assert.AssertionError);b.map.x=undefined;b.map.n=0;assert.throws(()=>assert.deepEqual(canonical(a),canonical(b)),assert.AssertionError);
});
