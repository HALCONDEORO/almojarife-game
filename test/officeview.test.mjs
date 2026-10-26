import test from "node:test";
import assert from "node:assert/strict";
import { houseHtml } from "../src/view/rankview.mjs";
import { newGame } from "../src/game/game.mjs";
import { loadWorld } from "../src/sim/world.mjs";
const fmt = (n) => String(n);
test("Oficina view: progress bar, 7 rank steps, perk cards, both languages", () => {
  const g = newGame(loadWorld());
  for (const l of ["es", "en"]) {
    const h = houseHtml(g, l, 2300, fmt, (c) => c);
    assert.ok(h.includes('role="progressbar"') && h.includes('aria-valuenow="77"'));
    assert.equal((h.match(/<li class=/g) || []).length, 7);
    assert.ok(h.includes('aria-current="step"') && h.includes("of-perks"));
  }
});
