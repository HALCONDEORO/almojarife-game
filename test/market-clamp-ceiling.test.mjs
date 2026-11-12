// Market rule pinning: behaviour at the price clamp. The classic Hanse games teach
// that at the shared price ceiling the poor cannot afford staples (and nobody trades
// at all); our model gets the same shape from the uniform clamp plus the per-class
// affordability cutoffs. This test documents that intended behaviour at the ceiling
// and that the market recovers from it instead of pinning there.
import test from "node:test";
import assert from "node:assert/strict";
import { makeMarket, price, affordRatio, tickMarket } from "../src/sim/market.mjs";
import { demandBy } from "../src/sim/classes.mjs";

const world = { cities: [{ id: "a", pop: 20000, makes: [], needs: ["grain"] }], goods: { grain: { base: 22 } } };
const NO_LEDGERS = { needsLedger: false, commerceLedger: false };

test("at the 3x ceiling every class is priced out and the staple settles above zero", () => {
  const m = makeMarket(world);
  const e = m.a.grain; // target 200, rate 20 from the founding formulas (pop 20000, needs)
  e.stock = 1; // near-empty shelf: the raw ratio explodes and the clamp binds
  assert.equal(price(world, e, "grain"), 66, "clamped at 3x base");
  // rich citizens stop buying below 3x (affordMul cutoffs), so at the ceiling nobody buys
  const d = demandBy(20000, "grain", affordRatio(e, 22));
  assert.equal(d.poor, 0);
  assert.equal(d.middle, 0);
  assert.equal(d.rich, 0);
  // demand follows price, so one day at the ceiling consumes nothing: only the local trickle adds stock
  tickMarket(m, 0, world, NO_LEDGERS);
  assert.equal(e.stock, 1 + Math.round(e.rate * 0.4), "nothing sold at the ceiling");
  // the shelf refills, the price leaves the ceiling and trade resumes; stock never goes negative
  let sawBelowCeiling = false;
  for (let day = 1; day <= 365; day++) {
    tickMarket(m, day, world, NO_LEDGERS);
    assert.ok(Number.isInteger(e.stock) && e.stock >= 0, `day ${day} stock ${e.stock}`);
    if (price(world, e, "grain") < 66) sawBelowCeiling = true;
  }
  assert.ok(sawBelowCeiling, "price falls below the ceiling as stock recovers");
  assert.ok(e.stock > 1, "stock settles above the near-empty level");
});
