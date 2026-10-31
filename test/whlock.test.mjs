import test from 'node:test';import assert from 'node:assert/strict';
import {loadWorld} from '../src/sim/world.mjs';
import {newGame,advanceDay,buyWarehouse,warehouseCap,takeGoods,doSellStored,doSellCombined,sellRequestQty,previewSellCombinedPort,storeGoods} from '../src/game/game.mjs';
import {setStewardRule,stewardTick} from '../src/game/steward.mjs';
import {LOCK_TYPES,setWarehouseLock,whLockOf,whLocked} from '../src/game/whlock.mjs';
import {serialize,deserialize} from '../src/game/gamesave.mjs';
import {price} from '../src/sim/market.mjs';
import {quoteTowers,startTowers,TOWER_RECIPE} from '../src/game/towers.mjs';
import {buyOffice,buyPlot,quoteConstruction,startConstruction,BUILDING_TYPES} from '../src/game/buildings.mjs';
import {RECIPES} from '../src/sim/recipes.mjs';
const world=loadWorld();
const mk=()=>{const game=newGame(world);const ship=game.ships[0];game.cash=100000;assert.ok(buyWarehouse(game,'cadiz').ok);return{game,ship};};
const dear=(game,good='grain')=>{const entry=game.market.cadiz[good];entry.stock=1;return price(world,entry,good);}; // clamp-high price
test('the named lock types are exactly one, with its documented name',()=>{
 assert.deepEqual(LOCK_TYPES,['outflow']);
});
test('validation: warehouse, good, type and the strict boolean rule',()=>{
 const{game}=mk();
 assert.equal(setWarehouseLock(game,'sevilla','grain','outflow',true).reason,'no warehouse here');
 assert.equal(setWarehouseLock(game,'cadiz','unobtainium','outflow',true).reason,'unknown good');
 assert.equal(setWarehouseLock(game,'cadiz','grain','sales',true).reason,'unknown lock type');
 for(const bad of [0,1,'true','',null,undefined]) assert.equal(setWarehouseLock(game,'cadiz','grain','outflow',bad).reason,'bad flag');
 game.over='lost';assert.equal(setWarehouseLock(game,'cadiz','grain','outflow',true).reason,'game over');
});
test('desired-state commands: idempotent set and clear, unrelated state preserved',()=>{
 const{game}=mk();const cap=warehouseCap(game,'cadiz');
 assert.ok(setStewardRule(game,'cadiz','grain',{sellAbove:40},cap).ok);
 assert.deepEqual(setWarehouseLock(game,'cadiz','grain','outflow',true),{ok:true,locked:true});
 assert.deepEqual(setWarehouseLock(game,'cadiz','grain','outflow',true),{ok:true,locked:true},'setting an already-set lock is applied again, not an error');
 assert.ok(whLocked(game.warehouses.cadiz,'grain'));
 assert.deepEqual(whLockOf(game,'cadiz','grain'),{outflow:true});
 assert.deepEqual(setWarehouseLock(game,'cadiz','wine','outflow',true).locked,true,'a second good locks independently');
 assert.deepEqual(setWarehouseLock(game,'cadiz','grain','outflow',false),{ok:true,locked:false});
 assert.ok(!whLocked(game.warehouses.cadiz,'grain'),'clearing one good leaves the other locked');
 assert.ok(whLocked(game.warehouses.cadiz,'wine'));
 assert.equal(game.warehouses.cadiz.admin.rules.grain.sellAbove,40,'the steward rule is untouched');
 assert.deepEqual(setWarehouseLock(game,'cadiz','grain','outflow',false),{ok:true,locked:false},'clearing an unset lock is applied, not an error');
 setWarehouseLock(game,'cadiz','wine','outflow',false);
 assert.equal(game.warehouses.cadiz.locks,undefined,'a lock-free warehouse saves like a fresh one');
});
test('a locked good is never sold by the standing order, but an unlocked one is',()=>{
 const{game}=mk();const cap=warehouseCap(game,'cadiz');
 const pw=dear(game,'wine');dear(game,'grain');
 game.warehouses.cadiz.goods.grain=30;game.warehouses.cadiz.goods.wine=10;
 assert.ok(setStewardRule(game,'cadiz','grain',{sellAbove:price(world,game.market.cadiz.grain,'grain')},cap).ok);
 assert.ok(setStewardRule(game,'cadiz','wine',{sellAbove:pw},cap).ok);
 assert.ok(setWarehouseLock(game,'cadiz','grain','outflow',true).ok);
 stewardTick(game,'cadiz',cap);
 assert.equal(game.warehouses.cadiz.goods.grain,30,'locked: no sale');
 assert.equal(game.warehouses.cadiz.goods.wine??0,0,'unlocked: sold out');
});
test('the lock holds through the real daily slot (advanceDay)',()=>{
 const{game}=mk();const cap=warehouseCap(game,'cadiz');
 dear(game,'grain');game.warehouses.cadiz.goods.grain=30;
 assert.ok(setStewardRule(game,'cadiz','grain',{sellAbove:price(world,game.market.cadiz.grain,'grain')},cap).ok);
 assert.ok(setWarehouseLock(game,'cadiz','grain','outflow',true).ok);
 advanceDay(game);
 assert.equal(game.warehouses.cadiz.goods.grain,30,'a day passed and nothing left the store');
});
test('the steward still BUYS a locked good: the lock only blocks outflow',()=>{
 const{game}=mk();const cap=warehouseCap(game,'cadiz');
 const entry=game.market.cadiz.grain;entry.stock=entry.target*4;const prc=price(world,entry,'grain');
 assert.ok(setStewardRule(game,'cadiz','grain',{buyBelow:prc,buyTo:20},cap).ok);
 assert.ok(setWarehouseLock(game,'cadiz','grain','outflow',true).ok);
 stewardTick(game,'cadiz',cap);
 assert.equal(game.warehouses.cadiz.goods.grain,20,'inflow stays open');
});
test('a locked good cannot be taken aboard or sold from the store',()=>{
 const{game,ship}=mk();
 game.warehouses.cadiz.goods.grain=30;
 assert.ok(setWarehouseLock(game,'cadiz','grain','outflow',true).ok);
 assert.equal(takeGoods(game,ship,'grain',10).reason,'locked');
 assert.equal(game.warehouses.cadiz.goods.grain,30);
 assert.equal(doSellStored(game,'cadiz','grain',10).reason,'locked');
 assert.equal(game.warehouses.cadiz.goods.grain,30);
 ship.cargo.grain=5;
 const res=storeGoods(game,ship,'grain',5);
 assert.ok(res.ok&&res.qty===5,'inflow stays open: storing into a locked store works');
 assert.equal(game.warehouses.cadiz.goods.grain,35);
});
test('a combined sale sells only the hold when the store stock is locked; previews agree',()=>{
 const{game,ship}=mk();
 ship.cargo.grain=8;game.warehouses.cadiz.goods.grain=30;
 assert.equal(sellRequestQty(game,ship,'grain',100,game.warehouses.cadiz),38,'unlocked: hold plus store');
 const pv=previewSellCombinedPort(game,ship,'grain',100,game.warehouses.cadiz);
 assert.equal(pv.qty,38);
 assert.ok(setWarehouseLock(game,'cadiz','grain','outflow',true).ok);
 assert.equal(sellRequestQty(game,ship,'grain',100,game.warehouses.cadiz),8,'locked: the hold only');
 const pv2=previewSellCombinedPort(game,ship,'grain',100,game.warehouses.cadiz);
 assert.equal(pv2.qty,8,'preview matches the locked execution');
 const res=doSellCombined(game,ship,'grain',100,game.warehouses.cadiz);
 assert.ok(res.ok&&res.qty===8,'only the hold sold');
 assert.equal(ship.cargo.grain??0,0);
 assert.equal(game.warehouses.cadiz.goods.grain,30,'the store stock never moved');
});
test('locks survive a save/load; an old save without locks loads clean',()=>{
 const{game}=mk();
 assert.ok(setWarehouseLock(game,'cadiz','grain','outflow',true).ok);
 const res=deserialize(serialize(game,'T'),world).g;
 assert.deepEqual(whLockOf(res,'cadiz','grain'),{outflow:true});
 const{game:g2}=mk();
 delete g2.warehouses.cadiz.locks; // an old save has none
 const r2=deserialize(serialize(g2,'T'),world).g;
 assert.equal(whLockOf(r2,'cadiz','grain'),null);
 assert.ok(!whLocked(r2.warehouses.cadiz,'grain'));
 assert.equal(takeGoods(r2,r2.ships[0],'grain',1).reason,'nothing to take','empty store still takes nothing, lock or no lock');
});

