import {speedFactor} from './crew.mjs';
import {makeShip} from '../sim/trade.mjs';
// Automatic encounter cadence: one seeded roll per tick at sea, keyed on the absolute tick,
// so a tick can never be rerolled after a save/reload. Per-tick chance keeps the daily exposure
// exactly as under the day model. Versioned state prevents rolling the same tick twice.
import {seeded} from '../view/cityscene.mjs';
import {TICKS_PER_DAY,hourOf} from '../sim/clock.mjs';
import {encounterOutcome,applyEncounter,encounterText} from './encounters.mjs';
import {fightPirates} from './piratefight.mjs';
import {post} from './ledger.mjs';
import {escortOf} from './convoys.mjs';
export const SEA_ENCOUNTER_CHANCE=0.025; // per day at sea
// Per tick: P(at least one encounter in a full day at sea) = 1-(1-p_tick)^240 = SEA_ENCOUNTER_CHANCE exactly.
export const SEA_ENCOUNTER_CHANCE_TICK=1-Math.pow(1-SEA_ENCOUNTER_CHANCE,1/TICKS_PER_DAY);
export function automaticEncounter(g,ship){
 if(!g.eventsOn||g.over||g.pending||g.encounterReport||!g.ships.includes(ship)||!ship.voyage)return null;
 const key=String(ship.id);if(g.encounterTicks?.[key]===g.tick)return null;
 (g.encounterTicks??={})[key]=g.tick;
 const r=seeded(`sea-v2:${g.seed??0}:${g.tick}:${ship.id}`);
 if(r()>=SEA_ENCOUNTER_CHANCE_TICK)return null;
 const kind=r()<0.5?'pirates':'storm';
 if(kind==='pirates'){
  g.pending={event:'sea-pirates',ship:ship.id,day:g.day,hour:hourOf(g.tick),id:`sea-v2:${g.tick}:${ship.id}`,escapeChance:escapeChance(ship)};
  return g.pending;
 }
 const out=encounterOutcome(ship,kind,r()),applied=applyEncounter(g,ship,out);
 if(!applied.ok)return null;
 const e={...applied,id:`sea-v2:${g.tick}:${ship.id}`,day:g.day,hour:hourOf(g.tick),ship:ship.id,from:ship.voyage.from,to:ship.voyage.to};
 (g.encounters??=[]).unshift(e);if(g.encounters.length>80)g.encounters.pop();
 g.log.unshift({day:g.day,key:'event',txt:{es:encounterText(e,'es'),en:encounterText(e,'en')},ship:ship.id});if(g.log.length>30)g.log.pop();
 post(g,'event',{txt:{es:encounterText(e,'es'),en:encounterText(e,'en')},ship:ship.id});
 return e;
}

/** Original escape rule: intact hull, crew and navigation improve the displayed chance. */
export function escapeChance(ship){
 const rawHull=ship.hull;
 const hull=Number.isFinite(rawHull)?Math.min(100,Math.max(0,rawHull)):100;
 const nav=ship.captain?.navigation;
 return Math.round(Math.min(85,Math.max(15,35+hull*.25+speedFactor(ship)*10+(Number.isSafeInteger(nav)&&nav>=0&&nav<=3?nav*3:0))));
}
/** One decision, one stored final report; reopening a save cannot reroll it. */
export function resolvePirates(g,choice){
 const p=g.pending;
 if(g.over||p?.event!=='sea-pirates'||!['flee','fight'].includes(choice))return {ok:false};
 const ship=g.ships.find(s=>s.id===p.ship);
 if(!ship?.voyage||!Number.isFinite(p.escapeChance)||p.escapeChance<15||p.escapeChance>85)return {ok:false};
 const r=seeded(`sea-choice-v1:${g.seed??0}:${p.id}`);
 const escaped=choice==='flee'&&r()*100<p.escapeChance;
 const fight=(escaped||g.pirateFight!==true)?null:fightPirates(ship,g.seed,p.id,escortOf(g,ship)); // the pirates are a real seeded ship fought with the shared battle resolver; a convoy escort adds defence
 let out=escaped?{kind:'pirates',result:'escaped',hullLoss:0,cargoLossPct:0,delay:1}:fight?fight.outcome:encounterOutcome(ship,'pirates',r(),escortOf(g,ship)); // flag off (default): the old single-roll outcome, identical to before
 const applied=applyEncounter(g,ship,out);if(!applied.ok)return applied;
 const e={...applied,id:p.id,day:p.day,ship:ship.id,from:ship.voyage.from,to:ship.voyage.to,choice,escapeFailed:choice==='flee'&&!escaped};
 (g.encounters??=[]).unshift(e);if(g.encounters.length>80)g.encounters.pop();
 if(e.result==='repelled'&&ship.voyage)e.prize=fight?fight.prize:prizeFor(g,e.id); // flag on: the fought ship if it did not sink; flag off: the old seeded prize, unchanged
 g.encounterReport=e;g.pending=null;return e;
}

// Prizes: a won fight against pirates can leave their ship behind; the player may keep it, once per encounter.
// A prize joins the fleet mid-voyage with no crew and a damaged hull, and a shipyard pays less for it (game.mjs).
export const PRIZE_ROLL=[["barca",0.6],["cog",0.3],["caravel",0.1]];
export const PRIZE_HULL_MIN=30,PRIZE_HULL_SPAN=40; // hull 30-69%
/** Seeded prize offer of a won encounter: type and hull. */
export function prizeFor(g,encounterId){
 const r=seeded(`prize-v1:${g.seed??0}:${encounterId}`);
 let x=r(),type=PRIZE_ROLL[PRIZE_ROLL.length-1][0];
 for(const[t,p]of PRIZE_ROLL){x-=p;if(x<0){type=t;break;}}
 return{type,hull:PRIZE_HULL_MIN+Math.floor(r()*PRIZE_HULL_SPAN)};
}
/** Keep or leave the prize of the open report. Closes the report; the choice is logged. */
export function claimPrize(g,keep){
 const e=g.encounterReport;
 if(g.over||!e?.prize)return{ok:false};
 const winner=g.ships.find(s=>s.id===e.ship);
 if(keep&&!winner)return{ok:false};
 let prize=null;
 if(keep){
  prize=makeShip(g.nextId++,e.prize.type,winner.at);
  prize.hull=e.prize.hull;prize.prize=true;prize.crew=0; // no crew: it cannot sail again until hands are hired
  if(winner.voyage)prize.voyage={...winner.voyage}; // it keeps station with the winner and arrives with it
  g.ships.push(prize);
 }
 const txt=keep
  ?{es:`Presa capturada: ${e.prize.type} se une a tu flota (casco ${e.prize.hull}%, sin tripulación).`,en:`Prize taken: a ${e.prize.type} joins your fleet (hull ${e.prize.hull}%, no crew).`}
  :{es:'Dejaste el barco pirata a la deriva.',en:'You left the pirate ship adrift.'};
 g.log.unshift({day:g.day,key:'event',txt,ship:e.ship});if(g.log.length>30)g.log.pop();
 post(g,'event',{txt,ship:e.ship});
 e.prize.taken=!!keep;
 g.encounterReport=null;
 return{ok:true,ship:prize};
}
export function dismissEncounterReport(g){if(!g.encounterReport)return false;g.encounterReport=null;return true;}
