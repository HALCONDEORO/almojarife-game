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
import {locate} from './freenav.mjs';
import {inStorm} from '../sim/weather.mjs';
export const SEA_ENCOUNTER_CHANCE=0.025; // per day at sea
// Per tick: P(at least one encounter in a full day at sea) = 1-(1-p_tick)^240 = SEA_ENCOUNTER_CHANCE exactly.
export const SEA_ENCOUNTER_CHANCE_TICK=1-Math.pow(1-SEA_ENCOUNTER_CHANCE,1/TICKS_PER_DAY);
/* Encounter lifecycle, named once (states are separate and observable):
   - prepared: the seeded roll happens here; a pirates roll becomes g.pending
     (a queued decision bound to one ship and one tick id), a storm applies at once.
   - queued: g.pending waits for the player's choice; while it exists no new
     encounter is prepared for anyone (the guard below), and the day loop stops.
   - active: resolvePirates consumes the pending decision, validates the bound ship
     still has a voyage, and stores ONE final report (g.encounterReport).
   A preparer called again on an already-queued tick returns null: the per-tick
   version (g.encounterTicks) is written before the roll, so a tick can never be
   rerolled, not even after a save/reload. A pending decision that no longer
   matches a ship with a voyage is rejected at resolve time, never silently reused. */
// Weather classification is pure: no encounter roll or state write happens here.
function encounterInStorm(g,ship,world){
 if(!world||!ship.voyage||!Number.isFinite(g.day))return false;
 const pos=locate(world,ship);
 return Boolean(pos&&Number.isFinite(pos.lat)&&Number.isFinite(pos.lon)&&inStorm(pos.lat,pos.lon,g.day,g.seed??0));
}
export function automaticEncounter(g,ship,world){
 if(!g.eventsOn||g.over||g.pending||g.encounterReport||!g.ships.includes(ship)||!ship.voyage||ship.voyage.anchored)return null;
 const key=String(ship.id);if(g.encounterTicks?.[key]===g.tick)return null;
 (g.encounterTicks??={})[key]=g.tick;
 const random=seeded(`sea-v2:${g.seed??0}:${g.tick}:${ship.id}`);
 if(random()>=SEA_ENCOUNTER_CHANCE_TICK)return null;
 const roll=random();
 let kind=roll<0.5?'pirates':'storm';
 // Real weather: inside a storm cell of the chart the encounter is always that storm. The daily
 // encounter rate is untouched; outside a cell the old 50/50 roll decides (a squall can still catch you).
 if(encounterInStorm(g,ship,world))kind='storm';
 if(kind==='pirates'){
  g.pending={event:'sea-pirates',ship:ship.id,day:g.day,hour:hourOf(g.tick),id:`sea-v2:${g.tick}:${ship.id}`,escapeChance:escapeChance(ship)};
  return g.pending;
 }
 const out=encounterOutcome(ship,kind,random()),applied=applyEncounter(g,ship,out);
 if(!applied.ok)return null;
 const report={...applied,id:`sea-v2:${g.tick}:${ship.id}`,day:g.day,hour:hourOf(g.tick),ship:ship.id,from:ship.voyage.from,to:ship.voyage.to};
 (g.encounters??=[]).unshift(report);if(g.encounters.length>80)g.encounters.pop();
 g.log.unshift({day:g.day,key:'event',txt:{es:encounterText(report,'es'),en:encounterText(report,'en')},ship:ship.id});if(g.log.length>30)g.log.pop();
 post(g,'event',{txt:{es:encounterText(report,'es'),en:encounterText(report,'en')},ship:ship.id});
 return report;
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
 const pending=g.pending;
 if(g.over||pending?.event!=='sea-pirates'||!['flee','fight'].includes(choice))return {ok:false};
 const ship=g.ships.find(s=>s.id===pending.ship);
 if(!ship?.voyage||!Number.isFinite(pending.escapeChance)||pending.escapeChance<15||pending.escapeChance>85)return {ok:false};
 const random=seeded(`sea-choice-v1:${g.seed??0}:${pending.id}`);
 const escaped=choice==='flee'&&random()*100<pending.escapeChance;
 const fight=(escaped||g.pirateFight!==true)?null:fightPirates(ship,g.seed,pending.id,escortOf(g,ship)); // the pirates are a real seeded ship fought with the shared battle resolver; a convoy escort adds defence
 const out=escaped?{kind:'pirates',result:'escaped',hullLoss:0,cargoLossPct:0,delay:1}:fight?fight.outcome:encounterOutcome(ship,'pirates',random(),escortOf(g,ship)); // flag off (default): the old single-roll outcome, identical to before
 const applied=applyEncounter(g,ship,out);if(!applied.ok)return applied;
 const report={...applied,id:pending.id,day:pending.day,ship:ship.id,from:ship.voyage.from,to:ship.voyage.to,choice,escapeFailed:choice==='flee'&&!escaped};
 (g.encounters??=[]).unshift(report);if(g.encounters.length>80)g.encounters.pop();
 if(report.result==='repelled'&&ship.voyage)report.prize=fight?fight.prize:prizeFor(g,report.id); // flag on: the fought ship if it did not sink; flag off: the old seeded prize, unchanged
 g.encounterReport=report;g.pending=null;return report;
}

