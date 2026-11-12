import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {spawnSync} from 'node:child_process';
const source=readFileSync(new URL('../tools/sim_1000y.mjs',import.meta.url),'utf8');
// Execute the actual reporting tool against a tiny, deterministic fixture. No
// real market calibration is asserted here, only the simulator's wiring/gate.
function run({stock=1,target=1,base=1,years='1',traders='0'}={}){
 const ticks=[],output=[],exits=[];
 const world={cities:[{id:'home'}],goods:{grain:{base}}};
 const context={process:{argv:['node','sim',years,traders],exit:code=>exits.push(code)},console:{log:text=>output.push(JSON.parse(text))},Date,Math,Number,Array,Object,JSON,Error,
 loadWorld:()=>world,makeMarket:()=>({home:{grain:{stock,target}}}),tickMarket:(market,day,seenWorld)=>ticks.push({day,world:seenWorld}),makeShip:()=>({type:'cog',at:'home',hull:100}),tickShip:()=>{},sailTick:()=>false,SHIP_TYPES:{cog:{upkeepPerDay:0}},TICKS_PER_DAY:1,aiStep:()=>{}};
 vm.createContext(context);vm.runInContext(source.replace(/^import .*;$/gm,''),context);
 return {ticks,output:output[0],exits,world};
}
test('the tool passes every simulated day and exact world to tickMarket',()=>{
 const r=run();assert.equal(r.ticks.length,365);assert.equal(r.ticks[0].day,0);assert.equal(r.ticks.at(-1).day,364);assert(r.ticks.every(x=>x.world===r.world));assert.equal(r.output.samples,13);assert.equal(r.output.pinnedShare,0);assert.equal(r.exits[0],0);assert.match(r.output.sampling,/Unrounded/);assert.match(r.output.scope,/not the full player/);
});
test('rounded one-coin price cannot fabricate a clamp',()=>{
 const r=run({stock:4,target:1,base:1});assert.equal(r.output.pinnedShare,0);assert.equal(r.exits[0],0);
});
test('actual unrounded upper and lower clamp samples fail the threshold gate',()=>{
 for(const config of [{stock:1,target:10},{stock:100,target:1}]){const r=run(config);assert.equal(r.output.pinnedShare,1);assert.equal(r.exits[0],1);}
});
test('zero traders are an explicit valid no-trade control',()=>{
 const r=run({traders:'0'});assert.equal(r.output.traders,0);assert.equal(r.output.totalCash,0);
});
test('invalid run sizes fail before looping',()=>{
 for(const [years,traders] of [['0','0'],['-1','1'],['1.5','1'],['NaN','1'],['Infinity','1'],['1','-1'],['1','1.5'],['1','NaN'],[String(Number.MAX_SAFE_INTEGER),'0']])assert.throws(()=>run({years,traders}),/safe integer/);
});
test('real CLI rejects invalid sizes with a nonzero status',()=>{
 for(const args of [['0','0'],['1','-1'],['1','1.5']]){const result=spawnSync(process.execPath,['tools/sim_1000y.mjs',...args],{encoding:'utf8',timeout:10000});assert.notEqual(result.status,0);assert.equal(result.stdout,'');}
});
