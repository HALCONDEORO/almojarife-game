// Concejo treasury and tax votes (phase B1): caja accounting, bounded discrete tax steps,
// deterministic meetings, and news only where the player is known.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildWorld } from "../src/sim/world.mjs";
import { newGame, advanceDay, doBuy, doSell } from "../src/game/game.mjs";
import { cajaOf, cajaTarget, taxSteps, sisaMul, portazgoMul, creditCaja, meetingDay, nextMeetingDay, councilDay, upkeepOf, SISA_STEP, TOLL_STEP, STEP_MAX } from "../src/game/council.mjs";
import { chargeToll, tollFor } from "../src/game/tolls.mjs";
import { FEE } from "../src/sim/trade.mjs";
import { feeMul } from "../game/../src/game/reputation.mjs";
import { ensureRep } from "../src/game/rank.mjs";
import { hallView } from "../src/view/townhallview.mjs";
import { townIndustry } from "../src/game/townindustry.mjs";
import { AUCTION_EVERY, SHIP_EVERY, HOUSE_EVERY, GOODS_EVERY, PERMIT_EVERY, maxShipLotValue, maxHouseLotValue, maxGoodsLotValue, maxPermitLotValue } from "../src/game/almoneda.mjs";
import { establishmentValue } from "../src/game/almoneda.mjs";

const world = buildWorld(JSON.parse(fs.readFileSync(new URL("../data/world.json", import.meta.url))));
const fresh = () => newGame(world, "cadiz", { cash: 30000 });
const runTo = (g, day) => { while (g.day < day && !g.over) advanceDay(g); };

test("chests start at their target reserve; steps start neutral", () => {
  const g = fresh();
  councilDay(g);
  assert.equal(cajaOf(g, "cadiz"), cajaTarget(world, "cadiz"));
  assert.deepEqual(taxSteps(g, "cadiz"), { sisa: 0, portazgo: 0 });
  assert.equal(sisaMul(g, "cadiz"), 1);
  assert.equal(portazgoMul(g, "cadiz"), 1);
});

test("the derechos the player pays feed the town's chest", () => {
  const g = fresh();
  const c0 = cajaOf(g, "cadiz");
  g.market.cadiz.grain.stock = 50;
  const ship = g.ships[0];
  const r = doBuy(g, ship, "grain", 10);
  assert.ok(r.ok);
  assert.ok(cajaOf(g, "cadiz") > c0, "the almojarifazgo of the purchase lands in the caja");
  const c1 = cajaOf(g, "cadiz");
  const t = chargeToll(g, ship, "cadiz");
  assert.ok(t > 0);
  assert.equal(cajaOf(g, "cadiz"), Math.round((c1 + t) * 100) / 100);
});

test("a poor chest makes the concejo raise a tax on its meeting day, scaled to the hole", () => {
  const g = fresh();
  const meet = nextMeetingDay(world, "cadiz", 1);
  g.hallCaja = { cadiz: 0 }; // an empty chest before the meeting: half the target missing
  const before = taxSteps(g, "cadiz");
  runTo(g, meet); // the meeting day fires inside dayTick
  const after = taxSteps(g, "cadiz");
  // deficit-scaled raise: ceil((target/2 - caja)/target * STEP_MAX), clamped 1..MAX; caja 0 -> 5
  assert.equal(after.sisa + after.portazgo, before.sisa + before.portazgo + 5);
  assert.ok(Math.abs(after.sisa) <= STEP_MAX && Math.abs(after.portazgo) <= STEP_MAX);
  // the steps move the real multipliers the trader pays
  if (after.sisa !== before.sisa) assert.ok(sisaMul(g, "cadiz") > 1);
  else assert.ok(portazgoMul(g, "cadiz") > 1);
});

test("a barely-poor chest still raises one step; a deep hole raises at most STEP_MAX", () => {
  for (const [caja, want] of [[cajaTarget(world, "cadiz") / 2 - 0.01, 1], [-10 * cajaTarget(world, "cadiz"), STEP_MAX]]) {
    const g = fresh();
    const meet = nextMeetingDay(world, "cadiz", 1);
    g.hallCaja = { cadiz: caja };
    const before = taxSteps(g, "cadiz");
    runTo(g, meet);
    const after = taxSteps(g, "cadiz");
    assert.equal(after.sisa + after.portazgo, before.sisa + before.portazgo + want, `caja ${caja} -> +${want}`);
  }
});

