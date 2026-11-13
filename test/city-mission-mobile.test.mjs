import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync('web/index.html','utf8');
const mobile=html.match(/\/\* Keep mission text and its controls left of the mobile city sidebar\. \*\/[\s\S]*?\n\}/)?.[0];
test('mission sidebar clearance is confined to the existing mobile breakpoint',()=>{
 assert.ok(mobile);
 assert.match(mobile,/@media\(max-width:600px\)/);
 assert.match(mobile,/#v3d \.city-mission-wrap\{max-width:calc\(100% - 200px\);flex-wrap:wrap/);
 // Existing mobile sidebar is 184px: reserve it plus the chip's left/gap margins.
 assert.match(html,/@media\(max-width:600px\)\{[^\n]*\.city-controls\{width:184px/);
 assert.ok(200>=184+8+8);
 assert.doesNotMatch(mobile,/\.city-controls\{|\.city-panel-host|weekly|\.city-window/);
});
test('mobile objective can wrap and scroll without losing its action buttons',()=>{
 assert.match(mobile,/pointer-events:auto;max-height:calc\(100% - 48px\);overflow:auto/);
 assert.match(mobile,/#v3d \.city-mission\{box-sizing:border-box;flex:1 1 100%;min-width:0;overflow-wrap:anywhere\}/);
 // CSS does not replace DOM or the existing minimise/restore and skip actions.
 const js=readFileSync('web/main.mjs','utf8');
 assert.ok(js.includes('$('+'"mission-min").onclick=()=>{localStorage.setItem("missionMin","1")'));
 assert.ok(js.includes('$('+'"mission-max").onclick=()=>{localStorage.setItem("missionMin","0")'));
 assert.ok(js.includes('tsk.onclick = () => act(() => skipTutorial(g))'));
});
