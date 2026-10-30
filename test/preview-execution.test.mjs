// Preview = execution at engine level (Estudios 1, Marco 30/10): the numbers the engine's preview
// functions return are exactly what the matching execution calls do - executable quantity, the
// named limit (stock, hold room, cash, the port purse), total cost/revenue and the next price.
// Scope: src/sim/trade.mjs + src/game/game.mjs only (engine rounding included); no renderer claims.
// Contracts pin previewBuy/previewSellCombinedPort against doBuy/doSellCombined on the real game
// path, including the cases where a large operation cannot fill: stock-tier crossing, stock-out,
// hold room, cash, a binding port purse (partial combined sale) and cent rounding.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { newGame, doBuy, doSellCombined, previewSellCombinedPort, quote } from "../src/game/game.mjs";
import { buildWorld } from "../src/sim/world.mjs";
import { previewBuy, FEE } from "../src/sim/trade.mjs";
import { feeMul, scarcityOf } from "../src/game/reputation.mjs";
import { stockLevel } from "../src/game/stocklevel.mjs";
import { commerceOf } from "../src/sim/procurement.mjs";

const world = buildWorld(JSON.parse(fs.readFileSync(new URL("../data/world.json", import.meta.url))));
const game = (seed = 7) => newGame(world, "cadiz", { freePlay: true, seed });
const r2 = (num) => Math.round(num * 100) / 100;
const fee = (gm, city) => FEE * feeMul(gm, city);

test("stock-tier crossing: a large sale walks the price down across levels, and the preview is the execution", () => {
  const gm = game();
  const sh = gm.ships[0], good = "grain";
  const row = gm.market.cadiz[good];
  assert.equal(stockLevel(row), "short", "test premise: grain starts short in cadiz");
  const lvl0 = stockLevel(row), sc0 = scarcityOf(row);
  sh.cargo[good] = 500; sh.basis = { [good]: 500 * 8 }; // a hold far past the stock boundaries ahead
  const ps = previewSellCombinedPort(gm, sh, good, 500, null);
  const cash0 = gm.cash;
  const rs = doSellCombined(gm, sh, good, 500, null);
  assert.ok(rs.ok && rs.qty === 500, "the whole hold sells (the fresh-game purse covers it)");
  assert.notEqual(stockLevel(row), lvl0, "test premise: the operation crossed a stock level");
  assert.ok(scarcityOf(row) < sc0, "test premise: scarcity moved against the seller");
  assert.equal(ps.qty, rs.qty, "preview quantity = executed quantity");
  assert.equal(r2(ps.revenue), r2(rs.revenue), "preview revenue = executed revenue to the cent");
  assert.equal(r2(gm.cash - cash0), r2(ps.revenue), "the cash delta is the previewed revenue");
  assert.equal(r2(ps.next), r2(quote(gm, "cadiz", good)), "the previewed next price is the price after the deal");
});

test("insufficient hold room: the preview names room, fills exactly the free hold, and cash and cargo move by the preview", () => {
  const gm = game();
  const sh = gm.ships[0], good = "fish"; // cheap and plentiful: with ample cash only the hold binds
  gm.cash = 100000;
  const pb = previewBuy(gm.world, gm.market, sh, gm.cash, good, 9999, fee(gm, "cadiz"));
  assert.equal(pb.qty, 60, "the cog's free hold caps the deal at exactly 60 units");
  assert.equal(pb.limit, "room", "the preview names hold room as the limit");
  const cash0 = gm.cash;
  const rs = doBuy(gm, sh, good, 9999);
  assert.ok(rs.ok);
  assert.equal(rs.qty, 60, "the execution buys exactly the previewed 60");
  assert.equal(pb.qty, rs.qty, "preview quantity = executed quantity under the room cap");
  assert.equal(r2(pb.cost), r2(rs.cost), "preview cost = executed cost to the cent");
  assert.equal(r2(cash0 - gm.cash), r2(pb.cost), "the cash delta is the previewed cost");
  assert.equal(sh.cargo[good], 60, "the cargo delta is the previewed quantity");
  assert.equal(r2(pb.next), r2(quote(gm, "cadiz", good)), "the previewed next price is the price after the deal");
});

