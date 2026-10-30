// Internal needs telemetry: explicit periods, sources and continuation, no economic changes.
import test from "node:test";
import assert from "node:assert/strict";
import { tickMarketCity } from "../src/sim/market.mjs";
import { needsHtml } from "../src/view/needsview.mjs";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, advanceTick, TICKS_PER_DAY } from "../src/game/game.mjs";
import { serialize, deserialize } from "../src/game/gamesave.mjs";
import { writeSlot, readSlot, listSlots } from "../src/game/saveslots.mjs";

const city = () => ({ grain: { stock: 300, target: 100, rate: 0, pop: 1000 }, fish: { stock: 200, target: 100, rate: 0, pop: 1000 } });
const tick = (row, day) => tickMarketCity(row, day, undefined, { commerceLedger: false });
const snapshot = row => structuredClone(row.grain.needsLedger);
const sumClasses = (ledger, good, key) => ["poor", "middle", "rich"].reduce((total, cls) => total + ledger.daily.byClass[cls][good][key], 0);

test("a later tick replaces daily, adds cumulative, and never clears an interposed stock update", () => {
  const row = city();
  tick(row, 2);
  const first = snapshot(row);
  row.grain.stock += 7; // another source between snapshots; not a household receipt
  const before = row.grain.stock;
  tick(row, 3);
  const next = row.grain.needsLedger;
  assert.equal(next.days, 2);
  assert.equal(next.daily.day, 3);
  assert.equal(next.daily.byGood.grain.consumed, before - row.grain.stock);
  assert.equal(next.totals.grain.consumed, first.totals.grain.consumed + next.daily.byGood.grain.consumed);
  assert.equal(first.daily.day, 2, "a copied prior period is a stable reference");
});

test("exact and stock-limited service share one unit and reconcile daily and cumulative receipts", () => {
  for (const stock of [1, 4]) {
    const row = { grain: { stock, target: stock, rate: 0, pop: 1000 } };
    tick(row, 0);
    const ledger = row.grain.needsLedger;
    assert.equal(row.grain.stock, 0);
    assert.equal(ledger.daily.byGood.grain.consumed, stock);
    assert.equal(ledger.totals.grain.consumed, stock);
    assert.equal(sumClasses(ledger, "grain", "consumed"), stock);
  }
});

test("multiple goods and estimated classes reconcile without duplicate withdrawal", () => {
  const row = city();
  const before = { grain: row.grain.stock, fish: row.fish.stock };
  tick(row, 0);
  const ledger = row.grain.needsLedger;
  for (const good of ["grain", "fish"]) {
    const served = before[good] - row[good].stock;
    assert.equal(ledger.daily.byGood[good].consumed, served);
    assert.equal(sumClasses(ledger, good, "consumed"), served);
    assert.equal(ledger.totals[good].consumed, served);
  }
});

test("physical need and desired purchases survive a stock clamp without becoming actual consumption", () => {
  const row = { grain: { stock: 1, target: 1, rate: 0, pop: 1000 } };
  tick(row, 0);
  const entry = row.grain.needsLedger.daily.byGood.grain;
  assert.ok(entry.need > entry.consumed);
  assert.ok(entry.desired > entry.consumed);
  assert.equal(entry.consumed, 1);
  assert.equal(entry.balance, entry.need - entry.consumed);
});

test("rendering reads the latest completed market day and cumulative count without mutating either", () => {
  const row = city();
  tick(row, 8);
  const old = snapshot(row);
  const before = needsHtml(row.grain, {}, "en");
  assert.ok(before.includes("Latest day (8)"));
  assert.ok(before.includes("1 market days"));
  assert.deepEqual(row.grain.needsLedger, old);
  tick(row, 9);
  const current = snapshot(row);
  const after = needsHtml(row.grain, {}, "en");
  assert.ok(after.includes("Latest day (9)"));
  assert.ok(after.includes("2 market days"));
  assert.deepEqual(row.grain.needsLedger, current);
  assert.ok(before.includes("Latest day (8)"), "an old rendered string stays in its original period");
});

test("real tick continuation through a validated manual save slot preserves a partly completed market day", () => {
  const world = loadWorld();
  const continuous = newGame(world, "cadiz", { seed: 7, freePlay: true, works: false, calamities: false, regionalRivals: false });
  continuous.ai = [];
  for (let step = 0; step < Math.floor(TICKS_PER_DAY / 2); step++) advanceTick(continuous);
  const midTick = continuous.tick;
  const raw = JSON.stringify(serialize(continuous, "Period test", 1000));
  const values = new Map();
  const store = { setItem: (key, value) => values.set(key, value), getItem: key => values.get(key) ?? null };
  const unpack = text => deserialize(JSON.parse(text), world);
  writeSlot(store, 1, raw, text => { try { unpack(text); return true; } catch { return false; } });
  assert.equal(listSlots(store, unpack)[0].state, "ok");
  const resumed = unpack(readSlot(store, 1)).g;
  assert.equal(resumed.tick, midTick);
  for (let step = 0; step < TICKS_PER_DAY * 2; step++) {
    advanceTick(continuous); advanceTick(resumed);
  }
  assert.equal(resumed.tick, continuous.tick);
  for (const port of world.cities) {
    assert.deepEqual(resumed.market[port.id].grain.needsLedger, continuous.market[port.id].grain.needsLedger, port.id);
  }
});

test("disabled telemetry records no period and does not change market cell outcomes", () => {
  const enabled = city(), disabled = city();
  for (let day = 0; day < 3; day++) {
    tick(enabled, day);
    tickMarketCity(disabled, day, undefined, { needsLedger: false, commerceLedger: false });
  }
  assert.ok(!Object.hasOwn(disabled.grain, "needsLedger"));
  for (const good of ["grain", "fish"]) {
    const entry = { ...enabled[good] };
    delete entry.needsLedger;
    assert.deepEqual(entry, disabled[good]);
  }
});
