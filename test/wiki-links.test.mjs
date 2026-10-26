import test from 'node:test';
import assert from 'node:assert/strict';
import {readdirSync,readFileSync,existsSync} from 'node:fs';
import {join,dirname,resolve} from 'node:path';
const files=d=>readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(join(d,e.name)):e.name.endsWith('.md')?[join(d,e.name)]:[]);
test('all relative wiki Markdown destinations exist from their containing page',()=>{
 const missing=[];
 for(const p of files('docs/wiki'))for(const m of readFileSync(p,'utf8').matchAll(/\[[^\]]+\]\(([^)]+)\)/g)){
  const u=m[1];if(/^(?:[a-z]+:|#|\/)/i.test(u))continue;
  if(!existsSync(resolve(dirname(p),decodeURIComponent(u.split('#')[0]))))missing.push(`${p}: ${u}`);
 }
 assert.deepEqual(missing,[]);
});
