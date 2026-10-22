import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, advanceDay, netWorth, botWorth, houseWorth, shipValue } from "../src/game/game.mjs";
import { householdWeek, householdCharge, cityWorks, healthShield, cityHealth, HOUSEHOLD_RATE_YEAR, WORKS_COST, WORKS_EVERY } from "../src/game/household.mjs";
import { rollShock } from "../src/game/shocks.mjs";
import { reportsHtml } from "../src/view/ledgerview.mjs";
const world = loadWorld();
const hash = (g) => createHash("sha1").update(JSON.stringify({ ...g, household: undefined, world: undefined })).digest("hex");
const mk = (o = {}) => newGame(world, "cadiz", { seed: 3, household: true, ...o });
test("pure: 2% a year over 52 weeks, never above cash, zero for no worth", () => {
  assert.equal(householdCharge(100000, 52000), 20); assert.equal(householdCharge(5, 52000), 5);
  assert.equal(householdCharge(1000, 0), 0); assert.equal(householdCharge(1000, -50), 0); assert.equal(householdCharge(-10, 1000), 0);
  assert.equal(HOUSEHOLD_RATE_YEAR, 0.02);
});
test("flag off by default: state identical to a game that never heard of it, and no funds appear", () => {
  const a = newGame(world, "cadiz", { seed: 3, events: true }), b = newGame(world, "cadiz", { seed: 3, events: true, household: false });
  assert.equal(a.household, false);
  for (let i = 0; i < 200; i++) { advanceDay(a); advanceDay(b); }
  assert.equal(hash(a), hash(b)); assert.equal(a.cityFunds, undefined); assert.equal(a.cityHealth, undefined);
  assert.ok(!(a.reports ?? []).some((r) => "household" in r));
});
test("player and a bot with equal cash and worth pay exactly the same, each into its own home port", () => {
  const g = mk(); g.day = 7; g.ships = [{ ...g.ships[0], cargo: {} }]; g.warehouses = {}; g.loans = [];
  const t = g.ai[0]; t.home = "bilbao"; t.ship.cargo = {}; t.cash = g.cash; g.profile.home = "cadiz";
  const bw = (gg, x) => x.cash; // same worth definition for this check
  g.ai.length = 1;
  const c0 = g.cash; householdWeek(g, netWorth, bw);
  assert.equal(Math.round((c0 - g.cash) * 100), Math.round((c0 - t.cash) * 100));
  assert.equal(g.cityFunds.cadiz, g.cityFunds.bilbao); assert.ok(g.cityFunds.cadiz > 0);
});
test("conservation: player cash + bot cash + city funds + spent is constant over weeks and quarterly works", () => {
  const g = mk(); g.warehouses = {}; g.loans = [];
  const total = () => g.cash + g.ai.reduce((s, t) => s + t.cash, 0) + Object.values(g.cityFunds ?? {}).reduce((s, v) => s + v, 0) + (g.citySpent ?? 0);
  const t0 = total();
  for (let d = 7; d <= 7 * 30; d += 7) { g.day = d; householdWeek(g, netWorth, botWorth); assert.ok(Math.abs(total() - t0) < 0.5, "week day " + d); }
  assert.ok(g.citySpent > 0); assert.ok(Object.keys(g.cityHealth).length > 0);
});
test("quarterly works spend the whole fund and raise health by spent / cost; funds survive a save round trip", () => {
  const g = mk(); g.cityFunds = { lisboa: 10000, porto: 2500 }; g.day = WORKS_EVERY;
  assert.equal(cityWorks(g), 12500); assert.equal(g.cityFunds.lisboa, 0); assert.equal(g.cityHealth.lisboa, 10000 / WORKS_COST);
  g.day = WORKS_EVERY + 1; g.cityFunds.porto = 99; assert.equal(cityWorks(g), 0);
  const back = JSON.parse(JSON.stringify({ ...g, world: undefined })); assert.deepEqual(back.cityHealth, g.cityHealth); assert.deepEqual(back.cityFunds, g.cityFunds);
});
test("health lowers plague scares (port_closed) and never touches the other shocks", () => {
  assert.equal(healthShield(0), 0); assert.ok(healthShield(10) > 0 && healthShield(10) < healthShield(40)); assert.ok(healthShield(1e6) <= 0.6);
  const g = mk({ events: true });
  const count = (health) => { let n = 0; g.cityHealth = health ? Object.fromEntries(world.cities.map((c) => [c.id, health])) : {}; for (let seed = 1; seed <= 150; seed++) for (let day = 30; day < 330; day++) {
    g.seed = seed; g.day = day; g.shocks = []; const s = rollShock(g); if (s?.type === "port_closed") n++; } return n; };
  const a = count(0), b = count(60);
  assert.ok(a > 20 && b < a * 0.7, `scares ${a} -> ${b}`);
});
test("bot net worth counts the ship", () => {
  const g = mk(); const t = g.ai[0]; t.cash = 100; t.ship.cargo = {};
  assert.equal(botWorth(g, t), 100 + shipValue(t.ship)); assert.ok(shipValue(t.ship) > 0);
});
test("weekly report line appears with the flag on and not with it off", () => {
  const g = mk(); g.cash = 20000; g.warehouses = {}; for (let i = 0; i < 14; i++) advanceDay(g);
  const rep = g.reports.find((r) => r.household); assert.ok(rep && rep.household > 0);
  const html = reportsHtml(g, "es", (x) => String(x), (k) => k); assert.ok(html.includes("Tributo a la ciudad"));
  const off = newGame(world, "cadiz", { seed: 3 }); off.cash = 20000; for (let i = 0; i < 14; i++) advanceDay(off);
  assert.ok(!reportsHtml(off, "es", (x) => String(x), (k) => k).includes("Tributo"));
});
test("hook does nothing off the weekly day or with the flag off", () => {
  const g = mk(); g.day = 6; const c = g.cash; assert.equal(householdWeek(g, netWorth, botWorth), 0); assert.equal(g.cash, c);
  const h = newGame(world, "cadiz", { seed: 3 }); h.day = 7; assert.equal(householdWeek(h, netWorth, botWorth), 0);
});
test("same base for both: a player's tribute worth counts ships like a bot (cash + cargo + ships)", () => {
  const g = mk(); g.warehouses = {}; g.loans = []; g.ships = [g.ships[0]]; g.ships[0].cargo = {};
  const t = g.ai[0]; t.cash = g.cash; t.ship = { ...g.ships[0], cargo: {} };
  assert.equal(houseWorth(g), g.cash + shipValue(g.ships[0])); assert.equal(houseWorth(g), botWorth(g, t));
});
