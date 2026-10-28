// Player controls for the existing privateering rules. Own wording; no balance changes.
import {namableRealms,realmOf,sameMonarch,LETTER_FEE,activeLetter} from '../game/marque.mjs';
import {targetsFor} from '../game/privateering.mjs';
import {atPeace,suspended} from '../game/peace.mjs';
import {yearOf} from '../game/chronicle.mjs';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function privateeringHallHtml(g,s,realms,peaces,lang='es'){
 if(g.marque!==true||g.over||s?.voyage)return '';
 const es=lang==='es',year=yearOf(g.day,g.startYear),issuer=realmOf(realms,s.at,year);
 const rows=namableRealms(realms,year).filter(r=>issuer&&!sameMonarch(realms,issuer,r,year));
 return `<section class="card" data-privateering-hall><h3>${es?'Cartas de marca y presas':'Letters of marque and prizes'}</h3><p>${es?'Una carta dura 365 días y cuesta 600 monedas. Autoriza ataques a mercantes del reino indicado, salvo durante una paz. Un quinto del botín se entrega al emisor.':'A letter lasts 365 days and costs 600 coins. It licenses attacks on traders of the named realm, except during peace. One fifth of loot goes to the issuer.'}</p>`+rows.map(r=>{
 const l=activeLetter(g,r),name=esc(realms.realms[r].name[lang]??realms.realms[r].name.es);
 return `<p>${name}${atPeace(g,realms,peaces,issuer,r).peace?' · '+(es?'paz vigente: la carta no autoriza ataques ahora':'peace in force: the letter cannot license attacks now'):''}: ${l?`${es?'Vence día':'Expires day'} ${l.until}${suspended(g,realms,peaces,l)?' · '+(es?'suspendida por paz':'suspended by peace'):''}`:`<button data-letter="${esc(r)}" ${g.cash<LETTER_FEE?'disabled':''}>${es?'Comprar carta':'Buy letter'} (${LETTER_FEE})</button>`}</p>`;
 }).join('')+`${s.prizeLots?.length?`<button data-settle-prize>${es?'Presentar presas al tribunal':'Present prizes to court'}</button><p>${es?'El tribunal puede liberar o confiscar la carga según el reino y tu reputación.':'The court may release or seize cargo according to realm and reputation.'}</p>`:''}</section>`;
}
export function privateeringSeaHtml(g,s,realms,peaces,lang='es'){
 if(g.marque!==true||g.over||!s?.voyage)return '';
 const es=lang==='es',targets=targetsFor(g,realms,s,peaces,{unlicensed:true});
 return `<section class="card" data-privateering-sea><h3>${es?'Mercantes a la vista':'Traders in sight'}</h3><p>${es?'Atacar puede dañar o hundir ambos barcos. Sin carta válida habrá cargos si tomas botín.':'Attacking can damage or sink either ship. Taking loot without a valid letter creates charges.'}</p>`+(targets.length?targets.map(t=>`<p>${esc(realms.realms[t.realm].name[lang]??realms.realms[t.realm].name.es)} · ${t.unlicensed?(es?'sin carta válida':'no valid letter'):(es?'con carta válida':'valid letter')} <button data-trader-attack="${t.index}">${es?'Atacar':'Attack'}</button></p>`).join(''):`<p>${es?'No hay mercantes en tu misma ruta ahora.':'No traders share your route now.'}</p>`)+`</section>`;
}
