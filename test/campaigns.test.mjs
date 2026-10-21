import test from 'node:test';import assert from 'node:assert/strict';
import {newCampaign,campaignEvent,campaignTick,campaignSteps,campaignById,missionView,MISSIONS} from '../src/game/campaigns.mjs';
import {serialize,deserialize} from '../src/game/gamesave.mjs';
const H={post:()=>{},addRespect:()=>{},repOf:()=>0,netWorth:()=>0};
test('M1 completes only through its ordered steps with the right good and city',()=>{
 const g={day:1,profile:{home:'cadiz'},campaign:newCampaign()};
 campaignEvent(g,{kind:'buy',good:'grain',qty:99},H);assert.equal(g.campaign.missions['m1-oficio'].count,0); // wrong good
 campaignEvent(g,{kind:'buy',good:'salt',qty:20},H);assert.equal(g.campaign.missions['m1-oficio'].count,20);
 campaignEvent(g,{kind:'buy',good:'salt',qty:25},H);assert.equal(g.campaign.missions['m1-oficio'].step,1); // 45>=40
 campaignEvent(g,{kind:'arrive',city:'sevilla'},H);assert.equal(g.campaign.missions['m1-oficio'].step,1); // must sail first
 campaignEvent(g,{kind:'sail',to:'sevilla'},H);assert.equal(g.campaign.missions['m1-oficio'].step,2);
 campaignEvent(g,{kind:'arrive',city:'lisboa'},H);assert.equal(g.campaign.missions['m1-oficio'].step,2); // wrong city
 campaignEvent(g,{kind:'arrive',city:'sevilla'},H);assert.equal(g.campaign.missions['m1-oficio'].step,3);
 campaignEvent(g,{kind:'sell',good:'salt',qty:40,city:'cadiz'},H);assert.equal(g.campaign.missions['m1-oficio'].step,3); // wrong city
 campaignEvent(g,{kind:'sell',good:'salt',qty:40,city:'sevilla'},H);assert.equal(g.campaign.missions['m1-oficio'].step,4);
 assert.equal(g.campaign.missions['m1-oficio'].done,false);
 campaignEvent(g,{kind:'readReport'},H);assert.equal(g.campaign.missions['m1-oficio'].done,true);
 assert.deepEqual(campaignSteps(g,'m1-oficio'),[true,true,true,true,true]);
});
test('M1 reward pays coins and respect, and side missions activate after it',()=>{
 const posts=[],resp=[];
 const h={post:(g,k,p)=>posts.push(p.txt?.es),addRespect:(g,c,a)=>resp.push([c,a]),repOf:()=>0,netWorth:()=>0};
 const g={day:1,cash:100,profile:{home:'cadiz'},campaign:newCampaign()};
 for(const e of [{kind:'buy',good:'salt',qty:40},{kind:'sail',to:'sevilla'},{kind:'arrive',city:'sevilla'},{kind:'sell',good:'salt',qty:40,city:'sevilla'},{kind:'readReport'}])campaignEvent(g,e,h);
 assert.equal(g.cash,400); // +300 reward
 assert.deepEqual(resp,[['sevilla',5]]);
 assert.ok(g.campaign.active.includes('s1-gremio')&&g.campaign.active.includes('s2-caja')); // optionals offered
 assert.ok(posts.some((t)=>t.includes('concejo ha visto'))); // epilogue posted
});
test('deadline fails the mission without ending the game; failed text is posted',()=>{
 const posts=[];const h={...H,post:(g,k,p)=>posts.push(p.txt?.es)};
 const g={day:59,profile:{home:'cadiz'},campaign:newCampaign()};
 campaignTick(g,h);assert.equal(g.campaign.missions['m1-oficio'].failed,false);
 g.day=61;campaignTick(g,h);
 assert.equal(g.campaign.missions['m1-oficio'].failed,true);
 assert.ok(posts.some((t)=>t.includes('día 60')));
 assert.equal(g.campaign.missions['s1-gremio'],undefined); // failed parent opens no branches
});
test('condition steps complete from daily ticks (worth) and can pay respect home',()=>{
 const resp=[];const h={post:()=>{},addRespect:(g,c,a)=>resp.push([c,a]),repOf:()=>0,netWorth:(g)=>g.nw};
 const g={day:1,profile:{home:'cadiz'},nw:0,campaign:newCampaign()};
 g.campaign.missions['m1-oficio'].done=true;g.campaign.missions['s2-caja']={step:0,count:0,done:false,failed:false};g.campaign.active.push('s2-caja');
 g.nw=12000;campaignTick(g,h);
 assert.equal(g.campaign.missions['s2-caja'].done,true);
 assert.deepEqual(resp,[['cadiz',5]]); // respect: {home: 5} resolves to the home port
});
test('mission data stays data: ids unique, steps known kinds, stories in both languages',()=>{
 const ids=new Set();
 for(const m of MISSIONS){
  assert.ok(!ids.has(m.id));ids.add(m.id);
  for(const r of m.requires)assert.ok(MISSIONS.some((x)=>x.id===r),`${m.id} requires unknown ${r}`);
  assert.ok(m.title.es&&m.title.en&&m.intro.es&&m.intro.en&&m.done.es&&m.done.en,`${m.id} stories`);
  for(const s of m.steps){assert.ok(s.label.es&&s.label.en,`${m.id} step labels`);assert.ok(['buy','sell','sail','arrive','readReport','respect','worth','fleet','build','warehouse'].includes(s.kind),`${m.id} kind ${s.kind}`);}
 }
});
test('unknown ids fail and games without campaign are unaffected',()=>{
 assert.throws(()=>newCampaign('unknown'));assert.equal(campaignById('unknown'),null);
 const g={};assert.equal(campaignEvent(g,{kind:'buy',qty:1}),false);assert.deepEqual(campaignSteps(g),[]);assert.deepEqual(missionView(g,'es'),[]);
 campaignTick(g,H);assert.deepEqual(g,{});
});
test('save/restore retains mission progress',()=>{
 const g={day:1,tick:0,cash:2000,ships:[],market:{},world:{},profile:{home:'cadiz'},campaign:newCampaign()};
 campaignEvent(g,{kind:'buy',good:'salt',qty:25},H);
 const r=deserialize(serialize(g,'House'),{}).g;
 assert.equal(r.campaign.missions['m1-oficio'].count,25);assert.notEqual(r.campaign,g.campaign);
 const v=missionView({...r,day:3},'es');assert.equal(v[0].title,'La prueba del oficio');assert.ok(v[0].stepLabel.includes('40'));assert.equal(v[0].daysLeft,57);
});
