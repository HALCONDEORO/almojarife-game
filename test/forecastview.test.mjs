import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, setRoute } from "../src/game/game.mjs";
import { forecastPorts, forecastData, forecastHtml } from "../src/view/forecastview.mjs";
const world = loadWorld();
const game = () => { const g = newGame(world); g.eventsOn = false; return g; };
test("ports: route ports, or the port the ship is in", () => {
  assert.deepEqual(forecastPorts({ at: "cadiz" }), ["cadiz"]);
  assert.deepEqual(forecastPorts({ route: { a: "cadiz", b: "malaga" } }), ["cadiz", "malaga"]);
  assert.deepEqual(forecastPorts({ route: { stops: [{ city: "cadiz" }, { city: "malaga" }, { city: "cadiz" }] } }), ["cadiz", "malaga"]);
  assert.deepEqual(forecastPorts(null), []);
});
test("data has 7 days per port and is deterministic for a seed", () => {
  const g = game(), s = g.ships[0], b = world.cities.find((c) => c.id !== s.at).id;
  const good = Object.keys(world.goods).find((k) => g.market[s.at][k] && g.market[s.at][k].stock > 50);
  setRoute(g, s, s.at, b, good);
  const d = forecastData(g, world, s);
  assert.equal(d.length, 2); assert.equal(d[0].days.length, 7);
  assert.deepEqual(forecastData(g, world, s), d);
});
test("html: 7 day cells per port, Spanish by default, storms marked, nothing when empty", () => {
  const g = game(), d = forecastData(g, world, g.ships[0]);
  const h = forecastHtml(d, { lang: "es" });
  assert.match(h, /Previsión a 7 días/); assert.match(h, /Hoy/); assert.equal((h.match(/class="fc-day[ "]/g) || []).length, 7);
  assert.match(forecastHtml(d, { lang: "en" }), /7-day outlook/);
  assert.equal(forecastHtml([]), "");
  assert.match(forecastHtml([{ city: "x", days: [{ dir: 0, force: 0.9, storm: true }] }]), /fc-storm/);
});
