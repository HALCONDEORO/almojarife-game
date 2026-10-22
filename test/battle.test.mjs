import test from 'node:test';import assert from 'node:assert/strict';
import {resolveBattle,applyBattle,lootPlan,firepower,boardStrength,ROUNDS,LOOT_CAP} from '../src/game/battle.mjs';
const ship=(o={})=>({id:1,type:'cog',hull:100,crew:12,cargo:{},...o});
const rnd=(i)=>{let x=i*2654435761%4294967296;return ()=>{x=(x*1664525+1013904223)%4294967296;return x/4294967296;};};
const rolls=(i)=>{const r=rnd(i);return Array.from({length:ROUNDS+1},()=>r());};
const units=(...s)=>s.reduce((a,x)=>a+Object.values(x.cargo??{}).reduce((p,q)=>p+q,0),0);
test('pure and reproducible: no mutation, same rolls same report',()=>{
 const a=ship({cannons:3,gunCond:100}),d=ship({cargo:{salt:20}}),before=JSON.stringify([a,d]);
 const r1=resolveBattle(a,d,[.3,.5,.7,.4]);assert.equal(JSON.stringify([a,d]),before);assert.deepEqual(r1,resolveBattle(a,d,[.3,.5,.7,.4]));
});
test('roll validation and finish validation',()=>{
 const a=ship(),d=ship();
 for(const bad of [-1,1,NaN])assert.throws(()=>resolveBattle(a,d,[bad,.1,.1,.1]));
 assert.throws(()=>resolveBattle(a,d,[.1,.1]));assert.throws(()=>resolveBattle(a,d,[.1,.1,.1,.1],{finish:'x'}));
});
test('armed, geared, captained ships beat unarmed ones; weapons and gear matter',()=>{
 const strong=ship({cannons:4,gunCond:100,gear:3,captain:{defence:3}}),weak=ship({cargo:{salt:50}});
 assert.ok(firepower(strong)>firepower(weak));assert.ok(boardStrength(strong)>boardStrength(ship()));
 let wins=0;for(let i=1;i<=200;i++){const r=resolveBattle(strong,weak,rolls(i));if(['captured','plundered','defender-sunk'].includes(r.result))wins++;}
 assert.ok(wins>=180,'strong side wins almost always: '+wins);
 let back=0;for(let i=1;i<=200;i++){const r=resolveBattle(weak,strong,rolls(i));if(['captured','plundered'].includes(r.result))back++;}
 assert.ok(back<=20,'weak side rarely wins: '+back);
});
test('conservation: loot moves, the rest is counted, nothing is minted (400 battles x 3 finishes)',()=>{
 for(let i=1;i<=400;i++)for(const finish of ['capture','plunder','sink']){
  const a=ship({cannons:i%5,gunCond:100,crew:6+i%10,cargo:{wood:i%7}}),d=ship({cannons:(i*3)%5,crew:6+(i*7)%10,hull:40+i%60,cargo:{salt:10+i%30,silk:i%9}});
  const free=Math.max(0,60-units(a)),before=units(a,d);
  const r=resolveBattle(a,d,rolls(i),{finish,freeHold:free,prices:{silk:100,salt:5}});
  const destroyed=applyBattle(a,d,r);
  assert.equal(units(a,d)+destroyed,before,'goods conserved');
  assert.ok(units(a)<=units({cargo:{wood:i%7}})+free,'loot fits the free hold');
  assert.ok(a.hull>=0&&d.hull>=0&&a.crew>=0&&d.crew>=0);
  if(r.result==='defender-won')assert.deepEqual(r.loot,{});
  if(finish==='sink'&&r.result==='defender-sunk')assert.ok(d.sunk&&Object.keys(r.loot).length===0);
  if(r.result==='defender-sunk')assert.equal(units(d),0);
 }
});
test('loot plan: best value first, capped at 60% and at the free hold',()=>{
 const l=lootPlan({salt:50,silk:10,wood:40},1000,{silk:100,salt:5,wood:2});
 assert.equal(Object.values(l).reduce((a,b)=>a+b,0),Math.floor(100*LOOT_CAP));assert.equal(l.silk,10);assert.equal(l.salt,50);assert.equal(l.wood,undefined);
 assert.deepEqual(lootPlan({salt:50},7),{salt:7});assert.deepEqual(lootPlan({salt:50},0),{});assert.deepEqual(lootPlan({},10),{});
});
test('sinking leaves no loot; hopeless odds make the defender surrender',()=>{
 const a=ship({cannons:4,gunCond:100,hull:100}),d=ship({hull:100,cargo:{salt:30}});
 const r=resolveBattle(a,d,[.5,.5,.5,.5],{finish:'plunder',freeHold:50});
 assert.ok(r.surrendered||r.result==='defender-sunk');if(r.surrendered){assert.equal(r.result,'plundered');assert.ok(Object.keys(r.loot).length>0);}
 const s=resolveBattle(a,d,[.5,.5,.5,.5],{finish:'sink'});assert.ok(s.defenderShipSunk);assert.deepEqual(s.loot,{});assert.deepEqual(s.destroyed,{salt:30});
});
test('guns wear and crews shrink after a fight',()=>{
 const a=ship({cannons:3,gunCond:100}),d=ship({cannons:3,gunCond:100,cargo:{salt:10}});
 const r=resolveBattle(a,d,[.5,.5,.5,.5]);applyBattle(a,d,r);assert.ok(a.gunCond<100&&d.gunCond<100);assert.ok(a.crew<=12&&d.crew<=12);
});
test('a sunk attacker loses its cargo and it is counted as destroyed',()=>{
 const a=ship({hull:1,crew:12,cargo:{wood:10}}),d=ship({hull:100,crew:28,cannons:8,gunCond:100,cargo:{salt:5}});
 const r=resolveBattle(a,d,[.5,.5,.5,.5]);assert.ok(r.attackerShipSunk);assert.deepEqual(r.destroyedAttacker,{wood:10});
 const before=units(a,d),destroyed=applyBattle(a,d,r);
 assert.equal(destroyed,10);assert.equal(a.cargo.wood,undefined);assert.equal(d.cargo.salt,5);assert.equal(units(a,d)+destroyed,before);
});
test('when both ships sink, both cargoes are destroyed and counted',()=>{
 let found=0;
 for(let i=1;i<=400&&!found;i++){
  const a=ship({hull:2+i%4,cannons:4,gunCond:100,cargo:{wood:7}}),d=ship({hull:2+(i*3)%4,cannons:4,gunCond:100,cargo:{salt:9}});
  const r=resolveBattle(a,d,rolls(i));
  if(r.result!=='both-sunk')continue;found++;
  const before=units(a,d),destroyed=applyBattle(a,d,r);
  assert.equal(destroyed,16);assert.equal(units(a,d),0);assert.equal(before,16);
 }
 assert.ok(found,'at least one both-sunk fight in the sample');
});
