import test from 'node:test';import assert from 'node:assert/strict';import {TUT_TEXT} from '../src/game/tutorial.mjs';
test('standing-route tutorial directs players to the visible city Ships control',()=>{
 assert.match(TUT_TEXT.es.route,/botón Barcos en la ciudad/);assert.match(TUT_TEXT.en.route,/Ships button in the city/);
 assert.doesNotMatch(TUT_TEXT.es.route,/pestaña Ruta/);assert.doesNotMatch(TUT_TEXT.en.route,/Route tab/);
});
