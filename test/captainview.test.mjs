import test from 'node:test';import assert from 'node:assert/strict';import {assignedCaptainHtml,tavernCaptainsHtml} from '../src/view/captainview.mjs';import {captainRoster} from '../src/game/captains.mjs';
test('captain view ES/EN shows fee/salary/inactive skills and escapes saved names',()=>{
 const s={id:1,at:'cadiz'},g={world:{cities:[{id:'cadiz'}]},cash:2000,ships:[s]};
 const es=tavernCaptainsHtml(g,s,'es'),en=tavernCaptainsHtml(g,s,'en');
 const r=captainRoster(g,'cadiz')[0];assert.match(es,new RegExp(`${r.fee}`));assert.match(es,new RegExp(`${r.wage*7}/semana`));assert.match(en,/coins\/day/);assert.match(en,/no effect yet/);
 s.captain={id:'x',name:'<img onerror=x>',navigation:2,wage:2};assert.doesNotMatch(assignedCaptainHtml(s,'en'),/<img/);assert.match(assignedCaptainHtml(s,'en'),/&lt;img/);
 assert.doesNotMatch(tavernCaptainsHtml(g,s,'en'),/data-captain-review/);
});
