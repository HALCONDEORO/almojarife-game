import test from 'node:test';
import assert from 'node:assert/strict';
import {loadWorld} from '../src/sim/world.mjs';
import {makeMarket, tickMarket, price} from '../src/sim/market.mjs';
const world=loadWorld();
test('Bilbao grain import dependency is represented without claiming local production',()=>{
 const city=world.nodes.bilbao;
 assert.ok(city.needs.includes('grain'));
 assert.ok(!city.makes.includes('grain'));
 const market=makeMarket(world);
 assert.equal(market.bilbao.grain.needs,true);
 assert.equal(market.bilbao.grain.target,90);
 for(let d=0;d<365;d++)tickMarket(market,d,world);
 assert.ok(market.bilbao.grain.stock>=0);
 assert.ok(Number.isFinite(price(world,market.bilbao.grain,'grain')));
});
