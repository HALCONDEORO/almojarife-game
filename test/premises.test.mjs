import test from 'node:test';
import assert from 'node:assert/strict';
import { premises } from '../src/view/premises.mjs';
test('House exists only at recorded home, local office is not a property',()=>{
 const g={profile:{home:'lisboa'}};
 assert.equal(premises(g,'lisboa').label,'Casa');
 assert.equal(premises(g,'cadiz','en').label,'Office');
 assert.equal(premises(g,'lisboa','en').isHome,true);
 assert.match(premises(g,'cadiz','en').info,/do not own/);
});
test('Legacy save does not invent a home or mutate save',()=>{
 const g={}; const before=JSON.stringify(g);
 assert.equal(premises(g,'cadiz').home,null);assert.equal(premises(g,'cadiz').isHome,false);
 assert.match(premises(g,'cadiz','en').info,/older save/);assert.equal(JSON.stringify(g),before);
});
