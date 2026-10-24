import test from 'node:test';import assert from 'node:assert/strict';
import {loadWorld} from '../src/sim/world.mjs';import {newGame} from '../src/game/game.mjs';
import {captainRoster,hireCaptain,captainOf,captainPrice} from '../src/game/captains.mjs';
import {gainXp,levelFor,XP_AT,encounterXp} from '../src/game/captainxp.mjs';
import {encounterOutcome,applyEncounter} from '../src/game/encounters.mjs';
const w=loadWorld();
const hired=()=>{const g=newGame(w),s=g.ships[0];hireCaptain(g,s,captainRoster(g,s.at)[0].id);return {g,s};};
test('flag off: no experience, nothing saved on the captain',()=>{
 const {g,s}=hired();const before=JSON.stringify(s.captain);
 assert.equal(gainXp(g,s,'navigation',99),null);assert.equal(JSON.stringify(s.captain),before);
});
test('flag on: levels rise at the thresholds, never above 3, never down',()=>{
 const {g,s}=hired();g.captainXp=true;s.captain.weather=0;
 let up=null;for(let i=0;i<5;i++)up=gainXp(g,s,'weather');assert.equal(up,1);assert.equal(captainOf(s).weather,1);
 for(let i=0;i<500;i++)gainXp(g,s,'weather');assert.equal(captainOf(s).weather,3);
 s.captain.navigation=3;assert.equal(gainXp(g,s,'navigation',1),null);assert.equal(captainOf(s).navigation,3);
 assert.equal(levelFor(XP_AT[3]),3);
});
test('a hired captain starts at the experience of the hired level',()=>{
 const {g,s}=hired();g.captainXp=true;s.captain.defence=2;
 for(let i=0;i<19;i++)gainXp(g,s,'defence');assert.equal(captainOf(s).defence,2);
 gainXp(g,s,'defence');assert.equal(captainOf(s).defence,3); // 15 + 20 = 35
});
test('wage follows the new levels, within the stored bound',()=>{
 const {g,s}=hired();g.captainXp=true;gainXp(g,s,'navigation',200);gainXp(g,s,'weather',200);gainXp(g,s,'defence',200);
 const c=captainOf(s);assert.ok(c.wage>=captainPrice({navigation:3,weather:3,defence:3}).wage&&c.wage<=10);
});
test('encounters give experience only with the flag on',()=>{
 for(const flag of [false,true]){
  const {g,s}=hired();g.captainXp=flag;s.voyage={from:s.at,to:'lisboa',ticksLeft:100,totalTicks:100};
  const out=encounterOutcome(s,'storm',0.9);assert.deepEqual(encounterXp(out),{weather:2});
  applyEncounter(g,s,out);assert.equal(s.captain.xp?.weather,flag?(s.captain.weather>=0?s.captain.xp.weather:0):undefined);
  assert.equal(!!s.captain.xp,flag);
 }
});
