import test from 'node:test';
import assert from 'node:assert/strict';
import { loadWorld } from '../src/sim/world.mjs';
import { npcPlan, NPC_CAP } from '../src/sim/npcplan.mjs';
import { readFileSync } from 'node:fs';
const w=loadWorld(), historical=JSON.parse(readFileSync(new URL('../data/population-1500.json',import.meta.url))).cities;
test('NPC plan covers all Alpha ports and never exceeds performance cap',()=>{
  const p=npcPlan(w,{historical});
  assert.equal(p.total,48); assert.equal(p.ports.length,33);
  assert.equal(p.ports.reduce((n,r)=>n+r.count,0),p.total);
  assert.ok(p.ports.every((r)=>r.count>=1 && r.count<=r.desired && r.count<=6));
});
test('unknown history is explicit, never zero or invented',()=>{
  const p=npcPlan(w,{historical});
  assert.match(p.ports.find((r)=>r.city==='argel').populationBasis,/fallback/);
  assert.equal(p.ports.find((r)=>r.city==='lisboa').population,65000);
  assert.match(p.ports.find((r)=>r.city==='lisboa').populationBasis,/historical/);
});
test('NPC planner is order independent, pure, bounded at zero and rejects unsafe caps',()=>{
  const before=JSON.stringify(w), p=npcPlan(w,{historical});
  assert.deepEqual(npcPlan({...w,cities:[...w.cities].reverse()},{historical}),p);
  assert.equal(JSON.stringify(w),before); assert.equal(npcPlan(w,{cap:0}).total,0);
  assert.equal(npcPlan(w,{cap:5}).total,5);
  for(const cap of [-1,NPC_CAP+1,1.5,NaN]) assert.throws(()=>npcPlan(w,{cap}));
});
