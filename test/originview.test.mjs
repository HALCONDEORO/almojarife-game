import test from 'node:test';import assert from 'node:assert/strict';
import {loadWorld} from '../src/sim/world.mjs';
import {originPreview,originChoiceHtml,originHouseHtml,originTavernHtml} from '../src/view/originview.mjs';
const world=loadWorld(), name=id=>world.nodes[id]?.name??id;
test('preview is pure, deterministic and matches known home-specific targets',()=>{
 const before=JSON.stringify(world);
 assert.equal(originPreview(world,{home:'cadiz',background:'seafarer'}).city,'faro');
 assert.equal(originPreview(world,{home:'cadiz',background:'scholar'}).city,'tanger');
 assert.equal(originPreview(world,{home:'melilla',background:'scholar'}).city,null);
 assert.equal(JSON.stringify(world),before);
});
test('all origins explain exact grants and one-time limits in ES/EN',()=>{
 for(const lang of ['es','en'])for(const origin of ['merchant','seafarer','scholar']){
  const h=originChoiceHtml(world,{home:'cadiz',background:origin},lang,name);
  assert.ok(h.includes('founding-origin'));assert.ok(h.includes(lang==='es'?'Solo al fundar':'Only when founding'));
  if(origin==='merchant')assert.ok(h.includes('+5')&&h.includes('20'));
  if(origin==='seafarer')assert.ok(h.includes('Faro')&&h.includes(lang==='es'?'sin precios':'without prices'));
  if(origin==='scholar')assert.ok(h.includes(lang==='es'?'aproximada':'approximate'));
 }
});
test('isolated scholars are explicitly warned before starting',()=>{
 for(const lang of ['es','en'])assert.ok(originChoiceHtml(world,{home:'melilla',background:'scholar'},lang,name).includes(lang==='es'?'no recibes nota':'no starting market note'));
});
test('house and tavern never fabricate benefits for old saves and greetings stay home-only',()=>{
 const g={profile:{background:'merchant',home:'cadiz'}};
 assert.equal(originHouseHtml(g,'es',name),'');assert.equal(originTavernHtml(g,'cadiz','es'),'');
 g.originStart={v:1,origin:'merchant',home:'cadiz',respect:5};
 assert.ok(originHouseHtml(g,'es',name).includes('+5'));
 assert.ok(originTavernHtml(g,'cadiz','es'));assert.equal(originTavernHtml(g,'lisboa','es'),'');
 g.originStart.origin='king';assert.equal(originHouseHtml(g,'es',name),'');
});
test('city labels are escaped on creation and house record',()=>{
 const bad=()=>'<img src=x onerror=alert(1)>';
 assert.ok(originChoiceHtml(world,{home:'cadiz',background:'merchant'},'es',bad).includes('&lt;img'));
 const h=originHouseHtml({originStart:{v:1,origin:'scholar',home:'cadiz',city:'tanger'}},'en',bad);
 assert.ok(!h.includes('<img'));assert.ok(h.includes('&lt;img'));
});
