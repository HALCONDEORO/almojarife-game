import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const main=readFileSync(new URL('../web/main.mjs',import.meta.url),'utf8');
test('merchant and house names update as text without redrawing the setup form',()=>{
 const preview=main.slice(main.indexOf('const previewNames ='),main.indexOf('const read =',main.indexOf('const previewNames =')));
 assert.ok(preview.includes('$("founding-person-name").textContent'));
 assert.ok(preview.includes('$("founding-house-name").textContent'));
 assert.ok(preview.includes('$("p-co").oninput = previewNames'));
 assert.ok(preview.includes('$("p-ch").oninput = previewNames'));
 assert.doesNotMatch(preview,/innerHTML|draw\(/);
 assert.ok(preview.includes('Tu mercader'));assert.ok(preview.includes('Your merchant'));
});
