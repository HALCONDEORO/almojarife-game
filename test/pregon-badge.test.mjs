// 0020: the pregón badge shows the live shortage (vigencia) and the missing units (cantidad),
// derived from the same scarcity the concejo cries about - no state of its own.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildWorld } from "../src/sim/world.mjs";
import { newGame } from "../src/game/game.mjs";
import { arrivalPregon, pregonMissing, PREGON_CRIT } from "../src/game/pregon.mjs";

const world = buildWorld(JSON.parse(fs.readFileSync(new URL("../data/world.json", import.meta.url))));

test("pregonMissing: only critical scarcity, and the units to the normal level", () => {
  assert.equal(pregonMissing({ stock: 50, target: 180 }), 130); // ratio 3.6
  assert.equal(pregonMissing({ stock: 90, target: 180 }), 90); // exactly PREGON_CRIT
  assert.equal(pregonMissing({ stock: 91, target: 180 }), 0); // just below
  assert.equal(pregonMissing({ stock: 200, target: 180 }), 0); // surplus
  assert.equal(pregonMissing(null), 0);
  assert.ok(PREGON_CRIT === 2);
});

test("the cried good is exactly the badge good: one source of truth", () => {
  const g = newGame(world, "cadiz", { cash: 30000 });
  for (const e of Object.values(g.market.cadiz)) e.stock = e.target; // calm
  g.market.cadiz.grain.stock = 10; // critical
  const p = arrivalPregon(g, "cadiz");
  assert.equal(p?.good, "grain");
  assert.ok(pregonMissing(g.market.cadiz.grain) > 0);
  for (const [k, e] of Object.entries(g.market.cadiz)) if (k !== "grain") assert.equal(pregonMissing(e), 0);
  // the day the market recovers, the badge lapses: that is the vigencia
  g.market.cadiz.grain.stock = g.market.cadiz.grain.target;
  assert.equal(pregonMissing(g.market.cadiz.grain), 0);
});

test("the web wires the badge into the market rows, with its own strings and style", () => {
  const main = fs.readFileSync(new URL("../web/main.mjs", import.meta.url), "utf8");
  assert.ok(main.includes("pregonMissing(g.market[s.at][gd])"), "badge computed per row");
  assert.ok(main.includes('class="pregon-badge"'), "badge rendered");
  assert.ok(main.includes("const PRG = {"), "strings outside the T lines");
  const css = fs.readFileSync(new URL("../web/ui2d.css", import.meta.url), "utf8");
  assert.ok(css.includes(".pregon-badge"), "badge styled");
});
