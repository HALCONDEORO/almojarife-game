// Default ON (owner order 23/10); ?ui2d=0 opts out.
import { LT, messageText } from './ledgerview.mjs';
import { msgClass, groupNotices, actionUnread } from './msgclass.mjs';
const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
export const enabled=search=>new URLSearchParams(search).get('ui2d')!=='0'; // default ON (Marco 23/10); ?ui2d=0 opts out
const categories={
 es:{port:'Puerto',house:'Casa mercantil',bank:'Banco',council:'Concejo',report:'Informe',read:'Leído',new:'Sin leer',intro:'Las noticias de tu casa y del puerto, en un solo lugar.'},
 en:{port:'Port',house:'Trading house',bank:'Bank',council:'Council',report:'Report',read:'Read',new:'Unread',intro:'News from your trading house and the port, in one place.'}
};
export function messageCategory(kind){
 if(['arrival','order','routeLeg','routeStuck'].includes(kind))return ['port','⚓'];
 if(['loan','loanPaid','loanDue','loanLate','loanSeized','debt','bankrupt'].includes(kind))return ['bank','◎'];
 if(['contractAccept','contractDone','contractFailed','respect'].includes(kind))return ['council','⚜'];
 if(kind==='report')return ['report','▤'];
 return ['house','✉'];
}
export function inbox2dHtml(g,lang,fmt,cityName,goodName){
 const t=LT[lang],c=categories[lang],all=g.inbox??[],txt=m=>messageText(m,lang,fmt,cityName,goodName),acts=all.filter(m=>msgClass(m)==='action'),groups=groupNotices(all.filter(m=>msgClass(m)==='notice'),txt),box=[...acts,...groups.map(e=>({...e.first,read:!e.unread,day:e.day,count:e.n,leg:e.kind==='routeLeg'?e:null}))],n=actionUnread(g);
 return `<div class="ui2d-intro"><p>${c.intro}</p><span class="ui2d-count">${n} ${t.unreadWord}</span></div>`+
 (box.length?`<div class="ui2d-tools"><button id="l-all"${n?'':' disabled'}>${t.markAll}</button></div><div class="ui2d-messages">`+box.map(m=>{const [cat,icon]=messageCategory(m.kind);return `<button type="button" class="ui2d-message${m.read?'':' is-unread'}" data-msg="${Number(m.id)}"><span class="ui2d-seal" aria-hidden="true">${icon}</span><span class="ui2d-letter"><span class="ui2d-message-meta"><b>${c[cat]}</b><span>${t.day} ${esc(m.day)}</span><span class="ui2d-read">${m.read?c.read:c.new}</span></span><span class="ui2d-message-text">${esc(m.leg?(lang==='en'?`Ship ${m.ship}: ${m.count} route sale${m.count>1?'s':''}, profit ${fmt(m.leg.profit)}`:`Barco ${m.ship}: ${m.count} venta${m.count>1?'s':''} de ruta, ganancia ${fmt(m.leg.profit)}`):txt(m))}${m.count>1&&!m.leg?` <b>×${m.count}</b>`:''}</span></span></button>`;}).join('')+`</div>`:`<div class="ui2d-empty"><span aria-hidden="true">✉</span><p>${t.noMsg}</p></div>`);
}

/** Town-hall presentation consumes the existing view model, including optional city lines. */
export function hall2dHtml(hv,t,fmt,respect,lang){
 const line=(key,values={})=>esc(Object.entries(values).reduce((s,[k,v])=>s.replace(`{${k}}`,v),t[key]));
 const card=(icon,title,text)=>`<section class="ui2d-hall-card"><span aria-hidden="true">${icon}</span><div><h4>${esc(title)}</h4><p>${text}</p></div></section>`;
 const cityLines=[hv.identity,hv.mood,hv.craft,hv.festival,hv.memory,hv.relations,hv.growth].filter(Boolean).map(l=>l.txt?.[lang]??l.txt?.es).filter(Boolean);
 return `<div class="ui2d-hall"><p class="ui2d-hall-intro">${esc(t.hallInfo)}</p><div class="ui2d-officers">`+
 card('⚜',t.hallMayor,esc(hv.mayor))+hv.councillors.map((n,i)=>card('◈',`${t.hallRegs} ${i+1}`,esc(n))).join('')+`</div><p class="ui2d-standing">${line('hallStand',{r:respect,n:hv.respectPts})}</p>`+
 (cityLines.length?`<div class="ui2d-city-lines">${cityLines.map(l=>`<p>${esc(l)}</p>`).join('')}</div>`:'')+
 `<h3>${esc(t.hallDerechos)}</h3><div class="ui2d-duties">`+card('◎',lang==='es'?'Mercado':'Market',line('hallFee',{p:hv.feePct}))+card('⚓',lang==='es'?'Puerto':'Port',line('hallToll',{d:hv.tollDiv,x:hv.tollDiscountPct}))+`</div><section class="ui2d-hall-ledger"><p><b>${line('hallCaja',{c:fmt(hv.caja)})}</b></p><p>${line('hallLevies',{s:(hv.sisaPct>0?'+':'')+hv.sisaPct+'%',p:(hv.portazgoPct>0?'+':'')+hv.portazgoPct+'%'})}</p><p class="ui2d-meeting">▤ ${line('hallNext',{d:hv.nextMeeting})}</p></section><p class="ui2d-hall-note">${esc(t.hallNote)}</p></div>`;
}

/** Decorates the existing reports without recalculating or dropping report data. */
export function reports2dHtml(weekly,chronicle,voyages,encounters,lang){
 const labels=lang==='es'?['Cuentas semanales','Crónica de la casa','Diario de viajes','Encuentros en el mar']:['Weekly accounts','House chronicle','Voyage log','Encounters at sea'];
 const ids=['weekly','chronicle','voyages','encounters'],parts=[weekly.replace(/^<h2>[^<]*<\/h2>/,''),chronicle,voyages,encounters];
 return `<nav class="ui2d-report-nav" aria-label="${LT[lang].reports}">`+ids.map((id,i)=>`<button type="button" data-report-target="ui2d-${id}">${labels[i]}</button>`).join('')+`</nav>`+parts.map((html,i)=>`<section class="ui2d-report-section" id="ui2d-${ids[i]}" aria-label="${labels[i]}">${i===0?`<h3>${labels[i]}</h3>`:''}${html||`<p>${lang==='es'?'Aún no hay registros.':'No records yet.'}</p>`}</section>`).join('');
}