test("a flush chest makes the concejo lower a tax", () => {
  const g = fresh();
  (g.hallTax ??= {}).cadiz = { sisa: 1, portazgo: 0 };
  const meet = nextMeetingDay(world, "cadiz", 1);
  g.hallCaja = { cadiz: 1e6 };
  runTo(g, meet);
  assert.equal(taxSteps(g, "cadiz").sisa + taxSteps(g, "cadiz").portazgo, 0);
});

test("steps never leave the [-2, +2] band", () => {
  const g = fresh();
  (g.hallTax ??= {}).cadiz = { sisa: STEP_MAX, portazgo: STEP_MAX };
  const meet = nextMeetingDay(world, "cadiz", 1);
  g.hallCaja = { cadiz: 0 };
  runTo(g, meet);
  const st = taxSteps(g, "cadiz");
  assert.ok(st.sisa <= STEP_MAX && st.portazgo <= STEP_MAX);
});

test("votes are deterministic for the same city and day", () => {
  const a = fresh(), b = fresh();
  const meet = nextMeetingDay(world, "sevilla", 1);
  runTo(a, meet - 1); runTo(b, meet - 1);
  a.hallCaja = { sevilla: 0 }; b.hallCaja = { sevilla: 0 };
  councilDay(a); councilDay(b);
  assert.deepEqual(taxSteps(a, "sevilla"), taxSteps(b, "sevilla"));
});

test("the vote is only news where the concejo knows the player", () => {
  const g = fresh();
  const meet = nextMeetingDay(world, "sevilla", 1);
  g.hallCaja = { sevilla: 0 };
  runTo(g, meet); // sevilla never heard of the player
  assert.equal(g.inbox.filter((m) => m.kind === "council").length, 0);
  const g2 = fresh();
  ensureRep(g2).sevilla = 500; // some respect: the player sold there before
  g2.hallCaja = { sevilla: 0 };
  runTo(g2, meet);
  const msg = g2.inbox.find((m) => m.kind === "council");
  assert.ok(msg.txt.es.includes("El concejo de Sevilla"));
  assert.ok(msg.txt.es.includes("subir"));
});

test("an idle year keeps every chest and tax step inside its band", () => {
  const g = fresh();
  runTo(g, 120);
  for (const c of world.cities) {
    const st = taxSteps(g, c.id);
    assert.ok(Math.abs(st.sisa) <= STEP_MAX && Math.abs(st.portazgo) <= STEP_MAX, `${c.id} out of band: ${JSON.stringify(st)}`);
    const caja = cajaOf(g, c.id), target = cajaTarget(world, c.id);
    const almoneda = g.hallAlmoneda?.[c.id] ?? 0; // municipal auction proceeds are legitimate one-off income, tracked apart from taxes (almoneda.mjs)
    const almGen = g.hallAlmonedaGen?.[c.id] ?? 0; // generated lots (used ships, town houses, goods, permits) pay the chest too, cadence-bounded below
    // Invariant: the chest never goes bankrupt, and it can only exceed the old tax band by verified auction
    // income - the concejo may spend or relieve the windfall (money is fungible), so the tax part alone can
    // dip, but nothing may appear beyond taxes-plus-sales. Conservation per sale is proven in almoneda.test.
    assert.ok(caja >= 0 && caja <= 3 * target + almoneda + almGen, `${c.id} chest out of control: ${caja} vs target ${target} + auction income ${almoneda + almGen}`);
    // The game world carries the optional goods: that is the roster the almoneda sells.
    const municipalValue = townIndustry(g.world, c.id).filter((e) => e.owner.kind === "council" && e.kind === "building" && establishmentValue(g.world, e) > 0).reduce((a, e) => a + establishmentValue(g.world, e), 0);
    assert.ok(almoneda <= Math.ceil(municipalValue * 1.15), `${c.id} auction income ${almoneda} beyond the value of its municipal works ${municipalValue}`); // finite: each municipal work sells once, at most the top bidder's factor
    // Generated lots are unbounded in time but cadence-bounded: at most one of each kind every KIND_EVERY
    // cycles, each at most the top bidder's factor over the top valuation of that kind.
    const cycles = Math.floor(g.day / AUCTION_EVERY) + 1;
    const genCap = cycles * (Math.ceil((maxShipLotValue() * 1.15) / SHIP_EVERY) + Math.ceil((maxHouseLotValue(g.world) * 1.15) / HOUSE_EVERY)
      + Math.ceil((maxGoodsLotValue(g.world) * 1.15) / GOODS_EVERY) + Math.ceil((maxPermitLotValue(g.world) * 1.15) / PERMIT_EVERY));
    assert.ok(almGen <= genCap, `${c.id} generated auction income ${almGen} beyond the cadence cap ${genCap}`);
  }
});

