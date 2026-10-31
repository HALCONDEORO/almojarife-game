import test from 'node:test';import assert from 'node:assert/strict';
import {loadWorld} from '../src/sim/world.mjs';
import {newGame,doSail,buyCaravel,sellShip,formConvoy,leaveConvoy,disbandConvoy,sailConvoy,escortOf,convoyOf} from '../src/game/game.mjs';
import {buyWeapon,defenceOf} from '../src/game/crew.mjs';
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
test('candidate selection is construction-time advice; formation validates at execution and is all-or-nothing',()=>{
 const {g,s0,s1}=mk();
 assert.ok(buyCaravel(g,s0.at).ok);const s2=g.ships[2];
 // a stale candidate list (one ship sailed off, another got grouped elsewhere) fails whole:
 const cv=formConvoy(g,[s0.id,s1.id]).convoy;
 const seqBefore=g.convoySeq,groupedSnapshot=JSON.stringify(g);
 assert.equal(formConvoy(g,[s0.id,s2.id]).ok,false,'a grouped candidate rejects the command');
 assert.equal(formConvoy(g,[s0.id,s2.id]).reason,'already grouped');
 assert.equal(JSON.stringify(g),groupedSnapshot,'rejected grouped candidate writes nothing');
 assert.equal(s2.convoy,undefined,'no partial assignment');
 assert.equal(g.convoySeq,seqBefore,'no id minted on failure');
 assert.deepEqual(Object.keys(g.convoys),[cv.id],'the existing registration is untouched');
 // candidate order at construction does not change membership:
 disbandConvoy(g,cv.id);
 const reformed=formConvoy(g,[s1.id,s0.id,s2.id]).convoy;
 assert.deepEqual([...reformed.ships].sort(),[s0.id,s1.id,s2.id].sort(),'same members regardless of candidate order');
 disbandConvoy(g,reformed.id);
 // a candidate that leaves port between selection and execution invalidates the whole command:
 assert.ok(doSail(g,s0,'barcelona').ok);
 const sailedSnapshot=JSON.stringify(g);
 assert.equal(formConvoy(g,[s0.id,s1.id]).reason,'at sea');
 assert.equal(JSON.stringify(g),sailedSnapshot,'rejected sailed candidate writes nothing');
 assert.equal(s1.convoy,undefined,'nobody is registered from a stale list');
 assert.equal(g.convoySeq,seqBefore+1,'only the successful re-formation consumed an id');
});
test('convoy ids are minted once and never reused, even across disband and reload',()=>{
 const {g,s0,s1}=mk();
 const cv1=formConvoy(g,[s0.id,s1.id]).convoy;
 const seqAfterForm=g.convoySeq,beforeReplay=JSON.stringify(g);
 assert.equal(formConvoy(g,[s0.id,s1.id]).ok,false,'replay: the relation already exists');
 assert.equal(g.convoySeq,seqAfterForm,'a rejected replay mints no id');
 assert.equal(JSON.stringify(g),beforeReplay,'a rejected replay writes nothing');
 assert.ok(disbandConvoy(g,cv1.id).ok);
 assert.equal(g.convoys[cv1.id],undefined,'registration removed on disband');
 const cv2=formConvoy(g,[s0.id,s1.id]).convoy;
 assert.notEqual(cv2.id,cv1.id,'a disbanded id is never reused');
 const loaded=deserialize(serialize(g,'T'),world).g;
 assert.equal(loaded.convoySeq,g.convoySeq,'the sequence survives a save/load round-trip');
 assert.ok(disbandConvoy(loaded,cv2.id).ok);
 const cv3=formConvoy(loaded,[loaded.ships[0].id,loaded.ships[1].id]).convoy;
 assert.ok(![cv1.id,cv2.id].includes(cv3.id),'no id reuse after reload either');
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
test('escort counts the effective defence of mates (condition and crew), not raw firepower',()=>{
 const {g,s0,s1}=mk();g.cash=100000;
 assert.ok(buyWeapon(g,s0,'bombard').ok);assert.ok(buyWeapon(g,s1,'bombard').ok);
 const cv=formConvoy(g,[s0.id,s1.id]).convoy;sailConvoy(g,cv.id,'barcelona',{doSail});
 assert.equal(escortOf(g,s0),defenceOf(s1),'escort equals the mate defence');
 const full=escortOf(g,s0);assert.ok(full>0);
 s1.gunCond=0;assert.equal(escortOf(g,s0),defenceOf(s1));assert.ok(escortOf(g,s0)<full,'worn-out guns escort less');
 s1.gunCond=100;s1.crew=1;assert.equal(escortOf(g,s0),defenceOf(s1));assert.ok(escortOf(g,s0)<full,'a skeleton crew escorts less');
});
test('convoys survive save and load',()=>{
 const {g,s0,s1}=mk();const cv=formConvoy(g,[s0.id,s1.id]).convoy;
 const back=deserialize(JSON.parse(JSON.stringify(serialize(g,'Test Co'))),world).g;
 assert.ok(back.convoys[cv.id]);assert.deepEqual(back.convoys[cv.id].ships,[s0.id,s1.id]);
 assert.equal(back.ships[0].convoy,cv.id);
});

test('a convoy only forms in one port (scattered ships are rejected)',()=>{
 const {g,s0,s1}=mk();s1.at='lisboa';
 assert.equal(formConvoy(g,[s0.id,s1.id]).reason,'scattered');
 assert.ok(!s0.convoy&&!s1.convoy,'nobody grouped');
});
test('every convoy notice carries bilingual text (no blank inbox lines)',()=>{
 const {g,s0,s1}=mk();const cv=formConvoy(g,[s0.id,s1.id]).convoy;
 sailConvoy(g,cv.id,'barcelona',{doSail});
 const notes=(g.inbox??[]).filter((m)=>m.kind.startsWith('convoy'));
 assert.equal(notes.length,2,'formed + sailed');
 for(const m of notes){assert.ok(m.txt?.es?.length>5&&m.txt?.en?.length>5,`txt on ${m.kind}`);}
 assert.ok(notes.find((m)=>m.kind==='convoySailed').txt.es.includes('Barcelona'),'the city name, not the id');
});
test('sailConvoy validates every hull before any leaves: no partial departures',()=>{
 const {g,s0,s1}=mk();const cv=formConvoy(g,[s0.id,s1.id]).convoy;
 s1.crew=0; // below the minimum: this hull cannot leave
 const r=sailConvoy(g,cv.id,'barcelona',{doSail});
 assert.equal(r.ok,false);assert.equal(r.reason,'crew');
 assert.ok(!s0.voyage&&!s1.voyage,'nobody moved: the group is not stranded without its escort');
});
test('selling a ship posts its convoy farewell and a single-hull remainder disbands with notice',()=>{
 const {g,s0,s1}=mk();const cv=formConvoy(g,[s0.id,s1.id]).convoy;
 assert.ok(sellShip(g,s1).ok);
 const notes=(g.inbox??[]).filter((m)=>m.kind.startsWith('convoy'));
 assert.ok(notes.some((m)=>m.kind==='convoyLeft'&&m.txt?.es&&m.txt?.en),'farewell posted, bilingual');
 assert.ok(notes.some((m)=>m.kind==='convoyDisbanded'),'the disband is posted too');
 assert.equal(s0.convoy,undefined);assert.equal(g.convoys[cv.id],undefined);
});
