import test from'node:test';import assert from'node:assert/strict';import fs from'node:fs';
import{calendarOf}from'../src/sim/clock.mjs';import{politicalHolding,politicalPortLayer}from'../src/view/historicalmap.mjs';
const data=JSON.parse(fs.readFileSync(new URL('../data/realms.json',import.meta.url))),world=JSON.parse(fs.readFileSync(new URL('../data/world.json',import.meta.url)));
for(const[port,year,before,after]of[['malaga',1487,'granada','castile'],['oran',1509,'tlemcen','castile'],['melilla',1497,null,'castile'],['argel',1516,null,'algiers']])test(`${port}: calendar year ${year-1} -> ${year} changes holding and rendered name`,()=>{
 const p=world.cities.find(p=>p.id===port),firstDay=(year-1480)*365;
 const prev=calendarOf(firstDay-1,1480).year,next=calendarOf(firstDay,1480).year;
 assert.equal(prev,year-1);assert.equal(next,year);
 assert.equal(politicalHolding(data,port,prev)?.realm??null,before);assert.equal(politicalHolding(data,port,next)?.realm??null,after);
 for(const[y,realm]of[[prev,before],[next,after]]){const r=politicalPortLayer({enabled:true,ports:[p],year:y,data,x:n=>n,y:n=>n,lang:'en'});if(realm){assert.match(r.svg,/<circle/);assert.ok(r.legend.includes(data.realms[realm].name.en));}else assert.equal(r.svg,'');assert.doesNotMatch(r.legend,/https:|<a |Source|attribution/);}
});
test('Ceuta stays Portuguese across 1580 union and crowns remain distinct',()=>{for(const y of[1579,1580,1600])assert.equal(politicalHolding(data,'ceuta',y).realm,'portugal');assert.equal(politicalHolding(data,'cadiz',1580).realm,'castile');assert.equal(politicalHolding(data,'barcelona',1580).realm,'aragon');});
test('missing holding, unverified source or overlapping sources yields no colour',()=>{const p=world.cities.find(p=>p.id==='almeria');assert.equal(politicalHolding(data,p.id,1480),null);const h=data.holdings.find(h=>h.port==='cadiz'),d={...data,holdings:[h,{...h,source:''}]};assert.equal(politicalHolding(d,'cadiz',1480),null);assert.equal(politicalHolding({...data,holdings:[{...h,source:''}]},'cadiz',1480),null);});
test('OFF suppresses all changing political data; caller discovery list is respected',()=>{assert.deepEqual(politicalPortLayer({enabled:false,ports:world.cities,year:1509,data}),{svg:'',legend:''});const r=politicalPortLayer({enabled:true,ports:[],year:1509,data,x:n=>n,y:n=>n});assert.equal(r.svg,'');assert.doesNotMatch(r.legend,/Oran|Castile|Granada/);});
