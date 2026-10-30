import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { makeMarket, price } from "../src/sim/market.mjs";
import { makeShip } from "../src/sim/trade.mjs";
import { aiStep } from "../src/sim/ai.mjs";
import { weaponCount, gearOf } from "../src/sim/armament.mjs";

const world = loadWorld();
// Isolated book: every city oversupplied in every good (no margin anywhere), except cadiz grain cheap
// (stock 360, price 15) and sevilla grain at the given stock. Only sevilla grain can clear the margin bar.
const iso = (sevStock) => {
  const m = makeMarket(world);
  for (const city of Object.values(m)) for (const e of Object.values(city)) e.stock = e.target * 2;
  m.cadiz.grain.stock = 360;
  if (sevStock != null) m.sevilla.grain.stock = sevStock;
  return m;
};
const run = (m, cash = 5000, ship = makeShip(1, "cog", "cadiz"), hooks) => {
  const t = { cash, ship };
  const plan = aiStep(world, m, t, ship, hooks);
  return { plan, t, ship };
};

test("the 12% gross-margin bar: 8.9% is declined, 21.7% is taken", () => {
  assert.equal(run(iso(900)).plan, null, "a margin under the bar must not move the ship");
  const { plan, ship } = run(iso(800));
  assert.equal(plan.dest, "sevilla");
  assert.equal(plan.good, "grain");
  assert.equal(plan.qty, 60);
  assert.equal(plan.bought, 60, "the port records what really left");
  assert.equal(ship.voyage.to, "sevilla");
});

test("the planned quantity respects the cash clamp in whole coins", () => {
  const { plan, t } = run(iso(800), 95);
  assert.equal(plan.qty, 5, "floor(95 / ceil(15.3)) = 5, never a fraction the buy would round differently");
  assert.equal(plan.bought, 5);
  assert.equal(t.cash, 18.5, "5 units at 15.30");
});

test("onBuy reports the port, good, scarcity before the purchase and the real cost", () => {
  const calls = [];
  run(iso(800), 5000, makeShip(1, "cog", "cadiz"), { onBuy: (c, g, sc, cost) => calls.push([c, g, sc, Math.round(cost * 100) / 100]) });
  assert.deepEqual(calls, [["cadiz", "grain", 0.5, 940.44]], "scarcity is target/stock = 180/360");
});

test("profit is per day: the nearer port wins at equal prices, a richer far port can still win", () => {
  const m = iso(800);
  m.malaga.grain.stock = 200; // same price 19 as sevilla
  assert.equal(price(world, m.malaga.grain, "grain"), price(world, m.sevilla.grain, "grain"));
  assert.equal(run(m).plan.dest, "sevilla", "154 km beats 287 km at equal terms");
  const m2 = iso(800);
  m2.malaga.grain.stock = 50; // price 43
  assert.equal(run(m2).plan.dest, "malaga", "a much better margin pays for the extra days");
});

test("the score weighs quantity, not only the per-unit margin", () => {
  const m = iso(700);
  m.cadiz.ironware.stock = m.cadiz.ironware.target; // flat price 110
  m.sevilla.ironware.stock = Math.round(m.sevilla.ironware.target / 1.5); // price 140: big per-unit margin, tiny affordable qty
  const { plan } = run(m, 500);
  assert.equal(plan.dest, "sevilla");
  assert.equal(plan.good, "grain", "31 units at 4.30 beat 4 units at 25.20");
  assert.equal(plan.qty, 31);
});

test("cargo aboard is sold first, reported with its scarcity, before any new plan", () => {
  const m = makeMarket(world); // flat: no plan follows the sale
  const ship = makeShip(1, "cog", "cadiz");
  ship.cargo = { wool: 5 };
  const sales = [];
  const { plan, t } = run(m, 1000, ship, { onSale: (c, g, sc, rev) => sales.push([c, g, sc, rev]) });
  assert.deepEqual(sales, [["cadiz", "wool", 1, 290.08]]);
  assert.equal(t.cash, 1290.08);
  assert.deepEqual(ship.cargo, {});
  assert.equal(plan, null, "no margin on a flat book");
});

test("a ship that cannot rid its cargo stays put", () => {
  const m = iso(800);
  const ship = makeShip(1, "cog", "cadiz");
  ship.cargo = { unobtainium: 3 }; // no market entry anywhere
  const { plan, t } = run(m, 5000, ship);
  assert.equal(plan, null);
  assert.equal(ship.voyage, null);
  assert.equal(t.cash, 5000);
});

test("goods reserved for the player trade are never planned", () => {
  world.goods.grain.npcTrade = false;
  try {
    assert.equal(run(iso(800)).plan, null);
  } finally {
    delete world.goods.grain.npcTrade;
  }
});

test("a ship already at sea is not touched", () => {
  const m = iso(800);
  const ship = makeShip(1, "cog", "cadiz");
  ship.voyage = { from: "cadiz", to: "lisboa" };
  assert.equal(run(m, 5000, ship).plan, null);
});

test("arming ladder under pirate risk: gear first, then the best power per coin", () => {
  const rich = run(makeMarket(world), 100000, makeShip(1, "cog", "cadiz"), { pirateRisk: () => true });
  assert.equal(gearOf(rich.ship), 1, "gear level 1 comes first");
  assert.deepEqual(rich.ship.weapons, { ballista: 1 }, "ballista ties cannon on power per coin and wins the id tie-break");
  assert.equal(rich.t.cash, 99850, "60 for the gear, 90 for the ballista");
});

test("arming respects the 40x purse rule and the gear-first order", () => {
  const poor = run(makeMarket(world), 1000, makeShip(1, "cog", "cadiz"), { pirateRisk: () => true });
  assert.equal(gearOf(poor.ship), 0);
  assert.equal(weaponCount(poor.ship), 0);
  assert.equal(poor.t.cash, 1000);
  const mid = run(makeMarket(world), 3600, makeShip(1, "cog", "cadiz"), { pirateRisk: () => true });
  assert.equal(gearOf(mid.ship), 1);
  assert.equal(weaponCount(mid.ship), 0, "3540 left after the gear cannot afford the 3600 gate for a ballista");
  assert.equal(mid.t.cash, 3540);
});

test("arming stops at half the cannon slots and at a tenth of the hold", () => {
  const half = makeShip(1, "cog", "cadiz");
  half.weapons = { ballista: 1, catapult: 1 }; half.gear = 1;
  const r1 = run(makeMarket(world), 100000, half, { pirateRisk: () => true });
  assert.equal(weaponCount(r1.ship), 2, "a cog mounts at most ceil(3/2) weapons");
  assert.equal(r1.t.cash, 100000);
  const heavy = makeShip(1, "cog", "cadiz");
  heavy.weapons = { cannon: 2 }; heavy.crew = 50; // load 6 + gear weight 5 > 10% of 60
  const r2 = run(makeMarket(world), 100000, heavy, { pirateRisk: () => true });
  assert.equal(gearOf(r2.ship), 0, "the gear would push the load past a tenth of the hold");
  assert.equal(r2.t.cash, 100000);
});
