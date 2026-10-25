import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, advanceDay, setRoute, clearRoute } from "../src/game/game.mjs";
import { serialize, deserialize } from "../src/game/gamesave.mjs";
import { messageText } from "../src/view/ledgerview.mjs";
import { SHIP_TYPES } from "../src/sim/trade.mjs";
const SHIP_CAP = (s) => SHIP_TYPES[s.type].capacity;
const world = loadWorld();
const game = () => { const g = newGame(world); g.eventsOn = false; return g; };
const run = (g, n) => { for (let i = 0; i < n; i++) advanceDay(g); };
const pair = (g) => { const a = g.ships[0].at, b = world.cities.find((c) => c.id !== a).id; return [a, b]; };
const goodAt = (g, a) => Object.keys(world.goods).find((k) => g.market[a][k] && g.market[a][k].stock > 50);

test("setRoute validates ports and goods", () => {
  const g = game(), s = g.ships[0], [a, b] = pair(g), good = goodAt(g, a);
  assert.equal(setRoute(g, s, a, a, good).reason, "bad route");
  assert.equal(setRoute(g, s, a, "nowhere", good).reason, "bad route");
  assert.equal(setRoute(g, s, a, b, "gold-dust").reason, "bad good");
  assert.equal(setRoute(g, s, a, b, good, good).reason, "bad good");
  assert.ok(setRoute(g, s, a, b, good).ok); assert.equal(s.route.legs, 0);
  assert.ok(clearRoute(s)); assert.equal(s.route, undefined); assert.equal(clearRoute(s), false);
});
test("a ship with a route loads, sails, sells and comes back by itself", () => {
  const g = game(), s = g.ships[0], [a, b] = pair(g), good = goodAt(g, a), c0 = g.cash;
  setRoute(g, s, a, b, good);
  run(g, 1);
  assert.ok(s.voyage && s.voyage.to === b, "sailed to B with cargo");
  assert.ok((s.cargo[good] ?? 0) > 0);
  let sold = false;
  for (let d = 0; d < 120 && !sold; d++) { run(g, 1); sold = (g.inbox ?? []).some((m) => m.kind === "routeLeg"); }
  assert.ok(sold, "a sale message arrived");
  assert.ok(s.route.legs >= 1);
  run(g, 60); assert.ok(s.voyage || s.at === a || s.at === b, "keeps moving along the route");
  assert.ok(g.cash !== c0);
});
test("at A it never sails empty: no cash stalls the route with one message, then it recovers", () => {
  const g = game(), s = g.ships[0], [a, b] = pair(g), good = goodAt(g, a);
  setRoute(g, s, a, b, good); g.cash = 0;
  run(g, 3);
  assert.equal(s.at, a); assert.equal(s.voyage, null);
  assert.equal((g.inbox ?? []).filter((m) => m.kind === "routeStuck").length, 1, "only one stall message");
  g.cash = 2000; run(g, 1);
  assert.ok(s.voyage, "left once it could buy");
  assert.equal(s.route.stuck, 0);
});
test("a ship away from the route first goes to A", () => {
  const g = game(), s = g.ships[0], [a, b] = pair(g), c = world.cities.find((x) => x.id !== a && x.id !== b).id, good = goodAt(g, a);
  s.at = c; setRoute(g, s, a, b, good);
  run(g, 1); assert.equal(s.voyage?.to, a);
});
test("routes survive saving and show in both languages", () => {
  const g = game(), s = g.ships[0], [a, b] = pair(g), good = goodAt(g, a);
  setRoute(g, s, a, b, good);
  const back = deserialize(serialize(g, "X"), world).g;
  assert.deepEqual(back.ships[0].route, s.route);
  const m = { kind: "routeLeg", ship: 1, city: b, good, qty: 5, amt: 120, profit: 30 };
  const f = (n) => String(Math.round(n));
  assert.equal(messageText(m, "en", f, (c) => "Port", () => "Wool"), "Ship 1: sold 5 Wool at Port for 120 (profit 30).");
  assert.equal(messageText(m, "es", f, (c) => "Puerto", () => "Lana"), "Barco 1: vendió 5 Lana en Puerto por 120 (ganancia 30).");
  assert.ok(messageText({ kind: "routeStuck", ship: 1, city: a, good }, "es", f, () => "X", () => "Lana").includes("parada"));
});
test("a hold full of an unrelated good does not shuttle without trading", () => {
  const g = game(), s = g.ships[0], [a, b] = pair(g), good = goodAt(g, a);
  const other = Object.keys(world.goods).find((k) => k !== good);
  s.cargo = { [other]: SHIP_CAP(s) };
  setRoute(g, s, a, b, good);
  run(g, 3);
  assert.ok(!s.voyage, "stays in port");
  assert.ok(g.inbox.some((m) => m.kind === "routeStuck"));
});

test("route tab source: goods is declared before the advanced-route editor uses it (TDZ regression)", () => {
  const src = fs.readFileSync(new URL("../web/main.mjs", import.meta.url), "utf8");
  const route = src.slice(src.indexOf('tab === "route"'), src.indexOf('tab === "city"'));
  const use = route.indexOf("goods.map");
  const decl = route.indexOf("const goods = Object.keys(g.world.goods)");
  assert.ok(use > 0 && decl > 0 && decl < use, "goods must be declared before first use in the route tab");
});

test("the route tab shows its explainer line exactly once", async () => {
  const { readFileSync } = await import("node:fs");
  const src = readFileSync(new URL("../web/main.mjs", import.meta.url), "utf8");
  const uses = src.split("t.routeInfo}").length - 1;
  assert.equal(uses, 1, "routeInfo renders once in the route tab (regression: it was concatenated twice)");
});

test("route tab source: the active advanced route renders as a visual P3 chain with one chip per stop", () => {
  const src = fs.readFileSync(new URL("../web/main.mjs", import.meta.url), "utf8");
  const route = src.slice(src.indexOf('tab === "route"'), src.indexOf('tab === "city"'));
  assert.ok(route.includes("rpathLoop(rt.stops.map"), "active v2 route renders the visual chip circuit");
  assert.ok(route.includes("rpath-preview"), "the advanced editor shows a live preview of the draft");
  assert.ok(!route.includes("stopLine"), "old per-stop paragraph lines are gone");
});

test("route tab source: the simple A⇄B card never renders for an advanced (v2) route", () => {
  const src = fs.readFileSync(new URL("../web/main.mjs", import.meta.url), "utf8");
  const route = src.slice(src.indexOf('tab === "route"'), src.indexOf('tab === "city"'));
  assert.ok(route.includes("rt && rt.v !== 2"), "the simple card is gated to legacy A⇄B routes");
});

test("route tab source: the editor keeps its control ids inside the compact table", () => {
  const src = fs.readFileSync(new URL("../web/main.mjs", import.meta.url), "utf8");
  const route = src.slice(src.indexOf('tab === "route"'), src.indexOf('tab === "city"'));
  for (const id of ["rts-city-", "rts-bg-", "rts-bp-", "rts-sg-", "rts-sp-", "rts-del-", "rts-add", "rts-mincash", "rts-set2"]) {
    assert.ok(route.includes(id), `editor control ${id} survives the redesign`);
  }
});
