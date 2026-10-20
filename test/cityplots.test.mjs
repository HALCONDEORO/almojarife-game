import test from 'node:test';import assert from 'node:assert/strict';import {cityPlots} from '../src/view3d/cityplots.mjs';
test('seeded adapter is repeatable and city size changes layout without game data',async()=>{
 const a=await cityPlots('cadiz',8000);assert.deepEqual(a,await cityPlots('cadiz',8000));assert.notDeepEqual(a,await cityPlots('barcelona',25000));assert.equal(a.size,48);assert.equal((await cityPlots('barcelona',25000)).size,72);
});
test('50 city seeds: plots stay in bounds, do not overlap or cover streets',async()=>{
 for(let i=0;i<50;i++){
 const l=await cityPlots(`fixture${i}`,8000+i*500),tiles=new Set(),roads=new Set();
 for(const p of l.paths){assert.ok(p.beg.x===p.end.x||p.beg.y===p.end.y);const dx=Math.sign(p.end.x-p.beg.x),dy=Math.sign(p.end.y-p.beg.y),n=Math.abs(p.end.x-p.beg.x)+Math.abs(p.end.y-p.beg.y);for(let k=0;k<=n;k++)roads.add(`${p.beg.x+dx*k}:${p.beg.y+dy*k}`);}
 for(const p of l.plots){assert.ok(p.x>=0&&p.y>=0&&p.x+p.w<=l.size&&p.y+p.d<=l.size);for(let x=p.x;x<p.x+p.w;x++)for(let y=p.y;y<p.y+p.d;y++){const k=`${x}:${y}`;assert.ok(!tiles.has(k));assert.ok(!roads.has(k));tiles.add(k);}}
 }
});
test('bad city parameters rejected',async()=>{for(const [id,pop] of [[null,8],['cadiz',NaN],['cadiz',-1]])await assert.rejects(cityPlots(id,pop));});
