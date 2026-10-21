import test from 'node:test';import assert from 'node:assert/strict';
import {loadWorld} from '../src/sim/world.mjs';
import {newGame,advanceDay,buyWarehouse,warehouseCap,WAREHOUSE_PRICE} from '../src/game/game.mjs';
import {setStewardRule,clearStewardRule,setStewardReserve,stewardOf,stewardTick} from '../src/game/steward.mjs';
import {FEE} from '../src/sim/trade.mjs';
import {price} from '../src/sim/market.mjs';
import {serialize,deserialize} from '../src/game/gamesave.mjs';
import {repOf} from '../src/game/rank.mjs';
import {openVoyage,voyageLog} from '../src/game/voyages.mjs';
const world=loadWorld();
const mk=()=>{const g=newGame(world);const s=g.ships[0];g.cash=100000;assert.ok(buyWarehouse(g,'cadiz').ok);return{g,s};};
const cheap=(g,good='grain')=>{const e=g.market.cadiz[good];e.stock=e.target*4;return price(world,e,good);}; // clamp-low price
const dear=(g,good='grain')=>{const e=g.market.cadiz[good];e.stock=1;return price(world,e,good);}; // clamp-high price
test('rule validation: warehouse, numbers, capacity and the no-churn ladder',()=>{
 const{g}=mk();const cap=warehouseCap(g,'cadiz');
 assert.equal(setStewardRule(g,'sevilla','grain',{}).reason,'no warehouse here');
 assert.equal(setStewardRule(g,'cadiz','unobtainium',{}).reason,'unknown good');
 assert.equal(setStewardRule(g,'cadiz','grain',{buyBelow:-1}).reason,'bad number');
 assert.equal(setStewardRule(g,'cadiz','grain',{buyBelow:10}).reason,'buy needs a stock target');
 assert.equal(setStewardRule(g,'cadiz','grain',{buyBelow:10,buyTo:cap+1},cap).reason,'target above warehouse capacity');
 assert.equal(setStewardRule(g,'cadiz','grain',{buyBelow:10,buyTo:5,sellAbove:10},cap).reason,'buy cap must stay below sell floor');
 assert.ok(setStewardRule(g,'cadiz','grain',{buyBelow:10,buyTo:5,sellAbove:11},cap).ok);
 assert.ok(clearStewardRule(g,'cadiz','grain').ok);assert.equal(clearStewardRule(g,'cadiz','grain').ok,false);
});
test('buys when the price is at or below the cap, up to the stock target, paying the fee',()=>{
 const{g}=mk();const p=cheap(g);
 assert.ok(setStewardRule(g,'cadiz','grain',{buyBelow:p,buyTo:20},999).ok);
 const cash=g.cash,did=stewardTick(g,'cadiz',warehouseCap(g,'cadiz'));
 const w=g.warehouses.cadiz;
 assert.equal(w.goods.grain,20);assert.ok(did[0].bought===20);
 assert.ok(g.cash<cash&&cash-g.cash>=20*p,'paid at least base price');
 assert.ok(w.basis.grain>0);
 const did2=stewardTick(g,'cadiz',warehouseCap(g,'cadiz'));
 assert.equal(did2,null,'target reached: nothing more to do');
});
test('no buy above the price cap, and the reserve is never spent',()=>{
 const{g}=mk();const p=cheap(g);
 assert.ok(setStewardRule(g,'cadiz','grain',{buyBelow:p-1,buyTo:20},999).ok);
 assert.equal(stewardTick(g,'cadiz',999),null,'price above the cap: no trade');
 setStewardRule(g,'cadiz','grain',{buyBelow:p,buyTo:50},999);
 const reserve=g.cash-50; // leave only 50 coins of room to spend
 setStewardReserve(g,'cadiz',reserve);
 stewardTick(g,'cadiz',999);
 assert.ok(g.cash>=reserve,'reserve intact');
 assert.ok((g.warehouses.cadiz.goods.grain??0)<50,'spent only what the reserve left');
 assert.ok((g.warehouses.cadiz.goods.grain??0)>0,'and it did buy with the little it had');
});
test('the warehouse cap bounds automatic buying',()=>{
 const{g}=mk();cheap(g);const cap=warehouseCap(g,'cadiz');
 g.warehouses.cadiz.goods.salt=cap-3; // almost full
 assert.ok(setStewardRule(g,'cadiz','grain',{buyBelow:999,buyTo:20},cap).ok);
 stewardTick(g,'cadiz',cap);
 assert.equal(g.warehouses.cadiz.goods.grain,3,'only the free room');
});
test('sells when the price is at or above the floor, keeping the chosen stock',()=>{
 const{g}=mk();const p=dear(g);
 g.warehouses.cadiz.goods.grain=30;g.warehouses.cadiz.basis={grain:300};
 assert.ok(setStewardRule(g,'cadiz','grain',{sellAbove:p,sellKeep:5},999).ok);
 const cash=g.cash,did=stewardTick(g,'cadiz',999);
 assert.equal(g.warehouses.cadiz.goods.grain,5,'kept the chosen stock');
 assert.ok(did[0].sold===25);assert.ok(g.cash>cash);
 assert.equal(stewardTick(g,'cadiz',999),null,'nothing left above the keep');
});
test('no sell below the price floor',()=>{
 const{g}=mk();const p=dear(g);
 g.warehouses.cadiz.goods.grain=30;
 assert.ok(setStewardRule(g,'cadiz','grain',{sellAbove:p+1},999).ok);
 assert.equal(stewardTick(g,'cadiz',999),null);assert.equal(g.warehouses.cadiz.goods.grain,30);
});
test('runs by itself on the market slot through advanceDay and posts to Reports',()=>{
 const{g}=mk();cheap(g);
 assert.ok(setStewardRule(g,'cadiz','grain',{buyBelow:price(world,g.market.cadiz.grain,'grain'),buyTo:10},999).ok);
 advanceDay(g);
 assert.ok((g.warehouses.cadiz.goods.grain??0)>0,'bought without a click');
 assert.ok((g.inbox??[]).some((m)=>m.kind==='steward'),'a report was posted');
});
test('a closed port (shocks state, duck-typed) pauses the steward',()=>{
 const{g}=mk();cheap(g);
 assert.ok(setStewardRule(g,'cadiz','grain',{buyBelow:999,buyTo:10},999).ok);
 g.shocks=[{type:'port_closed',city:'cadiz',untilDay:g.day+2}];
 assert.equal(stewardTick(g,'cadiz',999),null);
 assert.equal(g.warehouses.cadiz.goods.grain??0,0);
});
test('rules and reserve survive a save/load',()=>{
 const{g}=mk();setStewardReserve(g,'cadiz',500);
 setStewardRule(g,'cadiz','grain',{buyBelow:10,buyTo:20,sellAbove:40,sellKeep:2},999);
 const r=deserialize(serialize(g,'T'),world).g;
 assert.deepEqual(stewardOf(r,'cadiz'),stewardOf(g,'cadiz'));
});
test('automatic trades move the market like manual ones',()=>{
 const{g}=mk();const e=g.market.cadiz.grain;e.stock=e.target*4;
 setStewardRule(g,'cadiz','grain',{buyBelow:999,buyTo:15},999);
 const stock0=e.stock;stewardTick(g,'cadiz',999);
 assert.equal(e.stock,stock0-15,'stock left the market');
});

