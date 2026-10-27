// Phase-1 binding wholesale purse (docs/design/wholesale-purse-binding-phase1.md):
// a port pays for goods sold INTO its market only with the cash its purse holds.
import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { makeMarket } from "../src/sim/market.mjs";
import { makeShip, buy, sell, previewSell } from "../src/sim/trade.mjs";
import { commerceOf } from "../src/sim/procurement.mjs";
const world = loadWorld();
const [A] = [world.cities[0].id];
const GOOD = world.cities[0].makes[0];

test("a squeezed purse pays only what it holds: partial fill, preview matches", () => {
  const m = makeMarket(world), s = makeShip(1, "cog", A);
  const b = buy(world, m, s, 1e9, GOOD, 100);
  assert.ok(b.ok && b.qty > 10);
  const a = commerceOf(m[A]);
  const full = previewSell(world, m, s, GOOD, b.qty); // purse still covers everything
  assert.equal(full.qty, b.qty);
  a.cash = Math.max(1, Math.floor(full.revenue / 2)); // squeeze below the full sale value
  const held = a.cash;
  const pv = previewSell(world, m, s, GOOD, b.qty);
  const r = sell(world, m, s, GOOD, b.qty);
  assert.ok(r.ok && r.qty > 0 && r.qty < b.qty, "partial fill when the purse runs dry");
  assert.ok(r.revenue <= held, "never pays more than it held");
  assert.equal(r.qty, pv.qty, "preview qty matches the real sale");
  assert.equal(r.revenue, pv.revenue, "preview revenue matches the real sale");
  assert.ok(Math.abs(a.cash - (held - r.revenue)) < 0.005, "the purse paid exactly the sale, to the cent");
});

test("an empty purse pays nothing and keeps the cargo", () => {
  const m = makeMarket(world), s = makeShip(1, "cog", A);
  const b = buy(world, m, s, 1e9, GOOD, 10);
  assert.ok(b.ok);
  const a = commerceOf(m[A]);
  a.cash = 0;
  const r = sell(world, m, s, GOOD, 5);
  assert.deepEqual(r, { ok: false, reason: "market has no cash" });
  assert.equal(s.cargo[GOOD], 10, "nothing left the hold");
  assert.equal(previewSell(world, m, s, GOOD, 5).qty, 0, "preview shows the same refusal");
});

test("a port without a ledger account sells exactly as before (bare fixtures)", () => {
  const m = makeMarket(world), s = makeShip(1, "cog", A);
  const b = buy(world, m, s, 1e9, GOOD, 10);
  delete m[A].grain.commerce;
  const r = sell(world, m, s, GOOD, 10);
  assert.ok(r.ok && r.qty === 10, "no account, no cap");
});
