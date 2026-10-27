import test from 'node:test';import assert from 'node:assert/strict';
import {encounterOutcome,applyEncounter} from '../src/game/encounters.mjs';
const ship=()=>({id:1,type:'cog',hull:100,crew:12,cargo:{salt:10},basis:{salt:100},voyage:{ticksLeft:720,totalTicks:1200}});
test('pure reproducible pirates use actual cannon/crew/condition and defence skill',()=>{
 const s=ship(),before=JSON.stringify(s),o=encounterOutcome(s,'pirates',0.4);assert.equal(o.result,'raided');assert.equal(JSON.stringify(s),before);
 s.cannons=3;s.gunCond=100;s.captain={defence:3};assert.equal(encounterOutcome(s,'pirates',0.4).result,'repelled');
 s.gunCond=10;assert.ok(encounterOutcome(s,'pirates',0.4).chance<0.5);
 assert.deepEqual(encounterOutcome(s,'pirates',0.6),encounterOutcome(s,'pirates',0.6));
});
test('weather reduces real damage, bounded levels, roll validation',()=>{
 const s=ship(),a=encounterOutcome(s,'storm',0.8);s.captain={weather:3};const b=encounterOutcome(s,'storm',0.8);assert.ok(b.hullLoss<a.hullLoss);assert.ok(b.cargoLossPct<a.cargoLossPct);
 s.captain.weather=999;assert.equal(encounterOutcome(s,'storm',0.8).hullLoss,a.hullLoss);
 for(const r of [-1,1,NaN])assert.throws(()=>encounterOutcome(s,'storm',r));assert.throws(()=>encounterOutcome(s,'x',0));
});
test('application changes actual hull cargo basis and voyage, no cash minted',()=>{
 const s=ship(),g={ships:[s],cash:500,basis:{salt:{qty:10,cost:100}}};const o=encounterOutcome(s,'pirates',0.9),r=applyEncounter(g,s,o);
 assert.equal(r.ok,true);assert.equal(s.hull,90);assert.equal(s.cargo.salt,8);assert.deepEqual(g.basis.salt,{qty:8,cost:80});assert.equal(s.basis.salt,80);assert.equal(s.voyage.ticksLeft,960);assert.equal(s.voyage.totalTicks,1440);assert.equal(g.cash,500);
 s.hull=12;applyEncounter(g,s,o);assert.equal(s.hull,10);
});
test('invalid application no mutation, port/foreign/ended rejected',()=>{
 for(const mode of ['port','foreign','end','bad']){const s=ship(),g={ships:[s],cash:10};if(mode==='port')s.voyage=null;if(mode==='end')g.over='win';const before=JSON.stringify(g);const r=applyEncounter(g,mode==='foreign'?{...s}:s,mode==='bad'?{kind:'pirates',hullLoss:-1}:encounterOutcome(s,'pirates',0.9));assert.equal(r.ok,false);assert.equal(JSON.stringify(g),before);}
});

test('total loss clears ship basis and global book, no phantom basis on later trade',()=>{
 const s=ship(),g={ships:[s],cash:500,basis:{salt:{qty:10,cost:100}}};
 applyEncounter(g,s,{kind:'pirates',hullLoss:10,cargoLossPct:100,delay:0});
 assert.deepEqual(s.cargo,{});assert.deepEqual(s.basis,{});assert.deepEqual(g.basis.salt,{qty:0,cost:0});
});

test('storm delay attribution accumulates on this voyage only, without changing timing rules',()=>{
 const s=ship(),g={ships:[s],cash:500},out={kind:'storm',hullLoss:0,cargoLossPct:0,delay:1};
 applyEncounter(g,s,out);assert.equal(s.voyage.stormDelayDays,1);assert.equal(s.voyage.ticksLeft,960);assert.equal(s.voyage.totalTicks,1440);
 applyEncounter(g,s,{...out,delay:2});assert.equal(s.voyage.stormDelayDays,3);assert.equal(s.voyage.ticksLeft,1440);
 applyEncounter(g,s,{...out,kind:'pirates'});assert.equal(s.voyage.stormDelayDays,3);
 s.voyage={ticksLeft:10,totalTicks:10};applyEncounter(g,s,out);assert.equal(s.voyage.stormDelayDays,1);
});

test('storm attribution survives save/reload and clears with arrival/new departure',async()=>{
 const fs=await import('node:fs');const {buildWorld}=await import('../src/sim/world.mjs');const {newGame}=await import('../src/game/game.mjs');const {serialize,deserialize}=await import('../src/game/gamesave.mjs');const {sail,sailTick}=await import('../src/sim/trade.mjs');
 const world=buildWorld(JSON.parse(fs.readFileSync(new URL('../data/world.json',import.meta.url))));const g=newGame(world,'cadiz'),s=g.ships[0];
 assert.ok(sail(world,s,'sevilla').ok);applyEncounter(g,s,{kind:'storm',hullLoss:0,cargoLossPct:0,delay:1});
 const {g:loaded}=deserialize(serialize(g,'Test'),world),ls=loaded.ships[0];assert.equal(ls.voyage.stormDelayDays,1);assert.equal(ls.voyage.ticksLeft,s.voyage.ticksLeft);
 ls.voyage.ticksLeft=1;assert.ok(sailTick(ls));assert.equal(ls.voyage,null);assert.ok(sail(world,ls,'cadiz').ok);assert.equal(ls.voyage.stormDelayDays,undefined);
 const old=serialize(loaded,'Test');delete old.state.ships[0].voyage.stormDelayDays;assert.equal(deserialize(old,world).g.ships[0].voyage.stormDelayDays,undefined);
});
