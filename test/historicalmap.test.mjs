import test from'node:test';import assert from'node:assert/strict';import{mapModeControls,politicalPortLayer,HISTORICAL_MAPS_ENABLED}from'../src/view/historicalmap.mjs';
const data={validFrom:1480,validUntil:1500,realms:{a:{name:{es:'Reino A',en:'Realm A'}}},holdings:[{port:'p',realm:'a',from:1480,until:1490,source:'https://example.invalid/source'}]},p={ports:[{id:'p',lon:1,lat:2}],year:1485,data,x:n=>n,y:n=>n,enabled:true};
test('flag OFF (explicit) has no selector, overlay or internal OFF notice',()=>{assert.equal(typeof HISTORICAL_MAPS_ENABLED,'boolean');assert.equal(mapModeControls({enabled:false}),'');assert.deepEqual(politicalPortLayer({...p,enabled:false}),{svg:'',legend:''});});
test('all three views named ES EN when explicitly enabled',()=>{assert.match(mapModeControls({enabled:true}),/Geográfico/);assert.match(mapModeControls({enabled:true,lang:'en'}),/Political/);});
test('bounded source rows produce original port rings, never territory claims',()=>{assert.match(politicalPortLayer(p).svg,/<circle/);assert.equal(politicalPortLayer({...p,year:1490}).svg,'');});
test('out of validity year or uncorrected unbounded data renders no political attribution',()=>{assert.equal(politicalPortLayer({...p,year:1601}).svg,'');assert.equal(politicalPortLayer({...p,data:null}).svg,'');});
test('caller filtered discovery is respected without leaking hidden ports',()=>{assert.equal(politicalPortLayer({...p,ports:[]}).svg,'');});
test('overlapping conflicting holdings and source-free rows are not guessed',()=>{assert.equal(politicalPortLayer({...p,data:{...data,holdings:[...data.holdings,...data.holdings]}}).svg,'');assert.equal(politicalPortLayer({...p,data:{...data,holdings:[{...data.holdings[0],source:''}]}}).svg,'');});

import{tradePortLayer}from'../src/view/historicalmap.mjs';
test('trade lists only supplied discovered ports and declared specialisations',()=>{const a=tradePortLayer({enabled:true,ports:[{id:'p',name:'Port',pop:50000,lon:1,lat:2,makes:['fish'],needs:['grain']}],x:n=>n,y:n=>n,goodName:id=>({fish:'Pescado',grain:'Grano'}[id])});assert.match(a.svg,/Pescado/);assert.match(a.svg,/Grano/);assert.equal(a.legend,'');assert.doesNotMatch(a.legend,/stock|cash|telemetry/);assert.deepEqual(tradePortLayer({}),{svg:'',legend:''});});

