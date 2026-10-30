import test from 'node:test';
import assert from 'node:assert/strict';
import { PHYSICAL_NEEDS_ENABLED, FOOD_PHYSICAL, foodNeedsPolicy } from '../src/sim/food-needs.mjs';

// Pinned provenance table: the physical quantities and their evidence labels exactly as
// researched (heterogeneous evidence: a reconstructed worker basket, an institutional
// allowance, fiscal reconstructions and explicit design assumptions - NOT universal
// historical requirements). If these change on purpose, update the table deliberately.
const BASKET = 'https://e-archivo.uc3m.es/rest/api/core/bitstreams/900ef851-1967-4a5e-b5a4-8f1afdccda6a/content';
const COURT = 'https://ifc.dpz.es/recursos/publicaciones/33/14/_ebook.pdf';
const MEAT = 'https://revistascientificas.us.es/index.php/HID/article/download/22543/19779/95098';
const TABLE = {
  grain: { physicalUnit: 'kg-bread-equivalent', perPersonDay: { poor: 0.450, middle: 0.600, rich: 0.890 },
    evidenceByClass: { poor: 'reconstructed-adult-worker-basket-Sevilla1521-1540', middle: 'design-assumption', rich: 'court-servant-allowance-not-rich-population' },
    sources: { poor: BASKET, rich: COURT } },
  meat: { physicalUnit: 'kg', perPersonDay: { poor: 0.132, middle: 0.220, rich: 0.800 },
    evidenceByClass: { poor: 'reconstructed-adult-worker-basket-Sevilla1521-1540', middle: 'fiscal-reconstruction-population-average-Sevilla1481-not-middle-class', rich: 'fiscal-reconstruction-Abencemerro-household-and-servants-Sevilla1481-not-all-rich' },
    sources: { poor: BASKET, middle: MEAT, rich: MEAT } },
  fish: { physicalUnit: 'kg', perPersonDay: { poor: 15 / 365, middle: 0.060, rich: 0.060 },
    evidenceByClass: { poor: 'reconstructed-adult-worker-basket-Sevilla1521-1540', middle: 'design-assumption', rich: 'design-assumption' },
    sources: { poor: BASKET } },
  wine: { physicalUnit: 'litre', perPersonDay: { poor: 146 / 365, middle: 0.600, rich: 0.800 },
    evidenceByClass: { poor: 'reconstructed-adult-worker-basket-Sevilla1521-1540', middle: 'design-assumption', rich: 'design-assumption' },
    sources: { poor: BASKET } },
  olive_oil: { physicalUnit: 'litre', perPersonDay: { poor: 7 / 365, middle: 0.030, rich: 0.040 },
    evidenceByClass: { poor: 'reconstructed-adult-worker-basket-food-only-Sevilla1521-1540', middle: 'design-assumption', rich: 'design-assumption' },
    sources: { poor: BASKET } },
};
const GOODS = Object.keys(TABLE), CLASSES3 = ['poor', 'middle', 'rich'];

test('PHYSICAL_NEEDS_ENABLED stays ON (Marco 23/10 decision)', () => {
  assert.equal(PHYSICAL_NEEDS_ENABLED, true);
});

test('FOOD_PHYSICAL is frozen and matches the pinned provenance table, every good and class', () => {
  assert.ok(Object.isFrozen(FOOD_PHYSICAL));
  assert.deepEqual(Object.keys(FOOD_PHYSICAL).sort(), GOODS.sort());
  for (const g of GOODS) {
    assert.deepEqual(FOOD_PHYSICAL[g].perPersonDay, TABLE[g].perPersonDay, `${g} quantities`);
    assert.equal(FOOD_PHYSICAL[g].physicalUnit, TABLE[g].physicalUnit, `${g} unit`);
    assert.deepEqual(FOOD_PHYSICAL[g].evidenceByClass, TABLE[g].evidenceByClass, `${g} evidence`);
    assert.deepEqual(FOOD_PHYSICAL[g].sources, TABLE[g].sources, `${g} sources`);
  }
});

test('foodNeedsPolicy converts every good and class at the default scale 100', () => {
  const policy = Object.fromEntries(GOODS.map(g => [g, { base: 1 }]));
  const out = foodNeedsPolicy(policy);
  for (const g of GOODS) for (const c of CLASSES3)
    assert.equal(out[g].perPersonDay[c], TABLE[g].perPersonDay[c] / 100, `${g}.${c}`);
});

test('foodNeedsPolicy converts every good and class at an explicit scale', () => {
  const policy = Object.fromEntries(GOODS.map(g => [g, { base: 1 }]));
  const out = foodNeedsPolicy(policy, 50);
  for (const g of GOODS) {
    for (const c of CLASSES3) assert.equal(out[g].perPersonDay[c], TABLE[g].perPersonDay[c] / 50, `${g}.${c}`);
    assert.equal(out[g].physicalPerMarketUnit, 50, g);
  }
});

test('foodNeedsPolicy labels every row: game-unit, physical unit, mixed-evidence tag, evidenceByClass and sources', () => {
  const out = foodNeedsPolicy(Object.fromEntries(GOODS.map(g => [g, {}])));
  for (const g of GOODS) {
    assert.equal(out[g].unit, 'game-unit', g);
    assert.equal(out[g].physicalUnit, TABLE[g].physicalUnit, g);
    assert.equal(out[g].physicalPerMarketUnit, 100, g);
    assert.equal(out[g].evidence, 'mixed-explicit-see-evidenceByClass', g);
    assert.deepEqual(out[g].evidenceByClass, TABLE[g].evidenceByClass, `${g} evidence labels`);
    assert.deepEqual(out[g].source, TABLE[g].sources, `${g} sources carried`);
  }
});

test('foodNeedsPolicy conversion does not depend on input row content', () => {
  const a = foodNeedsPolicy({ grain: { base: 22 } });
  const b = foodNeedsPolicy({ grain: { base: 9999, multiplier: 7, note: 'noise' } });
  assert.deepEqual(a.grain.perPersonDay, b.grain.perPersonDay);
});

test('foodNeedsPolicy does not mutate the input and preserves the whole policy', () => {
  const policy = { grain: { base: 22, custom: 'keep-me' }, silk: { base: 300 } };
  const snapshot = structuredClone(policy);
  const out = foodNeedsPolicy(policy);
  assert.deepEqual(policy, snapshot, 'input unchanged, deeply');
  assert.equal(out.grain.base, 22);
  assert.equal(out.grain.custom, 'keep-me', 'existing row fields survive');
  assert.deepEqual(out.silk, { base: 300 }, 'non-food good passes through');
});
