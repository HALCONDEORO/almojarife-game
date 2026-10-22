// Read-only selected-ship voyage summary. ETA is an estimate, not a promise.
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function voyageSummary(s){
 if(!s?.voyage)return{atPort:true,port:s?.at};
 const v=s.voyage,total=Math.max(1,v.totalTicks??v.ticksLeft??1),left=Math.max(0,v.ticksLeft??0),progress=Math.max(0,Math.min(1,1-left/total));
 return{atPort:false,from:v.from,to:v.to,progress,remainingKm:Math.max(0,(v.km??0)*(1-progress)),ticksLeft:left};
}
export function voyageCardHtml(s,{lang='es',cityName=id=>id,eta=()=>''}={}){
 const en=lang==='en',r=voyageSummary(s);
 if(r.atPort)return `<b>${en?'Selected ship':'Barco seleccionado'} ${esc(s.id)}</b> · ${en?'At port':'En puerto'}: ${esc(cityName(r.port))}`;
 return `<b>${en?'Selected ship':'Barco seleccionado'} ${esc(s.id)}</b> · ${esc(cityName(r.from))} → ${esc(cityName(r.to))}<br><span>${en?'Estimated arrival':'Llegada estimada'}: ${esc(eta(s))}</span> · ≈ ${Math.round(r.remainingKm)} km ${en?'left':'restantes'}<br><label>${en?'Voyage progress':'Progreso del viaje'} <progress max="100" value="${Math.round(r.progress*100)}">${Math.round(r.progress*100)}%</progress> ${Math.round(r.progress*100)}%</label>`;
}
