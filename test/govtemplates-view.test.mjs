import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, buyWarehouse } from "../src/game/game.mjs";
import { hireGovernor } from "../src/game/governor.mjs";
import { setStewardRule } from "../src/game/steward.mjs";
import { saveGovTemplate, applyGovTemplate } from "../src/game/govtemplates.mjs";
import { serialize, deserialize } from "../src/game/gamesave.mjs";
import { esc } from "../src/view/esc.mjs";
const world = loadWorld();
const main = readFileSync(new URL("../web/main.mjs", import.meta.url), "utf8");
const ATTACK = '<img src=x onerror=window.tplProbe=1>';
const unesc = (raw) => raw.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&");

test("the template option is built with escaped value and text (no raw interpolation)", () => {
  assert.match(main, /<option value="\$\{esc\(tplName\)\}">\$\{esc\(tplName\)\}<\/option>/);
});

test("an attacking template name escapes to inert text and round-trips literally", () => {
  const escaped = esc(ATTACK);
  assert.ok(!escaped.includes("<") && !escaped.includes(">"), "no markup brackets survive");
  assert.ok(!escaped.includes("<img"), "no img tag can form");
  assert.equal(unesc(escaped), ATTACK); // the name is preserved literally, just inert
});

test("a markup name is stored and loaded verbatim, so the escaped render is the only sink needed", () => {
  const game = newGame(world); game.eventsOn = false; game.cash = 50000;
  buyWarehouse(game, "cadiz");
  hireGovernor(game, "cadiz", 2);
  setStewardRule(game, "cadiz", "grain", { buyBelow: 5, buyTo: 20 });
  assert.equal(saveGovTemplate(game, "cadiz", ATTACK).ok, true);
  const { g: round } = deserialize(serialize(game, "Prueba"), world);
  assert.ok(Object.prototype.hasOwnProperty.call(round.govTemplates, ATTACK)); // verbatim key survives the save round trip
  assert.equal(applyGovTemplate(round, "cadiz", ATTACK, 100).ok, true);
});
