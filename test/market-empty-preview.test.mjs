import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('empty market preview is hidden without suppressing live feedback',()=>{
 const css=readFileSync(new URL('../web/ui2d.css',import.meta.url),'utf8');
 const js=readFileSync(new URL('../web/main.mjs',import.meta.url),'utf8');
 assert.match(css,/\.mkt-preview:empty\{display:none\}/);
 assert.ok(js.includes('data-market-preview aria-live="polite"'));
});
