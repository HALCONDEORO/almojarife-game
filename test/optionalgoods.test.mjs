import test from 'node:test';
import assert from 'node:assert/strict';
import { POTTERY, LEGUMES, withPottery, withLegumes } from '../src/sim/optional_goods.mjs';

const world = () => ({
  goods: { grain: { base: 22 } },
  cities: [
    { id: 'valencia', makes: ['silk'], needs: ['grain'] },
    { id: 'sevilla', makes: [], needs: [] },
    { id: 'lisboa', makes: [], needs: [] },
    { id: 'porto', makes: [], needs: [] },
  ],
});

test('POTTERY and LEGUMES data stay frozen with their pinned bases', () => {
  assert.ok(Object.isFrozen(POTTERY) && Object.isFrozen(LEGUMES));
  assert.equal(POTTERY.base, 40);
  assert.equal(LEGUMES.base, 20);
  assert.deepEqual(LEGUMES.makers, ['sevilla']);
});

test('withPottery adds the good, makers and consumers without touching the input', () => {
  const w = world();
  const snapshot = structuredClone(w);
  const out = withPottery(w);
  assert.notEqual(out, w);
  assert.deepEqual(w, snapshot, 'input world unchanged, deeply (goods, cities, makes, needs)');
  assert.equal(out.goods.pottery.base, POTTERY.base);
  assert.ok(out.cities.find(c => c.id === 'valencia').makes.includes('pottery'));
  assert.ok(out.cities.find(c => c.id === 'lisboa').needs.includes('pottery'));
  assert.ok(!out.cities.find(c => c.id === 'porto').makes.includes('pottery'), 'porto is not a maker');
  assert.ok(!out.cities.find(c => c.id === 'porto').needs.includes('pottery'), 'porto is not a consumer');
  assert.deepEqual(out.cities.find(c => c.id === 'valencia').makes.filter(g => g === 'silk'), ['silk'], 'existing makes kept');
});

test('withPottery and withLegumes are idempotent: a second join changes nothing, deeply', () => {
  const once = withLegumes(withPottery(world()));
  const twice = withLegumes(withPottery(once));
  assert.deepEqual(twice, once, 'whole world identical after the second join');
  const valencia = twice.cities.find(c => c.id === 'valencia');
  assert.deepEqual(valencia.makes.filter(g => g === 'pottery'), ['pottery'], 'no duplicate makes');
  assert.deepEqual(valencia.makes.filter(g => g === 'silk'), ['silk'], 'pre-existing makes kept');
  const lisboa = twice.cities.find(c => c.id === 'lisboa');
  assert.deepEqual(lisboa.needs.filter(g => g === 'pottery'), ['pottery'], 'no duplicate needs');
  assert.deepEqual(lisboa.needs.filter(g => g === 'legumes'), ['legumes'], 'no duplicate legumes needs');
  assert.deepEqual(twice.cities.find(c => c.id === 'porto'), { id: 'porto', makes: [], needs: [] }, 'unlisted city untouched');
});

test('withLegumes adds the good with Sevilla as the only maker', () => {
  const w = world();
  const snapshot = structuredClone(w);
  const out = withLegumes(w);
  assert.equal(out.goods.legumes.base, LEGUMES.base);
  assert.ok(out.cities.find(c => c.id === 'sevilla').makes.includes('legumes'));
  assert.ok(out.cities.find(c => c.id === 'valencia').needs.includes('legumes'));
  assert.ok(!out.cities.find(c => c.id === 'porto').needs.includes('legumes'));
  assert.deepEqual(w, snapshot, 'input world unchanged, deeply (goods, cities, makes, needs)');
});
