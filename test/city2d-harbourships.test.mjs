import test from "node:test";
import assert from "node:assert/strict";
import { harbourLayout, harbourShipBerths } from "../src/view/city2d.mjs";

const bounds = { minX: 0, minY: 0, maxX: 40, maxY: 60 };

test("no ships, no berths; unknown input stays empty", () => {
  assert.deepEqual(harbourShipBerths(bounds, []), []);
  assert.deepEqual(harbourShipBerths(bounds, null), []);
});

test("each docked ship gets its own berth at a pier, sized by class", () => {
  const ships = [{ id: "a", type: "nao" }, { id: "b", type: "barca" }, { id: "c", type: "cog" }];
  const berths = harbourShipBerths(bounds, ships);
  assert.equal(berths.length, 3);
  assert.ok(berths[0].w > berths[2].w && berths[2].w > berths[1].w, "nao > cog > barca");
  const { piers } = harbourLayout(bounds);
  berths.forEach((b, i) => {
    const pier = piers[i % piers.length];
    assert.ok(b.x >= pier.x + pier.w, "berth sits at the water end of its pier");
    assert.ok(Math.abs(b.y + b.d / 2 - (pier.y + pier.d / 2)) < 1e-9, "berth centered on its pier");
  });
  const spots = new Set(berths.map((b) => `${b.x.toFixed(2)},${b.y.toFixed(2)}`));
  assert.equal(spots.size, berths.length, "no two ships overlap exactly");
});

test("more ships than piers raft outward without overlapping", () => {
  const ships = Array.from({ length: 5 }, (_, i) => ({ id: "s" + i, type: "cog" }));
  const berths = harbourShipBerths(bounds, ships);
  const spots = new Set(berths.map((b) => `${b.x.toFixed(2)},${b.y.toFixed(2)}`));
  assert.equal(spots.size, 5);
});

test("berths are deterministic", () => {
  const ships = [{ id: "a", type: "nao" }, { id: "b", type: "barca" }];
  assert.deepEqual(harbourShipBerths(bounds, ships), harbourShipBerths(bounds, ships));
});
