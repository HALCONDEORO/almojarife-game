// Information contracts for the market redesign. No UI layout or new game rules.
import test from 'node:test';
import assert from 'node:assert/strict';
import {loadWorld} from '../src/sim/world.mjs';
import {newGame,doBuy,doSell,bestPorts,feeMul} from '../src/game/game.mjs';
import {previewBuy,previewSell,shipCapacity,cargoUsed,FEE} from '../src/sim/trade.mjs';
const world=loadWorld();
const setup=()=>{const g=newGame(world,'cadiz',{freePlay:true});return {g,s:g.ships[0]};};
test('bestPorts prices a known destination using its own fee, not the ship object',()=>{
 const {g,s}=setup();s.cargo={silk:10};s.basis={silk:100};
 g.portRep={cadiz:0,lisboa:100};
 g.intel.lisboa={day:g.day,exact:true,cells:structuredClone(g.market.lisboa)};
 assert.notEqual(feeMul(g,'cadiz'),feeMul(g,'lisboa'));
 const expected=previewSell(g.world,{lisboa:g.intel.lisboa.cells},{...s,at:'lisboa',voyage:null},'silk',10,FEE*feeMul(g,'lisboa'));
 const row=bestPorts(g,s).find(x=>x.city==='lisboa');
 assert.ok(row);assert.equal(row.revenue,expected.revenue);assert.equal(row.profit,expected.profit);
 assert.equal(row.age,0);assert.equal(row.exact,true);
});
test('buy preview quantity and total match a cash-limited executed purchase',()=>{
 const {g,s}=setup();g.cash=30;
 const p=previewBuy(g.world,g.market,s,g.cash,'fish',10,FEE*feeMul(g,s.at));
 assert.ok(p.qty>0&&p.qty<10);assert.equal(p.limit,'cash');
 const cash=g.cash,r=doBuy(g,s,'fish',10);
 assert.equal(r.ok,true);assert.equal(r.qty,p.qty);assert.equal(r.cost,p.cost);assert.equal(g.cash,cash-p.cost);
});
test('available cargo room subtracts mounted weapon weight, not only cargo',()=>{
 const {g,s}=setup();s.cannons=3;s.cargo={fish:49};
 assert.equal(shipCapacity(s),51);assert.equal(cargoUsed(s),49);
 const p=previewBuy(g.world,g.market,s,g.cash,'fish',10,FEE*feeMul(g,s.at));
 assert.equal(p.qty,2);assert.equal(p.limit,'room');
 const r=doBuy(g,s,'fish',10);assert.equal(r.qty,2);assert.equal(cargoUsed(s),shipCapacity(s));
});
test('transaction previews are not authorization: a closed port gives the action reason',()=>{
 const {g,s}=setup();g.shocks=[{id:'contract-fixture',type:'port_closed',city:'cadiz',fromDay:g.day,untilDay:g.day+3}];
 s.cargo={fish:5};s.basis={fish:50};
 assert.ok(previewBuy(g.world,g.market,s,g.cash,'fish',1).qty>0);
 assert.ok(previewSell(g.world,g.market,s,'fish',1).qty>0);
 const before=JSON.stringify({cash:g.cash,cargo:s.cargo,market:g.market});
 assert.deepEqual(doBuy(g,s,'fish',1),{ok:false,reason:'port closed'});
 assert.deepEqual(doSell(g,s,'fish',1),{ok:false,reason:'port closed'});
 assert.equal(JSON.stringify({cash:g.cash,cargo:s.cargo,market:g.market}),before);
});
test('warehouse goods are not cargo available for a direct ship sale',()=>{
 const {g,s}=setup();g.warehouses.cadiz={goods:{fish:20}};
 assert.equal(previewSell(g.world,g.market,s,'fish',10).qty,0);
 assert.equal(doSell(g,s,'fish',10).reason,'nothing to sell');
 assert.equal(g.warehouses.cadiz.goods.fish,20);
});
