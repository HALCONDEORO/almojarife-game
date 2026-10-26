import {test} from 'node:test';
import assert from 'node:assert/strict';
import {enabled,inbox2dHtml,messageCategory} from '../src/view/ui2d.mjs';
test('ui2d defaults ON (owner order 23/10), only ?ui2d=0 opts out, independent of city2d',()=>{for(const q of ['', '?city2d=1','?city2d=0','?ui2d=1','?ui2d=true'])assert.equal(enabled(q),true);assert.equal(enabled('?ui2d=0'),false);});
test('inbox presentation keeps IDs, dates, copy and read state without mutation',()=>{const g={inbox:[{id:4,day:2,kind:'info',txt:'<script>bad</script>',read:false},{id:5,day:3,kind:'respect',city:'huelva',read:true},{id:6,day:4,kind:'warn',due:1,cash:2,read:false}]},before=JSON.stringify(g),h=inbox2dHtml(g,'es',String,x=>x);assert.match(h,/data-msg="4"/);assert.match(h,/Día 2/);assert.match(h,/&lt;script&gt;/);assert.doesNotMatch(h,/<script>/);assert.match(h,/Sin leer/);assert.match(h,/Leído/);assert.match(h,/1 sin leer/);assert.equal(JSON.stringify(g),before);});
test('inbox empty and all-read presentations are explicit',()=>{assert.match(inbox2dHtml({},'es',String),/No hay mensajes/);assert.match(inbox2dHtml({inbox:[{id:1,kind:'info',txt:'ok',read:true}]},'en',String),/id="l-all" disabled/);assert.deepEqual(messageCategory('arrival'),['port','⚓']);});
import {hall2dHtml} from '../src/view/ui2d.mjs';
test('hall preserves every displayed value and escapes optional city lines',()=>{
 const hv={mayor:'<Mayor>',councillors:['One','Two'],respectPts:14,feePct:4,tollDiv:10,tollDiscountPct:5,caja:1600,sisaPct:5,portazgoPct:-5,nextMeeting:12,identity:{txt:{es:'<ciudad>'}}},t={hallInfo:'Info',hallMayor:'Alcalde',hallRegs:'Regidor',hallStand:'{r}/{n}',hallDerechos:'Derechos',hallFee:'fee {p}',hallToll:'toll {d}/{x}',hallCaja:'caja {c}',hallLevies:'levies {s}/{p}',hallNext:'meeting {d}',hallNote:'note'},before=JSON.stringify(hv),h=hall2dHtml(hv,t,String,'Conocido','es');
 for(const text of ['&lt;Mayor&gt;','One','Two','Conocido/14','fee 4','toll 10/5','caja 1600','levies +5%/-5%','meeting 12','&lt;ciudad&gt;'])assert.ok(h.includes(text),text);
 assert.equal(JSON.stringify(hv),before);assert.doesNotMatch(h,/<ciudad>/);
});
import {readFileSync} from 'node:fs';
test('hall presentation appends rather than erases pending events and ship controls',()=>{const source=readFileSync(new URL('../web/main.mjs',import.meta.url),'utf8');assert.match(source,/if\(ui2dEnabled\(location.search\)\)h \+= hall2dHtml/);assert.doesNotMatch(source,/if\(ui2dEnabled\(location.search\)\)h = hall2dHtml/);});

import {reports2dHtml} from '../src/view/ui2d.mjs';
test('reports presentation retains weekly, chronicle, voyage and encounter content',()=>{const h=reports2dHtml('<h2>Reports</h2><p>Next payment: 55</p><div class="card">week 4: 123</div>','<h3>Chronicle</h3>year 1480','<h3>Voyages</h3>profit -42','encounter #7','en');for(const text of ['Next payment: 55','week 4: 123','year 1480','profit -42','encounter #7','ui2d-weekly','ui2d-encounters'])assert.ok(h.includes(text));assert.doesNotMatch(h,/<h2>/);assert.match(reports2dHtml('','','','','es'),/Aún no hay registros/);});
