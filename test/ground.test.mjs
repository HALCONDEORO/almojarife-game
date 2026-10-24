import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {GROUND_TYPES,GROUND_ORDER,hash01,fieldPatches,scrubPatches,groundZoneAt} from '../src/view/ground.mjs';

const HEX=/^#[0-9a-f]{6}$/;
const bounds={minX:0,minY:0,maxX:60,maxY:50};
const ctx={bounds,plaza:{x:25,y:20,w:10,d:10},paths:[{beg:{x:3,y:1},end:{x:3,y:40}},{beg:{x:1,y:10},end:{x:50,y:10}}]};

test('every ground type has localized names, a base wash and valid layers',()=>{
 for(const id of GROUND_ORDER){
  const g=GROUND_TYPES[id];
  assert.ok(g,`GROUND_ORDER entry ${id} exists`);
  assert.match(g.names.es,/\S/);assert.match(g.names.en,/\S/);
  assert.match(g.base,HEX);
  if(g.tones)for(const t of g.tones)assert.match(t,HEX);
  assert.ok(Array.isArray(g.layers)&&g.layers.length>=1,`${id} has texture layers`);
  for(const l of g.layers){
   assert.ok(['grain','tufts','ripples','joints','furrows','wear'].includes(l.kind),`${id} layer kind ${l.kind}`);
   for(const c of l.colors)assert.match(c,HEX);
   assert.ok(l.alpha>0&&l.alpha<=1);
  }
 }
 for(const id of Object.keys(GROUND_TYPES))assert.ok(GROUND_ORDER.includes(id),`${id} is classifiable`);
});

test('hash01 is deterministic and stays inside [0,1)',()=>{
 for(let i=0;i<5000;i++)for(const s of [0,1,11,99]){const v=hash01(i,s);assert.ok(v>=0&&v<1,`hash01(${i},${s})=${v}`)}
 assert.equal(hash01(42,7),hash01(42,7));
 assert.notEqual(hash01(42,7),hash01(43,7));
 assert.notEqual(hash01(42,7),hash01(42,8));
});

test('zone classification: square, streets, city earth, quay, sand, farmland, scrub, grass',()=>{
 assert.equal(groundZoneAt(30,25,ctx),'empedrado'); // plaza centre
 assert.equal(groundZoneAt(25,20,ctx),'empedrado'); // plaza corner counts
 assert.equal(groundZoneAt(3,30,ctx),'camino'); // on the vertical street
 assert.equal(groundZoneAt(30,10,ctx),'camino'); // on the transverse street
 assert.equal(groundZoneAt(10,20,ctx),'tierra'); // between buildings
 assert.equal(groundZoneAt(61,20,ctx),'tierra'); // quay strip under the apron
 assert.equal(groundZoneAt(10,55,ctx),'arena'); // south coast band
 assert.equal(groundZoneAt(58,55,ctx),'pradera'); // band stops before the quay corner
 const f=fieldPatches(bounds)[0];
 assert.equal(groundZoneAt(f.x+f.w/2,f.y+f.d/2,ctx),'campo');
 const s=scrubPatches(bounds)[0];
 assert.equal(groundZoneAt(s.x,s.y,ctx),'matorral');
 assert.equal(groundZoneAt(-200,-200,ctx),'pradera'); // beyond every generated patch
});

test('zone classification follows GROUND_ORDER and never mutates its input',()=>{
 const before=JSON.stringify(ctx);
 assert.equal(groundZoneAt(30,25,ctx),'empedrado'); // plaza beats the transverse street check below
 assert.equal(groundZoneAt(30,10,{bounds,plaza:ctx.plaza,paths:ctx.paths}),'camino');
 assert.equal(JSON.stringify(ctx),before);
 assert.throws(()=>groundZoneAt(1,1,{bounds:{...bounds,maxX:0}}));
 assert.throws(()=>groundZoneAt(NaN,1,ctx));
 assert.throws(()=>groundZoneAt(1,1,null));
});

test('farmland and scrub patches are deterministic and stay outside the district',()=>{
 assert.equal(fieldPatches(bounds).length,9);
 assert.deepEqual(fieldPatches(bounds),fieldPatches(bounds));
 for(const f of fieldPatches(bounds)){assert.ok(f.x+f.w<=bounds.minX+1&&f.y+f.d<=bounds.minY+4);assert.ok(f.w>0&&f.d>0)}
 const s=scrubPatches(bounds);
 assert.deepEqual(s,scrubPatches(bounds));
 assert.ok(s.length>=8);
 for(const p of s){
  assert.ok(p.y<=bounds.maxY-2); // off the sand band
  assert.ok(!(p.x+p.rx>bounds.minX-4&&p.x-p.rx<bounds.maxX+4&&p.y+p.ry>bounds.minY-4&&p.y-p.ry<bounds.maxY+4),'clear of the district');
 }
 assert.throws(()=>fieldPatches({...bounds,maxX:0}));
 assert.throws(()=>scrubPatches(null));
});

test('the city scene paints ground from the shared module',async()=>{
 const s=await readFile(new URL('../web/city2d/scene.mjs',import.meta.url),'utf8');
 assert.match(s,/import \{[^}]*GROUND_TYPES[^}]*\} from '\.\.\/\.\.\/src\/view\/ground\.mjs'/);
 assert.match(s,/groundZoneAt\(/);
 assert.match(s,/fieldPatches\(bounds\)/);
 assert.match(s,/drawLandmass\(\)/);
});
