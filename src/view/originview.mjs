// Founder copy describes the small existing-system grants, not inferred old-save rewards.
import { ORIGIN_RESPECT, ORIGIN_IDS, correspondencePort } from '../game/origin.mjs';
import { startingChart } from '../game/fog.mjs';
import { routeRumorTarget } from '../game/charts.mjs';
import { NAMES } from '../game/profile.mjs';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function originPreview(world, profile) {
 const g={world,day:0,discovered:{},intel:{},ships:[]};
 if(!world.nodes[profile.home])return null;
 startingChart(g,profile.home);
 return {v:1,origin:profile.background,home:profile.home,
  ...(profile.background==='merchant'?{respect:ORIGIN_RESPECT}:{}),
  ...(profile.background==='seafarer'?{city:routeRumorTarget(g,profile.home)}:{}),
  ...(profile.background==='scholar'?{city:correspondencePort(g,profile.home)}:{})};
}
function effect(r, lang, cityName) {
 const es=lang==='es', home=esc(cityName(r.home)), city=esc(cityName(r.city));
 if(r.origin==='merchant')return es?`Tu familia te presenta en ${home}: +${ORIGIN_RESPECT} de respeto. Aún no desbloquea privilegios (primer nivel: 20).`:`Your family introduces you in ${home}: +${ORIGIN_RESPECT} respect. No privileges yet (first tier: 20).`;
 if(r.origin==='seafarer')return r.city?(es?`Recuerdas la ruta hacia ${city}: un puerto más en la carta, sin precios ni orden de navegación.`:`You remember the way to ${city}: one extra port on the chart, without prices or sailing orders.`):(es?'Ya conoces todos los puertos: no se añade otra carta.':'You already know every port: no extra chart is added.');
 return r.city?(es?`Correspondencia de ${city}: una nota de mercado aproximada al empezar. No se actualiza a distancia.`:`Correspondence from ${city}: one approximate market note at the start. It does not update remotely.`):(es?`No hay otro puerto conocido cerca de ${home}: aquí no recibes nota comercial inicial.`:`There is no other known port near ${home}: no starting market note here.`);
}
export function originChoiceHtml(world, profile, lang, cityName) {
 const r=originPreview(world,profile);if(!r||!ORIGIN_IDS.includes(r.origin))return '';
 return `<div class="founding-origin" id="founding-origin"><strong>${lang==='es'?'Tu experiencia abre puertas':'Your experience opens doors'}</strong><p>${effect(r,lang,cityName)}</p><small>${lang==='es'?'Solo al fundar la casa. El origen no cambia después.':'Only when founding the house. Origin cannot be changed later.'}</small></div>`;
}
export function originHouseHtml(g,lang,cityName) {
 const r=g.originStart;if(r?.v!==1||!ORIGIN_IDS.includes(r.origin))return '';
 return `<section class="of-card origin-record"><small>${lang==='es'?'Origen de la casa':'House origins'}</small><strong>${esc(NAMES[lang][r.origin])}</strong><p>${effect(r,lang,cityName)}</p><small>${lang==='es'?'Recuerdo de la fundación, no una recompensa renovable.':'A founding record, not a recurring reward.'}</small></section>`;
}
export function originTavernHtml(g,at,lang) {
 const r=g.originStart;if(r?.v!==1||at!==r.home||!ORIGIN_IDS.includes(r.origin))return '';
 const lines=lang==='es'?{merchant:'«Tu familia ya comerciaba en estos muelles. Ahora tu nombre lo ganarás tú.»',seafarer:'«Conoces la costa. Pero ver un puerto en la carta no te dice cuánto pagan allí.»',scholar:'«Las cartas viajan despacio. Contrasta las noticias con el mercado antes de arriesgar la caja.»'}:{merchant:'"Your family traded on these docks. Now you must earn your own name."',seafarer:'"You know the coast. A port on a chart still tells you nothing about its prices."',scholar:'"Letters travel slowly. Check the market before risking your cash on old news."'};
 return `<p class="origin-greeting">${esc(lines[r.origin])}</p>`;
}
