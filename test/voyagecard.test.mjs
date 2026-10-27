import test from'node:test';import assert from'node:assert/strict';import{voyageSummary,voyageCardHtml}from'../src/view/voyagecard.mjs';
test('voyage progress and remaining distance use the selected ship only',()=>{const s={id:1,voyage:{from:'a',to:'b',totalTicks:100,ticksLeft:40,km:200}};const before=JSON.stringify(s),r=voyageSummary(s);assert.equal(r.progress,.6);assert.equal(r.remainingKm,80);assert.equal(JSON.stringify(s),before);});
test('progress clamps without negative distance',()=>{const r=voyageSummary({voyage:{totalTicks:10,ticksLeft:-3,km:100}});assert.equal(r.progress,1);assert.equal(r.remainingKm,0);});
test('docked ship reports current port not stale ETA',()=>{const h=voyageCardHtml({id:2,at:'huelva'},{lang:'en',cityName:()=> 'Huelva'});assert.match(h,/At port: Huelva/);assert.doesNotMatch(h,/Estimated arrival/);});
test('ETA is explicitly estimated and escaped',()=>{const h=voyageCardHtml({id:1,voyage:{from:'a',to:'b',totalTicks:10,ticksLeft:5}},{lang:'en',eta:()=>'<tomorrow>'});assert.match(h,/Estimated arrival/);assert.match(h,/&lt;tomorrow&gt;/);});
test('card shows cargo at port and has an Open ship action',()=>{const h=voyageCardHtml({id:3,at:'cadiz'},{lang:'es',cityName:()=> 'Cádiz',cargo:{used:5,cap:60}});assert.match(h,/Carga: 5\/60/);assert.match(h,/id="voyage-open"[^>]*>Abrir barco</);assert.match(h,/En puerto: Cádiz/);});
test('docked ship with a chosen destination offers a Sail button with the estimate',()=>{const h=voyageCardHtml({id:1,at:'cadiz'},{lang:'es',cityName:()=> 'Cádiz',sail:{city:'Sevilla',hours:'12'}});assert.match(h,/id="voyage-sail"[^>]*>Zarpar a Sevilla \(≈12 h\)/);const n=voyageCardHtml({id:1,at:'cadiz'},{lang:'es'});assert.doesNotMatch(n,/voyage-sail/);});
test('a pending voyage event gets a button to resolve it, in both languages and only then',()=>{
 const s={id:1,at:'cadiz',voyage:{from:'cadiz',to:'malaga',ticksLeft:10,totalTicks:20,km:100}};
 assert.match(voyageCardHtml(s,{lang:'es',eventPending:true}),/id="voyage-event"[^>]*>Resolver suceso/);
 assert.match(voyageCardHtml(s,{lang:'en',eventPending:true}),/Resolve voyage event/);
 assert.doesNotMatch(voyageCardHtml(s,{lang:'es'}),/voyage-event/);
});

test('ETA explains accumulated storm delays in both languages without claiming current storm',()=>{
 const s={id:1,voyage:{from:'a',to:'b',ticksLeft:480,totalTicks:720,stormDelayDays:1}},before=JSON.stringify(s);
 assert.match(voyageCardHtml(s),/Retraso por tormenta en este viaje: \+1 día \(incluido en la estimación\)/);
 s.voyage.stormDelayDays=3;assert.match(voyageCardHtml(s,{lang:'en'}),/Storm delay on this voyage: \+3 days \(included in estimate\)/);
 s.voyage.stormDelayDays=1;assert.equal(JSON.stringify(s),before);
 for(const days of [undefined,0,-1,1.5,NaN,'1','<x>']){s.voyage.stormDelayDays=days;assert.doesNotMatch(voyageCardHtml(s),/Retraso por tormenta/);}
 s.voyage.stormDelayDays=1;s.voyage.anchored=true;assert.doesNotMatch(voyageCardHtml(s),/Retraso por tormenta/);
 delete s.voyage;assert.doesNotMatch(voyageCardHtml(s),/Retraso por tormenta/);
});
