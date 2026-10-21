import test from 'node:test';import assert from 'node:assert/strict';
import {captainRoster,hireCaptain,dismissCaptain,captainOf,captainSpeed,captainWage,captainPrice} from '../src/game/captains.mjs';
import {serialize,deserialize} from '../src/game/gamesave.mjs';
const setup=()=>({world:{cities:[{id:'cadiz'},{id:'lisboa'}]},day:0,tick:0,cash:2000,market:{},ships:[{id:1,at:'cadiz'}]});
test('stable roster, one hire and assignment, fee once, no respawn after dismissal',()=>{
 const g=setup(),s=g.ships[0],before=JSON.stringify(g),r=captainRoster(g,'cadiz')[0];
 assert.equal(JSON.stringify(g),before);assert.deepEqual(captainRoster(g,'cadiz')[0],r);
 assert.equal(hireCaptain(g,s,r.id).ok,true);assert.equal(g.cash,2000-r.fee);assert.equal(captainWage(s),r.wage);
 assert.ok(captainSpeed(s)>1&&captainSpeed(s)<=1.12);assert.equal(captainRoster(g,'cadiz').length,0);
 const snap=JSON.stringify(g);assert.equal(hireCaptain(g,s,r.id).ok,false);assert.equal(JSON.stringify(g),snap);
 assert.equal(dismissCaptain(g,s).ok,true);assert.equal(g.cash,2000-r.fee);assert.equal(captainWage(s),0);assert.equal(captainSpeed(s),1);
 assert.equal(captainRoster(g,'cadiz').length,0);assert.equal(hireCaptain(g,s,r.id).ok,false);
});
test('rejected hire never mutates: wrong ship, sea, wrong port, no cash, game over',()=>{
 for(const mode of ['foreign','sea','port','cash','over']){
 const g=setup(),s=g.ships[0],id=captainRoster(g,'cadiz')[0].id;
 if(mode==='sea')s.voyage={to:'lisboa'};if(mode==='port')s.at='lisboa';if(mode==='cash')g.cash=captainRoster(g,'cadiz')[0].fee-1;if(mode==='over')g.over='win';
 const before=JSON.stringify(g);assert.equal(hireCaptain(g,mode==='foreign'?{...s}:s,id).ok,false);assert.equal(JSON.stringify(g),before);
 }
});
test('captain unique across ships, save restore, old and malformed states safe',()=>{
 const g=setup(),s=g.ships[0],id=captainRoster(g,'cadiz')[0].id;hireCaptain(g,s,id);g.ships.push({id:2,at:'cadiz'});
 assert.equal(hireCaptain(g,g.ships[1],id).ok,false);
 g.profile??={home:'cadiz'};const r=deserialize(serialize(g,'House'),g.world).g;assert.deepEqual(captainOf(r.ships[0]),captainOf(s));assert.equal(captainRoster(r,'cadiz').length,0);
 assert.equal(captainOf({}),null);assert.equal(captainSpeed({}),1);assert.equal(captainWage({}),0);
 assert.equal(captainSpeed({captain:{id:'x',name:'X',navigation:99,wage:Infinity}}),1);
 assert.equal(captainRoster(g,'unknown').length,0);
});
test('dismiss requires owned docked ship, no fee refund or unrelated changes',()=>{
 const g=setup(),s=g.ships[0];hireCaptain(g,s,captainRoster(g,'cadiz')[0].id);s.voyage={to:'lisboa'};
 const before=JSON.stringify(g);assert.equal(dismissCaptain(g,s).ok,false);assert.equal(JSON.stringify(g),before);
 assert.equal(dismissCaptain(g,{...s}).ok,false);
});

test('skill pricing: fee 30/level plus base 30, wage +1 per two levels, roster uses it',()=>{
 assert.deepEqual(captainPrice({navigation:0,weather:0,defence:0}),{fee:30,wage:1});
 assert.deepEqual(captainPrice({navigation:3,weather:3,defence:3}),{fee:300,wage:5});
 assert.deepEqual(captainPrice({navigation:2,weather:1,defence:2}),{fee:180,wage:3});
 assert.deepEqual(captainPrice({navigation:99,weather:-1,defence:1.5}),{fee:30,wage:1});
 const g=setup();
 for(const city of ['cadiz','lisboa'])for(const r of captainRoster(g,city))assert.deepEqual({fee:r.fee,wage:r.wage},captainPrice(r));
 assert.notEqual(captainRoster(g,'cadiz')[0].fee,captainRoster(g,'lisboa')[0].fee);
});
