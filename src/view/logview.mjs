/** Format log entries without assuming every producer has a template in the host. */
// Coin amounts are stored unrounded (e.g. 183.60000000000002); show whole coins, like the rest of the UI.
const MONEY_KEYS=new Set(['sum','price','cost','revenue']);
export function logText(entry,t,lang,cityName=x=>x,shipName=x=>x){
 const own=typeof entry.txt==='string'?entry.txt:entry.txt?.[lang]??entry.txt?.es;
 if(own!=null)return `${t.day} ${entry.day}: ${own}`;
 const template=t.log?.[entry.key];
 if(typeof template!=='string')return `${t.day} ${entry.day}: ${lang==='es'?'La casa mercantil ha recibido noticias.':'Your trading house has received news.'}`;
 return template.replace(/\{(\w+)\}/g,(_,k)=>k==='ship'?shipName(entry.ship):k==='city'||k==='at'?cityName(entry[k]):k==='good'?(t.goods[entry.good]??entry.good):MONEY_KEYS.has(k)&&Number.isFinite(entry[k])?String(Math.round(entry[k])):(entry[k]??''));
}
export function logHtml(entries,t,lang,cityName,shipName){
 const esc=s=>String(s).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const rows=[];
 for(const e of entries){const x=logText(e,t,lang,cityName,shipName);const l=rows[rows.length-1];if(l&&l.x===x)l.n++;else rows.push({x,n:1});}
 return rows.map(r=>`<div>${esc(r.x)}${r.n>1?` ×${r.n}`:''}</div>`).join('');
}
