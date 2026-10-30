// Book cost of cargo and cash are separate ledgers (Estudios 2, Marco 30/10). Our criterion is
// weighted-average cost (AVCO), documented here as a contract: every buy adds its cost to the
// lot's basis, a partial sale settles the pro-rata share, a full sale settles the exact remainder,
// and transfers move the basis with the goods. Revenue is income, never profit: only the settled
// book cost separates the two. These tests pin that contract so no change can quietly turn
// income into profit, strand cost on sold goods, or create/destroy value in a transfer.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { newGame, doBuy, doSellCombined, storeGoods, takeGoods } from "../src/game/game.mjs";
import { buildWorld } from "../src/sim/world.mjs";

const world = buildWorld(JSON.parse(fs.readFileSync(new URL("../data/world.json", import.meta.url))));
const game = (seed = 7) => newGame(world, "cadiz", { freePlay: true, seed });
const r2 = (num) => Math.round(num * 100) / 100;

test("two buys at different prices stack one lot: the basis is the sum of both costs", () => {
  const gm = game();
  const sh = gm.ships[0], good = "grain";
  const first = doBuy(gm, sh, good, 10);
  const second = doBuy(gm, sh, good, 10);
  assert.ok(first.ok && second.ok);
  assert.notEqual(r2(first.cost / first.qty), r2(second.cost / second.qty), "test premise: the price walked between the two buys");
  assert.equal(sh.cargo[good], 20, "one lot, twenty units");
  assert.equal(r2(sh.basis[good]), r2(first.cost + second.cost), "the lot's basis is exactly both costs together");
  assert.equal(r2(sh.basis[good] / sh.cargo[good]), r2((first.cost + second.cost) / 20), "the average cost is the weighted average");
});

test("a partial sale settles the pro-rata share rounded to the coin and the remainder keeps its cost; a full disposal settles every cent", () => {
  const gm = game();
  const sh = gm.ships[0], good = "grain";
  sh.cargo[good] = 7; sh.basis = { [good]: 100.55 }; // fractional book cost: 14.36 per unit and change
  let settled = 0;
  const leg1 = doSellCombined(gm, sh, good, 3, null);
  assert.ok(leg1.ok);
  assert.equal(leg1.spent, Math.round(100.55 * 3 / 7), "first leg settles the literal Math.round share of 100.55 x 3/7");
  assert.equal(leg1.spent, 43, "43.09 rounds down to the coin (a ceil mutant dies here)");
  assert.equal(r2(sh.basis[good]), 57.55, "the remainder keeps the rest of the cost, cents included");
  settled += leg1.spent;
  const leg2 = doSellCombined(gm, sh, good, 2, null);
  assert.equal(leg2.spent, Math.round(57.55 * 2 / 4), "second leg settles the literal Math.round share of the remainder");
  assert.equal(leg2.spent, 29, "28.775 rounds up to the coin (a floor mutant dies here)");
  assert.equal(r2(sh.basis[good]), 28.55);
  settled += leg2.spent;
  const leg3 = doSellCombined(gm, sh, good, 2, null);
  assert.equal(leg3.spent, 28.55, "the final leg settles the exact remainder to the cent, no rounding at all");
  settled += leg3.spent;
  assert.equal(sh.basis?.[good] ?? null, null, "a fully sold lot carries no basis");
  assert.equal(r2(settled), 100.55, "across all legs the settled cost is the original book cost, no more, no less");
});

test("store and take move the basis with the goods: a transfer is never a sale, and a deposit merges into an existing lot", () => {
  const gm = game();
  const sh = gm.ships[0], good = "grain";
  const wh = { goods: { [good]: 3 }, basis: { [good]: 40.2 } }; // an existing lot at a different cost
  gm.warehouses = { cadiz: wh };
  sh.cargo[good] = 7; sh.basis = { [good]: 100.55 };
  const cash0 = gm.cash;
  const st1 = storeGoods(gm, sh, good, 2);
  assert.ok(st1.ok);
  assert.equal(sh.basis[good], 71.55, "100.55 - 29: 28.73 rounds up (a floor mutant dies here)");
  assert.equal(wh.goods[good], 5, "the units merge into the existing lot");
  assert.equal(wh.basis[good], 69.2, "the basis MERGES: 40.20 + 29, not an overwrite (an overwrite mutant dies here)");
  const st2 = storeGoods(gm, sh, good, 2);
  assert.ok(st2.ok);
  assert.equal(sh.basis[good], 42.55, "71.55 - Math.round(71.55 x 2/5) = 42.55");
  assert.equal(wh.basis[good], 98.2, "69.20 + 29");
  const tk1 = takeGoods(gm, sh, good, 3);
  assert.ok(tk1.ok);
  assert.equal(wh.basis[good], 56.2, "a PARTIAL take moves the literal Math.round share: 98.20 - Math.round(98.20 x 3/7) = 56.20 (a ceil mutant dies here)");
  assert.equal(sh.basis[good], 84.55, "the taken share lands on the ship: 42.55 + 42");
  assert.equal(gm.cash, cash0, "no money moved: a transfer is not income");
  const tkAll = takeGoods(gm, sh, good, 4);
  assert.ok(tkAll.ok);
  assert.equal(sh.basis[good], 140.75, "taking the rest settles the exact remainder: 84.55 + 56.20");
  assert.equal(wh.basis[good] ?? 0, 0, "nothing left behind");
  assert.equal(wh.goods[good] ?? 0, 0);
  assert.equal(r2(sh.basis[good]), r2(100.55 + 40.2), "a full round trip conserves both lots' book cost to the cent");
  assert.equal(gm.cash, cash0, "still no money moved");
});

test("income is not profit: a same-port round trip books revenue as income and the loss to the fee as profit", () => {
  const gm = game();
  const sh = gm.ships[0], good = "grain";
  const cash0 = gm.cash;
  const bought = doBuy(gm, sh, good, 20);
  assert.ok(bought.ok);
  assert.equal(r2(gm.cash), r2(cash0 - bought.cost), "cash leaves with the purchase");
  assert.equal(r2(sh.basis[good]), r2(bought.cost), "and lands in the book cost, the two ledgers agree");
  const sold = doSellCombined(gm, sh, good, 20, null);
  assert.ok(sold.ok);
  assert.ok(sold.revenue > 0, "the sale has income");
  assert.equal(r2(sold.profit), r2(sold.revenue - bought.cost), "profit is income minus the settled book cost");
  assert.ok(sold.profit < 0, "test premise: the fee makes a same-port round trip a loss");
  assert.notEqual(r2(sold.revenue), r2(sold.profit), "income and profit are different numbers");
  assert.equal(r2(gm.cash - cash0), r2(sold.profit), "the cash delta of the whole round trip is the profit, nothing else");
  assert.equal(sh.basis?.[good] ?? null, null, "no cost stranded after the full disposal");
});