test("tax steps are fine-grained: 5% each inside the same +-50% band", () => {
  assert.equal(SISA_STEP * STEP_MAX, 0.5, "sisa band preserved");
  assert.equal(TOLL_STEP * STEP_MAX, 0.5, "portazgo band preserved");
  const g = fresh();
  (g.hallTax ??= {}).cadiz = { sisa: 1, portazgo: -1 };
  assert.equal(sisaMul(g, "cadiz"), 1.05);
  assert.equal(portazgoMul(g, "cadiz"), 0.95);
});

test("council upkeep keeps cents so mid-size ports land on intermediate costs", () => {
  assert.equal(upkeepOf({ nodes: { x: { pop: 8500 } } }, "x"), 8.5);
  assert.equal(upkeepOf({ nodes: {} }, "missing"), 8); // default 8000 pop
  assert.equal(upkeepOf({ nodes: { t: { pop: 400 } } }, "t"), 1); // floor invariant
  assert.equal(cajaTarget({ nodes: { x: { pop: 8500 } } }, "x"), 255);
});

test("the Ayuntamiento tab shows the chest, the tax levels and the next meeting", () => {
  const g = fresh();
  (g.hallTax ??= {}).cadiz = { sisa: 1, portazgo: -1 };
  const hv = hallView(g, "cadiz");
  assert.equal(hv.caja, Math.round(cajaTarget(world, "cadiz") * 100) / 100);
  assert.equal(hv.sisa, 1);
  assert.equal(hv.portazgo, -1);
  assert.equal(hv.sisaPct, 5);
  assert.equal(hv.portazgoPct, -5);
  assert.equal(hv.nextMeeting, nextMeetingDay(world, "cadiz", g.day));
  assert.equal(hv.feePct, 2.1); // sisa +1: 2% x 1.05
});

test("fee and toll stay at base values while steps are neutral", () => {
  const g = fresh();
  assert.equal(feeMul(g, "cadiz"), 1); // neutral reputation x sisa 1
  const ship = g.ships[0];
  assert.equal(tollFor(g, ship, "cadiz"), 6); // 60 capacity / 10, no discounts
});

test("a sale pays its derecho into the chest in full (cent-settled)", () => {
  const g = fresh();
  const ship = g.ships[0];
  ship.cargo.grain = 10;
  const c0 = cajaOf(g, "cadiz");
  const r = doSell(g, ship, "grain", 10);
  assert.ok(r.ok);
  const f = FEE * feeMul(g, "cadiz");
  const expected = Math.round(r.revenue * f / (1 - f) * 100) / 100;
  assert.equal(cajaOf(g, "cadiz"), Math.round((c0 + expected) * 100) / 100, "the sell derecho lands whole, not at 1/100");
});

test("chest income follows the real tax rate, not raw steps (fixAB regression)", () => {
  for (const [steps, want] of [
    [{ sisa: STEP_MAX, portazgo: STEP_MAX }, 0.5], // both at +50%: income 1.5x upkeep, net +0.5
    [{ sisa: -STEP_MAX, portazgo: -STEP_MAX }, -0.5], // both at -50%: income 0.5x, net -0.5
    [{ sisa: 1, portazgo: 0 }, 0.6 * SISA_STEP], // one fine step moves income one rate-step
  ]) {
    const g = fresh();
    g.hallTax = { cadiz: steps };
    while (meetingDay(world, "cadiz", g.day)) g.day++; // no vote interferes
    const up = upkeepOf(world, "cadiz"), c0 = cajaOf(g, "cadiz");
    councilDay(g);
    assert.equal(cajaOf(g, "cadiz"), Math.round((c0 + up * want) * 100) / 100, `steps ${JSON.stringify(steps)} -> net ${want}x upkeep`);
  }
});
