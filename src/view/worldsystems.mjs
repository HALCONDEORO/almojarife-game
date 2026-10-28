import {HOUSEHOLD_RATE_YEAR,cityHealth} from '../game/household.mjs';
import {calamityActive} from '../game/calamities.mjs';
const esc=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
export function worldSystemsHtml(g,port,lang='es'){
 const es=lang==='es';let h='';
 if(g.household===true)h+=`<p>${es?'Tributo de las casas':'Household tribute'}: ${HOUSEHOLD_RATE_YEAR*100}% ${es?'del patrimonio al año, cobrado cada semana por igual a tu casa y rivales. Salud del puerto':'of net worth per year, charged weekly to your house and rivals alike. Port health'}: ${cityHealth(g,port).toFixed(2)}</p>`;
 if(g.calamities)h+=`<p>${es?'Calamidades activas':'Active calamities'}: ${calamityActive(g,port).map(esc).join(', ')||(es?'ninguna':'none')}</p>`;
 if(g.regionalRivals===true)h+=`<h4>${es?'Casas rivales':'Rival houses'}</h4>`+g.ai.map(b=>`<p>${esc(b.house?.house??'')} · ${esc(b.house?.name??'')}</p>`).join('');
 return h?`<section class="card" data-world-systems>${h}</section>`:'';
}
