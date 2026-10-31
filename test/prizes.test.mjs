import test from 'node:test';import assert from 'node:assert/strict';
import {loadWorld} from '../src/sim/world.mjs';
import {newGame,doSail,advanceDay,sellShip,shipValue,SELL_RATE,PRIZE_SELL_RATE} from '../src/game/game.mjs';
import {resolvePirates,claimPrize,prizeFor,PRIZE_HULL_MIN,PRIZE_HULL_SPAN} from '../src/game/encounterdaily.mjs';
import {encounterDialogHtml} from '../src/view/encounterview.mjs';
import {serialize,deserialize} from '../src/game/gamesave.mjs';
import {SHIP_TYPES} from '../src/sim/trade.mjs';
const world=loadWorld();
/** A game whose pirate choice ends with the wanted result (scanning encounter ids keeps the roll honest). */
function fight(resultWanted){
 const choice=resultWanted==='escaped'?'flee':'fight';
 for(let i=1;i<200;i++){
  const g=newGame(world,'cadiz',{pirateFight:false});g.eventsOn=true;g.seed=0; // OFF contract: this harness asserts the classic seeded prizeFor path (the ON battle prize is covered in battle.test.mjs)
  const s=g.ships[0];doSail(g,s,'barcelona');
  g.pending={event:'sea-pirates',ship:s.id,day:g.day,hour:0,id:`t:${i}`,escapeChance:50};
  const e=resolvePirates(g,choice);
  if(e.ok!==false&&e.result===resultWanted){g.eventsOn=false;return{g,s,e};} // quiet voyage for the rest of the test
 }
 throw new Error('no roll found for '+resultWanted);
}
/** Advance until the ship is docked. */
function arrive(g,s){let n=0;while(s.voyage&&n++<400)advanceDay(g);assert.ok(!s.voyage,'arrived');}
test('a won fight offers a seeded prize; escaped and raided offer none',()=>{
 const w=fight('repelled');
 assert.ok(w.e.prize);assert.ok(['barca','cog','caravel'].includes(w.e.prize.type));
 assert.ok(w.e.prize.hull>=PRIZE_HULL_MIN&&w.e.prize.hull<PRIZE_HULL_MIN+PRIZE_HULL_SPAN);
 assert.deepEqual(prizeFor(w.g,w.e.id),w.e.prize,'offer is reproducible from seed and id');
 assert.equal(fight('escaped').e.prize,undefined);
 assert.equal(fight('raided').e.prize,undefined);
});
test('keeping the prize adds a crewless ship that keeps station and arrives with the winner',()=>{
 const{g,s,e}=fight('repelled');
 const before=g.ships.length,result=claimPrize(g,true);
 assert.ok(result.ok);assert.equal(g.ships.length,before+1);assert.equal(g.encounterReport,null);
 const prize=result.ship;assert.equal(prize.type,e.prize.type);assert.equal(prize.hull,e.prize.hull);assert.equal(prize.prize,true);assert.equal(prize.crew,0);
 // DECLARED (hull-wear rebalance 26/10): the pair carries escort markers (escorted / escortedBy) so
 // hull drag leaves them in station; everything else about the shared voyage is identical.
 const{escorted,...pv}=prize.voyage,{escortedBy,...wv}=s.voyage;
 assert.deepEqual(pv,wv,'same voyage as the winner');
 assert.equal(escorted,true);assert.equal(escortedBy,prize.id,'escort markers on the pair');
 assert.equal(claimPrize(g,true).ok,false,'once per encounter');
 arrive(g,s);
 assert.ok(!prize.voyage&&prize.at===s.at,'both arrived at the destination');
 assert.equal(doSail(g,prize,'cadiz').reason,'crew','a crewless prize cannot sail again');
});
test('a kept prize registers once and the escort binding dies with the shared voyage',()=>{
 const{g,s}=fight('repelled');
 const before=g.ships.length,claim=claimPrize(g,true);
 assert.ok(claim.ok);
 assert.equal(claimPrize(g,true).ok,false,'replay registers nothing');
 assert.equal(claimPrize(g,false).ok,false,'the report is already closed');
 assert.equal(g.ships.length,before+1,'the fleet grew exactly once');
 const loaded=deserialize(serialize(g,'T'),world).g,saved=JSON.stringify(loaded);
 assert.equal(claimPrize(loaded,true).ok,false,'reload cannot reopen the claimed report');
 assert.equal(JSON.stringify(loaded),saved,'rejected replay after reload writes nothing');
 const prize=claim.ship;
 assert.equal(prize.voyage?.escorted,true);assert.equal(s.voyage?.escortedBy,prize.id,'mutual binding while the voyage lives');
 arrive(g,s);
 assert.equal(s.voyage,null);assert.equal(prize.voyage,null,'both voyage records close on arrival, markers with them');
 assert.ok(doSail(g,s,'cadiz').ok);
 assert.equal(Object.hasOwn(s.voyage,'escorted'),false);assert.equal(Object.hasOwn(s.voyage,'escortedBy'),false,'a fresh voyage carries no stale binding');
});
test('leaving the prize adds nothing and closes the report',()=>{
 const{g}=fight('repelled');const before=g.ships.length;
 const result=claimPrize(g,false);assert.ok(result.ok);assert.equal(g.ships.length,before);assert.equal(g.encounterReport,null);
});
test('a prize resells at the lower prize rate; a normal ship keeps the standard rate',()=>{
 const{g,s,e}=fight('repelled');const result=claimPrize(g,true);arrive(g,s);
 const prize=result.ship;
 assert.equal(shipValue(prize),Math.round(SHIP_TYPES[e.prize.type].price*PRIZE_SELL_RATE*(0.5+0.5*prize.hull/100)));
 assert.equal(shipValue(s),Math.round(SHIP_TYPES[s.type].price*SELL_RATE*(0.5+0.5*s.hull/100)),'standard ship unchanged');
 const cash=g.cash,v=shipValue(prize),sale=sellShip(g,prize);
 assert.ok(sale.ok,sale.reason);assert.equal(sale.value,v);assert.equal(Math.round(g.cash),Math.round(cash+v));
 assert.ok(!g.ships.includes(prize));
});
test('the offer survives a save/load mid-report and claims identically',()=>{
 const{g,e}=fight('repelled');
 const result=deserialize(serialize(g,'T'),world).g;
 assert.deepEqual(result.encounterReport.prize,e.prize);
 const originalClaim=claimPrize(g,true),loadedClaim=claimPrize(result,true);
 assert.equal(originalClaim.ship.type,loadedClaim.ship.type);assert.equal(originalClaim.ship.hull,loadedClaim.ship.hull);
});
test('the dialog offers keep/leave only while a prize is pending (es/en)',()=>{
 const{g}=fight('repelled');
 assert.match(encounterDialogHtml(g,'es'),/Quedarme el barco/);assert.match(encounterDialogHtml(g,'en'),/Keep the ship/);
 assert.match(encounterDialogHtml(g,'es'),/Dejarlo a la deriva/);
 const{g:g2}=fight('raided');
 assert.doesNotMatch(encounterDialogHtml(g2,'es'),/Quedarme el barco/);assert.match(encounterDialogHtml(g2,'es'),/Continuar/);
});
test('selling a prize still follows the normal guards (hold empty, not the last ship)',()=>{
 const{g,s}=fight('repelled');const result=claimPrize(g,true);arrive(g,s);
 result.ship.cargo={grain:1};assert.equal(sellShip(g,result.ship).reason,'hold not empty');
});
