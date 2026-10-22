import test from 'node:test';import assert from 'node:assert/strict';
import {loadWorld} from '../src/sim/world.mjs';
import {newGame,doSail,normalizeSeed} from '../src/game/game.mjs';
import {serialize,deserialize} from '../src/game/gamesave.mjs';
const world=loadWorld();
test('seed: none, negative, fractional or too big means 0; a valid integer is kept',()=>{
 for(const bad of [undefined,null,-1,1.5,NaN,'7',2**32,Infinity])assert.equal(normalizeSeed(bad),0);
 for(const ok of [0,1,12345,0xFFFFFFFF])assert.equal(normalizeSeed(ok),ok);
 assert.equal(newGame(world).seed,0,'default is reproducible');
 assert.equal(newGame(world,'cadiz',{seed:987654}).seed,987654);
});
test('seed survives save and load',()=>{
 const g=newGame(world,'cadiz',{seed:424242});
 assert.equal(deserialize(serialize(g,{}),world).g.seed,424242);
});
test('the seed changes the weather of a voyage; the same seed repeats it',()=>{
 const sail=(seed)=>{const g=newGame(world,'cadiz',{seed});g.cash=50000;doSail(g,g.ships[0],'barcelona');return g.ships[0].voyage?.totalTicks;};
 assert.equal(sail(1),sail(1));
 const set=new Set([1,2,3,4,5,6,7,8].map(sail));assert.ok(set.size>1,'different seeds give different winds');
});
