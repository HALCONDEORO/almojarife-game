import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {voyageCardHtml} from '../src/view/voyagecard.mjs';
const source=readFileSync(new URL('../web/main.mjs',import.meta.url),'utf8');
const start=source.indexOf('  $("voyage-card").innerHTML=voyageCardHtml',source.indexOf('function render()'));
const end=source.indexOf('  $("cash-card").innerHTML',start);
assert.ok(start>0&&end>start,'actual render voyage-card block is present');
function renderCard({lang='es',target='sevilla',allowed=true,voyage=null,eventPending=false}={}){
 const children=new Map(),calls=[];
 const card={set innerHTML(html){this.html=html;children.clear();for(const [,id] of html.matchAll(/id="([^"]+)"/g))children.set(id,{listeners:{},addEventListener(type,fn){this.listeners[type]=fn;}});},get innerHTML(){return this.html;}};
 const selected={id:1,name:'Buenaventura',at:'cadiz',voyage};
 const context={$:id=>id==='voyage-card'?card:children.get(id),voyageCardHtml,ship:()=>selected,lang,cityName:id=>({cadiz:'Cádiz',sevilla:'Sevilla'}[id]??id),target,world:{},travelEstimate:()=>({ok:allowed,ticks:60}),legWindEst:()=>0,hoursOf:()=>1,pendingEvent:()=>eventPending,g:{tick:0},etaPlain:()=>'',cargoUsed:()=>0,shipCapacity:()=>60,sailToTarget:()=>calls.push('sail')};
 vm.runInNewContext(source.slice(start,end),context);
 return{card,children,calls};
}
for(const lang of ['es','en'])test(`render keeps the ${lang} sail button and its live listener in the final DOM`,()=>{
 const r=renderCard({lang});assert.ok(r.children.has('voyage-sail'),'final card contains sail button');assert.match(r.card.innerHTML,lang==='es'?/Zarpar a Sevilla/:/Sail to Sevilla/);
 r.children.get('voyage-sail').listeners.click();assert.deepEqual(r.calls,['sail']);
});
test('final render has no stale sail button without a permitted destination or while sailing',()=>{
 for(const options of [{target:null},{allowed:false},{voyage:{from:'cadiz',to:'sevilla',ticksLeft:30,totalTicks:60}}])assert.equal(renderCard(options).children.has('voyage-sail'),false);
});
test('merging the duplicate paint keeps the pending-event button',()=>{
 const r=renderCard({eventPending:true});assert.ok(r.children.has('voyage-event'));assert.ok(r.children.has('voyage-sail'));
});
