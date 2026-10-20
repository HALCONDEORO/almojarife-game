import {encounterText} from '../game/encounters.mjs';
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
export function encountersHtml(g,lang='es'){
 const rows=g.encounters??[];if(!rows.length)return '';
 return `<h3>${lang==='es'?'Sucesos en el mar':'Sea encounters'}</h3>`+rows.slice(0,20).map(e=>`<p>${lang==='es'?'Día':'Day'} ${e.day} · ${lang==='es'?'Barco':'Ship'} ${e.ship}: ${esc(encounterText(e,lang))}</p>`).join('');
}

export function encounterDialogHtml(g,lang='es'){
 const es=lang==='es',p=g.pending,e=g.encounterReport;
 if(p?.event==='sea-pirates')return `<div class="sea-shade"><section class="sea-dialog" role="dialog" aria-modal="true" aria-labelledby="sea-title"><small>${es?'BARCO':'SHIP'} ${esc(p.ship)} · ${es?'DÍA':'DAY'} ${esc(p.day)}</small><h2 id="sea-title">${es?'¡Velas piratas!':'Pirate sails!'}</h2><p>${es?'Un barco hostil cierra el paso. Tú decides; el encuentro se resolverá sin combate táctico.':'A hostile ship blocks your course. You decide; the encounter resolves without tactical combat.'}</p><p>${es?'Si la huida falla, tu tripulación luchará. Huir con éxito retrasa el viaje un día, sin pérdidas.':'If escape fails, your crew will fight. A successful escape costs one day, with no losses.'}</p><button data-sea="flee">${es?'Intentar huir':'Try to flee'} (${esc(p.escapeChance)}% ${es?'de éxito':'success'})</button> <button data-sea="fight">${es?'Luchar':'Fight'}</button><p><small>${es?'El tiempo está en pausa.':'Time is paused.'}</small></p></section></div>`;
 if(!e)return '';
 return `<div class="sea-shade"><section class="sea-dialog" role="dialog" aria-modal="true" aria-labelledby="sea-title"><small>${es?'BARCO':'SHIP'} ${esc(e.ship)} · ${es?'DÍA':'DAY'} ${esc(e.day)}</small><h2 id="sea-title">${es?'Informe del encuentro':'Encounter report'}</h2><p>${es?(e.choice==='flee'?'Ordenaste intentar huir.':'Ordenaste luchar.'):(e.choice==='flee'?'You ordered an escape attempt.':'You ordered a fight.')}</p>${e.escapeFailed?`<p>${es?'La huida falló. La tripulación tuvo que luchar.':'Escape failed. The crew had to fight.'}</p>`:''}<p>${esc(encounterText(e,lang))}</p><p>${es?'El resultado queda guardado. Puedes volver a consultarlo en Informes.':'The result is saved. You can read it again in Reports.'}</p><button data-sea-close>${es?'Continuar':'Continue'}</button></section></div>`;
}
