// Opt-in presentation only. No simulation or save fields belong here.
import { LT, messageText } from './ledgerview.mjs';
const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
export const enabled=search=>new URLSearchParams(search).get('ui2d')==='1';
const categories={
 es:{port:'Puerto',house:'Casa mercantil',bank:'Banco',council:'Concejo',report:'Informe',read:'Leído',new:'Sin leer',intro:'Las noticias de tu casa y del puerto, en un solo lugar.'},
 en:{port:'Port',house:'Trading house',bank:'Bank',council:'Council',report:'Report',read:'Read',new:'Unread',intro:'News from your trading house and the port, in one place.'}
};
export function messageCategory(kind){
 if(['arrival','order','routeLeg','routeStuck'].includes(kind))return ['port','⚓'];
 if(['loan','loanPaid','loanDue','loanLate','debt','bankrupt'].includes(kind))return ['bank','◎'];
 if(['contractAccept','contractDone','contractFailed','respect'].includes(kind))return ['council','⚜'];
 if(kind==='report')return ['report','▤'];
 return ['house','✉'];
}
export function inbox2dHtml(g,lang,fmt,cityName,goodName){
 const t=LT[lang],c=categories[lang],box=g.inbox??[],n=box.filter(m=>!m.read).length;
 return `<div class="ui2d-intro"><p>${c.intro}</p><span class="ui2d-count">${n} ${t.unreadWord}</span></div>`+
 (box.length?`<div class="ui2d-tools"><button id="l-all"${n?'':' disabled'}>${t.markAll}</button></div><div class="ui2d-messages">`+box.map(m=>{const [cat,icon]=messageCategory(m.kind);return `<button type="button" class="ui2d-message${m.read?'':' is-unread'}" data-msg="${Number(m.id)}"><span class="ui2d-seal" aria-hidden="true">${icon}</span><span class="ui2d-letter"><span class="ui2d-message-meta"><b>${c[cat]}</b><span>${t.day} ${esc(m.day)}</span><span class="ui2d-read">${m.read?c.read:c.new}</span></span><span class="ui2d-message-text">${esc(messageText(m,lang,fmt,cityName,goodName))}</span></span></button>`;}).join('')+`</div>`:`<div class="ui2d-empty"><span aria-hidden="true">✉</span><p>${t.noMsg}</p></div>`);
}
