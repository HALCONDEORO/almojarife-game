import test from 'node:test';
import assert from 'node:assert/strict';
import {cityPlots} from '../src/view3d/cityplots.mjs';
import {urbanLayout} from '../src/view/urbanlayout.mjs';
const hit=(a,b)=>a.x<b.x+b.w&&b.x<a.x+a.w&&a.y<b.y+b.d&&b.y<a.y+a.d;
test('Cádiz layout is fixed, walled and keeps ids and sizes',async()=>{
  const c=await cityPlots('cadiz',12000),L=urbanLayout(c,12000),L2=urbanLayout(await cityPlots('cadiz',12000),12000);
  assert.deepEqual(L.plots.map(p=>[p.x,p.y]),L2.plots.map(p=>[p.x,p.y]));
  assert.ok(L.walled&&L.walled.maxX>L.walled.minX);
  assert.deepEqual(L.plots.map(p=>p.id),c.plots.map(p=>p.id));
  const svc=L.plots.slice(0,6),quay=L.walled.maxX;
  for(const i of [1,5])assert.ok(quay-(svc[i].x+svc[i].w)<=6,'shipyard and warehouse on the quay');
  for(let i=0;i<svc.length;i++){assert.ok(!hit(svc[i],L.plaza));for(let j=i+1;j<svc.length;j++)assert.ok(!hit(svc[i],svc[j]))}
  for(const l of L.plots.slice(6))for(const s of svc)assert.ok(!hit(l,s));
  const o=urbanLayout(await cityPlots('sevilla',40000),40000);assert.equal(o.walled,undefined);
});
