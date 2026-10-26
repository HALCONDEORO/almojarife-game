// Read-only selected-ship voyage summary. ETA is an estimate, not a promise.
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function voyageSummary(s){
 if(!s?.voyage)return{atPort:true,port:s?.at};
 const v=s.voyage,total=Math.max(1,v.totalTicks??v.ticksLeft??1),left=Math.max(0,v.ticksLeft??0),progress=Math.max(0,Math.min(1,1-left/total));
 return{atPort:false,from:v.from,to:v.to,progress,remainingKm:Math.max(0,(v.km??0)*(1-progress)),ticksLeft:left};
}
export function voyageCardHtml(s,{lang='es',cityName=id=>id,eta=()=>'',cargo=null,sail=null,eventPending=false}={}){
 const en=lang==='en',r=voyageSummary(s);
 const row=h=>`<div class="vc-row">${h}</div>`;
 const head=`<div class="vc-head"><b>${en?'Selected ship':'Barco seleccionado'} ${esc(s.id)}</b></div>`;
 const cargoRow=cargo?row(`${en?'Cargo':'Carga'}: ${cargo.used}/${cargo.cap}`):'';
 const open=`<button type="button" id="voyage-open" class="vc-open">${en?'Open ship':'Abrir barco'}</button>`;
 const ev=eventPending?`<button type="button" id="voyage-event" class="vc-open vc-event">${en?'Resolve voyage event':'Resolver suceso'}</button>`:'';
 const go=sail?`<button type="button" id="voyage-sail" class="vc-open vc-sail">${en?'Sail to':'Zarpar a'} ${esc(sail.city)} (≈${esc(sail.hours)} h) (↵)</button>`:'';
 if(r.atPort)return head+row(`${en?'At port':'En puerto'}: ${esc(cityName(r.port))}`)+cargoRow+ev+go+open;
 const route=row(`${esc(cityName(r.from))} → ${esc(cityName(r.to))}`);
 if(s.voyage.anchored)return head+route+row(`<span>${en?'Holding position':'Al pairo'}</span>`)+cargoRow+ev+open; // anchored at a free point: no arrival to promise
 const pct=Math.round(r.progress*100);
 return head+route+row(`<span>${en?'Estimated arrival':'Llegada estimada'}: ${esc(eta(s))}</span> · ≈ ${Math.round(r.remainingKm)} km ${en?'left':'restantes'}`)+cargoRow+row(`<label>${en?'Voyage progress':'Progreso del viaje'} <progress max="100" value="${pct}">${pct}%</progress> ${pct}%</label>`)+ev+open;
}
