import test from 'node:test';import assert from 'node:assert/strict';import {assignedCaptainHtml,tavernCaptainsHtml} from '../src/view/captainview.mjs';import {captainRoster} from '../src/game/captains.mjs';
test('captain view ES/EN shows fee/salary/active skills and escapes saved names',()=>{
 const s={id:1,at:'cadiz'},g={world:{cities:[{id:'cadiz'}]},cash:2000,ships:[s]};
 const es=tavernCaptainsHtml(g,s,'es'),en=tavernCaptainsHtml(g,s,'en');
 const r=captainRoster(g,'cadiz')[0];assert.match(es,new RegExp(`${r.fee}`));assert.match(es,new RegExp(`${r.wage*7}/semana`));assert.match(en,/coins\/day/);assert.doesNotMatch(en,/no effect yet/);
 s.captain={id:'x',name:'<img onerror=x>',navigation:2,wage:2};assert.doesNotMatch(assignedCaptainHtml(s,'en'),/<img/);assert.match(assignedCaptainHtml(s,'en'),/&lt;img/);
 assert.doesNotMatch(tavernCaptainsHtml(g,s,'en'),/data-captain-review/);
});

test('captain view shows xp progress toward the next level only when the captain carries xp',()=>{
 const s={id:1,at:'cadiz',captain:{id:'x',name:'Ana',navigation:1,weather:0,defence:2,wage:4,xp:{navigation:7,defence:16}}};
 const es=assignedCaptainHtml(s,'es'),en=assignedCaptainHtml(s,'en');
 assert.match(es,/Navegación 1\/3 \(7\/15\)/);assert.match(es,/Defensa 2\/3 \(16\/35\)/);
 assert.match(en,/Navigation 1\/3 \(7\/15\)/);assert.match(en,/Defence 2\/3 \(16\/35\)/);
 assert.doesNotMatch(es,/Temporal 0\/3 \(\d/); // a skill with no xp entry yet shows no progress
});
test('captain view: no progress at max level, none without xp (flag off reads as before)',()=>{
 const maxed={id:1,at:'cadiz',captain:{id:'x',name:'Ana',navigation:3,weather:3,defence:3,wage:9,xp:{navigation:40,weather:40,defence:40}}};
 assert.doesNotMatch(assignedCaptainHtml(maxed,'es'),/\(\d+\/\d+\)/);
 const off={id:1,at:'cadiz',captain:{id:'x',name:'Ana',navigation:1,weather:0,defence:2,wage:4}};
 const h=assignedCaptainHtml(off,'es');
 assert.doesNotMatch(h,/\(\d+\/\d+\)/);assert.match(h,/Navegación 1\/3 \(\+/);
});
test('tavern candidates show no xp progress',()=>{
 const g={world:{cities:[{id:'cadiz'}]},cash:2000,ships:[{id:1,at:'cadiz'}]};
 assert.doesNotMatch(tavernCaptainsHtml(g,g.ships[0],'es'),/\d\/3 \(\d+\/\d+\)/);
});
