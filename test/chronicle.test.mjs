import test from 'node:test';import assert from 'node:assert/strict';
import {loadWorld} from '../src/sim/world.mjs';
import {newGame,advanceDay,netWorth,START_CASH} from '../src/game/game.mjs';
import {chronicleWeek,chronicleTick,CHRON_MAX,YEAR_DAYS} from '../src/game/chronicle.mjs';
import {serialize,deserialize} from '../src/game/gamesave.mjs';
import {START_YEAR} from '../src/sim/clock.mjs';
const world=loadWorld();
const run=(g,n)=>{for(let i=0;i<n;i++)advanceDay(g);};
test('the open year folds each weekly settlement and starts from a snapshot',()=>{
 const g=newGame(world);
 run(g,14); // two settlements (days 7 and 14)
 const b=g.chronBook;
 assert.ok(b,'the book opens');
 assert.equal(b.year,START_YEAR);assert.equal(b.cash0,START_CASH);assert.equal(b.ships0,1);
 const rs=g.reports??[];assert.equal(rs.length,2);
 assert.equal(b.upkeep,Math.round((rs[0].upkeep+rs[1].upkeep)*100)/100,'upkeep matches the reports');
 assert.equal(b.trade,0,'no trade yet');
});
test('trade profit and the best good fold in from the weekly report',()=>{
 const g=newGame(world);
 chronicleWeek(g,{upkeep:10,tolls:2,interest:1,loanInterest:0.5,trades:[{good:'grain',sold:5,revenue:100,profit:40},{good:'wool',sold:2,revenue:50,profit:-10}]},{cash:0,worth:0,ships:1,rank:null});
 const b=g.chronBook;
 assert.equal(b.trade,30);assert.equal(b.goods.grain,40);assert.equal(b.goods.wool,-10);
 assert.equal(b.interest,1.5,'overdraft and loan interest add up');assert.equal(b.tolls,2);
 g.day=YEAR_DAYS; // New Year's Day
 const e=chronicleTick(g,{cash:1234,worth:5678,ships:2,rank:'merchant'});
 assert.equal(e.year,START_YEAR);assert.equal(e.trade,30);
 assert.deepEqual(e.bestGood,{good:'grain',profit:40},'the best good is the top profit line');
 assert.equal(e.cash1,1234);assert.equal(e.worth1,5678);assert.equal(e.ships0,1);assert.equal(e.ships1,2);assert.equal(e.rank1,'merchant');
 assert.equal(g.chronBook.year,START_YEAR+1,'a fresh book opens');
 assert.equal(g.chronBook.upkeep,0);
});
test('a full idle year closes on New Year\'s Day and the numbers match the reports',()=>{
 const g=newGame(world);
 run(g,YEAR_DAYS);
 assert.equal(g.chronicle.length,1,'one closed year');
 const e=g.chronicle[0];
 assert.equal(e.year,START_YEAR);
 const rs=(g.reports??[]).filter((r)=>r.day<=YEAR_DAYS-1);
 const up=Math.round(rs.reduce((a,r)=>a+r.upkeep,0)*100)/100;
 assert.equal(e.upkeep,up,'the chronicle agrees with the weekly reports');
 assert.equal(e.cash1,Math.round(g.cash*100)/100);
 assert.equal(e.worth1,Math.round(netWorth(g)*100)/100);
 assert.equal(g.chronBook.year,START_YEAR+1);
});
test('the chronicle survives a save/load and keeps only the newest years',()=>{
 const g=newGame(world);
 chronicleWeek(g,{upkeep:5,tolls:0,interest:0,loanInterest:0,trades:[]},{cash:START_CASH,worth:START_CASH,ships:1,rank:null});
 g.day=YEAR_DAYS;
 chronicleTick(g,{cash:100,worth:100,ships:1,rank:null});
 const r=deserialize(serialize(g,'T'),world).g;
 assert.deepEqual(r.chronicle,g.chronicle,'closed years survive');
 assert.deepEqual(r.chronBook,g.chronBook,'the open year survives');
 for(let i=0;i<CHRON_MAX+3;i++){r.day=(i+1)*YEAR_DAYS;chronicleTick(r,{cash:i,worth:i,ships:1,rank:null});}
 assert.ok(r.chronicle.length<=CHRON_MAX,'capped');
});
