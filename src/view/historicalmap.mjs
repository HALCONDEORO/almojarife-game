import {goodIcon} from "../../web/icons.mjs";
import {markerScale,labelFontSize} from "./camera.mjs";
// Original SVG/UI. Informational only: no economy, discovery or warfare effects.
export const HISTORICAL_MAPS_ENABLED=true;
export const MAP_MODES=['geographic','political','leagues','trade'];
const TEXT={es:{trade:'Rutas y producción',label:'Mapa',geographic:'Geográfico',political:'Político',leagues:'Ligas y hermandades',unknown:'Sin atribución verificada',ports:'Colores de puertos; no fronteras territoriales.',zones:'Veladuras aproximadas, no fronteras exactas.',pending:'Datos históricos pendientes de verificar para este año.'},en:{trade:'Trade routes and production',label:'Map',geographic:'Geographic',political:'Political',leagues:'Leagues and brotherhoods',unknown:'No verified attribution',ports:'Port colours, not territorial boundaries.',zones:'Approximate washes, not exact borders.',pending:'Historical data not yet verified for this year.'}};
const COLORS=['#9e3f35','#315b83','#587346','#8a5b94','#a87820','#287d79','#74503b'];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function mapModeControls({enabled=HISTORICAL_MAPS_ENABLED,mode='geographic',lang='es'}={}){
 if(!enabled)return '';const t=TEXT[lang]??TEXT.es;
 return `<details><summary style="cursor:pointer;display:inline-block;background:#7a5a2a;color:#fff8e6;border-radius:4px;padding:6px 12px">${t.label}</summary><label> <select id="map-mode" aria-label="${t.label}">${MAP_MODES.map(id=>`<option value="${id}"${id===mode?' selected':''}>${t[id]}</option>`).join('')}</select></label></details>`;
}
/** Only individually sourced holdings in the game's 1480-1600 range are eligible. Data from a corrected
 * upstream realm table is injected, not silently duplicated here. Unknown != neutral.
 * All ports passed MUST already be filtered by the player's discovered chart. */
