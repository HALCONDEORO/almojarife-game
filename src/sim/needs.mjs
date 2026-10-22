// Physical need is not the same as purchasing power or a recorded market sale.
// Policies must state their unit and provenance; historical calibration is data,
// never inferred from a price curve or a household inventory stock.
import { CLASSES, PER_1000 } from './classes.mjs';
export const NEED_GROUP = Object.freeze({grain:'food',fish:'food',meat:'food',salt:'food',olive_oil:'food',beer:'drink',wine:'drink',sugar:'luxury',pepper:'luxury',silk:'luxury',cloth:'clothing',leather:'clothing',soap:'household',timber:'materials',bricks:'materials',iron:'materials',ironware:'materials',wool:'materials',esparto:'materials'});
/** Transitional rates only. Unit: game market units/person/day, NOT kg or rations.
 * Existing PER_1000 basket is preserved as raw rate data. Callers own any explicit
 * city multiplier. Food/history calibration will replace individual rows later. */
export function legacyNeedsPolicy(goods=Object.keys(PER_1000)) {
 return Object.fromEntries(goods.map(g=>[g,{unit:'game-unit',group:NEED_GROUP[g]??'other',evidence:'legacy-game-assumption',source:null,perPersonDay:Object.fromEntries(CLASSES.map(c=>[c,(PER_1000[g]?.[c]??0)/1000]))}]));
}
/** Price-independent daily physical quantities for a city. Pure, no rounding. */
export function physicalNeeds(counts,policy,multiplierOf=()=>1) {
 const byClass=Object.fromEntries(CLASSES.map(c=>[c,{}])),byGood={};
 for(const g of Object.keys(policy).sort()){
  const row=policy[g],mul=multiplierOf(g);
  if(!row.unit||!row.evidence||!Number.isFinite(mul)||mul<0)throw new Error('invalid needs policy');
  byGood[g]=0;
  for(const c of CLASSES){const n=counts[c],rate=row.perPersonDay[c];if(!Number.isFinite(n)||n<0||!Number.isFinite(rate)||rate<0)throw new Error('invalid physical need');byGood[g]+=byClass[c][g]=n*rate*mul;}
 }
 return {byClass,byGood};
}
/** Ledger uses the SAME allocation receipt as market settlement. No second consumption.
 * Deficit is daily physical need less actual consumption, never debt carried to demand.
 * Whole-unit fulfillment can exceed a fractional day's want when fractions settle.
 * Carry rounding must therefore be read over time; signed balance preserves that fact. */
export function recordNeeds(meta,need,receipt,{day=null,policyId='legacy-v1'}={}) {
 const prior=meta.needs??{days:0,policyId,totals:{},byClass:{}};
 if(prior.policyId!==policyId)throw new Error('needs policy changed: migrate ledger explicitly');
 const daily={day,byGood:{},byClass:{}},totals=prior.totals,byClass=prior.byClass;
 for(const c of CLASSES){daily.byClass[c]={};byClass[c]??={};for(const [g,n]of Object.entries(need.byClass[c])){
  const desired=receipt.byClass[c].desired?.[g]??n,consumed=receipt.byClass[c].units[g]??0;
  const d={need:n,desired,consumed,spending:receipt.byClass[c].spending[g]??0,balance:n-consumed};
  daily.byClass[c][g]=d;const total=(byClass[c][g]??={need:0,desired:0,consumed:0,spending:0,balance:0});
  const cityDay=(daily.byGood[g]??={need:0,desired:0,consumed:0,spending:0,balance:0});const cityTotal=(totals[g]??={need:0,desired:0,consumed:0,spending:0,balance:0});
  for(const k of Object.keys(d)){total[k]+=d[k];cityDay[k]+=d[k];cityTotal[k]+=d[k];}
 }}
 meta.needs={days:prior.days+1,policyId,daily,totals,byClass};return meta.needs;
}
