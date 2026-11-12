import test from 'node:test';
import assert from 'node:assert/strict';
import {routeFieldLabel} from '../src/view/routefieldlabels.mjs';
for(const lang of ['es','en'])test(`${lang} labels identify field and 1-based stop`,()=>{
 const fields=['city','buyGood','buyMax','sellGood','sellMin','remove'];
 const names=fields.map(field=>routeFieldLabel(field,1,lang));
 assert.equal(new Set(names).size,fields.length);
 for(const name of names)assert.match(name,lang==='es'?/^Parada 2: /:/^Stop 2: /);
 assert.match(routeFieldLabel('buyMax',0,lang),lang==='es'?/máximo.*monedas por unidad/:/Maximum.*coins per unit/);
 assert.match(routeFieldLabel('sellMin',0,lang),lang==='es'?/mínimo.*monedas por unidad/:/Minimum.*coins per unit/);
 assert.match(routeFieldLabel('limitHint',0,lang),lang==='es'?/vacío.*límite/:/blank.*limit/);
 assert.match(routeFieldLabel('cash',0,lang),lang==='es'?/monedas/:/coins/);
});
test('unknown labels fail closed and fallback is Spanish',()=>{
 assert.throws(()=>routeFieldLabel('typo',0),RangeError);
 for(const index of [-1,NaN,1.5])assert.throws(()=>routeFieldLabel('city',index),RangeError);
 assert.equal(routeFieldLabel('city',0,'fr'),routeFieldLabel('city',0,'es'));
});

import {routeOrderLabel} from '../src/view/routeorder.mjs';
test('order labels can be refreshed from the currently selected city',()=>{
 assert.equal(routeOrderLabel(0,'Cádiz',1,'es'),'Bajar: 1. Cádiz');
 assert.equal(routeOrderLabel(2,'Sevilla',-1,'en'),'Move up: 3. Sevilla');
});
