import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { newCampaign, campaignTick, campaignEvent, missionView } from '../src/game/campaigns.mjs';
import { newGame, advanceDay } from '../src/game/game.mjs';
import { serialize, deserialize } from '../src/game/gamesave.mjs';
import { buildWorld } from '../src/sim/world.mjs';
import { initTutorial, skipTutorial } from '../src/game/tutorial.mjs';
import { portRep } from '../src/game/reputation.mjs';
const id = 's3-long-name', next = 's4-next-word';
const fresh = () => ({ day: 9000, cash: 100, profile: { home: 'cadiz' }, market: { cadiz: {}, sevilla: {} }, longMissions: true, noGoal: true, portRep: { cadiz: 10 }, campaign: newCampaign() });
const seeded = () => { const g = fresh(); g.campaign.missions['m1-oficio'].done = true; return g; };
const h = { post() {}, addRespect() {}, repOf: () => 0, netWorth: () => 0 };
const start = () => { const g = seeded(); campaignTick(g, h); return g; };
test('relative deadline before/at/after, one penalty across reload, visible localized failure and exact cooldown', () => {
  let g = start();
  assert.equal(g.campaign.missions[id].deadlineDay, 730);
  for (const day of [9729, 9730]) { g.day = day; campaignTick(g, h); assert.equal(g.campaign.missions[id].failed, false); }
  g.day = 9731; campaignTick(g, h);
  assert.equal(g.campaign.missions[id].failed, true);
  assert.equal(portRep(g, 'cadiz'), 8);
  assert.equal(g.cash, 100);
  assert.equal(g.campaign.missions[next], undefined);
  for (const lang of ['en', 'es']) { const v = missionView(g, lang, h).find(m => m.id === id); assert.equal(v.failed, true); assert.ok(v.stepLabel.includes(lang === 'en' ? 'Revoked' : 'Revocado')); assert.equal(v.daysLeft, null); }
  g = JSON.parse(JSON.stringify(g)); campaignTick(g, h); campaignEvent(g, { kind: 'readReport' }, h);
  assert.equal(portRep(g, 'cadiz'), 8);
  g.day = 9744; campaignTick(g, h); assert.equal(g.campaign.missions[next], undefined);
  g.day = 9745; campaignTick(g, h); assert.ok(g.campaign.missions[next]);
  campaignEvent(g, { kind: 'readReport' }, h); assert.equal(g.campaign.missions[next].done, true);
  g.day++; campaignTick(g, h); assert.equal(portRep(g, 'cadiz'), 8); assert.equal(g.campaign.missions[id].failed, true);
});
test('cooldown never blocks main chain or accepted side missions', () => {
  const g = start(); g.day += 731; campaignTick(g, h);
  const live = { ...h, repOf: () => 20, netWorth: () => 10000 };
  campaignTick(g, live);
  for (const key of ['m2-nombre', 's1-gremio', 's2-caja']) assert.equal(g.campaign.missions[key].done, true);
  assert.equal(g.cash, 700);
});
test('tutorial freezes activation, deadline and cooldown; toggle hides and disables optional consequences', () => {
  const g = seeded(); initTutorial(g); campaignTick(g, h); g.day += 1000; campaignTick(g, h);
  assert.equal(g.campaign.missions[id], undefined); skipTutorial(g); campaignTick(g, h);
  assert.equal(missionView(g, 'en', h).find(m => m.id === id).daysLeft, 730);
  initTutorial(g); g.day += 800; campaignTick(g, h); assert.equal(g.campaign.missions[id].failed, false);
  skipTutorial(g); campaignTick(g, h); assert.equal(g.campaign.longClock.day, 0);
  g.longMissions = false; const before = JSON.stringify(g); g.day += 731; campaignTick(g, h);
  assert.equal(g.campaign.missions[id].failed, false); assert.equal(portRep(g, 'cadiz'), 10);
  assert.ok(!missionView(g, 'en', h).some(m => m.id === id));
  g.day -= 731; assert.equal(JSON.stringify(g), before);
  g.day += 731; g.longMissions = true; campaignTick(g, h); assert.equal(g.campaign.missions[id].failed, true);
  initTutorial(g); g.day += 100; campaignTick(g, h); skipTutorial(g); campaignTick(g, h);
  assert.equal(g.campaign.missions[next], undefined);
  g.day += 14; campaignTick(g, h); assert.ok(g.campaign.missions[next]);
});
test('success on deadline has no failure consequences and never repeats', () => {
  const g = start(); g.day += 730; campaignTick(g, { ...h, repOf: () => 30 });
  assert.equal(g.campaign.missions[id].done, true);
  g.day += 100; campaignTick(g, h); assert.equal(g.campaign.missions[id].failed, false);
  assert.equal(portRep(g, 'cadiz'), 10); assert.equal(g.campaign.optionalUntil, undefined);
});
test('flag-off campaign states byte-match snapshot engine, including m1 failure', async () => {
  const old = await import('./fixtures/campaigns-before-long-missions.mjs');
  for (const completed of [false, true]) {
    const a = fresh(); delete a.longMissions; if (completed) a.campaign.missions['m1-oficio'].done = true;
    const b = structuredClone(a);
    for (const day of [1, 59, 60, 61, 9000]) { a.day = b.day = day; campaignTick(a, h); old.campaignTick(b, h); assert.equal(JSON.stringify(a), JSON.stringify(b)); }
  }
});
const world = buildWorld(JSON.parse(fs.readFileSync(new URL('../data/world.json', import.meta.url))));
test('new/old valid saves retain opt-in only and deterministic flag-off simulation', () => {
  const a = newGame(world, undefined, { seed: 17 }), b = newGame(world, undefined, { seed: 17, longMissions: false });
  assert.equal(Object.hasOwn(a, 'longMissions'), false);
  for (let i = 0; i < 3; i++) { advanceDay(a); advanceDay(b); }
  assert.equal(JSON.stringify(serialize(a, 'Synthetic', 0)), JSON.stringify(serialize(b, 'Synthetic', 0)));
  const old = deserialize(serialize(a, 'Synthetic', 0), world).g; assert.equal(Object.hasOwn(old, 'longMissions'), false);
  const g = newGame(world, undefined, { longMissions: true, noGoal: true }); g.campaign.missions['m1-oficio'].done = true; campaignTick(g, h);
  g.day += 731; campaignTick(g, h);
  const back = deserialize(serialize(g, 'Synthetic', 0), world).g;
  const rep = portRep(back, back.profile.home); campaignTick(back, h);
  assert.equal(back.longMissions, true); assert.equal(back.campaign.missions[id].failed, true); assert.equal(portRep(back, back.profile.home), rep);
});

