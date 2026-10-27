import test from 'node:test';import assert from 'node:assert/strict';import {reportsHtml} from '../src/view/ledgerview.mjs';
test('weekly reports use the same ship name and number without a hash',()=>{
 const g={day:7,cash:2000,ships:[],reports:[{week:1,day:7,lines:[{ship:1,type:'cog',cost:8.4,wages:8.4,cannons:0}],upkeep:8.4,paid:8.4,cashAfter:2000}]};
 const es=reportsHtml(g,'es',String),en=reportsHtml(g,'en',String);
 assert.match(es,/Coca 1/);assert.match(en,/Cog 1/);assert.doesNotMatch(es,/Coca #1/);
});
