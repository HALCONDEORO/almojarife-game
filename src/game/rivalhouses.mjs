// Fictional houses, original names and presentation regions, not historical firms.
import {REGIONS,regionOf} from './shocks.mjs';
import {seeded} from '../view/cityscene.mjs';
import {refreshBotKnowledge,botIntelHooks,buyBotReport} from './botintel.mjs';
import {aiStep} from '../sim/ai.mjs';
const NAMES={atlantico:['Leonor Vela','Duarte Lago','Inés Salcedo'],estrecho:['Yusuf Zahra','Mariam Nadir','Tomás Albor'],mediterraneo:['Joan Ribera','Isabel Ferrer','Pere Olivar']};
const HOUSES={atlantico:['Casa del Poniente','Casa de la Ría','Casa del Faro'],estrecho:['Casa de las Dos Orillas','Casa del Estrecho','Casa de la Dársena'],mediterraneo:['Casa del Levante','Casa de la Vela Azul','Casa del Coral']};
export const RIVAL_PROFILES=['regional','staples','diverse'];
/** One house per existing gameplay region. No count inferred from historical population. */
export function regionalHousePlan(world,seed=0){
 return Object.keys(REGIONS).sort().flatMap(region=>{const ports=world.cities.filter(c=>regionOf(c.id)===region).sort((a,b)=>a.id.localeCompare(b.id));if(!ports.length)return[];const r=seeded(`rival-house:${seed}:${region}`),pick=a=>a[Math.floor(r()*a.length)];return[{id:`house-${region}`,region,home:pick(ports).id,name:pick(NAMES[region]),house:pick(HOUSES[region]),profile:pick(RIVAL_PROFILES)}];});
}
export function rivalCandidateScore(house,{dest,good,score}){
 const regional=regionOf(dest)===house.region;
 if(house.profile==='regional')return score*(regional?1.15:1);
 if(house.profile==='staples')return score*(['grain','fish','salt','olive_oil'].includes(good)?1.12:1);
 return score;
}
/** Opt-in host path. Real local trades, own discovery/reports, no remote book leak.
 * This does not add construction, finance or workforce capabilities to the legacy bot. */
export function regionalRivalStep(g,bot){
 if(g.regionalRivals!==true||!bot.house)return aiStep(g.world,g.market,bot,bot.ship);
 if(bot.ship.voyage)return null;
 refreshBotKnowledge(g,bot);
 if((g.day??0)>=0&&(g.day+bot.ship.id)%7===0&&bot.cash>100&&bot.lastRivalReportDay!==g.day){bot.lastRivalReportDay=g.day;buyBotReport(g,bot);} // normal paid report, no free discovery
 return aiStep(g.world,g.market,bot,bot.ship,{...botIntelHooks(g,bot),scoreCandidate:p=>rivalCandidateScore(bot.house,p)});
}
