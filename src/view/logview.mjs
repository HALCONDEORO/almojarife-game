/** Format log entries without assuming every producer has a template in the host. */
export function logText(entry,t,lang,cityName=x=>x){
 const own=typeof entry.txt==='string'?entry.txt:entry.txt?.[lang]??entry.txt?.es;
 if(own!=null)return `${t.day} ${entry.day}: ${own}`;
 const template=t.log?.[entry.key];
 if(typeof template!=='string')return `${t.day} ${entry.day}: ${lang==='es'?'La casa mercantil ha recibido noticias.':'Your trading house has received news.'}`;
 return template.replace(/\{(\w+)\}/g,(_,k)=>k==='city'?cityName(entry.city):k==='good'?(t.goods[entry.good]??entry.good):(entry[k]??''));
}
export function logHtml(entries,t,lang,cityName){
 const esc=s=>String(s).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 return entries.map(e=>`<div>${esc(logText(e,t,lang,cityName))}</div>`).join('');
}
