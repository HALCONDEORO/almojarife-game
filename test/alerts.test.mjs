import test from 'node:test';import assert from 'node:assert/strict';
import {loadWorld} from '../src/sim/world.mjs';
import {newGame,advanceDay,quote} from '../src/game/game.mjs';
import {setPriceAlert,clearPriceAlert,tickAlerts,alertsOf,ALERT_MAX} from '../src/game/alerts.mjs';
import {price} from '../src/sim/market.mjs';
import {serialize,deserialize} from '../src/game/gamesave.mjs';
const world=loadWorld();
const mk=()=>newGame(world);
test('setting validates and one alert per good and port replaces, never stacks',()=>{
 const g=mk();
 assert.equal(setPriceAlert(g,'cadiz','unobtainium','below',5).reason,'unknown good');
 assert.equal(setPriceAlert(g,'nowhere','grain','below',5).reason,'unknown port');
 assert.equal(setPriceAlert(g,'cadiz','grain','sideways',5).reason,'bad direction');
 assert.equal(setPriceAlert(g,'cadiz','grain','below',-3).reason,'bad price');
 assert.ok(setPriceAlert(g,'cadiz','grain','below',5).ok);
 assert.ok(setPriceAlert(g,'cadiz','grain','above',9).ok,'replacing is fine');
 assert.equal(alertsOf(g,'cadiz').length,1);assert.equal(alertsOf(g,'cadiz')[0].dir,'above');
 for(let i=0;i<ALERT_MAX;i++){const good=Object.keys(world.goods)[i%12];assert.ok(setPriceAlert(g,'lisboa',good,'below',1).ok||alertsOf(g).length<=ALERT_MAX);}
 assert.ok(alertsOf(g).length<=ALERT_MAX);
 assert.equal(setPriceAlert(g,'faro','grain','below',2).reason,alertsOf(g).length>=ALERT_MAX?'too many alerts':undefined);
 assert.ok(clearPriceAlert(g,'cadiz','grain').ok);assert.equal(clearPriceAlert(g,'cadiz','grain').reason,'no alert');
});
test('an alert fires once on the boundary and is spent; the other side stays quiet',()=>{
 const g=mk();const e=g.market.cadiz.grain;
 e.stock=1;const hi=price(world,e,'grain'); // scarce: dear
 assert.ok(setPriceAlert(g,'cadiz','grain','above',hi).ok);
 const f=tickAlerts(g);assert.equal(f.length,1,'fires at the boundary (>=)');assert.equal(f[0].now,hi);
 assert.equal(alertsOf(g,'cadiz').length,0,'spent');assert.equal(tickAlerts(g).length,0,'not twice');
 e.stock=e.target*4;const lo=price(world,e,'grain');
 assert.ok(setPriceAlert(g,'cadiz','grain','below',lo-1).ok);
 assert.equal(tickAlerts(g).length,0,'above the mark: quiet');
 assert.ok(setPriceAlert(g,'cadiz','grain','below',lo).ok);
 assert.equal(tickAlerts(g).length,1,'fires at the boundary (<=)');
 assert.ok((g.inbox??[]).some((m)=>m.kind==='alert'&&/bajó|fell/.test(m.txt.es+m.txt.en)),'the message was posted');
});
test('alerts survive a save/load and fire through advanceDay on the real market',()=>{
 const g=mk();const e=g.market.cadiz.grain;e.stock=1;const hi=price(world,e,'grain');
 assert.ok(setPriceAlert(g,'cadiz','grain','above',hi).ok);
 const r=deserialize(serialize(g,'T'),world).g;
 assert.deepEqual(alertsOf(r,'cadiz'),alertsOf(g,'cadiz'),'alerts survive the save');
 advanceDay(r); // grain at stock 1 stays far above the mark: the alert must fire on the day boundary
 assert.equal(alertsOf(r,'cadiz').length,0,'fired through the day work');
 assert.ok((r.inbox??[]).some((m)=>m.kind==='alert'));
});
