import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../web/main.mjs',import.meta.url),'utf8');
for(const [id,key] of [['rt-to','routeTo'],['rt-out','routeOut'],['rt-back','routeBack']])test(`simple route ${id} has an associated translated native label`,()=>{
 assert.ok(source.includes(`<label for="${id}">\${t.${key}}:</label> <select id="${id}">`));
});
