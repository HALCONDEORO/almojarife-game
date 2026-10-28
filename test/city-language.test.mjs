import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../web/main.mjs',import.meta.url),'utf8');
test('right City service labels resolve the current language before memoizing their HTML',()=>{
 assert.match(src,/function renderRightTabs\(\) \{\s*const t = T\[lang\];/);
 assert.match(src,/const sig = `\$\{rightTab\}\|\$\{lang\}/);
});
