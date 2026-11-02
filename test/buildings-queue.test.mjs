// City works queue (P3: one construction crew per port): a second paid order waits in the city's
// queue, the crew promotes the oldest one on the completion tick, and the UI explains the wait
// with an estimate that distinguishes "crew free" from "queued behind another work".
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildWorld } from "../src/sim/world.mjs";
import { newGame, advanceTick, TICKS_PER_DAY } from "../src/game/game.mjs";
import { buyPlot, quoteConstruction, startConstruction, buildingAt, cityActiveConstruction, cityQueue, constructionEstimate, BUILDING_TYPES } from "../src/game/buildings.mjs";
import { buildingsRows, buildingLabel } from "../src/view/buildingsview.mjs";
import { serialize, deserialize } from "../src/game/gamesave.mjs";

const world = buildWorld(JSON.parse(fs.readFileSync(new URL("../data/world.json", import.meta.url))));
const PLOTS = [
  { id: "cadiz:7", type: "workshop", w: 4, d: 5 },
  { id: "cadiz:8", type: "house", w: 3, d: 4 },
  { id: "cadiz:9", type: "warehouse", w: 5, d: 6 },
];
const funded = () => {
  const game = newGame(world, "cadiz", { cash: 30000 });
  for (const plot of PLOTS) assert.ok(buyPlot(game, "cadiz", plot).ok);
  return game;
};

test("one crew per city: a second paid order queues, locks its plot and reports an explained estimate", () => {
  const game = funded();
  const first = startConstruction(game, "cadiz", PLOTS[0].id, "workshop");
  assert.ok(first.ok); assert.ok(first.readyTick > game.tick); // crew free: exact ready tick as before
  const second = startConstruction(game, "cadiz", PLOTS[1].id, "house");
  assert.ok(second.ok); assert.equal(second.state, "queued"); assert.ok(!("readyTick" in second));
  const order = buildingAt(game, "cadiz", PLOTS[1].id);
  assert.equal(order.state, "queued"); assert.equal(order.type, "house"); assert.equal(order.nextLevel, 1);
  assert.equal(typeof order.orderedTick, "number");
  assert.equal(quoteConstruction(game, "cadiz", PLOTS[1].id, "house").ok, false); // first queued order also locks the plot
  assert.equal(cityActiveConstruction(game, "cadiz")[0], PLOTS[0].id);
  assert.deepEqual(cityQueue(game, "cadiz").map(([id]) => id), [PLOTS[1].id]);
  const est = second.estimate;
  assert.equal(est.state, "queued"); assert.equal(est.ahead, 0); // first in line behind the active work
  assert.ok(est.startsInDays >= 1); assert.ok(est.readyDay > Math.ceil(game.tick / TICKS_PER_DAY));
  assert.equal(constructionEstimate(game, "cadiz", PLOTS[0].id).readyDay, Math.ceil(first.readyTick / TICKS_PER_DAY)); // active work: exact day
  assert.equal(constructionEstimate(game, "cadiz", PLOTS[2].id), null); // bare plot: nothing to estimate
});

test("the freed crew promotes the oldest queued order on the completion tick and the estimate lands exactly", () => {
  const game = funded();
  const first = startConstruction(game, "cadiz", PLOTS[0].id, "workshop");
  const houseOrder = startConstruction(game, "cadiz", PLOTS[1].id, "house");
  const whOrder = startConstruction(game, "cadiz", PLOTS[2].id, "warehouse");
  assert.equal(houseOrder.state, "queued"); assert.equal(whOrder.state, "queued");
  const estB = constructionEstimate(game, "cadiz", PLOTS[1].id), estC = constructionEstimate(game, "cadiz", PLOTS[2].id);
  assert.equal(estC.ahead, 1); assert.ok(estC.readyDay > estB.readyDay);
  while (game.tick < first.readyTick - 1) advanceTick(game);
  assert.equal(buildingAt(game, "cadiz", PLOTS[1].id).state, "queued"); // not one tick early
  advanceTick(game);
  assert.equal(buildingAt(game, "cadiz", PLOTS[0].id).state, "active");
  const bNow = buildingAt(game, "cadiz", PLOTS[1].id);
  assert.equal(bNow.state, "construction"); // promoted on the very tick the crew freed
  assert.equal(bNow.readyTick, game.tick + BUILDING_TYPES.house.buildDays * TICKS_PER_DAY);
  assert.equal(Math.ceil(bNow.readyTick / TICKS_PER_DAY), estB.readyDay); // the estimate was exact
  assert.equal(buildingAt(game, "cadiz", PLOTS[2].id).state, "queued");
  while (game.tick < bNow.readyTick) advanceTick(game);
  assert.equal(buildingAt(game, "cadiz", PLOTS[1].id).state, "active");
  const cNow = buildingAt(game, "cadiz", PLOTS[2].id);
  assert.equal(cNow.state, "construction");
  assert.equal(Math.ceil(cNow.readyTick / TICKS_PER_DAY), estC.readyDay);
  while (game.tick < cNow.readyTick) advanceTick(game);
  assert.equal(buildingAt(game, "cadiz", PLOTS[2].id).state, "active");
  assert.deepEqual(cityQueue(game, "cadiz"), []);
});