test("zero requests and stock-out: nothing previewed, nothing executed, nothing moved", () => {
  const gm = game();
  const sh = gm.ships[0], good = "grain";
  const cash0 = gm.cash;
  const pb0 = previewBuy(gm.world, gm.market, sh, gm.cash, good, 0, fee(gm, "cadiz"));
  assert.equal(pb0.qty, 0, "a zero buy request previews zero units");
  assert.equal(pb0.cost, 0, "a zero buy request previews zero cost");
  const rb0 = doBuy(gm, sh, good, 0);
  assert.equal(rb0.ok, false, "a zero buy request is refused");
  sh.cargo[good] = 10; sh.basis = { [good]: 80 };
  const ps0 = previewSellCombinedPort(gm, sh, good, 0, null);
  assert.equal(ps0.qty, 0, "a zero sell request previews zero units");
  assert.equal(ps0.revenue, 0, "a zero sell request previews zero revenue");
  const rs0 = doSellCombined(gm, sh, good, 0, null);
  assert.equal(rs0.ok, false, "a zero sell request is refused");
  assert.equal(gm.cash, cash0, "no money moved on zero requests");
  assert.equal(sh.cargo[good], 10, "no cargo moved on zero requests");

  const gm2 = game(11);
  const sh2 = gm2.ships[0];
  gm2.cash = 100000; // room and cash abundant: only the shelf can bind
  gm2.market.cadiz.wine.stock = 2;
  const pb = previewBuy(gm2.world, gm2.market, sh2, gm2.cash, "wine", 500, fee(gm2, "cadiz"));
  assert.equal(pb.qty, 2, "the preview counts exactly the units on the shelf");
  assert.equal(pb.limit, "stock", "the preview names stock as the limit");
  const cash1 = gm2.cash;
  const rs = doBuy(gm2, sh2, "wine", 500);
  assert.ok(rs.ok);
  assert.equal(rs.qty, 2, "the execution buys exactly the two stocked units");
  assert.equal(r2(pb.cost), r2(rs.cost), "preview cost = executed cost to the cent");
  assert.equal(r2(cash1 - gm2.cash), r2(pb.cost), "the cash delta is the previewed cost");
  assert.equal(gm2.market.cadiz.wine.stock, 0, "the shelf is empty after the deal");
  assert.equal(r2(pb.next), r2(quote(gm2, "cadiz", "wine")), "the previewed next price is the price after the deal");
});

test("insufficient cash: the preview counts the affordable units, the execution buys exactly them", () => {
  const gm = game();
  const sh = gm.ships[0], good = "fish";
  gm.cash = 35; // a few units of fish at most
  const pb = previewBuy(gm.world, gm.market, sh, gm.cash, good, 50, fee(gm, "cadiz"));
  assert.ok(pb.qty > 0 && pb.qty < 50, "test premise: a partial fill");
  assert.equal(pb.limit, "cash", "the preview names cash as the limit");
  const rs = doBuy(gm, sh, good, 50);
  assert.ok(rs.ok);
  assert.equal(pb.qty, rs.qty);
  assert.equal(r2(pb.cost), r2(rs.cost));
  assert.ok(gm.cash >= 0, "never overdrawn");
  assert.ok(gm.cash < 35, "cash was spent");
  const oneMore = previewBuy(gm.world, gm.market, sh, gm.cash, good, 50, fee(gm, "cadiz"));
  assert.ok(oneMore.qty < pb.qty || oneMore.qty === 0, "after the purchase the same request affords no more than before");
});

