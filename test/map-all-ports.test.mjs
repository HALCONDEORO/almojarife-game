import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const main=fs.readFileSync(new URL('../web/main.mjs',import.meta.url),'utf8');
test('chart draws all port names, but unknown ports cannot open menus or become destinations',()=>{
 const loop=main.slice(main.indexOf('for (const c of world.cities) {',main.indexOf('const historical = historicalLayer')));
 assert.match(loop,/const explored = isDiscovered\(g, c.id\)/);assert.doesNotMatch(loop.slice(0,loop.indexOf('m += historical.svg')),/if \(!isDiscovered\(g, c.id\)\) continue/);
 assert.match(loop,/data-explored="\$\{explored\}"/);assert.match(loop,/Puerto no explorado/);
 assert.ok(main.includes(`querySelectorAll('g.city[data-explored="true"]')`));
 assert.match(main,/ports:world.cities.filter\(c=>isDiscovered\(g,c.id\)\)/);
 assert.match(main,/const hiddenPort = \(id\) => cityIdSet.has\(id\) && !isDiscovered\(g, id\)/);
});
