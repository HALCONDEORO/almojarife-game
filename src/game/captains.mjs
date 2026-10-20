// Original captain domain, not wired into the game yet. Prices/bonuses are design candidates.
const NAMES = ['Inés del Puerto','Tomás de la Ribera','Leonor del Mar','Mateo del Faro'];
const hash=(s)=>Array.from(s).reduce((a,c)=>(Math.imul(a,31)+c.charCodeAt(0))>>>0,7);
const validCity=(g,city)=>g.world?.cities?.some(c=>c.id===city);
const level=(v)=>Number.isSafeInteger(v)&&v>=0&&v<=3?v:0;
/** Deterministic port roster, no refresh timer or state mutation. Hired/dismissed entries do not respawn. */
export function captainRoster(g,city){
 if(!validCity(g,city))return [];
 const n=hash(city),id=`captain:${city}:1`;
 if(g.captainHistory?.[id])return [];
 return [{id,city,name:NAMES[n%NAMES.length],navigation:1+n%3,fee:120,wage:2}];
}
export function captainOf(ship){
 const c=ship?.captain;
 if(!c||typeof c.id!=='string'||typeof c.name!=='string')return null;
 return {id:c.id,name:c.name,navigation:level(c.navigation),wage:Number.isFinite(c.wage)&&c.wage>=0&&c.wage<=10?c.wage:0};
}
export const captainSpeed=(ship)=>1+0.04*(captainOf(ship)?.navigation??0);
export const captainWage=(ship)=>captainOf(ship)?.wage??0;
const owned=(g,ship)=>Array.isArray(g.ships)&&g.ships.includes(ship);
export function hireCaptain(g,ship,id){
 if(g.over)return {ok:false,reason:'game over'};
 if(!owned(g,ship))return {ok:false,reason:'foreign ship'};
 if(ship.voyage)return {ok:false,reason:'at sea'};
 if(captainOf(ship))return {ok:false,reason:'captain assigned'};
 const candidate=captainRoster(g,ship.at).find(c=>c.id===id);
 if(!candidate||g.ships.some(s=>s.captain?.id===id))return {ok:false,reason:'unavailable captain'};
 if(!Number.isFinite(g.cash)||g.cash<candidate.fee)return {ok:false,reason:'no cash'};
 const assigned={id:candidate.id,name:candidate.name,navigation:candidate.navigation,wage:candidate.wage};
 g.cash-=candidate.fee;ship.captain=assigned;
 (g.captainHistory??={})[id]={state:'hired',day:g.day,ship:ship.id};
 return {ok:true,cost:candidate.fee,captain:{...assigned}};
}
export function dismissCaptain(g,ship){
 if(g.over)return {ok:false,reason:'game over'};
 if(!owned(g,ship))return {ok:false,reason:'foreign ship'};
 if(ship.voyage)return {ok:false,reason:'at sea'};
 const c=captainOf(ship);if(!c)return {ok:false,reason:'no captain'};
 (g.captainHistory??={})[c.id]={state:'dismissed',day:g.day,ship:ship.id};
 delete ship.captain;
 return {ok:true,refund:0};
}
