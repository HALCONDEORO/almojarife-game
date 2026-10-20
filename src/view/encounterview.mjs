import {encounterText} from '../game/encounters.mjs';
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
export function encountersHtml(g,lang='es'){
 const rows=g.encounters??[];if(!rows.length)return '';
 return `<h3>${lang==='es'?'Sucesos en el mar':'Sea encounters'}</h3>`+rows.slice(0,20).map(e=>`<p>${lang==='es'?'Día':'Day'} ${e.day} · ${lang==='es'?'Barco':'Ship'} ${e.ship}: ${esc(encounterText(e,lang))}</p>`).join('');
}
