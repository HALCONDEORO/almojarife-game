// Automatic encounter cadence. Versioned state prevents same-day replay for each ship.
import {seeded} from '../view/cityscene.mjs';
import {encounterOutcome,applyEncounter,encounterText} from './encounters.mjs';
import {post} from './ledger.mjs';
export const SEA_ENCOUNTER_CHANCE=0.025;
export function automaticEncounter(g,ship){
 if(!g.eventsOn||g.over||g.pending||!g.ships.includes(ship)||!ship.voyage)return null;
 const key=String(ship.id);if(g.encounterDays?.[key]===g.day)return null;
 (g.encounterDays??={})[key]=g.day;
 const r=seeded(`sea-v1:${g.seed??0}:${g.day}:${ship.id}`);
 if(r()>=SEA_ENCOUNTER_CHANCE)return null;
 const kind=r()<0.5?'pirates':'storm',out=encounterOutcome(ship,kind,r()),applied=applyEncounter(g,ship,out);
 if(!applied.ok)return null;
 const e={...applied,id:`sea-v1:${g.day}:${ship.id}`,day:g.day,ship:ship.id,from:ship.voyage.from,to:ship.voyage.to};
 (g.encounters??=[]).unshift(e);if(g.encounters.length>80)g.encounters.pop();
 g.log.unshift({day:g.day,key:'event',txt:{es:encounterText(e,'es'),en:encounterText(e,'en')},ship:ship.id});if(g.log.length>30)g.log.pop();
 post(g,'event',{txt:{es:encounterText(e,'es'),en:encounterText(e,'en')},ship:ship.id});
 return e;
}
