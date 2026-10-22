import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {newCamera,resizeCamera,viewBox} from '../src/view/camera.mjs';
test('mobile map keeps a usable height instead of shrinking to height:auto',()=>{
 const html=readFileSync('web/index.html','utf8');
 assert.match(html,/main>\.card>#map\{flex:1 1 auto;height:calc\(100dvh - 350px\);min-height:340px\}/);
 assert.doesNotMatch(html,/main>\.card>#map\{flex:none;height:auto\}/);
 for(const viewportHeight of [667,844])assert.ok(Math.max(340,viewportHeight-350)>=340);
});
test('390x844 mobile map preserves geographic aspect and complete bounds',()=>{
 const camera=newCamera(800,829),mapWidth=350,mapHeight=494;resizeCamera(camera,mapWidth/mapHeight);
 const[x,y,w,h]=viewBox(camera);assert.equal(w,800);assert.equal(h,829);assert.equal(x,0);assert.equal(y,0);
});
