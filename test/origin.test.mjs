import test from 'node:test';
import assert from 'node:assert/strict';
import { loadWorld } from '../src/sim/world.mjs';
import { newGame, START_CASH } from '../src/game/game.mjs';
import { defaultProfile, startOptions } from '../src/game/profile.mjs';
import { initOrigin, ORIGIN_RESPECT } from '../src/game/origin.mjs';
import { repOf, respectOf } from '../src/game/rank.mjs';
import { feeMul } from '../src/game/reputation.mjs';
import { serialize, deserialize, SAVE_VERSION } from '../src/game/gamesave.mjs';
import { tutorialStep } from '../src/game/tutorial.mjs';
const world = loadWorld();
const make = (background, home = 'cadiz', extra = {}) => {
 const profile = { ...defaultProfile('Casa del Alba'), background, home };
 return newGame(world, home, { ...startOptions(profile), profile, seed: 42, ...extra });
};
test('merchant recognition is home-only, below perks; cash, cargo and tutorial stay unchanged', () => {
 const g = make('merchant'), control = make('merchant','cadiz',{originConnections:false});
 assert.equal(repOf(g,'cadiz'),ORIGIN_RESPECT);
 assert.equal(respectOf(g,'cadiz').id,'stranger');
 assert.equal(feeMul(g,'cadiz'),feeMul(control,'cadiz'));
 assert.equal(repOf(g,'lisboa'),0);
 assert.equal(g.cash,START_CASH+300); assert.equal(g.cash,control.cash);
 assert.deepEqual(g.ships,control.ships); assert.equal(tutorialStep(g),'buy');
});
test('seafarer discovers precisely one extra port, no market prices or new route orders', () => {
 for (const c of world.cities) {
  const g=make('seafarer',c.id), control=make('seafarer',c.id,{originConnections:false});
  const added=Object.keys(g.discovered).filter(id=>control.discovered[id]===undefined);
  assert.deepEqual(added,[g.originStart.city],c.id);
  assert.deepEqual(g.intel,control.intel); assert.deepEqual(g.ships,control.ships);
  assert.equal(g.cash,control.cash); assert.equal(g.upkeepMul,control.upkeepMul);
 }
});
test('scholar receives one approximate, detached snapshot of a charted nearby port, not live surveillance', () => {
 for(const c of world.cities) {
  const g=make('scholar',c.id), control=make('scholar',c.id,{originConnections:false});
  assert.deepEqual(g.discovered,control.discovered);
  const city=g.originStart.city;
  if(!city) { assert.deepEqual(g.intel,control.intel); continue; }
  assert.notEqual(city,c.id); assert.notEqual(g.discovered[city],undefined);
  const note=g.intel[city]; assert.equal(note.exact,false); assert.equal(note.day,0);
  assert.equal(Object.keys(g.intel).length,Object.keys(control.intel).length+1);
  for(const [good,cell] of Object.entries(note.cells)) {
   const real=g.market[city][good]; assert.notEqual(cell,real);
   assert.ok(Math.abs(cell.stock-real.stock)<=Math.ceil(real.stock*.25));
  }
  const stock=note.cells.salt.stock; g.market[city].salt.stock+=999;
  assert.equal(note.cells.salt.stock,stock); assert.equal(g.cash,control.cash);
 }
});
test('origin receipts and benefits survive save cycles and cannot be granted twice',()=>{
 for(const origin of ['merchant','seafarer','scholar']) {
  let g=make(origin);
  for(let i=0;i<3;i++) {
   const before=serialize(g,'Casa',123);
   g=deserialize(before,world).g;
   assert.equal(initOrigin(g),false);
   assert.deepEqual(serialize(g,'Casa',123),before);
  }
 }
});
test('pre-origin saves load without receipt, new benefits or version bump',()=>{
 const old=make('seafarer','lisboa',{originConnections:false}), save=serialize(old,'Casa',123);
 const g=deserialize(save,world).g;
 assert.equal(SAVE_VERSION,3); assert.equal(g.originStart,undefined);
 assert.deepEqual(serialize(g,'Casa',123),save);
 assert.equal(newGame(world).originStart,undefined,'simulation/default callers unchanged');
});
test('invalid origin is ignored; unknown home cannot produce a grant',()=>{
 const g=make('merchant','cadiz',{originConnections:false});
 g.profile.background='king'; assert.equal(initOrigin(g),false);
 g.profile.background='merchant'; g.profile.home='mars'; assert.equal(initOrigin(g),false);
 assert.equal(g.originStart,undefined);
});
test('same seed gives the same note and settings do not alter deterministic selection',()=>{
 assert.deepEqual(make('scholar').originStart,make('scholar').originStart);
 assert.deepEqual(make('scholar').intel,make('scholar').intel);
});
test('scholar in an isolated home port gets no invented correspondence or new discovery',()=>{
 const g=make('scholar','melilla'), control=make('scholar','melilla',{originConnections:false});
 assert.equal(g.originStart.city,undefined);
 assert.deepEqual(g.discovered,control.discovered); assert.deepEqual(g.intel,control.intel);
});
