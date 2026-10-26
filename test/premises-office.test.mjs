import test from 'node:test';
import assert from 'node:assert/strict';
import { premises } from '../src/view/premises.mjs';

// After buying an office the Oficina tab must not keep saying "no tienes oficina":
// web/main.mjs passes hasOffice(g, city) as the 4th argument.
test('premises info reflects a purchased office',()=>{
 const g={profile:{home:'cadiz'}};
 assert.match(premises(g,'sevilla','es',true).info,/Tienes una oficina comercial/);
 assert.match(premises(g,'sevilla','en',true).info,/own a trading office/);
 assert.match(premises(g,'sevilla','es',false).info,/No tienes una oficina propia/);
 assert.match(premises(g,'sevilla').info,/No tienes/); // default: no office
 assert.equal(premises(g,'sevilla','es',true).label,'Oficina');
 assert.match(premises(g,'cadiz','es',true).info,/Sede de tu casa/); // home wins over the office flag
});
