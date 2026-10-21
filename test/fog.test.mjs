import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld, buildWorld } from "../src/sim/world.mjs";
import { newGame, advanceDay, doSail, buyRumor, setRoute } from "../src/game/game.mjs";
import { isDiscovered, refreshDiscovery, DISCOVERY_KM, START_KNOWN_KM } from "../src/game/fog.mjs";
import { serialize, deserialize } from "../src/game/gamesave.mjs";
import { haversineKm } from "../tools/geo.mjs";
import { route } from "../src/sim/world.mjs";
const world = loadWorld();
const game = () => { const g = newGame(world); g.eventsOn = false; return g; };
const run = (g, n) => { for (let i = 0; i < n; i++) advanceDay(g); };

test("a new game knows only the home coast", () => {
  const g = game(), home = g.profile.home;
  assert.ok(isDiscovered(g, home));
  assert.ok(isDiscovered(g, "sevilla"), "a port 85 km from Cadiz is known");
  assert.ok(!isDiscovered(g, "bilbao"), "a port 800 km away is not");
  for (const c of Object.keys(g.discovered))
    assert.ok(haversineKm(world.nodes[home], world.nodes[c]) <= START_KNOWN_KM, c + " within the home coast");
});

test("sailing itself is not blocked: the fog hides ports from the chart, and arrival discovers them", () => {
  const g = game(), s = g.ships[0];
  assert.ok(!isDiscovered(g, "bilbao"));
  assert.ok(doSail(g, s, "bilbao").ok, "an expedition can sail into the unknown");
  run(g, 30);
  assert.equal(s.at, "bilbao", "arrived");
  assert.ok(isDiscovered(g, "bilbao"), "arrival puts the port on the chart");
});

test("a tavern rumour puts the named port on the chart", () => {
  const g = game();
  assert.ok(!isDiscovered(g, "lisboa"));
  assert.ok(buyRumor(g, "lisboa").ok);
  assert.ok(isDiscovered(g, "lisboa"), "now it can be sailed to");
  assert.ok(doSail(g, g.ships[0], "lisboa").ok);
  assert.ok(g.log.some((l) => l.key === "discovered" && l.city === "lisboa"));
});

// Small world: a--b with c just off the lane, out of the starting chart but inside DISCOVERY_KM of the path.
const mini = () => buildWorld({
  cities: [
    { id: "a", name: "A", lat: 36, lon: -6, pop: 8000, makes: ["grain"], needs: ["wine"] },
    { id: "b", name: "B", lat: 36, lon: 2, pop: 8000, makes: ["wine"], needs: ["grain"] },
    { id: "c", name: "C", lat: 36.02, lon: -2, pop: 8000, makes: [], needs: ["grain"] },
  ],
  waypoints: {}, lanes: [["a", "b"]],
  goods: { grain: { base: 10 }, wine: { base: 20 } },
});

test("sailing past a port discovers it, once, with a log line", () => {
  const w = mini(), g = (() => { const x = newGame(w, "a"); x.eventsOn = false; return x; })();
  assert.ok(haversineKm(w.nodes.a, w.nodes.c) > START_KNOWN_KM, "c starts unknown");
  assert.ok(haversineKm(w.nodes.c, { lat: 36, lon: -2 }) < DISCOVERY_KM, "the a-b lane passes by c");
  assert.ok(!isDiscovered(g, "c"));
  buyRumor(g, "b"); // chart a destination to sail to
  assert.ok(doSail(g, g.ships[0], "b").ok);
  let days = 0;
  while (!isDiscovered(g, "c") && days++ < 30) run(g, 1);
  assert.ok(isDiscovered(g, "c"), "discovered mid-voyage");
  assert.equal(g.log.filter((l) => l.key === "discovered" && l.city === "c").length, 1, "logged once");
  const after = g.discovered.c;
  run(g, 5);
  assert.equal(g.discovered.c, after, "not rediscovered");
});

test("refreshDiscovery is idempotent and only reports new ports", () => {
  const w = mini(), km = route(w, "a", "b").km;
  const g = { world: w, day: 3, warehouses: {}, intel: {},
    ships: [{ id: 1, type: "cog", at: "a", cargo: {},
      voyage: { from: "a", to: "b", ticksLeft: 60, totalTicks: 120, path: ["a", "b"], km } }] };
  const found = refreshDiscovery(g);
  assert.deepEqual(found, ["c"]);
  assert.deepEqual(refreshDiscovery(g), []);
  assert.ok(DISCOVERY_KM > 0);
});

test("the chart survives saving; a pre-fog save is seeded from intel and routes", () => {
  const g = game(), s = g.ships[0];
  setRoute(g, s, s.at, "sevilla", "grain");
  const back = deserialize(serialize(g, "X"), world).g;
  assert.deepEqual(back.discovered, g.discovered);
  // Legacy save: no discovered field at all.
  const raw = JSON.parse(JSON.stringify(serialize(g, "X")));
  delete raw.state.discovered;
  const old = deserialize(raw, world).g;
  assert.ok(isDiscovered(old, old.profile.home), "home from intel");
  assert.ok(isDiscovered(old, "sevilla"), "route endpoint from the route");
  assert.ok(!isDiscovered(old, "bilbao"), "the rest stays covered");
});

test("a complete chart is a no-op and discovery survives a save round-trip", () => {
  const g = game();
  for (const c of g.world.cities) g.discovered[c.id] = g.day; // chart complete
  assert.deepEqual(refreshDiscovery(g), []);
  const raw = JSON.parse(JSON.stringify(serialize(g, "Casa Prueba")));
  assert.ok(raw.state.discovered && typeof raw.state.discovered === "object"); // serialize keeps g.discovered
  const { g: back } = deserialize(raw, world);
  assert.deepEqual(back.discovered, g.discovered);
});
