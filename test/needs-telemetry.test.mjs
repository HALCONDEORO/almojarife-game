import test from'node:test';import assert from'node:assert/strict';import{makeMarket,tickMarket}from'../src/sim/market.mjs';import{loadWorld}from'../src/sim/world.mjs';import{NEEDS_LEDGER_ENABLED}from'../src/sim/needs-telemetry.mjs';import{needsHtml}from'../src/view/needsview.mjs';
const w=loadWorld();
test('flag defaults ON (owner order 23/10): ledger is recorded; players still never see it (main.mjs gates needsHtml behind devMode)',()=>{const m=makeMarket(w);tickMarket(m,0,w);assert.equal(NEEDS_LEDGER_ENABLED,true);const nl=m.cadiz.grain.needsLedger;assert.ok(nl&&nl.days===1);assert.ok(needsHtml(m.cadiz.grain,{},'es').length>0);});
test('enabled telemetry leaves ALL economic cell state unchanged and counts exact consumption',()=>{const a=makeMarket(w),b=makeMarket(w);for(let d=0;d<20;d++){tickMarket(a,d,w);tickMarket(b,d,w,{needsLedger:true});for(const[c,row]of Object.entries(b))for(const[g,e]of Object.entries(row)){const{needsLedger,...rest}=e;const{needsLedger:_nl,...arest}=a[c][g];assert.deepEqual(rest,arest);} }for(const row of Object.values(b)){const n=row.grain.needsLedger;assert.equal(n.days,20);assert.equal(n.attribution,'estimated-proportional-no-household-purse');for(const[g,r]of Object.entries(n.totals))assert.equal(r.consumed,Object.values(n.byClass).reduce((s,c)=>s+c[g].consumed,0));}});
test('save continuation and explicit world API remain exact',()=>{let a=makeMarket(w),b=makeMarket(w);for(let d=0;d<30;d++){tickMarket(a,d,w,{needsLedger:true});tickMarket(b,d,w,{needsLedger:true});if(d===14)b=JSON.parse(JSON.stringify(b));}assert.deepEqual(a,b);});
test('enabled component reports estimated allocation and game assumption, not historical precision',()=>{const m=makeMarket(w);tickMarket(m,0,w,{needsLedger:true});for(const lang of['es','en']){const h=needsHtml(m.cadiz.grain,{grain:'<grain>'},lang);assert.ok(h.includes('&lt;grain&gt;'));assert.ok(h.includes(lang==='es'?'estimada':'Estimated'));assert.ok(!h.includes('undefined'));}});

import { needsHtml as _needsHtml } from "../src/view/needsview.mjs";
test("needs view renders nothing when the ledger is off", () => {
  assert.equal(_needsHtml({}, {}, "es"), "");
  assert.equal(_needsHtml(undefined, {}, "en"), "");
});
