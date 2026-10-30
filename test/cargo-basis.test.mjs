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

test("a partial sale settles the pro-rata share and the remainder keeps its cost; a full disposal settles every cent", () => {
  const gm = game();
  const sh = gm.ships[0], good = "grain";
  sh.cargo[good] = 40; sh.basis = { [good]: 320 }; // 8 per unit book cost
  let settled = 0;
  const leg1 = doSellCombined(gm, sh, good, 10, null);
  assert.ok(leg1.ok);
  assert.equal(leg1.spent, 80, "first leg settles 10/40 of the 320 book cost");
  assert.equal(sh.basis[good], 240, "the remainder keeps the rest of the cost");
  settled += leg1.spent;
  const leg2 = doSellCombined(gm, sh, good, 10, null);
  assert.equal(leg2.spent, 80, "second leg settles 10/30 of the remaining 240");
  assert.equal(sh.basis[good], 160);
  settled += leg2.spent;
  const leg3 = doSellCombined(gm, sh, good, 20, null);
  assert.equal(leg3.spent, 160, "the final leg settles the exact remainder, no cent stranded");
  settled += leg3.spent;
  assert.equal(sh.basis?.[good] ?? null, null, "a fully sold lot carries no basis");
  assert.equal(settled, 320, "across all legs the settled cost is the original book cost, no more, no less");
});

test("store and take move the basis with the goods: a transfer is never a sale", () => {
  const gm = game();
  const sh = gm.ships[0], good = "grain";
  const wh = { goods: {}, basis: {} };
  gm.warehouses = { cadiz: wh };
  sh.cargo[good] = 40; sh.basis = { [good]: 320 };
  const cash0 = gm.cash;
  const st = storeGoods(gm, sh, good, 10);
  assert.ok(st.ok);
  assert.equal(sh.cargo[good], 30);
  assert.equal(sh.basis[good], 240, "the ship keeps 30/40 of the cost");
  assert.equal(wh.basis[good], 80, "the warehouse receives the transferred share");
  const tk = takeGoods(gm, sh, good, 10);
  assert.ok(tk.ok);
  assert.equal(sh.cargo[good], 40);
  assert.equal(sh.basis[good], 320, "taking the same units back restores the exact basis");
  assert.equal(wh.basis[good] ?? 0, 0, "nothing left behind");
  assert.equal(gm.cash, cash0, "no money moved: a transfer is not income");
  const tall = storeGoods(gm, sh, good, 40);
  assert.ok(tall.ok);
  assert.equal(wh.basis[good], 320, "a full store settles the exact book cost in the warehouse");
  assert.equal(sh.basis?.[good] ?? null, null);
  const tallBack = takeGoods(gm, sh, good, 40);
  assert.ok(tallBack.ok);
  assert.equal(sh.basis[good], 320, "a full round trip conserves the book cost to the cent");
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
