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
