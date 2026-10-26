import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame } from "../src/game/game.mjs";
import { buyRouteRumor, routeRumorTarget } from "../src/game/charts.mjs";
test("a paid route rumour leaves a log line in both languages", () => {
  const g = newGame(loadWorld()), at = g.ships[0].at; g.cash = 1000;
  if (!routeRumorTarget(g, at)) return;
  const n = (g.inbox ?? []).length, r = buyRouteRumor(g, at);
  assert.equal(r.ok, true); assert.equal(g.inbox.length, n + 1);
  const m = g.inbox[0]; assert.ok(m.txt.es.includes("rumor de ruta") && m.txt.en.includes("route rumour"));
});
