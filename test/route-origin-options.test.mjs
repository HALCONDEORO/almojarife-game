import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../web/main.mjs',import.meta.url),'utf8');
test('advanced circuit offers every discovered port including the current origin; simple destination excludes it',()=>{
 assert.match(src,/routePorts = world.cities.filter\(\(c\) => isDiscovered\(g, c.id\)\), others = routePorts.filter\(\(c\) => c.id !== s.at\)/);
 assert.match(src,/const cityOpts = routePorts.map/);
 assert.match(src,/<select id="rt-to">\$\{others.map/);
});
