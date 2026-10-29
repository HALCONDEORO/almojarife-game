import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
test('fit and fullscreen buttons use inline SVG independent of font glyph support',()=>{
 const js=readFileSync(new URL('../web/main.mjs',import.meta.url),'utf8');
 for(const k of ['fit','fs'])assert.match(js,new RegExp(`data-corner="${k}"><svg width="18" height="18"`));
 assert.ok(js.includes('aria-hidden="true" fill="none" stroke="currentColor"'));
 assert.ok(js.includes('syncFullscreenButtons([cfs]'));
 const fullscreen=readFileSync(new URL('../web/fullscreen.mjs',import.meta.url),'utf8');
 assert.ok(fullscreen.includes("button.setAttribute('aria-label', label)"));
});
