import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { makeShip, sail, tickShip } from "../src/sim/trade.mjs";
import { shipPosition } from "../src/sim/position.mjs";
import { newGame, advanceDay } from "../src/game/game.mjs";
import { haversineKm } from "../tools/geo.mjs";
const world = loadWorld();
const near = (a, b, km = 0.01) => haversineKm(a, b) <= km;

test("docked ship sits on its port; voyage start and end are the two ports", () => {
  const s = makeShip(1, "cog", "cadiz");
  assert.ok(near(shipPosition(world, s), world.nodes.cadiz));
  sail(world, s, "valencia");
  assert.ok(near(shipPosition(world, s, 0), world.nodes.cadiz));
  while (s.voyage && s.voyage.daysLeft > 1) tickShip(s);
  const last = shipPosition(world, s, 1);
  assert.ok(near(last, world.nodes.valencia), "end of last day is the destination");
});
test("every position along a voyage stays on its lane path (never jumps over land)", () => {
  const s = makeShip(1, "cog", "cadiz"); sail(world, s, "barcelona");
  const path = s.voyage.path, pts = path.map((id) => world.nodes[id]);
  const maxLeg = Math.max(...pts.slice(1).map((p, i) => haversineKm(pts[i], p)));
  let prev = shipPosition(world, s, 0), steps = 0;
  while (s.voyage) {
    for (const f of [0.25, 0.5, 0.75, 1]) {
      const p = shipPosition(world, s, f);
      assert.ok(haversineKm(prev, p) < 400 + 1, "no big jumps");
      // distance to the closest segment of the path is ~0
      const dmin = Math.min(...pts.slice(1).map((b, i) => { const a = pts[i]; return haversineKm(a, p) + haversineKm(p, b) - haversineKm(a, b); }));
      assert.ok(dmin < 1, "off the lane by " + dmin);
      prev = p; steps++;
    }
    tickShip(s);
  }
  assert.ok(steps > 4 && maxLeg > 0);
});
test("a save made at sea loads with the ship at the same point", () => {
  const s = makeShip(1, "caravel", "lisboa"); sail(world, s, "barcelona"); tickShip(s); tickShip(s);
  const copy = JSON.parse(JSON.stringify(s));
  assert.deepEqual(shipPosition(world, copy, 0.4), shipPosition(world, s, 0.4));
});
test("the sim does not depend on how often the view asks for positions", () => {
  const run = (calls) => { const g = newGame(world); for (let d = 0; d < 200; d++) { for (const t of g.ai) for (let i = 0; i < calls; i++) shipPosition(world, t.ship, i / calls); advanceDay(g); } return JSON.stringify([g.market, g.ai]); };
  assert.equal(run(1), run(8));
});