test("binding purse across hold and warehouse: the purse pays the hold first, then the store, and every book moves", () => {
  const gm = game();
  const sh = gm.ships[0], good = "grain";
  sh.cargo[good] = 40; sh.basis = { [good]: 40 * 8 };
  const wh = { goods: { [good]: 40 }, basis: { [good]: 40 * 7 } };
  gm.warehouses = { cadiz: wh };
  const purse = commerceOf(gm.market.cadiz);
  const purse0 = 1150; // covers all 40 hold units (1102.50) and part of the store, never the whole 80
  purse.cash = purse0;
  const ps = previewSellCombinedPort(gm, sh, good, 80, wh);
  assert.equal(ps.fromCargo, 40, "the preview sells the whole hold first");
  assert.ok(ps.fromStore > 0, "the preview continues into the warehouse");
  assert.ok(ps.qty < 80, "test premise: the purse cuts the combined sale short of 80");
  const cash0 = gm.cash;
  const rs = doSellCombined(gm, sh, good, 80, wh);
  assert.equal(rs.ok, true);
  assert.equal(ps.qty, rs.qty, "preview stops on the same unit the purse stops the execution");
  assert.equal(r2(ps.revenue), r2(rs.revenue));
  assert.equal(r2(gm.cash - cash0), r2(ps.revenue), "the cash delta is the previewed revenue");
  assert.equal(r2(purse.cash), r2(purse0 - ps.revenue), "the port purse paid exactly the previewed revenue");
  assert.equal(sh.cargo[good] ?? 0, 0, "the hold leg emptied the hold");
  assert.equal(wh.goods[good], 40 - ps.fromStore, "the store leg took exactly the previewed store units");
  assert.equal(sh.basis?.[good] ?? null, null, "a full hold sale settles the whole hold book cost");
  assert.equal(wh.basis[good], 280 - 7 * ps.fromStore, "the store book cost leaves with the store units, pro rata");
  assert.equal(ps.fromCargo + ps.fromStore, ps.qty, "the preview still splits hold first, warehouse second");
});

test("consistent engine rounding: deals settle to cents and the whole-coin figure rounds the same number", () => {
  const gm = game();
  const sh = gm.ships[0], good = "silk"; // fee keeps cents on the price
  const pb = previewBuy(gm.world, gm.market, sh, gm.cash, good, 7, fee(gm, "cadiz"));
  assert.ok(pb.cost % 1 !== 0, "test premise: this deal settles with cents");
  const cash0 = gm.cash;
  const rs = doBuy(gm, sh, good, 7);
  assert.ok(rs.ok && rs.qty === pb.qty);
  assert.equal(r2(cash0 - gm.cash), r2(pb.cost), "execution charges the previewed cents exactly");
  assert.equal(Math.round(cash0 - gm.cash), Math.round(pb.cost), "whole-coin engine rounding rounds the same number");
  const ps = previewSellCombinedPort(gm, sh, good, rs.qty, null);
  const cash1 = gm.cash;
  const rs2 = doSellCombined(gm, sh, good, rs.qty, null);
  assert.ok(rs2.ok);
  assert.equal(r2(gm.cash - cash1), r2(ps.revenue), "sell side: execution credits the previewed cents exactly");
  assert.equal(Math.round(gm.cash - cash1), Math.round(ps.revenue), "sell side: whole-coin engine rounding rounds the same number");
});

test("the preview never mutates: market, ship, warehouse and cash survive it byte-identical", () => {
  const gm = game();
  const sh = gm.ships[0];
  const wh = { goods: { grain: 25 }, basis: { grain: 200 } };
  gm.warehouses = { cadiz: wh };
  sh.cargo.grain = 30; sh.basis = { grain: 240 };
  const snap = JSON.stringify({ market: gm.market, ships: gm.ships, warehouses: gm.warehouses, cash: gm.cash });
  previewBuy(gm.world, gm.market, sh, gm.cash, "grain", 9999, fee(gm, "cadiz"));
  previewSellCombinedPort(gm, sh, "grain", 9999, wh);
  assert.equal(JSON.stringify({ market: gm.market, ships: gm.ships, warehouses: gm.warehouses, cash: gm.cash }), snap);
});
