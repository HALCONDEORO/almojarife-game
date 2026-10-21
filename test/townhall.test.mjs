// Ayuntamiento tab (phase A1): seeded concejo per city and the derechos it displays. Pure module tests.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildWorld } from "../src/sim/world.mjs";
import { newGame } from "../src/game/game.mjs";
import { townCouncil, COUNCIL_SIZE } from "../src/game/townhall.mjs";
import { hallView } from "../src/view/townhallview.mjs";
import { ensureRep } from "../src/game/rank.mjs";

const world = buildWorld(JSON.parse(fs.readFileSync(new URL("../data/world.json", import.meta.url))));
const cities = Object.keys(world.nodes).slice(0, 5);

test("the concejo is deterministic: same city, same council", () => {
  for (const c of cities) assert.deepEqual(townCouncil(world, c), townCouncil(world, c));
});

test("an alcalde and four distinct regidores, no repeated names inside a council", () => {
  for (const c of cities) {
    const hall = townCouncil(world, c);
    assert.equal(hall.councillors.length, COUNCIL_SIZE);
    assert.equal(new Set([hall.mayor, ...hall.councillors]).size, 1 + COUNCIL_SIZE);
  }
});

test("different ports have different councils", () => {
  const mayors = new Set(cities.map((c) => townCouncil(world, c).mayor));
  assert.ok(mayors.size > 1);
});

test("derechos start at base values: 2% fee, no toll discount, stranger standing", () => {
  const g = newGame(world, "cadiz", { cash: 30000 });
  const hv = hallView(g, "cadiz");
  assert.equal(hv.feePct, 2);
  assert.equal(hv.tollDiscountPct, 0);
  assert.equal(hv.respectId, "stranger");
  assert.equal(hv.respectPts, 0);
  assert.equal(hv.tollDiv, 10);
});

test("port reputation moves the shown fee, respect moves the toll discount", () => {
  const g = newGame(world, "cadiz", { cash: 30000 });
  g.portRep = { cadiz: 80 }; // renowned (portRep is created lazily on first trade)
  assert.equal(hallView(g, "cadiz").feePct, 0.5);
  ensureRep(g).cadiz = 100 * 100; // respect "trusted" (REP_PER_COINS = 100)
  const hv = hallView(g, "cadiz");
  assert.equal(hv.respectId, "trusted");
  assert.equal(hv.tollDiscountPct, 50);
});
