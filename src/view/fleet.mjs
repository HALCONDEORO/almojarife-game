import {shipNameForm} from './shipnameform.mjs';
import {shipDisplayName} from '../sim/shipnames.mjs';
import {cargoUsed} from '../game/game.mjs';
import {shipCapacity} from '../sim/trade.mjs';
import {tickParts} from '../sim/clock.mjs';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Fold diacritics so "cadiz" matches "Cádiz": ids are unaccented, display names are not.
const fold=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export function fleetRows(ships,{filter='all',search='',cityName=id=>id}={}){
 const needle=fold(search.trim());
 return ships.map((s,index)=>({s,index,state:s.voyage?'sea':s.route?'route':'idle'})).filter(r=>(filter==='all'||filter===r.state)&&(!needle||fold([String(r.s.name??r.s.id),r.s.at,r.s.voyage?.to??'',cityName(r.s.at),r.s.voyage?cityName(r.s.voyage.to):''].join(' ')).includes(needle)));
}
export const FLEET_SEARCH_MIN=5; // search and filter only earn their space with more than this many ships
export const showFleetSearch=n=>n>FLEET_SEARCH_MIN;
// Arrival estimate for a ship under way, same math as the ship window (tick + ticksLeft). Anchored ships and rows without a live voyage show nothing, so old saves and fixtures read as before.
export function fleetEta(g,s,en){const tl=s.voyage?.ticksLeft;if(!s.voyage||s.voyage.anchored||!Number.isFinite(tl)||!Number.isFinite(g?.tick))return null;const p=tickParts(g.tick+tl);return `${en?'arrives':'llega'} ${en?'day':'día'} ${p.day}, ${String(p.hour).padStart(2,'0')}:00`;}
export function fleetHtml(g,selected,{lang='es',filter='all',search='',cityName=id=>id,types={}}={}){
 const en=lang==='en',tools=showFleetSearch(g.ships.length);
 if(!tools){filter='all';search='';}
 const rows=fleetRows(g.ships,{filter,search,cityName});
 return `<h3>${en?'Fleet':'Flota'} (${g.ships.length})</h3>${tools?`<label>${en?'Search ship or port':'Buscar barco o puerto'} <input id="fleet-search" type="search" value="${esc(search)}"></label><label>${en?'Show':'Ver'} <select id="fleet-filter">${[['all',en?'All':'Todos'],['idle',en?'Without orders':'Sin orden'],['sea',en?'At sea':'En el mar'],['route',en?'Automatic route in port':'Ruta automática en puerto']].map(([v,l])=>`<option value="${v}" ${filter===v?'selected':''}>${l}</option>`).join('')}</select></label>`:''}<p>${en?'Selected':'Seleccionado'}: ${esc(shipDisplayName(g.ships[selected],types))}</p>${g.ships[selected]?`<details onkeydown="event.stopPropagation()"><summary style="pointer-events:auto;cursor:pointer;padding:2px 0"><svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" style="width:12px;height:12px;background:none;vertical-align:middle"><path d="M3 2 L8 6 L3 10" fill="none" stroke="currentColor" stroke-width="1.5"/></svg> ${en?'Rename':'Renombrar'}</summary>${shipNameForm(g.ships[selected],lang)}</details>`:''}<div class="fleet-rows">${rows.map(({s,index,state})=>`<button class="fleet-row" data-fleet-ship="${index}" aria-pressed="${index===selected}"><b>${esc(s.name??`${types[s.type]??s.type} ${s.id}`)}</b><span>${esc(s.voyage?`${cityName(s.voyage.from)} → ${cityName(s.voyage.to)}`:cityName(s.at))}</span><small>${state==='sea'?(en?'At sea':'En el mar'):state==='idle'?(en?'Without orders':'Sin orden'):(en?'Automatic route':'Ruta automática')}${fleetEta(g,s,en)?` · ${fleetEta(g,s,en)}`:''} · ${en?'Cargo':'Carga'} ${cargoUsed(s)}/${shipCapacity(s)} · ${en?'Hull':'Casco'} ${Math.round(s.hull??100)}%</small></button>`).join('')||`<p>${en?'No ships match.':'No hay barcos que coincidan.'}</p>`}</div>`;
}
