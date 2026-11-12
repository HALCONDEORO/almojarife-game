import test from 'node:test';
import assert from 'node:assert/strict';
import {loadWorld} from '../src/sim/world.mjs';
import {newGame,setRouteAdv,doBuy,doSell,doSail} from '../src/game/game.mjs';
import {processRoutes} from '../src/game/routes.mjs';
import {shipCapacity} from '../src/sim/trade.mjs';
const world=loadWorld();
function setup(){const g=newGame(world,'cadiz',{embargo:false,freePlay:true});g.eventsOn=false;g.cash=50000;return {g,s:g.ships[0]};}

test('advanced stop sells its full hold before buying new goods',()=>{
 const {g,s}=setup();s.cargo={grain:shipCapacity(s)};
 assert.ok(setRouteAdv(g,s,[{city:s.at,sell:[{good:'grain'}],buy:[{good:'wine'}]},{city:'huelva'}]).ok);
 processRoutes(g,{doBuy,doSell,doSail});
 assert.equal(s.cargo.grain??0,0);assert.ok(s.cargo.wine>0,'sale must free capacity for this stop, not tomorrow');
 assert.deepEqual(s.route.log[0].entries.map(e=>e.action),['sell','buy']);
});

test('advanced buy-rule order allocates the last free cargo space first',()=>{
 for(const priority of [['grain','wine'],['wine','grain']]){
  const {g,s}=setup();s.cargo={salt:shipCapacity(s)-1};
  assert.ok(setRouteAdv(g,s,[{city:s.at,buy:priority.map(good=>({good}))},{city:'huelva'}]).ok);
  processRoutes(g,{doBuy,doSell,doSail});
  assert.equal(s.cargo[priority[0]],1,'first eligible good gets the final unit of capacity');
  assert.equal(s.cargo[priority[1]]??0,0,'lower priority good must not displace the first');
 }
});
