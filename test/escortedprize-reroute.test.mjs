// Regression for a legitimate course order losing the shared prize voyage.
// Own synthetic game state only. No dependency on PR #812's delay changes.
import test from 'node:test';
import assert from 'node:assert/strict';
import {loadWorld} from '../src/sim/world.mjs';
import {newGame,doSail,doGoTo} from '../src/game/game.mjs';
import {resolvePirates,claimPrize} from '../src/game/encounterdaily.mjs';
import {serialize,deserialize} from '../src/game/gamesave.mjs';
import {sailTick} from '../src/sim/trade.mjs';
import {voyageCardHtml} from '../src/view/voyagecard.mjs';
const world=loadWorld();
function capturedPair(){
 const game=newGame(world,'cadiz',{freePlay:true,pirateFight:false,freeNav:true});
 game.eventsOn=true;game.seed=0;const winner=game.ships[0];assert.equal(doSail(game,winner,'barcelona').ok,true);
 let won=false;
 for(let attempt=1;attempt<200;attempt++){
  game.pending={event:'sea-pirates',ship:winner.id,day:game.day,hour:0,id:'t:'+attempt,escapeChance:50};
  const report=resolvePirates(game,'fight');
  if(report.result==='repelled'&&report.prize){won=true;break;}
  game.encounterReport=null;
 }
 assert.equal(won,true);const claimed=claimPrize(game,true);assert.equal(claimed.ok,true);
 return {game,winner,prize:claimed.ship};
}
function refuseWithoutMutation(game,winner,prize,selected){
 const before=JSON.stringify({winner:winner.voyage,prize:prize.voyage,cash:game.cash,voyages:game.voyages,log:game.log});
 const destination=world.nodes.huelva,result=doGoTo(game,selected,destination.lat,destination.lon);
 assert.deepEqual(result,{ok:false,reason:'escort'});
 assert.equal(selected.navError,'escort');
 assert.equal(JSON.stringify({winner:winner.voyage,prize:prize.voyage,cash:game.cash,voyages:game.voyages,log:game.log}),before,'refusal never partially reroutes either leg or charges/logs departure');
 assert.equal(winner.voyage.escortedBy,prize.id);assert.equal(prize.voyage.escorted,true);
}
test('rerouting the escort is refused without breaking its prize binding or route',()=>{
 const {game,winner,prize}=capturedPair();refuseWithoutMutation(game,winner,prize,winner);
});
test('a prize cannot change course independently even if it has acquired enough crew',()=>{
 const {game,winner,prize}=capturedPair();prize.crew=100;refuseWithoutMutation(game,winner,prize,prize);
});
test('binding protection survives save/load and ends with the shared voyage, not forever',()=>{
 const fixture=capturedPair(),game=deserialize(serialize(fixture.game,'Synthetic pair'),world).g;
 const winner=game.ships.find(s=>s.id===fixture.winner.id),prize=game.ships.find(s=>s.id===fixture.prize.id);
 refuseWithoutMutation(game,winner,prize,winner);
 for(let i=0;i<100000&&(winner.voyage||prize.voyage);i++){sailTick(winner);sailTick(prize);}
 assert.equal(winner.voyage,null);assert.equal(prize.voyage,null);assert.equal(winner.at,prize.at);
 const p=world.nodes.huelva;assert.equal(doGoTo(game,winner,p.lat,p.lon).ok,true);assert.equal(winner.navError,undefined,'arrival permits a new course and clears the old refusal');
});
test('voyage card explains the escort refusal in both languages without a convoy claim',()=>{
 const ship={id:1,navError:'escort',voyage:{from:'cadiz',to:'barcelona',totalTicks:100,ticksLeft:50}};
 assert.match(voyageCardHtml(ship,{lang:'es'}),/la escolta de una presa debe terminar el viaje antes de cambiar de rumbo/);
 assert.match(voyageCardHtml(ship,{lang:'en'}),/the prize escort must finish this voyage before changing course/);
 assert.doesNotMatch(voyageCardHtml(ship,{lang:'en'}),/in a convoy/);
});