import{leaguePortLayer,historicalLayer}from'../src/view/historicalmap.mjs';import fs from'node:fs';
const leagueData=JSON.parse(fs.readFileSync(new URL('../data/leagues.json',import.meta.url)));
test('Marismas rings only charter members on visible chart; Bilbao not assumed',()=>{const r=leaguePortLayer({enabled:true,year:1480,data:leagueData,ports:[{id:'santander',lat:1,lon:1},{id:'bilbao',lat:2,lon:2}],x:n=>n,y:n=>n});assert.equal((r.svg.match(/<rect/g)??[]).length,1);assert.match(r.legend,/Hermandad de las Marismas/);});
test('Marismas end1494 exclusive and OFF remains invisible',()=>{assert.equal(leaguePortLayer({enabled:true,year:1494,data:leagueData}).svg,'');assert.deepEqual(historicalLayer({enabled:false,mode:'leagues'}),{svg:'',legend:''});});
import{politicalHolding}from'../src/view/historicalmap.mjs';
test('political holdings change by year and unknown stays uncoloured',()=>{const table={realms:{a:{name:{en:'A'}},b:{name:{en:'B'}}},holdings:[{port:'p',realm:'a',from:1480,until:1487,source:'https://example.invalid'},{port:'p',realm:'b',from:1487,until:1601,source:'https://example.invalid'}]};assert.equal(politicalHolding(table,'p',1486).realm,'a');assert.equal(politicalHolding(table,'p',1487).realm,'b');assert.equal(politicalHolding(table,'missing',1487),null);});
test('normal player views contain no sources links technical intervals or attribution notices',()=>{for(const r of [politicalPortLayer(p),leaguePortLayer({enabled:true,ports:[],year:1480,data:leagueData,lang:'en'}),tradePortLayer({enabled:true,ports:[],lang:'en'})]){assert.doesNotMatch(r.legend,/<a|https:|[Ss]ource|attribution|1296|1494|historical volumes|verified/);}});
import{tradeBadgePorts}from'../src/view/historicalmap.mjs';
test('overview has at most five major known-port cards, never reveals absent ports; closer zoom restores detail',()=>{const ps=Array.from({length:9},(_,i)=>({id:`p${i}`,pop:12000+i*1000}));assert.equal(tradeBadgePorts(ps,1).length,5);assert.deepEqual(tradeBadgePorts(ps,1),tradeBadgePorts([...ps].reverse(),1));assert.equal(tradeBadgePorts(ps,2).length,9);assert.equal(tradeBadgePorts([{id:'small',pop:1}],3).length,1);assert.deepEqual(tradeBadgePorts([],1),[]);});

