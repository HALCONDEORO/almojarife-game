import test from 'node:test';import assert from 'node:assert/strict';
import {loadWorld} from '../src/sim/world.mjs';import {newGame,doSail,advanceDay} from '../src/game/game.mjs';
import {automaticEncounter,resolvePirates,dismissEncounterReport} from '../src/game/encounterdaily.mjs';import {encountersHtml} from '../src/view/encounterview.mjs';import {serialize,deserialize} from '../src/game/gamesave.mjs';
const world=loadWorld();
test('automatic deterministic encounter, same-day replay/save replay never double damages',()=>{
 const g=newGame(world),s=g.ships[0];g.eventsOn=true;doSail(g,s,'barcelona');let e;
 for(let day=1;day<2000&&!e;day++){g.day=day;e=automaticEncounter(g,s);}
 assert.ok(e);if(g.pending?.event==='sea-pirates'){resolvePirates(g,'fight');dismissEncounterReport(g);}assert.equal(g.pending,null);const before=JSON.stringify(g);assert.equal(automaticEncounter(g,s),null);assert.equal(JSON.stringify(g),before);
 const r=deserialize(serialize(g,'Test'),world).g;const snapshot=JSON.stringify(r);assert.equal(automaticEncounter(r,r.ships[0]),null);assert.equal(JSON.stringify(r),snapshot);
 assert.match(encountersHtml(g,'es'),/Sucesos en el mar/);assert.match(encountersHtml(g,'en'),/Sea encounters/);assert.equal(g.encounters.length,1);
});
test('disabled/port/pending/free game safety and legacy pending still resolvable',()=>{
 const g=newGame(world),s=g.ships[0],before=JSON.stringify(g);assert.equal(automaticEncounter(g,s),null);assert.equal(JSON.stringify(g),before);
 g.eventsOn=true;g.pending={event:'storm',ship:s.id,day:0};doSail(g,s,'barcelona');const snap=JSON.stringify(g);assert.equal(automaticEncounter(g,s),null);assert.equal(JSON.stringify(g),snap);
});
test('daily hook creates no forced choice for pirate/storm and missing old fields safe',()=>{
 const g=newGame(world),s=g.ships[0];g.eventsOn=true;g.world={...world,events:world.events.filter(e=>['pirates','storm'].includes(e.id))};doSail(g,s,'barcelona');
 for(let i=0;i<10&&s.voyage;i++){advanceDay(g);assert.ok(!g.pending||g.pending.event==='sea-pirates');}
 assert.ok(g.encounterDays);assert.equal(encountersHtml({},'en'),'');
});
