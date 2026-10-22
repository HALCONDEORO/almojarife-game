import test from'node:test';import assert from'node:assert/strict';import{mapModeControls,politicalPortLayer,HISTORICAL_MAPS_ENABLED}from'../src/view/historicalmap.mjs';
const data={validFrom:1480,validUntil:1500,realms:{a:{name:{es:'Reino A',en:'Realm A'}}},holdings:[{port:'p',realm:'a',from:1480,until:1490,source:'https://example.invalid/source'}]},p={ports:[{id:'p',lon:1,lat:2}],year:1485,data,x:n=>n,y:n=>n,enabled:true};
test('flag OFF has no selector, overlay or internal OFF notice',()=>{assert.equal(HISTORICAL_MAPS_ENABLED,false);assert.equal(mapModeControls(),'');assert.deepEqual(politicalPortLayer({...p,enabled:false}),{svg:'',legend:''});});
test('all three views named ES EN when explicitly enabled',()=>{assert.match(mapModeControls({enabled:true}),/Geográfico/);assert.match(mapModeControls({enabled:true,lang:'en'}),/Political/);});
test('bounded source rows produce original port rings, never territory claims',()=>{assert.match(politicalPortLayer(p).svg,/<circle/);assert.match(politicalPortLayer(p).legend,/no fronteras/);assert.equal(politicalPortLayer({...p,year:1490}).svg,'');});
test('out of validity year or uncorrected unbounded data renders no political attribution',()=>{assert.equal(politicalPortLayer({...p,year:1601}).svg,'');assert.equal(politicalPortLayer({...p,data:null}).svg,'');});
test('caller filtered discovery is respected without leaking hidden ports',()=>{assert.equal(politicalPortLayer({...p,ports:[]}).svg,'');});
test('overlapping conflicting holdings and source-free rows are not guessed',()=>{assert.equal(politicalPortLayer({...p,data:{...data,holdings:[...data.holdings,...data.holdings]}}).svg,'');assert.equal(politicalPortLayer({...p,data:{...data,holdings:[{...data.holdings[0],source:''}]}}).svg,'');});

import{tradePortLayer}from'../src/view/historicalmap.mjs';
test('trade lists only supplied discovered ports and declared specialisations',()=>{const a=tradePortLayer({enabled:true,ports:[{name:'Port',makes:['fish'],needs:['grain']}],goodName:id=>({fish:'Pescado',grain:'Grano'}[id])});assert.match(a.legend,/Pescado/);assert.match(a.legend,/Grano/);assert.match(a.legend,/no volúmenes históricos/);assert.doesNotMatch(a.legend,/stock|cash|telemetry/);assert.deepEqual(tradePortLayer({}),{svg:'',legend:''});});

import{leaguePortLayer,historicalLayer}from'../src/view/historicalmap.mjs';import fs from'node:fs';
const leagueData=JSON.parse(fs.readFileSync(new URL('../data/leagues.json',import.meta.url)));
test('Marismas rings only charter members on visible chart; Bilbao not assumed',()=>{const r=leaguePortLayer({enabled:true,year:1480,data:leagueData,ports:[{id:'santander',lat:1,lon:1},{id:'bilbao',lat:2,lon:2}],x:n=>n,y:n=>n});assert.equal((r.svg.match(/<rect/g)??[]).length,1);assert.match(r.legend,/1296/);assert.match(r.legend,/no una lista exhaustiva/);assert.match(r.legend,/síntesis secundaria/);});
test('Marismas end1494 exclusive and OFF remains invisible',()=>{assert.equal(leaguePortLayer({enabled:true,year:1494,data:leagueData}).svg,'');assert.deepEqual(historicalLayer({enabled:false,mode:'leagues'}),{svg:'',legend:''});});