import{politicalZoneLayer}from'../src/view/historicalmap.mjs';
const realmsData=JSON.parse(fs.readFileSync(new URL('../data/realms.json',import.meta.url)));
test('political washes render one soft path per cited zone active in the year, never borders',()=>{const z=y=>politicalZoneLayer({enabled:true,year:y,data:realmsData,x:n=>n,y:n=>n});
 const p1480=z(1480);assert.equal((p1480.svg.match(/<path/g)??[]).length,8);assert.match(p1480.svg,/fill-opacity="0\.38"/);assert.doesNotMatch(p1480.svg,/<path[^>]*stroke="#/);assert.match(p1480.svg,/Emirato de Granada/);assert.doesNotMatch(p1480.svg,/Regencia de Argel/);
 const p1520=z(1520);assert.equal((p1520.svg.match(/<path/g)??[]).length,9);assert.doesNotMatch(p1520.svg,/Emirato de Granada/);assert.match(p1520.svg,/Regencia de Argel/);assert.match(p1520.svg,/Reino de Tlemecén/);
 const p1560=z(1560);assert.equal((p1560.svg.match(/<path/g)??[]).length,8);assert.doesNotMatch(p1560.svg,/Tlemecén/);});
test('zone rows need a cited source, a known realm and a real polygon',()=>{const base=realmsData.zones[0];
 assert.equal(politicalZoneLayer({enabled:true,year:1480,data:{...realmsData,zones:[{...base,source:''}]},x:n=>n,y:n=>n}).svg,'');
 assert.equal(politicalZoneLayer({enabled:true,year:1480,data:{...realmsData,zones:[{...base,realm:'atlantis'}]},x:n=>n,y:n=>n}).svg,'');
 assert.equal(politicalZoneLayer({enabled:true,year:1480,data:{...realmsData,zones:[{...base,polygon:[[1,2]]}]},x:n=>n,y:n=>n}).svg,'');
 assert.equal(politicalZoneLayer({enabled:true,year:1480,data:{...realmsData,zones:[{...base,from:'siempre'}]},x:n=>n,y:n=>n}).svg,'');
 assert.deepEqual(politicalZoneLayer({enabled:false,year:1480,data:realmsData}),{svg:'',legend:''});
 assert.equal(politicalZoneLayer({enabled:true,year:1480,data:null}).svg,'');});
test('political mode composes washes under rings and keeps the no-borders notice in both languages',()=>{const args={enabled:true,mode:'political',ports:[],year:1480,data:realmsData,x:n=>n,y:n=>n};
 const es=historicalLayer(args);assert.match(es.underlay,/<path/);assert.match(es.legend,/Veladuras aproximadas/);assert.match(es.legend,/no fronteras territoriales/);
 const en=historicalLayer({...args,lang:'en'});assert.match(en.legend,/Approximate washes/);assert.match(en.legend,/not territorial boundaries/);});

test('all active realms have one visible name even without discovered ports, in ES and EN',()=>{
 for(const year of [1480,1520,1560])for(const lang of ['es','en']){
  const a=historicalLayer({enabled:true,mode:'political',ports:[],year,data:realmsData,x:n=>n,y:n=>n,lang});
  const ids=[...new Set(realmsData.zones.filter(z=>(z.from==null||year>=z.from)&&(z.until==null||year<z.until)).map(z=>z.realm))];
  assert.equal((a.underlay.match(/class="realm-label"/g)??[]).length,ids.length);
  for(const id of ids){assert.ok(a.underlay.includes(({...realmsData.realms,...realmsData.mapRealms})[id].name[lang]));assert.ok(a.legend.includes(({...realmsData.realms,...realmsData.mapRealms})[id].name[lang]));}
 }
});
test('chart generator and title artwork contain no decorative compass roses or radiating lines',()=>{
 const generator=fs.readFileSync(new URL('../tools/build_background.py',import.meta.url),'utf8');
 assert.doesNotMatch(generator,/def rhumbs|def rose|ROSES/);
 const title=fs.readFileSync(new URL('../web/titlebook.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(title,/id="rose"|href="#rose"|class="chart-rose"/);
});

test('political legend has aligned swatches and Granada keeps its complete accessible name in a compact two-line label',()=>{
 const a=historicalLayer({enabled:true,mode:'political',ports:[],year:1480,data:realmsData,x:n=>n,y:n=>n});
 assert.match(a.legend,/class="realm-key"/);assert.equal((a.legend.match(/class="realm-key-item"/g)??[]).length,6);
 assert.match(a.underlay,/aria-label="Emirato de Granada"/);assert.match(a.underlay,/<tspan x="0" dy="-10">Emirato de<\/tspan><tspan x="0" dy="20">Granada<\/tspan>/);
 assert.match(a.underlay,/font-size="19"/);assert.match(a.underlay,/data-realm="granada"[^>]*data-my="37.5"/);
});

const inWash=([x,y],vs)=>{let inside=false;for(let i=0,j=vs.length-1;i<vs.length;j=i++){const [xi,yi]=vs[i],[xj,yj]=vs[j];if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi))inside=!inside;}return inside;};
test('northern Castilian coast is washed, Galicia is not painted Portugal, and Navarre is map-only',()=>{
 const castile=realmsData.zones[0].polygon,portugal=realmsData.zones.find(z=>z.realm==='portugal').polygon;
 const points=[[-8.73,42.2],[-8.41,43.35],[-5.66,43.3],[-3.81,43.46],[-2.93,43.26],[-1.98,43.32],[-2.45,42.45]];
 for(const p of points){assert.ok(inWash(p,castile),`Castile covers ${p}`);assert.equal(inWash(p,portugal),false,`Portugal excludes ${p}`);}
 assert.equal(realmsData.realms.navarre,undefined);assert.ok(realmsData.mapRealms.navarre);
 assert.equal(realmsData.holdings.some(h=>h.realm==='navarre'),false);
 const at=year=>politicalZoneLayer({enabled:true,year,data:realmsData,x:n=>n,y:n=>n}).svg;
 assert.match(at(1480),/data-realm="navarre"/);assert.match(at(1514),/data-realm="navarre"/);assert.doesNotMatch(at(1515),/data-realm="navarre"/);
 assert.ok(inWash([-1.65,42.65],realmsData.zones.find(z=>z.realm==='navarre').polygon));
});
