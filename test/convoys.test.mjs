import test from 'node:test';import assert from 'node:assert/strict';
import {loadWorld} from '../src/sim/world.mjs';
import {newGame,doSail,buyCaravel,formConvoy,leaveConvoy,disbandConvoy,sailConvoy,escortOf,convoyOf} from '../src/game/game.mjs';
import {buyWeapon} from '../src/game/crew.mjs';
import {encounterOutcome} from '../src/game/encounters.mjs';
import {serialize,deserialize} from '../src/game/gamesave.mjs';
const world=loadWorld();
const mk=()=>{const g=newGame(world);g.cash=100000;const s0=g.ships[0],home=s0.at;assert.ok(buyCaravel(g,home).ok);const s1=g.ships[1];return {g,s0,s1};};

test('a convoy forms in port from 2-5 owned docked ships and rejects bad groups',()=>{
 const {g,s0,s1}=mk();
 assert.equal(formConvoy(g,[s0.id]).ok,false,'one hull is not a convoy');
 assert.equal(formConvoy(g,[s0.id,'nope']).ok,false,'foreign ship');
 const r=formConvoy(g,[s0.id,s1.id]);assert.ok(r.ok);assert.equal(r.convoy.ships.length,2);assert.equal(s0.convoy,r.convoy.id);
 assert.equal(formConvoy(g,[s0.id,s1.id]).ok,false,'already grouped');
 doSail(g,g.ships[0],'barcelona');
 assert.equal(formConvoy(g,[g.ships[0].id,s1.id]).ok,false,'at sea');
});
test('leaving shrinks the group and a single hull disbands itself; at-sea ships cannot leave',()=>{
 const {g,s0,s1}=mk();const cv=formConvoy(g,[s0.id,s1.id],'Flota del Sur').convoy;
 assert.equal(cv.name,'Flota del Sur');
 assert.ok(leaveConvoy(g,s0.id).ok);assert.equal(g.convoys[cv.id],undefined,'auto-disbanded');assert.equal(s1.convoy,undefined);
 const cv2=formConvoy(g,[s0.id,s1.id]).convoy;
 sailConvoy(g,cv2.id,'barcelona',{doSail});
 assert.equal(leaveConvoy(g,s0.id).ok,false,'cannot desert mid-voyage');
});
test('the convoy sails together at the pace of the slowest hull',()=>{
 const {g,s0,s1}=mk();const cv=formConvoy(g,[s0.id,s1.id]).convoy;
 const r=sailConvoy(g,cv.id,'barcelona',{doSail});assert.ok(r.ok);
 assert.ok(s0.voyage&&s1.voyage);assert.equal(s0.voyage.ticksLeft,s1.voyage.ticksLeft,'arrive together');
 assert.equal(s0.voyage.to,'barcelona');assert.equal(s1.voyage.to,'barcelona');
 assert.equal(sailConvoy(g,cv.id,'barcelona',{doSail}).ok,false,'already at sea');
});
test('escort firepower only counts convoy mates on the same leg',()=>{
 const {g,s0,s1}=mk();g.cash=100000;
 assert.ok(buyWeapon(g,s0,'bombard').ok);assert.ok(buyWeapon(g,s1,'bombard').ok);
 const cv=formConvoy(g,[s0.id,s1.id]).convoy;
 assert.equal(escortOf(g,s0),0,'in port there is nothing to escort');
 sailConvoy(g,cv.id,'barcelona',{doSail});
 assert.ok(escortOf(g,s0)>0,'mates cover each other at sea');assert.equal(escortOf(g,s0),escortOf(g,s1));
 const solo=encounterOutcome(s0,'pirates',0.5),escorted=encounterOutcome(s0,'pirates',0.5,escortOf(g,s0));
 assert.ok(escorted.defence>solo.defence&&escorted.chance>solo.chance,'escort raises the repel chance');
});
test('convoys survive save and load',()=>{
 const {g,s0,s1}=mk();const cv=formConvoy(g,[s0.id,s1.id]).convoy;
 const back=deserialize(JSON.parse(JSON.stringify(serialize(g,'Test Co'))),world).g;
 assert.ok(back.convoys[cv.id]);assert.deepEqual(back.convoys[cv.id].ships,[s0.id,s1.id]);
 assert.equal(back.ships[0].convoy,cv.id);
});
