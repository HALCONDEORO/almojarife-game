import test from 'node:test';
import assert from 'node:assert/strict';
import { PHYSICAL_NEEDS_ENABLED, FOOD_PHYSICAL, foodNeedsPolicy } from '../src/sim/food-needs.mjs';

test('PHYSICAL_NEEDS_ENABLED stays ON (Marco 23/10 decision)', () => {
  assert.equal(PHYSICAL_NEEDS_ENABLED, true);
});

test('FOOD_PHYSICAL keeps the evidenced per-person quantities', () => {
  assert.equal(FOOD_PHYSICAL.grain.perPersonDay.poor, 0.450);
  assert.equal(FOOD_PHYSICAL.grain.perPersonDay.rich, 0.890);
  assert.equal(FOOD_PHYSICAL.meat.perPersonDay.poor, 0.132);
  assert.ok(Object.isFrozen(FOOD_PHYSICAL));
});

test('foodNeedsPolicy converts per-person quantities to game units at the default scale', () => {
  const policy = { grain: { base: 22 }, meat: { base: 95 } };
  const out = foodNeedsPolicy(policy);
  assert.equal(out.grain.perPersonDay.poor, 0.450 / 100);
  assert.equal(out.grain.perPersonDay.rich, 0.890 / 100);
  assert.equal(out.grain.physicalPerMarketUnit, 100);
  assert.equal(out.grain.unit, 'game-unit');
  assert.equal(out.grain.physicalUnit, 'kg-bread-equivalent');
});

test('foodNeedsPolicy respects an explicit scale', () => {
  const out = foodNeedsPolicy({ grain: { base: 22 } }, 50);
  assert.equal(out.grain.perPersonDay.poor, 0.450 / 50);
  assert.equal(out.grain.physicalPerMarketUnit, 50);
});

test('foodNeedsPolicy labels every row as mixed provisional evidence', () => {
  const out = foodNeedsPolicy({ grain: {}, meat: {}, fish: {}, wine: {}, olive_oil: {} });
  for (const g of Object.keys(FOOD_PHYSICAL)) {
    assert.equal(out[g].evidence, 'mixed-explicit-see-evidenceByClass', g);
    assert.ok(out[g].evidenceByClass, g);
    assert.ok(out[g].perPersonDay, g);
  }
});

test('foodNeedsPolicy does not mutate the input and leaves unknown goods untouched', () => {
  const policy = { grain: { base: 22 }, silk: { base: 300 } };
  const out = foodNeedsPolicy(policy);
  assert.notEqual(out, policy);
  assert.deepEqual(policy.grain, { base: 22 }, 'input row unchanged');
  assert.deepEqual(out.silk, { base: 300 }, 'non-food good passes through');
});
