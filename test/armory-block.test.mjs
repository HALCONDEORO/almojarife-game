// 0019 (H13): an armory purchase that cannot happen says why — the block check is exported
// for the UI, and the ship window disables the button with the reason as its tooltip.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildWorld } from "../src/sim/world.mjs";
import { newGame } from "../src/game/game.mjs";
import { armoryBlock, buyWeapon, buyGear, gearNextWeight } from "../src/sim/armory.mjs";
import { SHIP_TYPES } from "../src/sim/trade.mjs";
import { WEAPON_TYPES } from "../src/sim/armament.mjs";
import { SW } from "../src/view/shipwindow.mjs";

const world = buildWorld(JSON.parse(fs.readFileSync(new URL("../data/world.json", import.meta.url))));

test("armoryBlock names the hold-full case the engine already rejected silently", () => {
  const g = newGame(world, "cadiz");
  const s = g.ships[0];
  const cap = SHIP_TYPES[s.type].capacity;
  assert.equal(armoryBlock(g, s, 1, 0, 1e9), null, "empty hold, rich buyer: no block");
  s.cargo = { grain: cap }; // full to the brim
  assert.equal(armoryBlock(g, s, WEAPON_TYPES.cannon.weight, 0, 1e9), "hold full");
  const r = buyWeapon(g, s, "cannon");
  assert.equal(r.ok, false);
  assert.equal(r.reason, "hold full", "the engine's reason is the one the UI shows");
});

test("gearNextWeight matches what buyGear would load, so the UI pre-check agrees with the click", () => {
  const g = newGame(world, "cadiz");
  const s = g.ships[0];
  const cap = SHIP_TYPES[s.type].capacity;
  s.cargo = { grain: cap };
  const r = buyGear(g, s);
  assert.equal(r.ok, false);
  assert.equal(r.reason, armoryBlock(g, s, gearNextWeight(s), 0, 1e9) ?? "hold full");
});

test("every block reason has a translated line in both locales", () => {
  for (const reason of ["game over", "at sea", "no cash", "hold full", "full", "max level"]) {
    assert.ok(SW.es.armWhy[reason], `es: ${reason}`);
    assert.ok(SW.en.armWhy[reason], `en: ${reason}`);
  }
});

test("the ship window disables the button with the reason as tooltip and the click surfaces it", () => {
  const sw = fs.readFileSync(new URL("../src/view/shipwindow.mjs", import.meta.url), "utf8");
  assert.ok(sw.includes("armoryBlock(g, s, W.weight, p, g.cash)"), "weapon button pre-check");
  assert.ok(sw.includes("armoryBlock(g, s, gearNextWeight(s, gl), gp, g.cash)"), "gear button pre-check");
  assert.ok(sw.includes('title="${t.armWhy[why] ?? why}"'), "weapon tooltip");
  assert.ok(sw.includes('title="${t.armWhy[gwhy] ?? gwhy}"'), "gear tooltip");
  const main = fs.readFileSync(new URL("../web/main.mjs", import.meta.url), "utf8");
  assert.ok(main.includes("armFailNote(r.reason)"), "failed click names the cause");
  assert.ok(main.includes('import { shipWindowHtml, SW }'), "strings imported");
});
