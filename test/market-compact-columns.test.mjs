import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
test('compact desktop row tracks share a badge-safe fixed goods width',()=>{
 const css=readFileSync(new URL('../web/ui2d.css',import.meta.url),'utf8');
 assert.match(css,/@media\(min-width:651px\) and \(max-width:899px\)\{\.mkt-head,\.mkt-row\{grid-template-columns:24px 130px 54px 60px 30px 36px 76px 76px\}\}/);
});
