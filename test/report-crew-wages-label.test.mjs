import test from 'node:test';import assert from 'node:assert/strict';import {reportsHtml,LT} from '../src/view/ledgerview.mjs';
test('report crew column explicitly labels monetary wages and preserves exact values',()=>{
 assert.equal(LT.es.crew,'Salarios de tripulación (monedas)');assert.equal(LT.en.crew,'Crew wages (coins)');
 const g={day:7,cash:2000,ships:[],reports:[{week:1,day:7,lines:[{ship:1,type:'cog',cost:8.4,wages:8.4,cannons:0}],upkeep:8.4,paid:8.4,cashAfter:2000}]};
 const html=reportsHtml(g,'es',String);assert.match(html,/Salarios de tripulación \(monedas\)/);assert.match(html,/>8\.4<\/td>/);
});
