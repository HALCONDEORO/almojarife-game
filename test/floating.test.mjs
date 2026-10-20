import test from 'node:test';import assert from 'node:assert/strict';import{clampWindow}from'../src/view/floating.mjs';
test('floating window stays reachable for pointer and keyboard movement',()=>{
 assert.deepEqual(clampWindow(-500,-100,500,500,1200,800),{left:0,top:0});
 assert.deepEqual(clampWindow(9999,9999,500,500,1200,800),{left:700,top:720});
 assert.deepEqual(clampWindow(40,50,500,500,390,700),{left:0,top:50});
 assert.deepEqual(clampWindow(NaN,NaN,500,500,1200,800),{left:0,top:0});
});
