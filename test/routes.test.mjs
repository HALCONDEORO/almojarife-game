import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, advanceDay, setRoute, clearRoute } from "../src/game/game.mjs";
import { serialize, deserialize } from "../src/game/gamesave.mjs";
import { messageText } from "../src/view/ledgerview.mjs";
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
