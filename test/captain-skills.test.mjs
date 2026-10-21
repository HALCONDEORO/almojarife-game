import test from 'node:test';import assert from 'node:assert/strict';
import {captainRoster,hireCaptain,captainOf,captainSpeed} from '../src/game/captains.mjs';
import {encounterOutcome} from '../src/game/encounters.mjs';
const setup=()=>({world:{cities:[{id:'cadiz'},{id:'lisboa'}]},day:0,tick:0,cash:2000,market:{},ships:[{id:1,at:'cadiz'}]});
test('roster carries deterministic weather/defence levels in 0..3; hire assigns them',()=>{
 const g=setup(),s=g.ships[0],r=captainRoster(g,'cadiz')[0];
 assert.ok(Number.isSafeInteger(r.weather)&&r.weather>=0&&r.weather<=3);
 assert.ok(Number.isSafeInteger(r.defence)&&r.defence>=0&&r.defence<=3);
 assert.equal(JSON.stringify(captainRoster(g,'cadiz')[0]),JSON.stringify(r)); // stable
 assert.equal(hireCaptain(g,s,r.id).ok,true);
 assert.equal(captainOf(s).weather,r.weather);assert.equal(captainOf(s).defence,r.defence);
 // other ports: levels differ across the map but stay bounded
 for(const c of ['lisboa'])for(const x of captainRoster(g,c)){assert.ok(x.weather>=0&&x.weather<=3&&x.defence>=0&&x.defence<=3);}
});
test('malformed or absent weather/defence read as 0 and never break speed/wage',()=>{
 const s={captain:{id:'x',name:'X',navigation:2,weather:99,defence:-1,wage:2}};
 assert.equal(captainOf(s).weather,0);assert.equal(captainOf(s).defence,0);
 assert.equal(captainSpeed(s),1.08);
});
test('defence skill raises the pirate-fight chance exactly +4% per level',()=>{
 const bare={cargo:{},hull:100,cannons:[],crew:0}; // defenceOf = 0 without cannons
 const base=encounterOutcome(bare,'pirates',0.5).chance;
 for(const lv of [1,2,3]){
  const withCap=encounterOutcome({...bare,captain:{id:'c',name:'C',defence:lv}},'pirates',0.5);
  assert.ok(Math.abs(withCap.chance-(base+lv*0.04))<1e-9,(lv,withCap.chance,base));
 }
 // a roll between base and base+0.12 flips the result only with the level-3 captain
 const r=base+0.08;
 assert.equal(encounterOutcome(bare,'pirates',r).result,'raided');
 assert.equal(encounterOutcome({...bare,captain:{id:'c',name:'C',defence:3}},'pirates',r).result,'repelled');
});
test('weather skill cuts storm hull and cargo losses by 15% per level',()=>{
 const bare={cargo:{grain:100},hull:100};
 const sevBare=encounterOutcome(bare,'storm',0.9); // severe
 assert.equal(sevBare.hullLoss,12);assert.equal(sevBare.cargoLossPct,10);
 const sevCap=encounterOutcome({...bare,captain:{id:'c',name:'C',weather:2}},'storm',0.9);
 assert.equal(sevCap.hullLoss,Math.ceil(12*0.7));assert.equal(sevCap.cargoLossPct,Math.ceil(10*0.7));
 const mildCap=encounterOutcome({...bare,captain:{id:'c',name:'C',weather:3}},'storm',0.2);
 assert.equal(mildCap.hullLoss,Math.ceil(6*0.55));
});
