// Concejo treasury and tax votes (phase B1): caja accounting, bounded discrete tax steps,
// deterministic meetings, and news only where the player is known.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildWorld } from "../src/sim/world.mjs";
import { newGame, advanceDay, doBuy, doSell } from "../src/game/game.mjs";
import { cajaOf, cajaTarget, taxSteps, sisaMul, portazgoMul, creditCaja, nextMeetingDay, councilDay, STEP_MAX } from "../src/game/council.mjs";
import { chargeToll, tollFor } from "../src/game/tolls.mjs";
import { feeMul } from "../game/../src/game/reputation.mjs";
import { ensureRep } from "../src/game/rank.mjs";
import { hallView } from "../src/view/townhallview.mjs";

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

test("a poor chest makes the concejo raise a tax on its meeting day, by one bounded step", () => {
  const g = fresh();
  g.ai = []; // council mechanics only: no bot derechos refilling the chest on the way to the meeting
  const meet = nextMeetingDay(world, "cadiz", 1);
  g.hallCaja = { cadiz: 0 }; // an empty chest before the meeting
  const before = taxSteps(g, "cadiz");
  runTo(g, meet); // the meeting day fires inside dayTick
  const after = taxSteps(g, "cadiz");
  assert.equal(after.sisa + after.portazgo, before.sisa + before.portazgo + 1);
  assert.ok(Math.abs(after.sisa) <= STEP_MAX && Math.abs(after.portazgo) <= STEP_MAX);
  // the step moves the real multipliers the trader pays
  if (after.sisa !== before.sisa) assert.ok(sisaMul(g, "cadiz") > 1);
  else assert.ok(portazgoMul(g, "cadiz") > 1);
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
  g.ai = []; // no bot derechos: the chest stays empty until the vote
  const meet = nextMeetingDay(world, "sevilla", 1);
  g.hallCaja = { sevilla: 0 };
  runTo(g, meet); // sevilla never heard of the player
  assert.equal(g.inbox.filter((m) => m.kind === "council").length, 0);
  const g2 = fresh();
  g2.ai = [];
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
    // bots pour derechos into busy ports; obras spending caps the surplus near 1.5*target + derechos/0.1,
    // so small ports on busy lanes read a high ratio on modest coins (measured worst: ~1.6k at huelva)
    assert.ok(caja >= 0 && caja <= 1.5 * target + 2500, `${c.id} chest out of control: ${caja} vs target ${target}`);
  }
});

test("the Ayuntamiento tab shows the chest, the tax levels and the next meeting", () => {
  const g = fresh();
  (g.hallTax ??= {}).cadiz = { sisa: 1, portazgo: -1 };
  const hv = hallView(g, "cadiz");
  assert.equal(hv.caja, Math.round(cajaTarget(world, "cadiz")));
  assert.equal(hv.sisa, 1);
  assert.equal(hv.portazgo, -1);
  assert.equal(hv.nextMeeting, nextMeetingDay(world, "cadiz", g.day));
  assert.equal(hv.feePct, 2.5); // sisa +1: 2% x 1.25
});

test("fee and toll stay at base values while steps are neutral", () => {
  const g = fresh();
  assert.equal(feeMul(g, "cadiz"), 1); // neutral reputation x sisa 1
  const ship = g.ships[0];
  assert.equal(tollFor(g, ship, "cadiz"), 6); // 60 capacity / 10, no discounts
});
