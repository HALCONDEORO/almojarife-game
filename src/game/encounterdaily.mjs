import {speedFactor} from './crew.mjs';
// Automatic encounter cadence. Versioned state prevents same-day replay for each ship.
import {seeded} from '../view/cityscene.mjs';
import {encounterOutcome,applyEncounter,encounterText} from './encounters.mjs';
import {post} from './ledger.mjs';
export const SEA_ENCOUNTER_CHANCE=0.025;
export function automaticEncounter(g,ship){
 if(!g.eventsOn||g.over||g.pending||g.encounterReport||!g.ships.includes(ship)||!ship.voyage)return null;
 const key=String(ship.id);if(g.encounterDays?.[key]===g.day)return null;
 (g.encounterDays??={})[key]=g.day;
 const r=seeded(`sea-v1:${g.seed??0}:${g.day}:${ship.id}`);
 if(r()>=SEA_ENCOUNTER_CHANCE)return null;
 const kind=r()<0.5?'pirates':'storm';
 if(kind==='pirates'){
  g.pending={event:'sea-pirates',ship:ship.id,day:g.day,id:`sea-v1:${g.day}:${ship.id}`,escapeChance:escapeChance(ship)};
  return g.pending;
 }
 const out=encounterOutcome(ship,kind,r()),applied=applyEncounter(g,ship,out);
 if(!applied.ok)return null;
 const e={...applied,id:`sea-v1:${g.day}:${ship.id}`,day:g.day,ship:ship.id,from:ship.voyage.from,to:ship.voyage.to};
 (g.encounters??=[]).unshift(e);if(g.encounters.length>80)g.encounters.pop();
 g.log.unshift({day:g.day,key:'event',txt:{es:encounterText(e,'es'),en:encounterText(e,'en')},ship:ship.id});if(g.log.length>30)g.log.pop();
 post(g,'event',{txt:{es:encounterText(e,'es'),en:encounterText(e,'en')},ship:ship.id});
 return e;
}

/** Original escape rule: intact hull, crew and navigation improve the displayed chance. */
export function escapeChance(ship){
 const hull=Math.min(100,Math.max(0,ship.hull??100));
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
 let out=escaped?{kind:'pirates',result:'escaped',hullLoss:0,cargoLossPct:0,delay:1}:encounterOutcome(ship,'pirates',r());
 const applied=applyEncounter(g,ship,out);if(!applied.ok)return applied;
 const e={...applied,id:p.id,day:p.day,ship:ship.id,from:ship.voyage.from,to:ship.voyage.to,choice,escapeFailed:choice==='flee'&&!escaped};
 (g.encounters??=[]).unshift(e);if(g.encounters.length>80)g.encounters.pop();
 g.encounterReport=e;g.pending=null;return e;
}
export function dismissEncounterReport(g){if(!g.encounterReport)return false;g.encounterReport=null;return true;}
