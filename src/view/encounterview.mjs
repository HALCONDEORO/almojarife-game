import {recordedShipName} from '../sim/shipnames.mjs';
import {encounterText} from '../game/encounters.mjs';
import {pirateOdds} from './oddsview.mjs';
const PRIZE_NAMES={es:{barca:'una barca',cog:'un cogue',caravel:'una carabela',nao:'una nao'},en:{barca:'a barca',cog:'a cog',caravel:'a caravel',nao:'a nao'}};
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
export function encountersHtml(g,lang='es'){
 const rows=g.encounters??[];if(!rows.length)return '';
 return `<h3>${lang==='es'?'Sucesos en el mar':'Sea encounters'}</h3>`+rows.slice(0,20).map(e=>`<p>${lang==='es'?'Día':'Day'} ${e.day} · ${lang==='es'?'Barco':'Ship'} ${esc(recordedShipName(g,e.ship,e.shipName))}: ${esc(encounterText(e,lang))}</p>`).join('');
}

export function encounterDialogHtml(g,lang='es'){
 const es=lang==='es',p=g.pending,e=g.encounterReport;
 if(p?.event==='sea-pirates')return `<div class="sea-shade"><section class="sea-dialog" role="dialog" aria-modal="true" aria-labelledby="sea-title"><small>${es?'BARCO':'SHIP'} ${esc(recordedShipName(g,p.ship,p.shipName))} · ${es?'DÍA':'DAY'} ${esc(p.day)}</small><h2 id="sea-title">${es?'¡Velas piratas!':'Pirate sails!'}</h2><p>${es?'Un barco hostil cierra el paso. Tú decides; el encuentro se resolverá sin combate táctico.':'A hostile ship blocks your course. You decide; the encounter resolves without tactical combat.'}</p><p>${es?'Si escapas: sin daños ni pérdidas de carga, pero un día de retraso y posible retroceso del progreso. Si no: combate.':'If you escape: no damage or cargo lost, but a one-day delay and possible progress setback. If not: combat.'}</p>${(()=>{const o=pirateOdds(g,lang);return `<div class="ev-choice"><button data-sea="flee">${es?'Intentar huir':'Try to flee'} (${esc(p.escapeChance)}% ${es?'de éxito':'success'})</button>${o?`<small class="ev-odds">${esc(o.flee)}</small>`:''}</div><div class="ev-choice"><button data-sea="fight">${es?'Luchar':'Fight'}</button>${o?`<small class="ev-odds">${esc(o.fight)}</small>`:''}</div>`;})()}<p><small>${es?'El tiempo está en pausa.':'Time is paused.'}</small></p></section></div>`;
 if(!e)return '';
 const common=`<div class="sea-shade"><section class="sea-dialog" role="dialog" aria-modal="true" aria-labelledby="sea-title"><small>${es?'BARCO':'SHIP'} ${esc(recordedShipName(g,e.ship,e.shipName))} · ${es?'DÍA':'DAY'} ${esc(e.day)}</small><h2 id="sea-title">${es?'Informe del encuentro':'Encounter report'}</h2><p>${es?(e.choice==='flee'?'Ordenaste intentar huir.':'Ordenaste luchar.'):(e.choice==='flee'?'You ordered an escape attempt.':'You ordered a fight.')}</p>${e.escapeFailed?`<p>${es?'La huida falló. La tripulación tuvo que luchar.':'Escape failed. The crew had to fight.'}</p>`:''}<p>${esc(encounterText(e,lang))}</p>`;
 if(e.prize&&e.prize.taken===undefined){
  const name=(es?PRIZE_NAMES.es:PRIZE_NAMES.en)[e.prize.type]??(es?'un barco':'a ship');
  return common+`<p>${es?`Los piratas huyen y abandonan ${name} (casco ${e.prize.hull}%). Puedes quedártelo: seguirá a tu barco sin tripulación y un astillero pagará menos por él que por uno cuidado.`:`The pirates flee and abandon ${name} (hull ${e.prize.hull}%). You can keep it: it will follow your ship with no crew, and a shipyard pays less for it than for a cared-for one.`}</p><button data-sea-claim="keep">${es?'Quedarme el barco':'Keep the ship'}</button> <button data-sea-claim="leave">${es?'Dejarlo a la deriva':'Leave it adrift'}</button><p><small>${es?'El tiempo está en pausa.':'Time is paused.'}</small></p></section></div>`;
 }
 return common+`<p>${es?'El resultado queda guardado. Puedes volver a consultarlo en Informes.':'The result is saved. You can read it again in Reports.'}</p><button data-sea-close>${es?'Continuar':'Continue'}</button></section></div>`;
}
