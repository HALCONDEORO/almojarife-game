import test from 'node:test';import assert from 'node:assert/strict';import {TUT_TEXT} from '../src/game/tutorial.mjs';
test('buy and sell steps point at the city Market, not the trade-intel tab',()=>{
  assert.match(TUT_TEXT.es.buy,/Mercado de la ciudad/);assert.match(TUT_TEXT.en.buy,/city Market/);
  assert.match(TUT_TEXT.es.sell,/Mercado de la ciudad/);assert.match(TUT_TEXT.en.sell,/city Market/);
});
