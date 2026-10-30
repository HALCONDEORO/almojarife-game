import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
test('fit and fullscreen buttons use inline SVG independent of font glyph support',()=>{
 const js=readFileSync(new URL('../web/main.mjs',import.meta.url),'utf8');
 const html=readFileSync(new URL('../web/index.html',import.meta.url),'utf8');
 assert.match(html,/data-corner="fit"><svg width="18" height="18"/);
 assert.match(html,/<button id="fs" hidden aria-label="Fullscreen" title="Fullscreen"><svg width="16" height="16"/);
 assert.ok(html.includes('aria-hidden="true" fill="none" stroke="currentColor"'));
 const fullscreen=readFileSync(new URL('../web/fullscreen.mjs',import.meta.url),'utf8');
 assert.ok(fullscreen.includes("button.setAttribute('aria-label', label)"));
});
