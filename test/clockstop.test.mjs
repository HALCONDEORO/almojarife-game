import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync('web/main.mjs','utf8');
const fn=source.slice(source.indexOf('function stepTicks(n)'),source.indexOf('function frame(now)'));
function run(kind,n=20){
 const g={day:0,tick:0,ships:[{voyage:{}}]};let opened=0,renders=0;
 const ctx={g,playing:true,sel:0,autosave(){},render(){renders++;},open3d(){opened++;},advanceTick(){g.tick++;if(g.tick===3){if(kind==='arrival')g.ships[0].voyage=null;if(kind==='event')g.pending={};if(kind==='attack')g.encounterReport={};if(kind==='over')g.over=true;}}};
 vm.createContext(ctx);vm.runInContext(fn+';stepTicks('+n+');',ctx);return{g,ctx,opened,renders};
}
for(const kind of ['arrival','event','attack','over'])test(`frame batch stops at exact ${kind} tick`,()=>{const r=run(kind);assert.equal(r.g.tick,3);assert.equal(r.renders,1);if(kind!=='over')assert.equal(r.ctx.playing,false);assert.equal(r.opened,kind==='arrival'?1:0);});
test('uninterrupted batch still advances every tick',()=>{assert.equal(run('none').g.tick,20);});
test('a one tick batch is unchanged',()=>{assert.equal(run('arrival',1).g.tick,1);});
