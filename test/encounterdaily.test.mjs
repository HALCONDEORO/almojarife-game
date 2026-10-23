import test from 'node:test';import assert from 'node:assert/strict';
import {loadWorld} from '../src/sim/world.mjs';import {newGame,doSail,advanceDay,advanceTick} from '../src/game/game.mjs';
import {automaticEncounter,resolvePirates,dismissEncounterReport,SEA_ENCOUNTER_CHANCE,SEA_ENCOUNTER_CHANCE_TICK} from '../src/game/encounterdaily.mjs';import {encountersHtml} from '../src/view/encounterview.mjs';import {serialize,deserialize} from '../src/game/gamesave.mjs';
import {TICKS_PER_DAY} from '../src/sim/clock.mjs';
const world=loadWorld();
test('per-tick chance keeps the daily exposure of the day model exactly',()=>{
 assert.ok(Math.abs(Math.pow(1-SEA_ENCOUNTER_CHANCE_TICK,TICKS_PER_DAY)-(1-SEA_ENCOUNTER_CHANCE))<1e-12);
});
test('tick-keyed encounter: fires, rolls each tick once, save replay never double damages',()=>{
 const g=newGame(world),s=g.ships[0];g.eventsOn=true;doSail(g,s,'barcelona');let e;
 for(let t=1;t<400000&&!e;t++){g.tick=t;e=automaticEncounter(g,s);}
 assert.ok(e);if(g.pending?.event==='sea-pirates'){resolvePirates(g,'fight');dismissEncounterReport(g);}assert.equal(g.pending,null);const before=JSON.stringify(g);assert.equal(automaticEncounter(g,s),null);assert.equal(JSON.stringify(g),before);
 const r=deserialize(serialize(g,'Test'),world).g;const snapshot=JSON.stringify(r);assert.equal(automaticEncounter(r,r.ships[0]),null);assert.equal(JSON.stringify(r),snapshot);
 assert.match(encountersHtml(g,'es'),/Sucesos en el mar/);assert.match(encountersHtml(g,'en'),/Sea encounters/);assert.equal(g.encounters.length,1);
});
test('disabled/port/pending/free game safety and legacy pending still resolvable',()=>{
 const g=newGame(world),s=g.ships[0],before=JSON.stringify(g);assert.equal(automaticEncounter(g,s),null);assert.equal(JSON.stringify(g),before);
 g.eventsOn=true;g.pending={event:'storm',ship:s.id,day:0};doSail(g,s,'barcelona');const snap=JSON.stringify(g);assert.equal(automaticEncounter(g,s),null);assert.equal(JSON.stringify(g),snap);
});
test('tick hook creates no forced choice for pirate/storm and missing old fields safe',()=>{
 const g=newGame(world),s=g.ships[0];g.eventsOn=true;g.world.events=g.world.events.filter(e=>['pirates','storm'].includes(e.id)); // filter in place: replacing g.world would drop the optional-goods entries the market now references
 doSail(g,s,'barcelona');
 for(let i=0;i<10&&s.voyage;i++){advanceDay(g);assert.ok(!g.pending||g.pending.event==='sea-pirates');}
 assert.ok(g.encounterTicks);assert.equal(encountersHtml({},'en'),'');
});
test('encounters fire inside advanceTick on a deterministic tick stream across a mid-voyage save',()=>{
 const mk=()=>{const g=newGame(world);g.eventsOn=true;doSail(g,g.ships[0],'barcelona');return g;};
 const a=mk();
 for(let i=0;i<3;i++)advanceDay(a);
 const save=serialize(a,'T');
 for(let i=0;i<3;i++)advanceDay(a);
 const r=deserialize(save,world).g;
 for(let i=0;i<3;i++)advanceDay(r);
 assert.equal(JSON.stringify(r.encounters??[]),JSON.stringify(a.encounters??[]));
 assert.equal(JSON.stringify(r.pending??null),JSON.stringify(a.pending??null));
 assert.equal(r.tick,a.tick);
});
test('long-run frequency matches the daily chance (seeded rolls over 1000 ship-days)',()=>{
 const g=newGame(world),s=g.ships[0];g.eventsOn=true;doSail(g,s,'barcelona');let hits=0;
 const days=1000;
 for(let t=1;t<=days*TICKS_PER_DAY;t++){g.tick=t;if(automaticEncounter(g,s)){hits++;if(g.pending){resolvePirates(g,'fight');dismissEncounterReport(g);}s.hull=100;}}
 const expected=days*SEA_ENCOUNTER_CHANCE;
 assert.ok(hits>expected*0.4&&hits<expected*1.8,`hits ${hits} vs expected ${expected}`);
});
