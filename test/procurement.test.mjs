import test from 'node:test';
import assert from 'node:assert/strict';
import {
  COMMERCE_LEDGER_ENABLED, WHOLESALE_PURSE_BINDING, commerceOf, openCommerce, openMarketLedgers,
  recordWholesaleSale, recordMarketPurchase, recordLocalSupply, recordRetailSale,
} from '../src/sim/procurement.mjs';

const world = { goods: { grain: { base: 22 }, timber: { base: 40 }, silk: { base: 300 }, mystery: {} } };
const city = () => ({ grain: { stock: 10 }, timber: { stock: 5 }, unknown: { stock: 7 } }); // opening 10*22 + 5*40 = 420

test('ledger flags stay ON (telemetry + binding purse are product decisions)', () => {
  assert.equal(COMMERCE_LEDGER_ENABLED, true);
  assert.equal(WHOLESALE_PURSE_BINDING, true);
});

test('commerceOf finds the account only when present', () => {
  assert.equal(commerceOf({}), null);
  assert.equal(commerceOf({ grain: {} }), null);
  const acc = { cash: 1 };
  assert.equal(commerceOf({ grain: { commerce: acc } }), acc);
});

test('openCommerce values founding stock at base and skips goods without a positive base', () => {
  const c = city();
  const a = openCommerce(world, c);
  assert.equal(a.cash, 420);
  assert.equal(a.openingCapital, 420);
  assert.equal(a.openingInventory, 420);
  assert.deepEqual(a.inventoryBasis, { grain: 220, timber: 200 }, 'goods without a positive base get no basis row at all');
  assert.equal(a.retail, 0);
  assert.equal(a.households, null);
  assert.equal(c.grain.commerce, a, 'account stored under grain.commerce');
});

test('openCommerce is idempotent: a second call returns the live account untouched', () => {
  const c = city();
  const a = openCommerce(world, c);
  a.cash = 999;
  a.inventoryBasis.grain = 1;
  const again = openCommerce(world, c);
  assert.equal(again, a);
  assert.equal(again.cash, 999);
  assert.equal(again.inventoryBasis.grain, 1);
});

test('openCommerce rounds the opening valuation to cents', () => {
  const c = { grain: { stock: 3 } };
  const a = openCommerce({ goods: { grain: { base: 7.777 } } }, c);
  assert.equal(a.cash, 23.33);
});

test('openMarketLedgers opens every city with grain and tolerates bare input', () => {
  assert.equal(openMarketLedgers(null, { x: city() }), undefined);
  assert.equal(openMarketLedgers(world, null), undefined);
  const market = { lisboa: city(), bare: { note: 'no grain' } };
  openMarketLedgers(world, market);
  assert.equal(market.lisboa.grain.commerce.cash, 420);
  assert.equal(market.bare.commerce, undefined);
});

test('recordWholesaleSale: the purse pays, paid accrues, stock enters at the price paid', () => {
  const a = openCommerce(world, city());
  recordWholesaleSale({ grain: { commerce: a } }, 'grain', 10, 55.5);
  assert.equal(a.cash, 420 - 55.5);
  assert.equal(a.paid, 55.5);
  assert.equal(a.inventoryBasis.grain, 220 + 55.5);
  // guards: no account, non-positive qty, negative revenue
  assert.equal(recordWholesaleSale({}, 'grain', 1, 1), undefined);
  const b = a.cash, p = a.paid, i = a.inventoryBasis.grain;
  recordWholesaleSale({ grain: { commerce: a } }, 'grain', 0, 10);
  recordWholesaleSale({ grain: { commerce: a } }, 'grain', 1, -5);
  assert.equal(a.cash, b); assert.equal(a.paid, p); assert.equal(a.inventoryBasis.grain, i);
});

test('recordMarketPurchase releases proportional book value and settles the shelf exactly', () => {
  const a = openCommerce(world, city());
  const c = { grain: { commerce: a } };
  recordMarketPurchase(c, 'grain', 4, 100, 10); // 4/10 of 220 basis
  assert.equal(a.inventoryBasis.grain, 132);
  assert.equal(a.releasedBasis, 88);
  assert.equal(a.cash, 520);
  assert.equal(a.received, 100);
  recordMarketPurchase(c, 'grain', 6, 150, 6); // qty >= stockBefore: releases the exact remaining basis
  assert.equal(a.inventoryBasis.grain, 0, 'emptying the shelf settles its book exactly');
  assert.equal(a.releasedBasis, 88 + 132);
  assert.equal(a.cash, 670);
  recordLocalSupply(c, 'grain', 1, 100); // basis 100, then over-draw: 8 units with only 6 on the shelf
  recordMarketPurchase(c, 'grain', 8, 40, 6);
  assert.equal(a.inventoryBasis.grain, 0, 'over-drawing never releases more than the whole basis');
  // guards
  const cc = a.cash, rb = a.releasedBasis;
  recordMarketPurchase(c, 'grain', 0, 10, 10);
  recordMarketPurchase(c, 'grain', 1, -1, 10);
  assert.equal(a.cash, cc); assert.equal(a.releasedBasis, rb);
});

test('recordLocalSupply adds book value at base without touching cash', () => {
  const a = openCommerce(world, city());
  const cash = a.cash;
  recordLocalSupply({ grain: { commerce: a } }, 'grain', 2, 22);
  recordLocalSupply({ grain: { commerce: a } }, 'silk', 1, 300); // new good row
  assert.equal(a.inventoryBasis.grain, 264);
  assert.equal(a.inventoryBasis.silk, 300);
  assert.equal(a.localSupplyValue, 44 + 300);
  assert.equal(a.cash, cash, 'no payment, no cash movement');
  assert.equal(recordLocalSupply({ grain: { commerce: a } }, 'grain', 0, 22), undefined);
  assert.equal(recordLocalSupply({ grain: { commerce: a } }, 'grain', 1, 0), undefined);
});

test('recordRetailSale earns retail at the day price and consumes proportional book value', () => {
  const a = openCommerce(world, city());
  const c = { grain: { commerce: a } };
  const v = recordRetailSale(c, 'grain', 3, 30, 10); // 3/10 of 220 basis = 66
  assert.equal(v, 90, 'returns the recorded retail value');
  assert.equal(a.cash, 420 + 90);
  assert.equal(a.retail, 90);
  assert.equal(a.inventoryBasis.grain, 154);
  assert.equal(a.consumedBasis, 66);
  const v2 = recordRetailSale(c, 'grain', 7, 30, 7); // whole remaining shelf
  assert.equal(v2, 210);
  assert.equal(a.inventoryBasis.grain, 0, 'consuming the whole shelf settles its book');
  assert.equal(a.consumedBasis, 66 + 154);
  recordLocalSupply(c, 'grain', 1, 50); // basis 50, then over-consume: 5 units with only 3 on the shelf
  recordRetailSale(c, 'grain', 5, 10, 3);
  assert.equal(a.inventoryBasis.grain, 0, 'over-consuming never removes more than the whole basis');
  // guards return 0 and change nothing
  assert.equal(recordRetailSale(c, 'grain', 0, 30, 10), 0);
  assert.equal(recordRetailSale({ grain: {} }, 'grain', 1, 30, 10), 0);
});
