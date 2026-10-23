import test from "node:test";
import assert from "node:assert/strict";
import { portLayout, buildPortScene, litAt, LIT_TOD } from "../src/view3d/port3d.mjs";
import { makeBellTower } from "../src/view3d/buildings/tower.mjs";

const THREE = await import("../web/vendor/three.module.min.js");
const count = (root, pred) => { let n = 0; root.traverse((o) => { if (pred(o)) n++; }); return n; };

test("the hillside grows cypresses, deterministically, clear of houses and the tower", () => {
  for (const pop of [3000, 12000, 40000]) {
    const L = portLayout("cadiz", pop);
    assert.deepEqual(L.trees, portLayout("cadiz", pop).trees); // same city, same trees
    assert.ok(L.trees.length >= 4, `${pop}: ${L.trees.length} trees`);
    for (const t of L.trees) {
      assert.ok(t.z <= -20 && t.z >= -43 && Math.abs(t.x) <= 33 && t.h >= 3 && t.h < 5);
      for (const h of L.houses) assert.ok(!(Math.abs(t.x - h.x) < h.w / 2 + 1.2 && Math.abs(t.z - h.z) < h.d / 2 + 1.2), "tree inside a house");
      assert.ok(!(Math.abs(t.x - L.tower.x) < 4 && Math.abs(t.z - L.tower.z) < 4), "tree inside the tower");
    }
  }
  assert.ok(portLayout("cadiz", 40000).trees.length > portLayout("cadiz", 3000).trees.length, "bigger towns keep more trees");
  assert.notDeepEqual(portLayout("cadiz", 12000).trees, portLayout("lisboa", 12000).trees);
});

test("the bell tower has a belfry stage with four arches and a bell", () => {
  const g = makeBellTower(THREE, { h: 18 });
  assert.equal(count(g, (o) => o.userData?.belfry), 4);
  assert.ok(count(g, (o) => o.isMesh) >= 8, "base, shaft, course, stage, bell, cap, pole");
  g.updateMatrixWorld(true);
  const top = Math.max(...g.children.map((o) => o.position.y));
  assert.ok(top > 18 - 0.01, "the pole crowns the tower");
});

test("the bank grows windows with its level: 2, 4, 6", () => {
  const wins = (pop, upgrades) => buildPortScene(THREE, { id: "cadiz", pop, ships: 0, upgrades }).scene.children.find((o) => o.userData?.building === "bank").userData.windows;
  assert.equal(wins(3000, {}), 2);
  assert.equal(wins(3000, { bank: 2 }), 4);
  assert.equal(wins(3000, { bank: 3 }), 6);
  assert.equal(wins(40000, {}), 6); // city size alone raises the level too
});

test("town windows light up only late in the day, deterministically", () => {
  assert.equal(LIT_TOD, 0.7);
  assert.equal(litAt("cadiz:1a", 0.5), false);
  assert.equal(litAt("cadiz:1a", 0.69), false);
  assert.equal(litAt("cadiz:1a", 0.72), litAt("cadiz:1a", 0.72)); // stable
  const lit = (tod) => count(buildPortScene(THREE, { id: "cadiz", pop: 12000, ships: 0, tod }).scene, (o) => o.userData?.win && o.material.emissiveIntensity > 0);
  assert.equal(lit(0.5), 0);
  assert.ok(lit(0.72) >= 4, "a share of windows glows at dusk");
  assert.equal(lit(0.72), lit(0.72));
});
