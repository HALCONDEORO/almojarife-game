import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../web/city2d/',import.meta.url);
test('delivered art checksums match each manifest entry',async()=>{const m=JSON.parse(await readFile(new URL('manifest.json',root),'utf8'));assert.equal(Object.keys(m.assets).length,114);for(const [key,a] of Object.entries(m.assets)){assert.match(a.file,/^assets\/[a-z0-9_-]+\.webp$/);const bytes=await readFile(new URL(a.file,root));assert.equal(bytes.toString('ascii',8,12),'WEBP',key);assert.equal(createHash('sha256').update(bytes).digest('hex'),a.fileSha256,key);assert.deepEqual(a.anchor,[256,500],key);}});
test('new city view accepts state only from its own parent and city',async()=>{const s=await readFile(new URL('scene.mjs',root),'utf8');assert.match(s,/e\.origin!==location\.origin\|\|e\.source!==parent/);assert.match(s,/e\.data\.city!==city/);assert.match(s,/prefers-reduced-motion: reduce/);assert.match(s,/if\(preview\)return/);});
