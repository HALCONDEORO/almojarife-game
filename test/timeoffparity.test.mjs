import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import vm from 'node:vm';import {arrivalNeedsDecision} from '../src/view/timepolicy.mjs';
import {execFileSync} from 'node:child_process';
const old=execFileSync('git',['show','4e02d4fb8c1c2614cde765881fe952d603f27f93:web/main.mjs'],{encoding:'utf8'}),now=readFileSync('web/main.mjs','utf8');
const fn=s=>s.slice(s.indexOf('function stepTicks(n)'),s.indexOf('function frame(now)'));
function run(source,stop){let advances=0,opens=0,renders=0;const g={day:0,tick:0,ships:[{voyage:{},route:{}}]};const ctx={g,automaticTime:false,arrivalNeedsDecision,playing:true,sel:0,autosave(){},render(){renders++;},open3d(){opens++;},advanceTick(){advances++;g.tick++;if(advances===3){if(stop==='arrival')g.ships[0].voyage=null;else if(stop!=='none')g[stop]={};}}};vm.createContext(ctx);vm.runInContext(fn(source)+';stepTicks(20);',ctx);return{g,advances,opens,renders,playing:ctx.playing};}
for(const stop of ['arrival','pending','encounterReport','over','none'])test('OFF exact step parity versus parent for '+stop,()=>{assert.deepEqual(run(now,stop),run(old,stop));});
