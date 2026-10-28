import test from 'node:test';
import assert from 'node:assert/strict';
import { loadWorld } from '../src/sim/world.mjs';
import { newGame, advanceDay } from '../src/game/game.mjs';
import { serialize, deserialize } from '../src/game/gamesave.mjs';
test('planned competition opt-in starts before warmup, default remains three',()=>{
 const w=loadWorld(), d=newGame(w), p=newGame(w,'cadiz',{npcCompetition:'planned'});
 assert.equal(d.ai.length,3);assert.equal(p.ai.length,48);assert.equal(p.regionalRivals,undefined);assert.equal(d.regionalRivals,true);
 assert.equal(new Set(p.ai.map(t=>t.ship.id)).size,48);
 assert.notDeepEqual(p.market,d.market);
 const r=deserialize(serialize(p,'Test'),w).g;
 assert.equal(r.ai.length,48);advanceDay(r);assert.equal(r.day,1);
 assert.ok(r.ai.every(t=>Number.isFinite(t.cash)&&t.cash>=0));
});
