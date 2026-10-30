import test from 'node:test';import assert from 'node:assert/strict';import {TUT_TEXT} from '../src/game/tutorial.mjs';
test('sell step tells the player to sail first, keeping the city Market pointer',()=>{
  assert.match(TUT_TEXT.es.sell,/zarpa/);assert.match(TUT_TEXT.en.sell,/sail/);
  assert.match(TUT_TEXT.es.sell,/Mercado de la ciudad/);assert.match(TUT_TEXT.en.sell,/city Market/);
});
