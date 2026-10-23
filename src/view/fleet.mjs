import {cargoUsed} from '../game/game.mjs';
import {shipCapacity} from '../sim/trade.mjs';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Fold diacritics so "cadiz" matches "Cádiz": ids are unaccented, display names are not.
const fold=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export function fleetRows(ships,{filter='all',search='',cityName=id=>id}={}){
 const needle=fold(search.trim());
 return ships.map((s,index)=>({s,index,state:s.voyage?'sea':s.route?'route':'idle'})).filter(r=>(filter==='all'||filter===r.state)&&(!needle||fold([String(r.s.name??r.s.id),r.s.at,r.s.voyage?.to??'',cityName(r.s.at),r.s.voyage?cityName(r.s.voyage.to):''].join(' ')).includes(needle)));
}
export function fleetHtml(g,selected,{lang='es',filter='all',search='',cityName=id=>id,types={}}={}){
 const en=lang==='en',rows=fleetRows(g.ships,{filter,search,cityName});
 return `<h3>${en?'Fleet':'Flota'} (${g.ships.length})</h3><label>${en?'Search ship or port':'Buscar barco o puerto'} <input id="fleet-search" type="search" value="${esc(search)}"></label><label>${en?'Show':'Ver'} <select id="fleet-filter">${[['all',en?'All':'Todos'],['idle',en?'Without orders':'Sin orden'],['sea',en?'At sea':'En el mar'],['route',en?'Automatic route in port':'Ruta automática en puerto']].map(([v,l])=>`<option value="${v}" ${filter===v?'selected':''}>${l}</option>`).join('')}</select></label><p>${en?'Selected':'Seleccionado'}: ${esc(types[g.ships[selected]?.type]??g.ships[selected]?.type??'')} ${esc(g.ships[selected]?.id??'')}</p><div class="fleet-rows">${rows.map(({s,index,state})=>`<button class="fleet-row" data-fleet-ship="${index}" aria-pressed="${index===selected}"><b>${esc(s.name??`${types[s.type]??s.type} ${s.id}`)}</b><span>${esc(s.voyage?`${cityName(s.voyage.from)} → ${cityName(s.voyage.to)}`:cityName(s.at))}</span><small>${state==='sea'?(en?'At sea':'En el mar'):state==='idle'?(en?'Without orders':'Sin orden'):(en?'Automatic route':'Ruta automática')} · ${en?'Cargo':'Carga'} ${cargoUsed(s)}/${shipCapacity(s)} · ${en?'Hull':'Casco'} ${Math.round(s.hull??100)}%</small></button>`).join('')||`<p>${en?'No ships match.':'No hay barcos que coincidan.'}</p>`}</div>`;
}
