// Read-only selected-ship voyage summary. ETA is an estimate, not a promise.
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function voyageSummary(s){
 if(!s?.voyage)return{atPort:true,port:s?.at};
 const v=s.voyage,total=Math.max(1,v.totalTicks??v.ticksLeft??1),left=Math.max(0,v.ticksLeft??0),progress=Math.max(0,Math.min(1,1-left/total));
 return{atPort:false,from:v.from,to:v.to,progress,remainingKm:Math.max(0,(v.km??0)*(1-progress)),ticksLeft:left};
}
// Why the last course change was refused (ship.navError, set by doGoTo): shown until a new order goes through.
const NAVWHY={
 convoy:{es:'navega en convoy: el grupo zarpa junto a un puerto',en:'it sails in a convoy: the group leaves together for a port'},
 crew:{es:'le falta tripulación para gobernar el barco',en:'it is short of crew to handle the ship'},
 held:{es:'la justicia lo tiene retenido en puerto',en:'the law is holding it in port'},
 'no sea there':{es:'ahí no hay mar navegable',en:'there is no navigable sea there'},
 'no route':{es:'no encuentra derrota navegable hasta ese punto',en:'it cannot find a navigable course to that point'},
 'no position':{es:'se ignora su posición actual',en:'its current position is unknown'},
};
export function voyageCardHtml(s,{lang='es',cityName=id=>id,eta=()=>'',cargo=null,sail=null,eventPending=false}={}){
 const en=lang==='en',r=voyageSummary(s);
 const row=h=>`<div class="vc-row">${h}</div>`;
 const head=`<div class="vc-head"><b>${en?'Selected ship':'Barco seleccionado'} ${esc(s.id)}</b></div>`;
 const cargoRow=cargo?row(`${en?'Cargo':'Carga'}: ${cargo.used}/${cargo.cap}`):'';
 const open=`<button type="button" id="voyage-open" class="vc-open">${en?'Open ship':'Abrir barco'}</button>`;
 const why=s.navError?(NAVWHY[s.navError]?.[en?'en':'es']??(en?'that order is not possible now':'esa orden no es posible ahora')):null;
 const navRow=why?row(`<span class="vc-warn">${en?'Could not change course':'No pudo cambiar de rumbo'}: ${esc(why)}</span>`):'';
 const ev=eventPending?`<button type="button" id="voyage-event" class="vc-open vc-event">${en?'Resolve voyage event':'Resolver suceso'}</button>`:'';
 const go=sail?`<button type="button" id="voyage-sail" class="vc-open vc-sail">${en?'Sail to':'Zarpar a'} ${esc(sail.city)} (≈${esc(sail.hours)} h) (↵)</button>`:'';
 if(r.atPort)return head+row(`${en?'At port':'En puerto'}: ${esc(cityName(r.port))}`)+navRow+cargoRow+ev+go+open;
 const route=row(`${esc(cityName(r.from))} → ${esc(cityName(r.to))}`);
 if(s.voyage.anchored)return head+route+row(`<span>${en?'Holding position':'Al pairo'}</span>`)+navRow+cargoRow+ev+open; // anchored at a free point: no arrival to promise
 const pct=Math.round(r.progress*100);
 return head+route+row(`<span>${en?'Estimated arrival':'Llegada estimada'}: ${esc(eta(s))}</span> · ≈ ${Math.round(r.remainingKm)} km ${en?'left':'restantes'}`)+navRow+cargoRow+row(`<label>${en?'Voyage progress':'Progreso del viaje'} <progress max="100" value="${pct}">${pct}%</progress> ${pct}%</label>`)+ev+open;
}