test("same-tick orders wait in a stable plotId order regardless of click order", () => {
  const game = funded();
  const first = startConstruction(game, "cadiz", PLOTS[0].id, "workshop");
  assert.ok(first.ok);
  startConstruction(game, "cadiz", PLOTS[2].id, "warehouse"); // later plot id ordered first, same tick
  startConstruction(game, "cadiz", PLOTS[1].id, "house");
  assert.deepEqual(cityQueue(game, "cadiz").map(([id]) => id), [PLOTS[1].id, PLOTS[2].id]);
});

test("a queued order survives save/load and still promotes on time", () => {
  const game = funded();
  const first = startConstruction(game, "cadiz", PLOTS[0].id, "workshop");
  const houseOrder = startConstruction(game, "cadiz", PLOTS[1].id, "house");
  assert.ok(first.ok && houseOrder.ok);
  const { g: loaded } = deserialize(serialize(game, "QueueTest"), world);
  assert.equal(buildingAt(loaded, "cadiz", PLOTS[1].id).state, "queued");
  assert.deepEqual(cityQueue(loaded, "cadiz").map(([id]) => id), [PLOTS[1].id]);
  while (loaded.tick < first.readyTick) advanceTick(loaded);
  assert.equal(buildingAt(loaded, "cadiz", PLOTS[0].id).state, "active");
  assert.equal(buildingAt(loaded, "cadiz", PLOTS[1].id).state, "construction");
});

test("legacy saves with parallel works finish on their own clocks, never demoted to the queue", () => {
  const game = funded();
  const first = startConstruction(game, "cadiz", PLOTS[0].id, "workshop");
  assert.ok(first.ok);
  const legacy = buildingAt(game, "cadiz", PLOTS[1].id); // hand back the pre-queue save shape: first second parallel work
  Object.assign(legacy, { type: "house", state: "construction", nextLevel: 1, readyTick: game.tick + 30 });
  while (game.tick < 30) advanceTick(game);
  assert.equal(buildingAt(game, "cadiz", PLOTS[1].id).state, "active"); // finished on its own readyTick
  assert.equal(buildingAt(game, "cadiz", PLOTS[0].id).state, "construction"); // the workshop keeps its own clock
  while (game.tick < first.readyTick) advanceTick(game);
  assert.equal(buildingAt(game, "cadiz", PLOTS[0].id).state, "active");
});

test("queued rows and labels explain the wait in Spanish and English", async () => {
  const { bldSummaryCard, bldChipInner } = await import("../src/view/buildingsview.mjs");
  const strings = {
    es: { bldTypes: { workshop: "Taller", house: "Casa" }, bldState: { plot: "Solar", construction: "en obras", queued: "en cola", active: "activo", halted: "parado", fire: "incendio" }, bldReady: "listo el día {d} ({p}%)", bldReadyQueued: "lista como pronto el día {d} (estimado)", bldQueuedLong: "turno {n} en la cola de obras · lista como pronto el día {d} (estimado: espera a la obra actual)" },
    en: { bldTypes: { workshop: "Workshop", house: "House" }, bldState: { plot: "empty plot", construction: "under construction", queued: "queued", active: "active", halted: "halted", fire: "fire" }, bldReady: "ready on day {d} ({p}%)", bldReadyQueued: "ready at earliest on day {d} (estimate)", bldQueuedLong: "turn {n} in the works queue · ready at earliest on day {d} (estimate: waits for the current work)" },
  };
  const game = funded();
  startConstruction(game, "cadiz", PLOTS[0].id, "workshop");
  startConstruction(game, "cadiz", PLOTS[1].id, "house");
  const row = buildingsRows(game, "cadiz").find((row) => row.plotId === PLOTS[1].id);
  assert.equal(row.state, "queued"); assert.equal(row.nextLevel, 1); assert.equal(row.queueAhead, 0);
  assert.equal(row.readyDay, constructionEstimate(game, "cadiz", PLOTS[1].id).readyDay);
  assert.equal(buildingLabel(strings.es, row), "Casa (1)");
  const card = bldSummaryCard(strings.es, row, "es", (n) => String(n));
  assert.ok(card.includes("en cola") && card.includes("turno 1") && card.includes("estimado"), "es card explains the queue and its estimate");
  assert.ok(!card.includes("undefined") && !card.includes("NaN"), "no raw holes");
  const cardEn = bldSummaryCard(strings.en, row, "en", (n) => String(n));
  assert.ok(cardEn.includes("queued") && cardEn.includes("turn 1") && cardEn.includes("estimate"), "en card explains the queue and its estimate");
  const chip = bldChipInner(strings.es, row, "es");
  assert.ok(chip.includes("en cola") && chip.includes("estimado"), "es chip shows the estimate");
});
