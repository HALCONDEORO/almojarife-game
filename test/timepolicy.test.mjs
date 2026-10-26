import test from 'node:test';import assert from 'node:assert/strict';
import {dayDurationMs,nextTimeSpeed,arrivalNeedsDecision} from '../src/view/timepolicy.mjs';
test('human pacing is 0.05 days per second at 1x',()=>{assert.equal(dayDurationMs(true),20000);});
test('OFF pacing and speed cycle preserve legacy values',()=>{assert.equal(dayDurationMs(false),1500);assert.deepEqual([1,2,4].map(s=>nextTimeSpeed(s,false)),[2,4,1]);});
test('human speeds include 8x for larger fleets',()=>{assert.deepEqual([1,2,4,8].map(s=>nextTimeSpeed(s,true)),[2,4,8,1]);});
test('automatic route arrivals do not interrupt; manual arrivals do',()=>{assert.equal(arrivalNeedsDecision({route:{}},true),false);assert.equal(arrivalNeedsDecision({},true),true);});
test('OFF still pauses on all arrivals',()=>{assert.equal(arrivalNeedsDecision({route:{}},false),true);assert.equal(arrivalNeedsDecision({},false),true);});
import {readFileSync} from 'node:fs';import vm from 'node:vm';
const source=readFileSync('web/main.mjs','utf8');
const step=source.slice(source.indexOf('function stepTicks(n)'),source.indexOf('function frame(now)'));
test('a fleet route arrival consumes the full batch in automatic mode but stops in OFF',()=>{
 for(const automaticTime of [false,true]){
  const g={day:0,ships:[{voyage:{},route:{a:'a',b:'b'}},{voyage:{}}]};let tick=0,opened=0;
  const ctx={g,automaticTime,arrivalNeedsDecision,playing:true,sel:0,autosave(){},render(){},renderFromClock(){},open3d(){opened++;},advanceTick(){tick++;if(tick===3)g.ships[0].voyage=null;}};
  vm.createContext(ctx);vm.runInContext(step+';stepTicks(20);',ctx);
  assert.equal(tick,automaticTime?20:3);assert.equal(ctx.playing,automaticTime);assert.equal(opened,automaticTime?0:1);
 }
});
test('automatic routes never suppress a pending decision or attack',()=>{
 for(const property of ['pending','encounterReport']){
  const g={day:0,ships:[{voyage:{},route:{}}]};let tick=0;
  const ctx={g,automaticTime:true,arrivalNeedsDecision,playing:true,autosave(){},render(){},renderFromClock(){},open3d(){},advanceTick(){tick++;if(tick===3){g.ships[0].voyage=null;g[property]={};}}};
  vm.createContext(ctx);vm.runInContext(step+';stepTicks(20);',ctx);assert.equal(tick,3);assert.equal(ctx.playing,false);
 }
});
