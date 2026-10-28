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

// Pin the pre-optimization geometry and count allocations instead of asserting wall time.
test('scrub generation reuses farmland rectangles without changing geometry',t=>{
 const allocations=t.mock.method(Array,'from');
 const actual=scrubPatches(bounds);
 const farmlandBuilds=allocations.mock.calls.filter(c=>c.arguments[0]?.length===9).length;
 assert.equal(farmlandBuilds,1,'build the nine farmland rectangles once per scrub generation');
 assert.deepEqual(actual,[
  {"x":-33.64268451416865,"y":9.67942865844816,"rx":5.872106558876112,"ry":8.54166975012049},
  {"x":-53.34211447602138,"y":34.05225009424612,"rx":12.594675636617467,"ry":6.910421922104433},
  {"x":20.62693857308477,"y":-42.48282985948026,"rx":10.94505887804553,"ry":7.843050446826965},
  {"x":-8.584181298036128,"y":-43.79741215938702,"rx":13.777806505095214,"ry":5.763199065811932},
  {"x":4.204724762123078,"y":-48.190140939783305,"rx":7.527084588073194,"ry":7.958510996541008},
  {"x":-51.22282765246928,"y":-49.74810755904764,"rx":5.521694324212149,"ry":8.618983927415684},
  {"x":46.69366693450138,"y":-56.341070832684636,"rx":11.199443665100262,"ry":6.508216520072892},
  {"x":-51.591908967122436,"y":32.95312501024455,"rx":5.267426621867344,"ry":7.218939805403352},
  {"x":-8.599600072950125,"y":-53.92758088000119,"rx":8.47198977181688,"ry":10.392893461044878},
  {"x":27.50959813548252,"y":-33.69557751622051,"rx":6.825812644558027,"ry":5.345751641783863},
  {"x":29.041441649198532,"y":-49.447520811110735,"rx":5.5192359099164605,"ry":6.598137402208522},
  {"x":-41.8380562402308,"y":-28.687246666755527,"rx":10.298302409471944,"ry":5.329649521037936},
 ]);
});
