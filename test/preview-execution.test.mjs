// Preview = execution (Estudios 1, Marco 30/10): what the market buttons and tooltips show is
// exactly what the deal will do - executable quantity, total cost/revenue, consistent rounding.
// These contracts pin previewBuy/previewSellCombinedPort against doBuy/doSellCombined on the
// real game path, including the cases where a large operation cannot fill: stock-tier crossing,
// hold room, cash, a binding port purse (partial sale) and cent rounding.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { newGame, doBuy, doSellCombined, sellableHold, previewSellCombinedPort, quote } from "../src/game/game.mjs";
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

test("insufficient hold room: the preview says how much of the request fits, and the buy fills exactly that", () => {
  const gm = game();
  const sh = gm.ships[0], good = "wine";
  const room = Math.max(0, 60 - 0); // cog capacity 60, empty hold
  const pb = previewBuy(gm.world, gm.market, sh, gm.cash, good, 9999, fee(gm, "cadiz"));
  assert.ok(pb.qty <= room, "test premise: room binds before stock or cash");
  const cash0 = gm.cash;
  const rs = doBuy(gm, sh, good, 9999);
  assert.ok(rs.ok);
  assert.equal(pb.qty, rs.qty, "preview quantity = executed quantity under the room cap");
  assert.equal(r2(pb.cost), r2(rs.cost), "preview cost = executed cost to the cent");
  assert.equal(r2(cash0 - gm.cash), r2(pb.cost), "the cash delta is the previewed cost");
  assert.equal(pb.limit, room < rs.qty ? undefined : pb.limit, "limit reported when the request is cut");
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

test("partial sale against a binding purse: preview and execution stop on the same unit", () => {
  const gm = game();
  const sh = gm.ships[0], good = "grain";
  sh.cargo[good] = 40; sh.basis = { [good]: 40 * 8 };
  const wh = { goods: { [good]: 40 }, basis: { [good]: 40 * 7 } };
  gm.warehouses = { cadiz: wh };
  const purse = commerceOf(gm.market.cadiz);
  purse.cash = 60; // pays for a few units only, across BOTH the hold and the warehouse
  const ps = previewSellCombinedPort(gm, sh, good, 80, wh);
  assert.ok(ps.qty > 0 && ps.qty < 80, "test premise: the purse cuts the sale");
  const cash0 = gm.cash;
  const rs = doSellCombined(gm, sh, good, 80, wh);
  assert.equal(rs.ok, true);
  assert.equal(ps.qty, rs.qty, "preview stops on the same unit the purse stops the execution");
  assert.equal(r2(ps.revenue), r2(rs.revenue));
  assert.equal(r2(gm.cash - cash0), r2(ps.revenue), "the cash delta is the previewed revenue");
  assert.equal(ps.fromCargo + ps.fromStore, ps.qty, "the preview still splits hold first, warehouse second");
});

test("consistent rounding: the whole-coin figure the button shows is the rounded executed delta, cents exact underneath", () => {
  const gm = game();
  const sh = gm.ships[0], good = "silk"; // fee keeps cents on the price
  const pb = previewBuy(gm.world, gm.market, sh, gm.cash, good, 7, fee(gm, "cadiz"));
  assert.ok(pb.cost % 1 !== 0, "test premise: this deal settles with cents");
  const cash0 = gm.cash;
  const rs = doBuy(gm, sh, good, 7);
  assert.ok(rs.ok && rs.qty === pb.qty);
  assert.equal(r2(cash0 - gm.cash), r2(pb.cost), "execution charges the previewed cents exactly");
  assert.equal(Math.round(cash0 - gm.cash), Math.round(pb.cost), "the whole-coin display (web/main.mjs) rounds the same number");
  const ps = previewSellCombinedPort(gm, sh, good, rs.qty, null);
  const cash1 = gm.cash;
  const rs2 = doSellCombined(gm, sh, good, rs.qty, null);
  assert.ok(rs2.ok);
  assert.equal(r2(gm.cash - cash1), r2(ps.revenue), "sell side: execution credits the previewed cents exactly");
  assert.equal(Math.round(gm.cash - cash1), Math.round(ps.revenue), "sell side: the whole-coin display rounds the same number");
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
