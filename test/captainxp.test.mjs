import test from 'node:test';import assert from 'node:assert/strict';
import {loadWorld} from '../src/sim/world.mjs';import {newGame} from '../src/game/game.mjs';
import {captainRoster,hireCaptain,captainOf,captainPrice} from '../src/game/captains.mjs';
import {gainXp,levelFor,XP_AT,encounterXp} from '../src/game/captainxp.mjs';
import {advanceDay,doSail} from '../src/game/game.mjs';
import {encounterOutcome,applyEncounter} from '../src/game/encounters.mjs';
const w=loadWorld();
const hired=()=>{const g=newGame(w),s=g.ships[0];hireCaptain(g,s,captainRoster(g,s.at)[0].id);return {g,s};};
test('flag off: no experience, nothing saved on the captain',()=>{
 const {g,s}=hired();g.captainXp=false;const before=JSON.stringify(s.captain);
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
import {serialize,deserialize} from '../src/game/gamesave.mjs';
test('captain experience, levels and the flag survive saving and loading',()=>{
 const {g,s}=hired();g.captainXp=true;gainXp(g,s,'weather',7);gainXp(g,s,'navigation',3);
 const back=deserialize(serialize(g,'T'),w).g;
 assert.deepEqual(back.ships[0].captain,s.captain);
 assert.equal(back.captainXp,true);
 gainXp(back,back.ships[0],'weather',1);assert.equal(back.ships[0].captain.xp.weather,s.captain.xp.weather+1);
});
test('an old save without experience loads unchanged with the flag off',()=>{
 const {g,s}=hired();delete g.captainXp;const back=deserialize(serialize(g,'T'),w).g; // delete the key to emulate a pre-flag save
 assert.deepEqual(back.ships[0].captain,s.captain);assert.ok(!back.captainXp);assert.equal(back.ships[0].captain.xp,undefined);
});
test('corrupt xp containers from old or tampered saves are normalized, never crash',()=>{
 const {g,s}=hired();g.captainXp=true;
 for(const bad of [7,'bad',[]]){
  s.captain.xp=bad;
  assert.doesNotThrow(()=>gainXp(g,s,'weather',1),JSON.stringify(bad));
  assert.ok(s.captain.xp&&typeof s.captain.xp==='object'&&!Array.isArray(s.captain.xp),'normalized to a plain object');
  assert.equal(JSON.parse(JSON.stringify(s.captain)).xp.weather,s.captain.xp.weather,'the book survives JSON');
 }
});
test('flag off: a full voyage and a storm leave the captain and the save byte-identical',()=>{
 const g=newGame(w,'cadiz',{seed:7,captainXp:false});const s=g.ships[0];hireCaptain(g,s,captainRoster(g,s.at)[0].id);
 assert.ok(!g.captainXp); // forced OFF (the default is ON since 24/10 12:08)
 const capBefore=JSON.stringify(s.captain);
 s.voyage={from:s.at,to:'lisboa',ticksLeft:100,totalTicks:100};
 applyEncounter(g,s,encounterOutcome(s,'storm',0.9));
 assert.equal(JSON.stringify(s.captain),capBefore,'the encounter hook adds nothing with the flag off');
 delete s.voyage;doSail(g,s,'lisboa');let days=0;while(s.voyage&&days++<30)advanceDay(g);
 assert.ok(!s.voyage,'the ship arrived');
 assert.equal(JSON.stringify(s.captain),capBefore,'the arrival hook adds nothing with the flag off');
 assert.ok(!JSON.stringify(serialize(g,'fixed')).includes('"xp"'),'nothing xp-shaped is saved');
});