// Prizes: a won fight against pirates can leave their ship behind; the player may keep it, once per encounter.
// A prize joins the fleet mid-voyage with no crew and a damaged hull, and a shipyard pays less for it (game.mjs).
export const PRIZE_ROLL=[["barca",0.6],["cog",0.3],["caravel",0.1]];
export const PRIZE_HULL_MIN=30,PRIZE_HULL_SPAN=40; // hull 30-69%
/** Seeded prize offer of a won encounter: type and hull. */
export function prizeFor(g,encounterId){
 const random=seeded(`prize-v1:${g.seed??0}:${encounterId}`);
 let x=random(),type=PRIZE_ROLL[PRIZE_ROLL.length-1][0];
 for(const[t,p]of PRIZE_ROLL){x-=p;if(x<0){type=t;break;}}
 return{type,hull:PRIZE_HULL_MIN+Math.floor(random()*PRIZE_HULL_SPAN)};
}
/** Keep or leave the prize of the open report. Closes the report; the choice is logged.
 * Registration is exactly-once: the report closes with the first claim, so any replay is a
 * no-op rejection and the fleet grows at most by one. The escort binding (escorted /
 * escortedBy) lives on the shared voyage record and dies with it on arrival. */
export function claimPrize(g,keep){
 const report=g.encounterReport;
 if(g.over||!report?.prize)return{ok:false};
 const winner=g.ships.find(s=>s.id===report.ship);
 if(keep&&!winner)return{ok:false};
 let prize=null;
 if(keep){
  prize=makeShip(g.nextId++,report.prize.type,winner.at,g.ships);
  prize.hull=report.prize.hull;prize.prize=true;prize.crew=0; // no crew: it cannot sail again until hands are hired
  if(winner.voyage){prize.voyage={...winner.voyage};prize.voyage.escorted=true;winner.voyage.escortedBy=prize.id; } // it keeps station with the winner and arrives with it; the escorted pair limps together: hull drag is skipped for both legs of the shared voyage (docs/design/hull-wear-rebalance.md)
  g.ships.push(prize);
 }
 const txt=keep
  ?{es:`Presa capturada: ${report.prize.type} se une a tu flota (casco ${report.prize.hull}%, sin tripulación).`,en:`Prize taken: a ${report.prize.type} joins your fleet (hull ${report.prize.hull}%, no crew).`}
  :{es:'Dejaste el barco pirata a la deriva.',en:'You left the pirate ship adrift.'};
 g.log.unshift({day:g.day,key:'event',txt,ship:report.ship});if(g.log.length>30)g.log.pop();
 post(g,'event',{txt,ship:report.ship});
 report.prize.taken=Boolean(keep);
 g.encounterReport=null;
 return{ok:true,ship:prize};
}
export function dismissEncounterReport(g){if(!g.encounterReport)return false;g.encounterReport=null;return true;}
