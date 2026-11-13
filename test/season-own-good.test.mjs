import test from 'node:test';
import assert from 'node:assert/strict';
import {seasonMul,SEASON_AMPLITUDE} from '../src/sim/market.mjs';
for(const id of ['constructor','__proto__','toString','hasOwnProperty'])test(`unknown seasonal good ${id} has neutral multiplier`,()=>{
 for(const day of [-365,0,1,225,364,365])assert.equal(seasonMul(id,day),1);
});
test('known seasonal good retains peak and undefined-day behavior',()=>{
 assert.equal(seasonMul('grain',225),1+SEASON_AMPLITUDE);
 assert.equal(seasonMul('grain',undefined),1);
});
