// Free-play bankruptcy: seizure + debt write-off instead of endless compounding (campaign still loses).
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loadWorld} from '../src/sim/world.mjs';
import {newGame, advanceDay, resolveBankruptcy} from '../src/game/game.mjs';
import {OVERDRAFT_LIMIT} from '../src/game/ledger.mjs';
const world = loadWorld();

test('campaign: crossing the overdraft limit still loses the game',()=>{
 const g=newGame(world,'cadiz',{cash:-OVERDRAFT_LIMIT-2500}); // START_CASH 2000 + this = below -3000
 advanceDay(g);
 assert.equal(g.over,'lose');
 assert.equal(g.overReason,'bankrupt');
});

test('free play: bankruptcy seizes assets, writes off the debt and the game goes on',()=>{
 const g=newGame(world,'cadiz',{cash:-OVERDRAFT_LIMIT-2500,freePlay:true});
 g.buildings={cadiz:{'cadiz:1':{type:'workshop',level:1,state:'active',halted:true}}};
 g.warehouses={cadiz:{goods:{salt:5},basis:{salt:40}}};
 g.ships[0].cargo={cloth:10}; g.ships[0].basis={cloth:250};
 g.loans=[{id:1,left:1000}];
 advanceDay(g);
 assert.equal(g.over,null,'no game over in free play');
 assert.equal(g.bankruptcies,1);
 assert.ok(g.cash>=0,'debt written off, never below zero after the seizure');
 assert.equal(g.buildings.cadiz['cadiz:1'],undefined,'building seized');
 assert.equal(g.warehouses.cadiz.goods.salt,undefined,'warehouse stock seized');
 assert.equal(g.warehouses.cadiz.basis?.salt,undefined,'warehouse basis cleared too');
 assert.equal(g.ships[0].cargo.cloth,undefined,'cargo seized: the key is deleted, like after a real sale');
 assert.equal(g.ships[0].basis?.cloth,undefined,'and its cost basis goes with it (no orphan basis distorting later voyages)');
 assert.equal(g.loans.length,0,'loans written off');
 assert.equal((g.inbox??[]).filter((m)=>m.kind==='bankrupt').length,1,'bankruptcy message posted');
});

test('free play: no deadline and no goal',()=>{
 const g=newGame(world,'cadiz',{freePlay:true});
 g.cash=1000000;
 advanceDay(g);
 assert.equal(g.over,null,'rich is not a win in free play');
});

test('resolveBankruptcy keeps the ships and reports recovered/forgiven',()=>{
 const g=newGame(world,'cadiz',{cash:-OVERDRAFT_LIMIT-2500,freePlay:true});
 const shipsBefore=g.ships.length;
 resolveBankruptcy(g);
 assert.equal(g.ships.length,shipsBefore,'ships are not seized');
 const m=(g.inbox??[]).find((x)=>x.kind==='bankrupt');
 assert.ok(m&&m.forgiven>0,'the uncovered part is reported as forgiven');
});
