import test from 'node:test';import assert from 'node:assert/strict';
import {escapeChance,resolvePirates} from '../src/game/encounterdaily.mjs';
import {encounterDialogHtml} from '../src/view/encounterview.mjs';
import {seeded} from '../src/view/cityscene.mjs';
const state=(chance,seed=0)=>({seed,day:2,ships:[{id:1,type:'cog',hull:100,cargo:{},voyage:{from:'cadiz',to:'barcelona',ticksLeft:2400,totalTicks:2400}}],pending:{event:'sea-pirates',ship:1,day:2,id:'sea-v1:2:1',escapeChance:chance}});
test('exact hull, crew and navigation contributions, rounding and physical domain limits',()=>{
 assert.equal(escapeChance({type:'cog',hull:100}),70);
 assert.equal(escapeChance({type:'cog',hull:0,crew:0}),35);
 assert.equal(escapeChance({type:'cog',hull:100,crew:8}),67);
 assert.equal(escapeChance({type:'cog',hull:100,crew:12}),70);
 assert.equal(escapeChance({type:'cog',hull:100,crew:18}),71);
 for(let navigation=0;navigation<=3;navigation++)assert.equal(escapeChance({type:'cog',hull:100,captain:{navigation}}),70+navigation*3);
 for(const navigation of [-1,4,1.5,NaN,Infinity,'3'])assert.equal(escapeChance({type:'cog',hull:100,captain:{navigation}}),70);
 assert.equal(escapeChance({type:'cog',hull:102,crew:18,captain:{navigation:3}}),80);
 assert.equal(escapeChance({type:'cog',hull:-3,crew:0}),35);
 assert.equal(escapeChance({type:'cog',hull:98,crew:12}),70);
 for(const hull of [NaN,Infinity,-Infinity,'invalid',null,undefined])assert.equal(escapeChance({type:'cog',hull}),70);
});
test('displayed threshold equals actual flee decision across 100000 fixed seeded trials',()=>{
 for(const chance of [15,35,50,70,85]){
  let wins=0;const n=20000;
  for(let seed=0;seed<n;seed++){
   const g=state(chance,seed),expected=seeded(`sea-choice-v1:${seed}:sea-v1:2:1`)()*100<chance;
   const e=resolvePirates(g,'flee');assert.equal(e.result==='escaped',expected);
   if(e.result==='escaped')wins++;
   if(seed===0){assert.match(encounterDialogHtml(state(chance),'es'),new RegExp(`${chance}% de éxito`));assert.match(encounterDialogHtml(state(chance),'en'),new RegExp(`${chance}% success`));}
  }
  // Fixed regression envelope, not a probabilistic test or a guarantee about one playthrough.
  assert.ok(Math.abs(wins/n*100-chance)<1,`${chance}: ${wins}/${n}`);
 }
});
test('flee outcome survives JSON save roundtrip at each threshold and cannot be rerolled',()=>{
 for(const chance of [15,35,50,70,85])for(let seed=0;seed<100;seed++){
  const g=state(chance,seed),reload=JSON.parse(JSON.stringify(g));
  assert.deepEqual(resolvePirates(g,'flee'),resolvePirates(reload,'flee'));
  const saved=JSON.parse(JSON.stringify(g)),before=JSON.stringify(saved);
  assert.equal(resolvePirates(saved,'flee').ok,false);assert.equal(JSON.stringify(saved),before);
 }
});
test('bad stored probability fails closed without mutation',()=>{
 for(const chance of [-1,0,14,86,100,Infinity,NaN,'70',null]){
  const g=state(chance),before=JSON.stringify(g);assert.equal(resolvePirates(g,'flee').ok,false);assert.equal(JSON.stringify(g),before);
 }
});