test('new optional offers wait, new main offers do not; expired event cannot complete mission', () => {
  const g = start();
  for (const key of ['m2-nombre', 's1-gremio']) { delete g.campaign.missions[key]; g.campaign.active = g.campaign.active.filter(x => x !== key); }
  g.day += 731; campaignEvent(g, { kind: 'readReport' }, h); campaignTick(g, h);
  assert.equal(g.campaign.missions[id].failed, true);
  assert.ok(g.campaign.missions['m2-nombre']); assert.equal(g.campaign.missions['s1-gremio'], undefined);
  g.day += 14; campaignTick(g, h); assert.ok(g.campaign.missions['s1-gremio']);
});
test('partial optional state gets a relative window; damaged new save timing is rejected', () => {
  const g = newGame(world, undefined, { longMissions: true, noGoal: true });
  g.campaign.missions['m1-oficio'].done = true; campaignTick(g, h);
  delete g.campaign.missions[id].deadlineDay; g.day += 1000; campaignTick(g, h);
  assert.equal(g.campaign.missions[id].failed, false);
  assert.equal(missionView(g, 'en', h).find(m => m.id === id).daysLeft, 730);
  for (const field of ['day', 'lastDay']) {
    const save = serialize(g, 'Synthetic', 0); save.state.campaign.longClock[field] = 'bad';
    assert.throws(() => deserialize(save, world), /damaged/);
  }
  const save = serialize(g, 'Synthetic', 0); save.state.campaign.missions[id].deadlineDay = -1;
  assert.throws(() => deserialize(save, world), /damaged/);
});

test('failed quantity, ports and respect objectives show no progress in EN/ES; chip is short', () => {
 const g=start();
 for(const key of ['m1-oficio','m2-nombre','s3-long-name']) g.campaign.missions[key].failed=true;
 for(const lang of ['en','es']) {
  const rows=missionView(g,lang,h);
  for(const key of ['m1-oficio','m2-nombre','s3-long-name']) assert.equal(rows.find(x=>x.id===key).progress,'');
  const chip=rows.find(x=>x.id==='s3-long-name').stepLabel;
  assert.ok(chip.length<50);assert.ok(!chip.includes('14'));assert.ok(chip.includes('−2'));
 }
});

test('long mission is absent in standard 365-day mode and present only in an open-ended campaign', () => {
 for(const noGoal of [false,true]) {
  const g=newGame(world,'cadiz',{seed:19,longMissions:true,noGoal});
  skipTutorial(g);g.campaign.missions['m1-oficio'].done=true;campaignTick(g,h);
  assert.equal(!!g.campaign.missions[id],noGoal);
  assert.equal(!!g.campaign.longClock,noGoal);
 }
 const free=newGame(world,'cadiz',{seed:19,longMissions:true,noGoal:true,freePlay:true});
 campaignTick(free,h);assert.equal(free.campaign,null);
});
test('real consecutive daily game advances reach long expiry without changing the standard deadline', () => {
 for(const noGoal of [false,true]) {
  const g=newGame(world,'cadiz',{seed:19,longMissions:true,noGoal,cash:38000,household:false,events:false});
  // Controlled no-trading fixture: isolate the full daily engine from rival randomness.
  g.ai=[];skipTutorial(g);g.campaign.missions['m1-oficio'].done=true;campaignTick(g,h);
  const last=noGoal?731:365;
  for(let day=1;day<=last;day++) {
   advanceDay(g);assert.equal(g.day,day);
   if(noGoal) {assert.equal(g.over,null);assert.equal(g.campaign.missions[id].failed,day>730);}
   else {assert.equal(g.campaign.missions[id],undefined);assert.equal(g.over,day===365?'lose':null);}
  }
  if(noGoal) assert.equal(g.campaign.optionalUntil,745);
 }
});
