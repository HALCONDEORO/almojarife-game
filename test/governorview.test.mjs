import test from "node:test";
import assert from "node:assert/strict";
import { tavernGovernorHtml } from "../src/view/governorview.mjs";
import { hireGovernor, governorDay } from "../src/game/governor.mjs";

test("the tavern section asks for a warehouse, offers the level 1 hire and shows the governor on duty", () => {
  const game = { cash: 500, day: 3, warehouses: {}, world: { nodes: {} } };
  assert.match(tavernGovernorHtml(game, "cadiz", "es"), /almacén propio/);
  assert.match(tavernGovernorHtml(game, "cadiz", "en"), /your own warehouse/);
  game.warehouses.cadiz = { goods: {} };
  const offer = tavernGovernorHtml(game, "cadiz", "es");
  assert.match(offer, /Contratar gobernador/);
  assert.match(offer, /Nivel 1/);
  assert.match(offer, /data-governor-hire="1"/);
  game.cash = 50; // below the fee: the button is disabled
  assert.match(tavernGovernorHtml(game, "cadiz", "es"), /data-governor-hire="1" disabled/);
  game.cash = 500;
  hireGovernor(game, "cadiz", 1);
  const hired = tavernGovernorHtml(game, "cadiz", "es");
  assert.match(hired, /En el cargo/);
  assert.match(hired, /data-governor-dismiss/);
  assert.doesNotMatch(hired, /data-governor-hire/);
  game.cash = 0;
  governorDay(game, "cadiz"); // suspends
  assert.match(tavernGovernorHtml(game, "cadiz", "es"), /Suspendido por impago/);
  assert.match(tavernGovernorHtml(game, "cadiz", "en"), /Suspended for lack of pay/);
});
