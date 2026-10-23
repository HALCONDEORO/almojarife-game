// Telemetry only. Default off; never changes prices, demand, stocks or traders.
import {classCounts,demandBy,CLASSES}from './classes.mjs';
import {legacyNeedsPolicy,physicalNeeds,recordNeeds}from './needs.mjs';
export const NEEDS_LEDGER_ENABLED=true; // default ON (Marco 23/10); telemetry only, never changes prices/demand/stocks/traders
/** Attribute the existing market's actual whole-unit consumption proportionally.
 * Class split is an estimate, not household purchases: the legacy market has no
 * per-class purse. Never label spending or affordability as observed here. */
export function recordLegacyConsumption(city,day,actual,desired,multiplierOf){
 const counts=classCounts(Object.values(city)[0].pop),need=physicalNeeds(counts,legacyNeedsPolicy(Object.keys(city)),multiplierOf);
 const receipt={byClass:Object.fromEntries(CLASSES.map(c=>[c,{units:{},spending:{},desired:{}}]))};
 for(const[g,n]of Object.entries(actual)){
  const d=desired[g],total=CLASSES.reduce((s,c)=>s+d[c],0);let left=n;
  const ranked=CLASSES.map(c=>({c,raw:total?n*d[c]/total:0}));
  for(const x of ranked){const units=Math.floor(x.raw);receipt.byClass[x.c].units[g]=units;receipt.byClass[x.c].desired[g]=d[x.c];left-=units;}
  ranked.sort((a,b)=>(b.raw%1)-(a.raw%1)||CLASSES.indexOf(a.c)-CLASSES.indexOf(b.c));
  for(let i=0;i<left;i++)receipt.byClass[ranked[i%ranked.length].c].units[g]++;
 }
 const meta={needs:city.grain.needsLedger};recordNeeds(meta,need,receipt,{day:Number.isFinite(day)?day:null,policyId:'legacy-telemetry-v1'});
 meta.needs.attribution='estimated-proportional-no-household-purse';city.grain.needsLedger=meta.needs;return meta.needs;
}
