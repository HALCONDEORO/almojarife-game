import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {loadWorld} from '../src/sim/world.mjs';
import {advanceTick} from '../src/game/game.mjs';
import {migrateRetired,RETIRED_GOODS,deserialize,serialize} from '../src/game/gamesave.mjs';
const clone=v=>JSON.parse(JSON.stringify(v));
for(const [from,to] of Object.entries(RETIRED_GOODS)){
 test(`history keeps current ${to} prices rather than adding ${from}`,()=>{
  const current=[10,20,30],legacy=[2,4,6],g={hist:{cadiz:{[from]:legacy,[to]:current}}};
  migrateRetired(g);assert.strictEqual(g.hist.cadiz[to],current);assert.deepEqual(g.hist.cadiz[to],[10,20,30]);assert(!Object.hasOwn(g.hist.cadiz,from));
  const once=clone(g);migrateRetired(g);assert.deepEqual(g,once);
 });
 test(`retired-only ${from} price history is renamed intact, including empty arrays`,()=>{
  for(const history of [[],[2,4,6]]){const g={hist:{cadiz:{[from]:history}}};migrateRetired(g);assert.strictEqual(g.hist.cadiz[to],history);assert(Array.isArray(g.hist.cadiz[to]));assert(!Object.hasOwn(g.hist.cadiz,from));}
 });
}
for(const path of ['test/fixtures/save-before-1480.json','tools/map-pr-tests/fixtures/all-discovered-save.json'])test(`old v3 corpus remains stable across repeated reloads: ${path}`,()=>{
 const raw=JSON.parse(fs.readFileSync(new URL('../'+path,import.meta.url))),w=loadWorld();
 const control=deserialize(clone(raw),w).g;let reload=deserialize(clone(raw),w).g;
 for(const row of Object.values(control.hist))for(const series of Object.values(row))assert(Array.isArray(series));
 for(let i=0;i<96;i++){
  advanceTick(control);advanceTick(reload);reload=deserialize(clone(serialize(reload,'Corpus',1)),w).g;
  assert.deepEqual(reload,control,'whole-state tick '+i);
 }
});
