import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
test('construction presentation omits raw IDs while preserving action bindings',()=>{
 const js=readFileSync(new URL('../web/main.mjs',import.meta.url),'utf8');const view=readFileSync(new URL('../src/view/buildingsview.mjs',import.meta.url),'utf8');
 assert.ok(!js.includes('${t.bldState.plot} <small>${o.id}</small>'));
 assert.ok(!js.includes('</b> ${bldAction.plotId}<br>'));
 assert.ok(!view.includes('<small>${escBw(r.plotId)}</small>'));
 assert.ok(js.includes('data-bldact="buy|${o.id}"'));
});
test('summary cards retain localized names and state without exposing internal plot IDs',async()=>{
 const {bldSummaryCard}=await import('../src/view/buildingsview.mjs');
 for(const lang of ['es','en']){
 const t={bldTypes:{house:lang==='es'?'Casa':'House'},bldState:{plot:lang==='es'?'solar':'plot',active:lang==='es'?'activo':'active'},bldReady:'{d} {p}'};
 for(const type of [null,'house']){
 const html=bldSummaryCard(t,{plotId:'cadiz:43',type,level:1,state:type?'active':'plot'},lang,String);
 assert.ok(!html.includes('cadiz:43'));assert.ok(html.includes(type?t.bldTypes.house:t.bldState.plot));
 }
 }
});