test('steward trade notices use localized good and city names',()=>{
 const{g}=mk();const p0=cheap(g);
 assert.ok(setStewardRule(g,'cadiz','grain',{buyBelow:p0,buyTo:5},999).ok);
 stewardTick(g,'cadiz',warehouseCap(g,'cadiz'));
 const line=(g.inbox??[]).find((l)=>l.kind==='steward');
 assert.ok(line,'ledger line'); assert.match(line.txt.es,/trigo/); assert.match(line.txt.es,/Cádiz/); assert.match(line.txt.en,/grain in Cádiz/);
});

test('the buy fills up to the market stock even when stock < 2 * target',()=>{
 const{g}=mk();
 g.market.cadiz.grain.stock=6; // less than the target and less than 2x it: the shrinking-stock bug bought only half
 const p6=price(world,g.market.cadiz.grain,'grain');
 assert.ok(setStewardRule(g,'cadiz','grain',{buyBelow:p6,buyTo:10},999).ok);
 stewardTick(g,'cadiz',warehouseCap(g,'cadiz'));
 assert.equal(g.warehouses.cadiz.goods.grain,6,'bought every available unit');
 assert.equal(g.market.cadiz.grain.stock,0);
});
test('steward trades move port reputation like manual trades',async()=>{
 const{portRep}=await import('../src/game/reputation.mjs');
 const{g}=mk();
 // Selling into a shortage earns reputation through the standing order too.
 dear(g,'grain'); // stock=1: critically short
 const w=g.warehouses.cadiz;w.goods.grain=10;w.basis={grain:100};
 const sellP=price(world,{...g.market.cadiz.grain,stock:2},'grain');
 assert.ok(setStewardRule(g,'cadiz','grain',{sellAbove:1,sellKeep:0},999).ok);
 const did=stewardTick(g,'cadiz',999);
 assert.ok(did?.[0]?.sold>0,'the order sold into the shortage');
 assert.ok(portRep(g,'cadiz')>0,'selling what the port lacks earned reputation');
 // Buying what is already scarce costs reputation through the standing order too.
 const{g:g2}=mk();dear(g2,'grain');
 const p2=price(world,g2.market.cadiz.grain,'grain');
 assert.ok(setStewardRule(g2,'cadiz','grain',{buyBelow:p2,buyTo:1},999).ok);
 const did2=stewardTick(g2,'cadiz',999);
 assert.ok(did2?.[0]?.bought>0,'the order bought');
 assert.ok(portRep(g2,'cadiz')<0,'buying a scarce good cost reputation');
});
test('steward sales earn respect like manual trades, and count for the docked ship\'s voyage',()=>{
 const{g,s}=mk();
 const w=g.warehouses.cadiz;w.goods={grain:50};w.basis={grain:500}; // 10 per unit of cost basis
 const p=dear(g);assert.ok(p>10,'dear market beats the basis');
 assert.ok(setStewardRule(g,'cadiz','grain',{sellAbove:p-1,sellKeep:0},999).ok);
 openVoyage(g,s,'lisboa','cadiz'); // the ship that brought the goods is docked here
 const before=repOf(g,'cadiz');
 const did=stewardTick(g,'cadiz',warehouseCap(g,'cadiz'));
 assert.ok(did?.[0]?.sold>0,'the sale happened');
 assert.ok(repOf(g,'cadiz')>before,'respect rose with the sale revenue, as in doSell');
 const v=voyageLog(g,s.id)[0];
 assert.ok(v&&v.sold===did[0].sold&&v.revenue===did[0].revenue,'the sale counts for the docked ship\'s voyage');
 assert.equal(v.profit,did[0].revenue-Math.round(500*did[0].sold/50),'with its cost-basis profit');
});
test('steward sale with no ship in port still works: respect rises, no voyage entry',()=>{
 const{g}=mk();g.ships=[]; // nobody docked
 const w=g.warehouses.cadiz;w.goods={grain:20};w.basis={grain:200};
 const p=dear(g);
 assert.ok(setStewardRule(g,'cadiz','grain',{sellAbove:p-1,sellKeep:0},999).ok);
 const did=stewardTick(g,'cadiz',warehouseCap(g,'cadiz'));
 assert.ok(did?.[0]?.sold>0,'sale fine without any ship');
 assert.deepEqual(g.voyages??[],[],'and nothing recorded');
});
