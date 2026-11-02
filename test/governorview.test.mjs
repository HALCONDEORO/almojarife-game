import test from "node:test";
import assert from "node:assert/strict";
import { tavernGovernorHtml } from "../src/view/governorview.mjs";
import { hireGovernor, upgradeGovernor, governorDay } from "../src/game/governor.mjs";

test("the tavern section asks for a warehouse, offers the level 1 hire and shows the governor on duty", () => {
  const game = { cash: 500, day: 3, warehouses: {}, world: { nodes: {} } };
  assert.match(tavernGovernorHtml(game, "cadiz", "es"), /almacén propio/);
  assert.match(tavernGovernorHtml(game, "cadiz", "en"), /your own warehouse/);
  game.warehouses.cadiz = { goods: {} };
  const offer = tavernGovernorHtml(game, "cadiz", "es");
  assert.match(offer, /Contratar gobernador/);
  assert.match(offer, /Nivel 1/);
  assert.match(offer, /data-governor-hire="1"/);
  assert.match(offer, /data-governor-hire="2"/); // level 2 is offered too
  assert.match(offer, /plantillas/);
  game.cash = 50; // below the fee: the button is disabled
  assert.match(tavernGovernorHtml(game, "cadiz", "es"), /data-governor-hire="1" disabled/);
  game.cash = 500;
  hireGovernor(game, "cadiz", 1);
  const hired = tavernGovernorHtml(game, "cadiz", "es");
  assert.match(hired, /En el cargo/);
  assert.match(hired, /data-governor-dismiss/);
  assert.doesNotMatch(hired, /data-governor-hire/);
  assert.match(hired, /data-governor-upgrade="2"/); // a level 1 governor can be promoted
  upgradeGovernor(game, "cadiz", 2);
  const promoted = tavernGovernorHtml(game, "cadiz", "es");
  assert.match(promoted, /Nivel 2/);
  assert.doesNotMatch(promoted, /data-governor-upgrade/); // level 3 is not for sale yet: no promotion offer
  assert.match(promoted, /llega después/); // only the note that it comes later
  assert.doesNotMatch(promoted, /data-governor-hire/);
  game.cash = 0;
  governorDay(game, "cadiz"); // suspends
  assert.match(tavernGovernorHtml(game, "cadiz", "es"), /Suspendido por impago/);
  assert.match(tavernGovernorHtml(game, "cadiz", "en"), /Suspended for lack of pay/);
});
