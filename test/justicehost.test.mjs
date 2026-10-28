import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {loadWorld} from '../src/sim/world.mjs';
import {newGame} from '../src/game/game.mjs';
import {serialize,deserialize} from '../src/game/gamesave.mjs';
import {setJusticeData,justiceReady,chargePiracy} from '../src/game/justicewire.mjs';
import {justiceStatusHtml} from '../src/view/justicestatus.mjs';
const world=loadWorld(),realms=JSON.parse(readFileSync(new URL('../data/realms.json',import.meta.url))),courts=JSON.parse(readFileSync(new URL('../data/courts.json',import.meta.url)));
test('normal new game enables justice and host data makes real charges available',()=>{
 const g=newGame(world);setJusticeData(realms,courts);
 assert.equal(g.justice,true);assert.equal(justiceReady(g),true);
 assert.ok(chargePiracy(g,'lisboa',{wool:5}));assert.equal(g.charges.length,1);
 assert.equal(deserialize(serialize(g,'T'),world).g.justice,true);
 const before=JSON.stringify(g);assert.match(justiceStatusHtml(g,'es'),/Cargos pendientes: 1/);assert.equal(JSON.stringify(g),before);
 assert.match(justiceStatusHtml(g,'en'),/Open charges: 1/);
 setJusticeData(null);
});
test('explicit off is unchanged and missing data never claims readiness',()=>{
 const g=newGame(world,'cadiz',{justice:false});setJusticeData(realms,courts);
 assert.equal(g.justice,undefined);assert.equal(justiceStatusHtml(g),'');
 setJusticeData(null);assert.equal(justiceStatusHtml(newGame(world)),'');
});
test('browser host registers the shipped courts and hall summary',()=>{
 const s=readFileSync(new URL('../web/main.mjs',import.meta.url),'utf8');
 assert.match(s,/setJusticeData\(justiceRealms, justiceCourts\)/);assert.match(s,/justiceStatusHtml\(g, lang\)/);
});
