import test from 'node:test';import assert from 'node:assert/strict';
import {loadWorld} from '../src/sim/world.mjs';
import {newGame,advanceDay,buyWarehouse,warehouseCap,takeGoods,doSellStored,doSellCombined,sellRequestQty,previewSellCombinedPort,storeGoods} from '../src/game/game.mjs';
import {setStewardRule,stewardTick} from '../src/game/steward.mjs';
import {LOCK_TYPES,setWarehouseLock,whLockOf,whLocked} from '../src/game/whlock.mjs';
import {serialize,deserialize} from '../src/game/gamesave.mjs';
import {price} from '../src/sim/market.mjs';
const world=loadWorld();
const mk=()=>{const g=newGame(world);const s=g.ships[0];g.cash=100000;assert.ok(buyWarehouse(g,'cadiz').ok);return{g,s};};
const dear=(g,good='grain')=>{const e=g.market.cadiz[good];e.stock=1;return price(world,e,good);}; // clamp-high price
test('the named lock types are exactly one, with its documented name',()=>{
 assert.deepEqual(LOCK_TYPES,['outflow']);
});
test('validation: warehouse, good, type and the strict boolean rule',()=>{
 const{g}=mk();
 assert.equal(setWarehouseLock(g,'sevilla','grain','outflow',true).reason,'no warehouse here');
 assert.equal(setWarehouseLock(g,'cadiz','unobtainium','outflow',true).reason,'unknown good');
 assert.equal(setWarehouseLock(g,'cadiz','grain','sales',true).reason,'unknown lock type');
 for(const bad of [0,1,'true','',null,undefined]) assert.equal(setWarehouseLock(g,'cadiz','grain','outflow',bad).reason,'bad flag');
 g.over='lost';assert.equal(setWarehouseLock(g,'cadiz','grain','outflow',true).reason,'game over');
});
test('desired-state commands: idempotent set and clear, unrelated state preserved',()=>{
 const{g}=mk();const cap=warehouseCap(g,'cadiz');
 assert.ok(setStewardRule(g,'cadiz','grain',{sellAbove:40},cap).ok);
 assert.deepEqual(setWarehouseLock(g,'cadiz','grain','outflow',true),{ok:true,locked:true});
 assert.deepEqual(setWarehouseLock(g,'cadiz','grain','outflow',true),{ok:true,locked:true},'setting an already-set lock is applied again, not an error');
 assert.ok(whLocked(g.warehouses.cadiz,'grain'));
 assert.deepEqual(whLockOf(g,'cadiz','grain'),{outflow:true});
 assert.deepEqual(setWarehouseLock(g,'cadiz','wine','outflow',true).locked,true,'a second good locks independently');
 assert.deepEqual(setWarehouseLock(g,'cadiz','grain','outflow',false),{ok:true,locked:false});
 assert.ok(!whLocked(g.warehouses.cadiz,'grain'),'clearing one good leaves the other locked');
 assert.ok(whLocked(g.warehouses.cadiz,'wine'));
 assert.equal(g.warehouses.cadiz.admin.rules.grain.sellAbove,40,'the steward rule is untouched');
 assert.deepEqual(setWarehouseLock(g,'cadiz','grain','outflow',false),{ok:true,locked:false},'clearing an unset lock is applied, not an error');
 setWarehouseLock(g,'cadiz','wine','outflow',false);
 assert.equal(g.warehouses.cadiz.locks,undefined,'a lock-free warehouse saves like a fresh one');
});
test('a locked good is never sold by the standing order, but an unlocked one is',()=>{
 const{g}=mk();const cap=warehouseCap(g,'cadiz');
 const pw=dear(g,'wine');dear(g,'grain');
 g.warehouses.cadiz.goods.grain=30;g.warehouses.cadiz.goods.wine=10;
 assert.ok(setStewardRule(g,'cadiz','grain',{sellAbove:price(world,g.market.cadiz.grain,'grain')},cap).ok);
 assert.ok(setStewardRule(g,'cadiz','wine',{sellAbove:pw},cap).ok);
 assert.ok(setWarehouseLock(g,'cadiz','grain','outflow',true).ok);
 stewardTick(g,'cadiz',cap);
 assert.equal(g.warehouses.cadiz.goods.grain,30,'locked: no sale');
 assert.equal(g.warehouses.cadiz.goods.wine??0,0,'unlocked: sold out');
});
test('the lock holds through the real daily slot (advanceDay)',()=>{
 const{g}=mk();const cap=warehouseCap(g,'cadiz');
 dear(g,'grain');g.warehouses.cadiz.goods.grain=30;
 assert.ok(setStewardRule(g,'cadiz','grain',{sellAbove:price(world,g.market.cadiz.grain,'grain')},cap).ok);
 assert.ok(setWarehouseLock(g,'cadiz','grain','outflow',true).ok);
 advanceDay(g);
 assert.equal(g.warehouses.cadiz.goods.grain,30,'a day passed and nothing left the store');
});
test('the steward still BUYS a locked good: the lock only blocks outflow',()=>{
 const{g}=mk();const cap=warehouseCap(g,'cadiz');
 const e=g.market.cadiz.grain;e.stock=e.target*4;const p=price(world,e,'grain');
 assert.ok(setStewardRule(g,'cadiz','grain',{buyBelow:p,buyTo:20},cap).ok);
 assert.ok(setWarehouseLock(g,'cadiz','grain','outflow',true).ok);
 stewardTick(g,'cadiz',cap);
 assert.equal(g.warehouses.cadiz.goods.grain,20,'inflow stays open');
});
test('a locked good cannot be taken aboard or sold from the store',()=>{
 const{g,s}=mk();
 g.warehouses.cadiz.goods.grain=30;
 assert.ok(setWarehouseLock(g,'cadiz','grain','outflow',true).ok);
 assert.equal(takeGoods(g,s,'grain',10).reason,'locked');
 assert.equal(g.warehouses.cadiz.goods.grain,30);
 assert.equal(doSellStored(g,'cadiz','grain',10).reason,'locked');
 assert.equal(g.warehouses.cadiz.goods.grain,30);
 s.cargo.grain=5;
 const r=storeGoods(g,s,'grain',5);
 assert.ok(r.ok&&r.qty===5,'inflow stays open: storing into a locked store works');
 assert.equal(g.warehouses.cadiz.goods.grain,35);
});
test('a combined sale sells only the hold when the store stock is locked; previews agree',()=>{
 const{g,s}=mk();
 s.cargo.grain=8;g.warehouses.cadiz.goods.grain=30;
 assert.equal(sellRequestQty(g,s,'grain',100,g.warehouses.cadiz),38,'unlocked: hold plus store');
 const pv=previewSellCombinedPort(g,s,'grain',100,g.warehouses.cadiz);
 assert.equal(pv.qty,38);
 assert.ok(setWarehouseLock(g,'cadiz','grain','outflow',true).ok);
 assert.equal(sellRequestQty(g,s,'grain',100,g.warehouses.cadiz),8,'locked: the hold only');
 const pv2=previewSellCombinedPort(g,s,'grain',100,g.warehouses.cadiz);
 assert.equal(pv2.qty,8,'preview matches the locked execution');
 const r=doSellCombined(g,s,'grain',100,g.warehouses.cadiz);
 assert.ok(r.ok&&r.qty===8,'only the hold sold');
 assert.equal(s.cargo.grain??0,0);
 assert.equal(g.warehouses.cadiz.goods.grain,30,'the store stock never moved');
});
test('locks survive a save/load; an old save without locks loads clean',()=>{
 const{g}=mk();
 assert.ok(setWarehouseLock(g,'cadiz','grain','outflow',true).ok);
 const r=deserialize(serialize(g,'T'),world).g;
 assert.deepEqual(whLockOf(r,'cadiz','grain'),{outflow:true});
 const{g:g2}=mk();
 delete g2.warehouses.cadiz.locks; // an old save has none
 const r2=deserialize(serialize(g2,'T'),world).g;
 assert.equal(whLockOf(r2,'cadiz','grain'),null);
 assert.ok(!whLocked(r2.warehouses.cadiz,'grain'));
 assert.equal(takeGoods(r2,r2.ships[0],'grain',1).reason,'nothing to take','empty store still takes nothing, lock or no lock');
});
