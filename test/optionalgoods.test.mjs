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
  const out = withPottery(w);
  assert.notEqual(out, w);
  assert.deepEqual(w.goods, { grain: { base: 22 } }, 'input world unchanged');
  assert.equal(out.goods.pottery.base, POTTERY.base);
  assert.ok(out.cities.find(c => c.id === 'valencia').makes.includes('pottery'));
  assert.ok(out.cities.find(c => c.id === 'lisboa').needs.includes('pottery'));
  assert.ok(!out.cities.find(c => c.id === 'porto').makes.includes('pottery'), 'porto is not a maker');
  assert.ok(!out.cities.find(c => c.id === 'porto').needs.includes('pottery'), 'porto is not a consumer');
  assert.deepEqual(out.cities.find(c => c.id === 'valencia').makes.filter(g => g === 'silk'), ['silk'], 'existing makes kept');
});

test('withPottery is idempotent when the world already has the good', () => {
  const once = withPottery(world());
  const twice = withPottery(once);
  const valencia = twice.cities.find(c => c.id === 'valencia');
  assert.deepEqual(valencia.makes.filter(g => g === 'pottery'), ['pottery'], 'no duplicate makes');
  const lisboa = twice.cities.find(c => c.id === 'lisboa');
  assert.deepEqual(lisboa.needs.filter(g => g === 'pottery'), ['pottery'], 'no duplicate needs');
});

test('withLegumes adds the good with Sevilla as the only maker', () => {
  const w = world();
  const out = withLegumes(w);
  assert.equal(out.goods.legumes.base, LEGUMES.base);
  assert.ok(out.cities.find(c => c.id === 'sevilla').makes.includes('legumes'));
  assert.ok(out.cities.find(c => c.id === 'valencia').needs.includes('legumes'));
  assert.ok(!out.cities.find(c => c.id === 'porto').needs.includes('legumes'));
  assert.deepEqual(w.goods, { grain: { base: 22 } }, 'input world unchanged');
});
