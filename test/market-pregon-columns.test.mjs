import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('desktop market heads and rows reserve the same badge-safe name track',()=>{
 const css=readFileSync(new URL('../web/ui2d.css',import.meta.url),'utf8');
 assert.match(css,/@media\(min-width:900px\)\{\.mkt-head,\.mkt-row\{grid-template-columns:26px 142px 58px 66px 40px 44px 86px 86px\}\}/);
});