test('towers never draw a locked good: quote and execution agree, the market covers it',()=>{
 const game=newGame(world,'cadiz',{freePlay:true,seed:7});
 (game.rep??={}).cadiz=100;game.cash=1e6;buyOffice(game,'cadiz');
 game.walls.cadiz={level:1,state:'active'};
 assert.ok(buyWarehouse(game,'cadiz').ok);
 const wh=game.warehouses.cadiz;
 for(const gd of Object.keys(TOWER_RECIPE)){wh.goods[gd]=100;game.market.cadiz[gd].stock=game.market.cadiz[gd].target*4;}
 assert.ok(setWarehouseLock(game,'cadiz','timber','outflow',true).ok);
 const qt=quoteTowers(game,'cadiz');
 assert.ok(qt.ok);
 assert.equal(qt.fromStore.timber,0,'locked timber stays');
 assert.equal(qt.missing.timber,TOWER_RECIPE.timber,'the market covers it');
 assert.equal(qt.fromStore.bricks,TOWER_RECIPE.bricks,'unlocked goods still come from the store');
 const res=startTowers(game,'cadiz');
 assert.ok(res.ok);
 assert.equal(wh.goods.timber,100,'locked stock untouched by the works');
 assert.equal(wh.goods.bricks,100-TOWER_RECIPE.bricks);
 assert.equal(wh.goods.ironware,100-TOWER_RECIPE.ironware);
});
test('construction never draws a locked good: quote and execution agree',()=>{
 const game=newGame(world,'cadiz',{cash:100000});
 buyOffice(game,'cadiz');
 assert.ok(buyWarehouse(game,'cadiz').ok);
 const plot={id:'cadiz:7',type:'warehouse',w:4,d:4};
 assert.ok(buyPlot(game,'cadiz',plot).ok);
 const recipe=RECIPES[BUILDING_TYPES.warehouse.recipe];
 const wh=game.warehouses.cadiz;
 for(const gd of Object.keys(recipe)){wh.goods[gd]=100;game.market.cadiz[gd].stock=game.market.cadiz[gd].target*4;}
 assert.ok(setWarehouseLock(game,'cadiz','bricks','outflow',true).ok);
 const qt=quoteConstruction(game,'cadiz','cadiz:7','warehouse');
 assert.ok(qt.ok);
 assert.equal(qt.fromStore.bricks,0,'locked bricks stay');
 assert.equal(qt.missing.bricks,recipe.bricks,'the market covers them');
 const res=startConstruction(game,'cadiz','cadiz:7','warehouse');
 assert.ok(res.ok);
 assert.equal(wh.goods.bricks,100,'locked stock untouched by the works');
 assert.equal(wh.goods.timber,100-recipe.timber,'unlocked goods still feed the works');
});
