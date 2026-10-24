import test from 'node:test';
import assert from 'node:assert/strict';
import {cityPlots} from '../src/view3d/cityplots.mjs';
import {urbanLayout,housingScale} from '../src/view/urbanlayout.mjs';
import {validateOccupancy} from '../src/view/city2d.mjs';
test('urban districts preserve every canonical parcel and never mutate simulation layout',async()=>{
 for(const [id,pop] of [['huelva',3000],['cadiz',15000],['lisboa',60000]]){
  const old=await cityPlots(id,pop),before=JSON.stringify(old),v=urbanLayout(old,pop);
  assert.equal(JSON.stringify(old),before);assert.equal(v.plots.length,old.plots.length);
  for(let i=0;i<old.plots.length;i++)for(const key of ['id','type','w','d'])assert.equal(v.plots[i][key],old.plots[i][key]);
  assert.equal(validateOccupancy([...v.plots,...v.residential]).collisions.length,0);
  const yard=v.plots[1],store=v.plots[5];assert.ok(v.visualBounds.maxX-yard.x-yard.w<10);assert.ok(v.visualBounds.maxX-store.x-store.w<10);
  for(const p of [...v.plots,...v.residential])assert.ok(p.x>=0&&p.y>=0&&p.x+p.w<=v.visualBounds.maxX&&p.y+p.d<=v.visualBounds.maxY);
 }
});
test('hundreds of people per drawing, rising density, bounded residential groups',()=>{
 assert.deepEqual([3000,15000,60000].map(p=>housingScale(p).groups),[10,28,67]);
 assert.deepEqual([3000,15000,60000].map(p=>housingScale(p).peoplePerGroup),[300,536,896]);
 for(let p=1000;p<100000;p+=250)assert.ok(housingScale(p+250).groups>=housingScale(p).groups);
 assert.equal(housingScale(1000000).groups,72);assert.equal(housingScale(0).groups,0);
 assert.throws(()=>housingScale(NaN));assert.throws(()=>housingScale(-1));
});
test('fifty ports keep separate footprints and streets outside parcel interiors',async()=>{
 for(let i=0;i<50;i++){
  const old=await cityPlots('fixture'+i,3000+i*1200),v=urbanLayout(old,3000+i*1200);
  assert.equal(validateOccupancy([...v.plots,...v.residential]).collisions.length,0);
  for(const p of [...v.plots,...v.residential])for(const r of v.paths){
   if(r.beg.x===r.end.x)assert.ok(!(r.beg.x>p.x&&r.beg.x<p.x+p.w&&Math.max(r.beg.y,r.end.y)>p.y&&Math.min(r.beg.y,r.end.y)<p.y+p.d));
   else assert.ok(!(r.beg.y>p.y&&r.beg.y<p.y+p.d&&Math.max(r.beg.x,r.end.x)>p.x&&Math.min(r.beg.x,r.end.x)<p.x+p.w));
  }
 }
});