export function politicalHolding(data,port,year){
 if(!data||!Number.isInteger(year)||year<1480||year>1600)return null;
 // Do not let an unsourced/conflicting row disappear before overlap detection.
 const rows=(data.holdings??[]).filter(h=>h.port===port&&(h.from==null||year>=h.from)&&(h.until==null||year<h.until));
 if(rows.length!==1)return null;const h=rows[0];
 if(!data.realms?.[h.realm]?.name||!/^https:\/\//.test(h.source??''))return null;
 if(['from','until'].some(k=>h[k]!=null&&!Number.isInteger(h[k])))return null;
 return h;
}
export function politicalPortLayer({ports,year,data,x,y,lang='es',enabled=false}){
 if(!enabled)return{svg:'',legend:''};const t=TEXT[lang]??TEXT.es,es=lang==='es';
 if(!data||!Number.isInteger(year)||year<1480||year>1600)return{svg:'',legend:''};
 const ids=Object.keys(data.realms??{}).sort(),used=new Set(),unknown=[];let svg='';
 for(const p of ports){const h=politicalHolding(data,p.id,year);if(!h){unknown.push(esc(p.name??p.id));continue;}const id=h.realm,name=data.realms[id].name[lang]??id;used.add(id);const color=COLORS[ids.indexOf(id)%COLORS.length];
 svg+=`<g data-mx="${x(p.lon)}" data-my="${y(p.lat)}"><circle cx="0" cy="0" r="13" fill="none" stroke="${color}" stroke-width="4" pointer-events="none"><title>${esc(name)}</title></circle></g>`;

 }
 const key=[...used].sort().map(id=>`<span style="display:inline-block;border-left:8px solid ${COLORS[ids.indexOf(id)%COLORS.length]};padding-left:4px">${esc(data.realms[id].name[lang]??id)}</span>`).join(' · ');
 return{svg,legend:`${year}: ${key}`};
}
/** Approximate hand-drawn realm washes from data.zones: soft fills, never borders.
 * Only cited rows for known realms render; zones stay behind ports (underlay). */
export function politicalZoneLayer({year,data,x,y,lang='es',enabled=false}){
 if(!enabled)return{svg:'',legend:''};
 if(!data||!Number.isInteger(year)||year<1480||year>1600)return{svg:'',legend:''};
 if(typeof x!=='function'||typeof y!=='function')return{svg:'',legend:''};
 const ids=Object.keys(data.realms??{}).sort();let svg='';
 for(const z of data.zones??[]){
  const r=data.realms?.[z.realm];
  if(!r?.name||!/^https:\/\//.test(z.source??''))continue;
  if(['from','until'].some(k=>z[k]!=null&&!Number.isInteger(z[k])))continue;
  if((z.from!=null&&year<z.from)||(z.until!=null&&year>=z.until))continue;
  const pts=z.polygon;
  if(!Array.isArray(pts)||pts.length<3||!pts.every(pt=>Array.isArray(pt)&&pt.length===2&&pt.every(Number.isFinite)))continue;
  const color=COLORS[ids.indexOf(z.realm)%COLORS.length];
  const d=pts.map((pt,i)=>`${i===0?'M':'L'}${x(pt[0])} ${y(pt[1])}`).join(' ')+' Z';
  svg+=`<path d="${d}" fill="${color}" fill-opacity="0.16" stroke="none" pointer-events="none"><title>${esc(r.name[lang]??z.realm)}</title></path>`;
 }
 return{svg,legend:''};
}
export function historicalLayer({mode,...args}){if(!args.enabled)return {svg:'',legend:''};if(mode==='political'){const zones=politicalZoneLayer(args),ports=politicalPortLayer(args),t=TEXT[args.lang]??TEXT.es;return{underlay:zones.svg,svg:ports.svg,legend:ports.legend?`${ports.legend}<br><span style="font-size:12px;opacity:.75">${t.zones} ${t.ports}</span>`:''};}if(mode==='trade')return tradePortLayer(args);if(mode==='leagues')return leaguePortLayer({...args,data:args.leagues});return{svg:'',legend:mode==='leagues'?(TEXT[args.lang]??TEXT.es).pending:''};}
/** Declared game specialisations only. No inferred historical trade volumes. */
export function tradePortLayer({enabled=false,ports=[],lang='es',goodName=id=>id,x,y,bounds={width:800,height:850},zoom=1}){
 if(!enabled)return{svg:'',legend:''};const es=lang==='es';
 const cards=typeof x==='function'&&typeof y==='function'?tradeGoodsCards({ports,x,y,lang,goodName,bounds,zoom}):'';
 return{svg:cards,legend:''};
}
/** Dated institutional evidence, not territory, alliances in game or invented routes. */
export function leaguePortLayer({enabled=false,ports=[],year,data,lang='es',x,y}){
 if(!enabled)return{svg:'',legend:''};
 const rows=(data?.leagues??[]).filter(l=>Number.isInteger(year)&&year>=l.from&&year<l.until&&/^https:\/\//.test(l.rosterSource)&&/^https:\/\//.test(l.periodSource));
 let svg='';const legend=rows.map(l=>{for(const p of ports.filter(p=>l.ports.includes(p.id)))svg+=`<g data-mx="${x(p.lon)}" data-my="${y(p.lat)}"><rect x="-12" y="-12" width="24" height="24" fill="none" stroke="#315b83" stroke-width="3" pointer-events="none"/></g>`;return `<p><b>${esc(l.name[lang])}</b>: ${esc(l.kind[lang])}.</p>`;}).join('');
 return{svg,legend};
}
// Hand-set original cartographic callouts for dense clusters; offsets are screen
// marker units, so they remain readable with the existing inverse zoom scaling.
export function mapLabelPlacement(id){return ({lisboa:{x:-18,y:-14,anchor:'end'},setubal:{x:18,y:22,anchor:'start'},santander:{x:-18,y:-16,anchor:'end'},bilbao:{x:0,y:32,anchor:'middle'},sansebastian:{x:18,y:-14,anchor:'start'},ceuta:{x:26,y:-12,anchor:'start'},tanger:{x:-18,y:-12,anchor:'end'},tetuan:{x:42,y:10,anchor:'start'},arcila:{x:-24,y:2,anchor:'end'},larache:{x:-18,y:20,anchor:'end'},huelva:{x:-18,y:-14,anchor:'end'},tarragona:{x:0,y:24,anchor:'middle'},oran:{x:-18,y:4,anchor:'end'},faro:{x:0,y:24,anchor:'middle'},mazagan:{x:0,y:26,anchor:'middle'},casablanca:{x:-20,y:-16,anchor:'end'}})[id]??{x:14,y:4,anchor:'start'};}

/** Stable collision-free cards in map coordinates at overview zoom. */
const cardLayouts=new Map();
export function tradeCardLayout(ports,x,y,bounds={width:800,height:850},zoom=1,obstaclePorts=ports){
 const cacheKey=JSON.stringify([bounds,zoom,ports.map(p=>[p.id,p.name,p.makes,p.needs,x(p.lon),y(p.lat)])]);
 if(cardLayouts.has(cacheKey))return cardLayouts.get(cacheKey);
 const gap=5/zoom,boxes=[],out=[];
 const hits=(a,b)=>a.x<b.x+b.w+gap&&a.x+a.w+gap>b.x&&a.y<b.y+b.h+gap&&a.y+a.h+gap>b.y;
 // Protect real port markers and the labels already placed on the chart.
 const fs=labelFontSize(zoom),k=markerScale(zoom);
 // Obstacles mirror the DOM label model (maplabels.test.mjs): labels render inside a group
 // scaled by markerScale(zoom) with font labelFontSize(zoom); 0.571*fs per char is the audited
 // conservative width bound. Cards must avoid the label the player actually sees.
 const obstacles=obstaclePorts.flatMap(p=>{const px=x(p.lon),py=y(p.lat),l=mapLabelPlacement(p.id),w=p.name.length*fs*0.571*k,h=1.214*fs*k,tx=px+k*l.x,ty=py+k*l.y;return[{x:px-13*k,y:py-13*k,w:26*k,h:26*k},{x:tx-(l.anchor==='end'?w:l.anchor==='middle'?w/2:0),y:ty-13*(fs/14)*k,w,h}];});
 for(const p of [...ports].sort((a,b)=>{const near=p=>ports.filter(q=>Math.hypot(x(q.lon)-x(p.lon),y(q.lat)-y(p.lat))<100).length;return near(b)-near(a)||a.id.localeCompare(b.id)})){const px=x(p.lon),py=y(p.lat),size=tradeCardSize(p),W=size.w/zoom,H=size.h/zoom,candidates=[];
 for(let yy=8;yy<bounds.height-H-8;yy+=Math.max(4,16/zoom))for(let xx=8;xx<bounds.width-W-8;xx+=Math.max(4,16/zoom)){const b={x:xx,y:yy,w:W,h:H};if([...boxes,...obstacles].some(o=>hits(b,o)))continue;const dx=xx+W/2-px,dy=yy+H-py;candidates.push({...b,score:dx*dx+dy*dy+(dy>0?1600:0)});}
 candidates.sort((a,b)=>a.score-b.score);const b=candidates[0];if(!b)continue;boxes.push(b);out.push({port:p,box:b,px,py});
 }if(cardLayouts.size>4)cardLayouts.clear();cardLayouts.set(cacheKey,out);return out;
}
export function tradeCardSize(p){return {w:138,h:20+Math.max(1,Math.ceil((p.makes?.length??0)/4))*27+Math.max(1,Math.ceil((p.needs?.length??0)/4))*27};}
export const tradeBadgePorts=(ports,zoom=1)=>zoom>=1.8?ports.filter(p=>zoom>=3||(p.pop??0)>=5000):ports.filter(p=>(p.pop??0)>=12000).sort((a,b)=>(b.pop??0)-(a.pop??0)||a.id.localeCompare(b.id)).slice(0,5);
export function tradeGoodsCards({ports,x,y,lang,goodName,bounds,zoom=1}){
 const es=lang==='es';return tradeCardLayout(tradeBadgePorts(ports,zoom),x,y,bounds,zoom,ports).map(({port:p,box:b,px,py})=>{
 const title=`${p.name}: ${es?'produce':'produces'} ${(p.makes??[]).map(goodName).join(', ')||'-'}; ${es?'pide':'needs'} ${(p.needs??[]).map(goodName).join(', ')||'-'}`;
 const size=tradeCardSize(p),nMakes=Math.max(1,Math.ceil((p.makes?.length??0)/4));
 const row=(goods,yy,label,color)=>`<text x="5" y="${yy+18}" font-size="18" font-weight="bold" fill="${color}">${label}</text>${goods.map((id,i)=>`<g transform="translate(${26+(i%4)*27} ${yy+Math.floor(i/4)*27})"><title>${esc(goodName(id))}</title>${goodIcon(id,24)}</g>`).join('')}`;
 return `<path d="M${px} ${py}L${b.x+b.w/2} ${b.y+b.h/2}" fill="none" stroke="#74634a" stroke-width=".8" pointer-events="none"/><g class="trade-card" data-port="${esc(p.id)}" transform="translate(${b.x} ${b.y}) scale(${1/zoom})" tabindex="0" aria-label="${esc(title)}"><title>${esc(title)}</title><rect width="${size.w}" height="${size.h}" rx="5" fill="#fff8e7" stroke="#625238" stroke-width="1.4"/><text x="5" y="14" font-size="12" font-weight="bold" fill="#302519">${esc(p.name)}</text>${row(p.makes??[],20,'↑','#215b37')}${row(p.needs??[],20+nMakes*27,'↓','#813c1d')}</g>`;
 }).join('');
}
