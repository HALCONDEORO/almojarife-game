import test from 'node:test';
import assert from 'node:assert/strict';
import { PURSE_UNCAPPED, HOUSEHOLD_INCOME, settleHouseholdDay, capRetailByPurses } from '../src/sim/households.mjs';
import { CLASSES, classCounts } from '../src/sim/classes.mjs';

const POP = 2000; // size 0: poor 1600, middle 360, rich 40 (classShares pinned by classCounts)
const city = () => ({ grain: { pop: POP, commerce: {} } });

test('classCounts fixture: pop 2000 splits 1600/360/40', () => {
  assert.deepEqual(classCounts(POP), { poor: 1600, middle: 360, rich: 40 });
});

test('PURSE_UNCAPPED is the food basket plus legumes, and incomes stay frozen', () => {
  assert.deepEqual([...PURSE_UNCAPPED].sort(), ['fish', 'grain', 'legumes', 'meat', 'olive_oil', 'salt']);
  assert.ok(Object.isFrozen(HOUSEHOLD_INCOME));
  assert.deepEqual(HOUSEHOLD_INCOME, { poor: 0.48, middle: 1.2, rich: 4.65 });
});

test('settleHouseholdDay is a no-op without a commerce account', () => {
  assert.equal(settleHouseholdDay({ grain: { pop: POP } }, { poor: 10 }), null);
  assert.equal(settleHouseholdDay({}, {}), null);
});

test('settleHouseholdDay pays the day income per class with no spend', () => {
  const c = city();
  const h = settleHouseholdDay(c, {});
  assert.deepEqual(h.poor, { cash: 768, income: 768, spent: 0, unmet: 0 });   // 1600 * 0.48
  assert.deepEqual(h.middle, { cash: 432, income: 432, spent: 0, unmet: 0 }); // 360 * 1.2
  assert.deepEqual(h.rich, { cash: 186, income: 186, spent: 0, unmet: 0 });   // 40 * 4.65
});

test('settleHouseholdDay pays what the purse covers and accrues the rest as unmet', () => {
  const c = city();
  settleHouseholdDay(c, {}); // poor cash 768 after day 1
  const h = settleHouseholdDay(c, { poor: 2000, middle: 100 }); // day 2 income lands first: poor cash 1536
  assert.equal(h.poor.cash, 0, 'purse emptied by the due');
  assert.equal(h.poor.spent, 1536, 'paid only what the purse covered');
  assert.equal(h.poor.unmet, 2000 - 1536, 'the rest accrues as unmet');
  assert.equal(h.middle.spent, 100, 'middle covers its due in full');
  assert.equal(h.middle.unmet, 0);
  assert.equal(h.middle.cash, 432 + 432 - 100);
});

test('settleHouseholdDay respects a custom income table', () => {
  const c = city();
  const h = settleHouseholdDay(c, {}, { poor: 1, middle: 2, rich: 10 });
  assert.equal(h.poor.income, 1600);
  assert.equal(h.middle.income, 720);
  assert.equal(h.rich.income, 400);
});

test('capRetailByPurses returns zeros on empty demand or price', () => {
  const zero = { units: 0, spend: { poor: 0, middle: 0, rich: 0 } };
  assert.deepEqual(capRetailByPurses({ poor: 10 }, { poor: 1 }, 0, 5), zero);
  assert.deepEqual(capRetailByPurses({ poor: 10 }, { poor: 1 }, 5, 0), zero);
  assert.deepEqual(capRetailByPurses({ poor: 10 }, {}, 5, 5), zero);
});

test('capRetailByPurses: equal shares split 10 units 4/3/3 with exact spend', () => {
  const r = capRetailByPurses({ poor: 1e9, middle: 1e9, rich: 1e9 }, { poor: 1, middle: 1, rich: 1 }, 10, 3);
  assert.equal(r.units, 10);
  assert.deepEqual(r.spend, { poor: 12, middle: 9, rich: 9 });
  assert.equal(r.spend.poor + r.spend.middle + r.spend.rich, 10 * 3, 'invariant: sum(spend) == units*price');
});

test('capRetailByPurses: a broke purse buys nothing and its units are not all resold', () => {
  const r = capRetailByPurses({ poor: 1, middle: 100, rich: 100 }, { poor: 1, middle: 1, rich: 1 }, 10, 3);
  assert.equal(r.spend.poor, 0, 'poor cannot pay, is not charged');
  assert.equal(r.units, 8, 'two units stay on the shelf (single remainder pass, no full resale)');
  assert.deepEqual(r.spend, { poor: 0, middle: 12, rich: 12 });
});

test('capRetailByPurses: uneven shares and a zero-share class', () => {
  const r = capRetailByPurses({ poor: 1e9, middle: 1e9, rich: 1e9 }, { poor: 2, middle: 1, rich: 0 }, 7, 5);
  assert.deepEqual(r, { units: 7, spend: { poor: 25, middle: 10, rich: 0 } });
});

test('capRetailByPurses: every class spend stays within its budget', () => {
  const budget = { poor: 4, middle: 6.5, rich: 0.99 };
  const r = capRetailByPurses(budget, { poor: 1, middle: 2, rich: 1 }, 9, 2);
  for (const c of CLASSES) assert.ok(r.spend[c] <= budget[c], `${c} within budget`);
  assert.equal(r.spend.poor + r.spend.middle + r.spend.rich, r.units * 2);
  assert.deepEqual(r, { units: 5, spend: { poor: 4, middle: 6, rich: 0 } });
});
