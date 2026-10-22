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
  const g=newGame(world);g.eventsOn=true;g.seed=0;
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
 const before=g.ships.length,r=claimPrize(g,true);
 assert.ok(r.ok);assert.equal(g.ships.length,before+1);assert.equal(g.encounterReport,null);
 const p=r.ship;assert.equal(p.type,e.prize.type);assert.equal(p.hull,e.prize.hull);assert.equal(p.prize,true);assert.equal(p.crew,0);
 assert.deepEqual(p.voyage,s.voyage,'same voyage as the winner');
 assert.equal(claimPrize(g,true).ok,false,'once per encounter');
 arrive(g,s);
 assert.ok(!p.voyage&&p.at===s.at,'both arrived at the destination');
 assert.equal(doSail(g,p,'cadiz').reason,'crew','a crewless prize cannot sail again');
});
test('leaving the prize adds nothing and closes the report',()=>{
 const{g}=fight('repelled');const before=g.ships.length;
 const r=claimPrize(g,false);assert.ok(r.ok);assert.equal(g.ships.length,before);assert.equal(g.encounterReport,null);
});
test('a prize resells at the lower prize rate; a normal ship keeps the standard rate',()=>{
 const{g,s,e}=fight('repelled');const r=claimPrize(g,true);arrive(g,s);
 const p=r.ship;
 assert.equal(shipValue(p),Math.round(SHIP_TYPES[e.prize.type].price*PRIZE_SELL_RATE*(0.5+0.5*p.hull/100)));
 assert.equal(shipValue(s),Math.round(SHIP_TYPES[s.type].price*SELL_RATE*(0.5+0.5*s.hull/100)),'standard ship unchanged');
 const cash=g.cash,v=shipValue(p),sale=sellShip(g,p);
 assert.ok(sale.ok,sale.reason);assert.equal(sale.value,v);assert.equal(Math.round(g.cash),Math.round(cash+v));
 assert.ok(!g.ships.includes(p));
});
test('the offer survives a save/load mid-report and claims identically',()=>{
 const{g,e}=fight('repelled');
 const r=deserialize(serialize(g,'T'),world).g;
 assert.deepEqual(r.encounterReport.prize,e.prize);
 const a=claimPrize(g,true),b=claimPrize(r,true);
 assert.equal(a.ship.type,b.ship.type);assert.equal(a.ship.hull,b.ship.hull);
});
test('the dialog offers keep/leave only while a prize is pending (es/en)',()=>{
 const{g}=fight('repelled');
 assert.match(encounterDialogHtml(g,'es'),/Quedarme el barco/);assert.match(encounterDialogHtml(g,'en'),/Keep the ship/);
 assert.match(encounterDialogHtml(g,'es'),/Dejarlo a la deriva/);
 const{g:g2}=fight('raided');
 assert.doesNotMatch(encounterDialogHtml(g2,'es'),/Quedarme el barco/);assert.match(encounterDialogHtml(g2,'es'),/Continuar/);
});
test('selling a prize still follows the normal guards (hold empty, not the last ship)',()=>{
 const{g,s}=fight('repelled');const r=claimPrize(g,true);arrive(g,s);
 r.ship.cargo={grain:1};assert.equal(sellShip(g,r.ship).reason,'hold not empty');
});
