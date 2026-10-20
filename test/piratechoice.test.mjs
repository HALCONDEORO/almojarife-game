import test from 'node:test';import assert from 'node:assert/strict';
import {loadWorld} from '../src/sim/world.mjs';import {newGame,doSail,advanceDay,waitUntilArrival} from '../src/game/game.mjs';
import {automaticEncounter,resolvePirates,dismissEncounterReport,escapeChance} from '../src/game/encounterdaily.mjs';
import {encounterDialogHtml} from '../src/view/encounterview.mjs';import {serialize,deserialize} from '../src/game/gamesave.mjs';import {pendingEvent,resolveEvent} from '../src/game/events.mjs';
const world=loadWorld();
function encounter(seed=13){const g=newGame(world),s=g.ships[0];g.eventsOn=true;g.seed=seed;doSail(g,s,'barcelona');for(let day=1;day<2000;day++){g.day=day;automaticEncounter(g,s);if(g.pending?.event==='sea-pirates')return g;}throw Error('missing pirates');}
test('pirates pause before any loss, show actual escape chance and options in both languages',()=>{
 const g=encounter(),p=g.pending;assert.equal(p.escapeChance,escapeChance(g.ships[0]));assert.equal(g.encounters?.filter(e=>e.kind==='pirates').length??0,0);
 const before=JSON.stringify(g);advanceDay(g);waitUntilArrival(g,g.ships[0]);assert.equal(JSON.stringify(g),before);assert.equal(pendingEvent(g),null);
 assert.match(encounterDialogHtml(g,'es'),new RegExp(`Intentar huir \\(${p.escapeChance}% de éxito\\)`));assert.match(encounterDialogHtml(g,'en'),/Try to flee/);assert.match(encounterDialogHtml(g,'es'),/Luchar/);
});
test('fight makes one final report, persists through save, blocks time until dismissed, no duplicate logs',()=>{
 const g=encounter(),p={...g.pending};const s=g.ships[0];s.cargo={salt:10};s.basis={salt:100};g.basis={salt:{qty:10,cost:100}};
 const clone=deserialize(serialize(g,'test'),world).g;assert.deepEqual(resolvePirates(g,'fight'),resolvePirates(clone,'fight'));
 assert.equal(g.pending,null);assert.equal(g.encounterReport.id,p.id);assert.equal(g.encounters.filter(e=>e.id===p.id).length,1);
 assert.equal(g.log.filter(l=>l.ship===p.ship&&l.day===p.day&&l.key==='event').length,0);
 assert.ok(!g.inbox?.some(e=>e.ship===p.ship&&e.day===p.day&&e.kind==='event'));
 const before=JSON.stringify(g);assert.equal(resolvePirates(g,'fight').ok,false);advanceDay(g);assert.equal(JSON.stringify(g),before);
 const loaded=deserialize(serialize(g,'test'),world).g;assert.deepEqual(loaded.encounterReport,g.encounterReport);assert.match(encounterDialogHtml(loaded,'es'),/Informe del encuentro/);assert.match(encounterDialogHtml(loaded,'en'),/Encounter report/);
 assert.equal(dismissEncounterReport(g),true);assert.equal(dismissEncounterReport(g),false);assert.equal(encounterDialogHtml(g),'');assert.equal(g.encounters.filter(e=>e.id===p.id).length,1);
 if(s.cargo.salt===8){assert.equal(s.basis.salt,80);assert.deepEqual(g.basis.salt,{qty:8,cost:80});}
});
test('escape can succeed or fail into simulated fight, never rerolls and no cash reward',()=>{
 let escaped=false,failed=false;
 for(let seed=1;seed<40&&!(escaped&&failed);seed++){
  const g=encounter(seed),cash=g.cash,s=g.ships[0],h=s.hull,left=s.voyage.ticksLeft;
  const e=resolvePirates(g,'flee');assert.equal(g.cash,cash);
  if(e.result==='escaped'){escaped=true;assert.equal(s.hull,h);assert.equal(s.voyage.ticksLeft,left+240);assert.equal(e.cargoLost,0);}else{failed=true;assert.equal(e.escapeFailed,true);assert.ok(['raided','repelled'].includes(e.result));}
  const before=JSON.stringify(g);resolvePirates(g,'flee');assert.equal(JSON.stringify(g),before);
 }
 assert.ok(escaped&&failed);
});
test('invalid decisions/game over/nonvoyage do not mutate and legacy events still resolve',()=>{
 const g=encounter();let before=JSON.stringify(g);assert.equal(resolvePirates(g,'pay').ok,false);assert.equal(JSON.stringify(g),before);
 g.over='lose';before=JSON.stringify(g);assert.equal(resolvePirates(g,'fight').ok,false);assert.equal(JSON.stringify(g),before);
 g.over=null;g.ships[0].voyage=null;before=JSON.stringify(g);assert.equal(resolvePirates(g,'fight').ok,false);assert.equal(JSON.stringify(g),before);
 g.pending={event:'pirates',ship:g.ships[0].id,day:g.day};const ev=world.events.find(e=>e.id==='pirates');assert.ok(pendingEvent(g));assert.equal(resolveEvent(g,ev.choices[0].id).ok,true);assert.equal(g.pending,null);
});
test('escape bounds, navigation and hull genuinely affect the displayed rule',()=>{
 assert.ok(escapeChance({type:'cog',hull:100})>escapeChance({type:'cog',hull:20}));assert.ok(escapeChance({type:'cog',hull:100,captain:{navigation:3}})>escapeChance({type:'cog',hull:100}));
 for(const hull of [-100,0,50,100,200])for(const crew of [0,8,12,18]){const c=escapeChance({type:'cog',hull,crew});assert.ok(c>=15&&c<=85);}
});
