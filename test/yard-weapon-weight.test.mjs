import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {WEAPON_TYPES,weaponWeight} from '../src/sim/armament.mjs';
import {shipCapacity,SHIP_TYPES} from '../src/sim/trade.mjs';
const src=readFileSync(new URL('../web/main.mjs',import.meta.url),'utf8');
test('the shipyard explains each weapon cargo cost before purchase in ES and EN',()=>{
 const yard=src.slice(src.indexOf('tab === "yard"'),src.indexOf('tab === "lonja"'));
 assert.match(yard,/class="yd-arm-weight"/);
 assert.ok(yard.includes('Uses ${w.weight} cargo space'));
 assert.ok(yard.includes('Ocupa ${w.weight} de bodega'));
 assert.ok(yard.indexOf('yd-arm-weight')<yard.indexOf('yd-arm-reason'),'weight is visible even when purchase is not blocked');
});
test('the explained cargo cost equals the effective capacity lost for every weapon',()=>{
 for(const [type,w] of Object.entries(WEAPON_TYPES)){
  const s={type:'cog',cargo:{},weapons:{[type]:1}};
  assert.equal(weaponWeight(s),w.weight);
  assert.equal(SHIP_TYPES.cog.capacity-shipCapacity(s),w.weight);
 }
});
