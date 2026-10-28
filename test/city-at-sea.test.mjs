import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../web/main.mjs',import.meta.url),'utf8');
test('city services show an explicit at-sea state instead of voyage controls',()=>{
 assert.match(source,/if \(inCity && s\.voyage\) \{\s*h \+= `<p data-city-away role="status">/);
 assert.match(source,/else if \(inCity \|\| pe\) \{/);
 assert.match(source,/Los servicios del puerto estarán disponibles cuando atraque/);
 assert.match(source,/Port services will be available when it docks/);
});
test('privateering sea controls stay outside city service windows',()=>{
 assert.match(source,/if \(!inCity && s\.voyage && privateeringReady\) h \+= privateeringSeaHtml/);
});

test('returning to the map redraws its voyage context',()=>{
 assert.ok(source.includes('d.querySelector("[data-map]").onclick=()=>{close3d();render();};'));
});
