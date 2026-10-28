import test from 'node:test';import assert from 'node:assert/strict';import{readFileSync}from'node:fs';
const src=readFileSync(new URL('../web/main.mjs',import.meta.url),'utf8');
test('Back keeps new-campaign fields in memory and successful launch retires the draft',()=>{assert.match(src,/createDraft\?\.profile \?\? defaultProfile/);assert.match(src,/createDraft = \{profile: pf, freeNav\}; showTitle\(\)/);assert.match(src,/const launch = \(\) => \{ createDraft = null/);});
