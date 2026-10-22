// Original SVG/UI. Informational only: no economy, discovery or warfare effects.
export const HISTORICAL_MAPS_ENABLED=false;
export const MAP_MODES=['geographic','political','leagues','trade'];
const TEXT={es:{trade:'Rutas y producción',label:'Mapa',geographic:'Geográfico',political:'Político',leagues:'Ligas y hermandades',unknown:'Sin atribución verificada',ports:'Colores de puertos; no fronteras territoriales.',pending:'Datos históricos pendientes de verificar para este año.'},en:{trade:'Trade routes and production',label:'Map',geographic:'Geographic',political:'Political',leagues:'Leagues and brotherhoods',unknown:'No verified attribution',ports:'Port colours, not territorial boundaries.',pending:'Historical data not yet verified for this year.'}};
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
export function historicalLayer({mode,...args}){if(!args.enabled)return {svg:'',legend:''};if(mode==='political')return politicalPortLayer(args);if(mode==='trade')return tradePortLayer(args);if(mode==='leagues')return leaguePortLayer({...args,data:args.leagues});return{svg:'',legend:mode==='leagues'?(TEXT[args.lang]??TEXT.es).pending:''};}
/** Declared game specialisations only. No inferred historical trade volumes. */
export function tradePortLayer({enabled=false,ports=[],lang='es',goodName=id=>id}){
 if(!enabled)return{svg:'',legend:''};const es=lang==='es';
 return{svg:'',legend:`<p>${es?'Rutas comerciales. Consulta qué produce y qué pide cada puerto.':'Trade routes. See what each port produces and needs.'}</p><details><summary>${es?'Producción y demanda por puerto':'Production and demand by port'}</summary><ul>${ports.map(p=>`<li><b>${esc(p.name)}</b>: ${es?'produce':'produces'} ${(p.makes??[]).map(id=>esc(goodName(id))).join(', ')||'-'}; ${es?'pide':'needs'} ${(p.needs??[]).map(id=>esc(goodName(id))).join(', ')||'-'}</li>`).join('')}</ul></details>`};
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
export function mapLabelPlacement(id){return ({lisboa:{x:-18,y:-14,anchor:'end'},setubal:{x:18,y:22,anchor:'start'},santander:{x:-18,y:-16,anchor:'end'},bilbao:{x:0,y:32,anchor:'middle'},sansebastian:{x:18,y:-14,anchor:'start'},ceuta:{x:26,y:-12,anchor:'start'},tanger:{x:-18,y:-12,anchor:'end'},tetuan:{x:42,y:10,anchor:'start'},arcila:{x:-18,y:4,anchor:'end'},larache:{x:-18,y:20,anchor:'end'}})[id]??{x:14,y:4,anchor:'start'};}
