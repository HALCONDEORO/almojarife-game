import {test} from 'node:test';
import assert from 'node:assert/strict';
import {enabled,inbox2dHtml,messageCategory} from '../src/view/ui2d.mjs';
test('ui2d is exact opt-in and independent of city2d',()=>{for(const q of ['', '?city2d=1','?ui2d=0','?ui2d=true'])assert.equal(enabled(q),false);assert.equal(enabled('?ui2d=1'),true);});
test('inbox presentation keeps IDs, dates, copy and read state without mutation',()=>{const g={inbox:[{id:4,day:2,kind:'info',txt:'<script>bad</script>',read:false},{id:5,day:3,kind:'arrival',ship:1,city:'huelva',read:true}]},before=JSON.stringify(g),h=inbox2dHtml(g,'es',String,x=>x);assert.match(h,/data-msg="4"/);assert.match(h,/Día 2/);assert.match(h,/&lt;script&gt;/);assert.doesNotMatch(h,/<script>/);assert.match(h,/Sin leer/);assert.match(h,/Leído/);assert.match(h,/1 sin leer/);assert.equal(JSON.stringify(g),before);});
test('inbox empty and all-read presentations are explicit',()=>{assert.match(inbox2dHtml({},'es',String),/No hay mensajes/);assert.match(inbox2dHtml({inbox:[{id:1,kind:'info',txt:'ok',read:true}]},'en',String),/id="l-all" disabled/);assert.deepEqual(messageCategory('arrival'),['port','⚓']);});
import {hall2dHtml} from '../src/view/ui2d.mjs';
test('hall preserves every displayed value and escapes optional city lines',()=>{
 const hv={mayor:'<Mayor>',councillors:['One','Two'],respectPts:14,feePct:4,tollDiv:10,tollDiscountPct:5,caja:1600,sisa:1,portazgo:-1,nextMeeting:12,identity:{txt:{es:'<ciudad>'}}},t={hallInfo:'Info',hallMayor:'Alcalde',hallRegs:'Regidor',hallStand:'{r}/{n}',hallDerechos:'Derechos',hallFee:'fee {p}',hallToll:'toll {d}/{x}',hallCaja:'caja {c}',hallLevies:'levies {s}/{p}',hallNext:'meeting {d}',hallNote:'note'},before=JSON.stringify(hv),h=hall2dHtml(hv,t,String,'Conocido','es');
 for(const text of ['&lt;Mayor&gt;','One','Two','Conocido/14','fee 4','toll 10/5','caja 1600','levies +1/-1','meeting 12','&lt;ciudad&gt;'])assert.ok(h.includes(text),text);
 assert.equal(JSON.stringify(hv),before);assert.doesNotMatch(h,/<ciudad>/);
});
