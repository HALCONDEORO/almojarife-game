import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, doBuy, doSail, doGoTo } from "../src/game/game.mjs";
import { BOYCOTT, BLOCKADE, measureOf, boycottOn, blockadeOn, entryBan } from "../src/game/portmeasures.mjs";
import { embargoOn } from "../src/game/embargo.mjs";
import { serialize, deserialize } from "../src/game/gamesave.mjs";
import { voyageCardHtml } from '../src/view/voyagecard.mjs';
const world = loadWorld();
const mk = () => { const game = newGame(world); game.eventsOn = false; const ship = game.ships[0]; ship.at = "cadiz"; ship.voyage = null; return { game, ship }; };
test("no measures: the harbour is open both ways (no navigation blocking exists by default)", () => {
  const { game, ship } = mk();
  assert.equal(measureOf(game, "sevilla"), null); assert.equal(entryBan(game, "sevilla"), null);
  assert.equal(doSail(game, ship, "sevilla").ok, true);
  ship.at = "sevilla"; ship.voyage = null; assert.equal(doSail(game, ship, "cadiz").ok, true);
});
test("boycott: the harbour refuses new arrivals but lets its own ships leave and trade", () => {
  const { game, ship } = mk(); game.measures = { sevilla: BOYCOTT };
  assert.equal(boycottOn(game, "sevilla"), true); assert.equal(blockadeOn(game, "sevilla"), false);
  const arrival = doSail(game, ship, "sevilla"); assert.equal(arrival.ok, false); assert.equal(arrival.reason, "boycott"); assert.equal(ship.voyage, null);
  ship.at = "sevilla"; // already inside when the boycott was declared: not trapped
  assert.equal(doSail(game, ship, "cadiz").ok, true);
  const trader = mk(); trader.game.measures = { cadiz: BOYCOTT }; assert.equal(doBuy(trader.game, trader.ship, "grain", 1).ok, true); // a boycott does not close the market
});
test("blockade: the harbour is sealed both ways and holds the ships inside", () => {
  const { game, ship } = mk(); game.measures = { malaga: BLOCKADE };
  assert.equal(blockadeOn(game, "malaga"), true); assert.equal(entryBan(game, "malaga"), "blockade");
  const arrival = doSail(game, ship, "malaga"); assert.equal(arrival.ok, false); assert.equal(arrival.reason, "blockade");
  ship.at = "malaga"; const departure = doSail(game, ship, "cadiz"); assert.equal(departure.ok, false); assert.equal(departure.reason, "blockade"); // trapped
  game.freeNav = true; const courseChange = doGoTo(game, ship, world.nodes.cadiz.lat, world.nodes.cadiz.lon); assert.equal(courseChange.ok, false); assert.equal(courseChange.reason, "blockade"); // free navigation cannot slip departure either
  const unaffected = mk(); assert.equal(doSail(unaffected.game, unaffected.ship, "malaga").ok, true); // a measure on one port never closes another
});
test("a course change at sea into a closed harbour is refused and the reason stays on the ship", () => {
  const { game, ship } = mk(); game.freeNav = true;
  assert.equal(doSail(game, ship, "lisboa").ok, true); // at sea now, before the measure exists
  game.measures = { lisboa: BOYCOTT };
  const courseChange = doGoTo(game, ship, world.nodes.lisboa.lat, world.nodes.lisboa.lon);
  assert.equal(courseChange.ok, false); assert.equal(courseChange.reason, "boycott"); assert.equal(ship.navError, "boycott");
  assert.equal(ship.voyage.to, "lisboa"); // the old leg still stands: nothing rewrites a voyage silently
});
test("the grain embargo stays a trade refusal, not a harbour ban: separate permissions, not one hostility flag", () => {
  const { game, ship } = mk(); const grain = game.market.cadiz.grain; grain.target = 100; grain.stock = 10;
  assert.equal(embargoOn(game, "cadiz"), true); assert.equal(entryBan(game, "cadiz"), null); // embargoed, harbour open
  assert.equal(doSail(game, ship, "sevilla").ok, true); ship.at = "cadiz"; ship.voyage = null;
  game.measures = { cadiz: BLOCKADE };
  assert.equal(embargoOn(game, "cadiz"), true); assert.equal(doSail(game, ship, "sevilla").reason, "blockade"); // both at once, each on its own rule
  const trader = mk(); trader.game.measures = { cadiz: BOYCOTT }; assert.equal(embargoOn(trader.game, "cadiz"), false); // a boycott never starves the market by itself
});
test("measures survive a save and reload", () => {
  const { game } = mk(); game.measures = { sevilla: BOYCOTT, malaga: BLOCKADE };
  const loaded = deserialize(JSON.parse(JSON.stringify(serialize(game, "T"))), world).g;
  assert.equal(measureOf(loaded, "sevilla"), "boycott"); assert.equal(measureOf(loaded, "malaga"), "blockade");
  const loadedShip = loaded.ships[0]; loadedShip.at = "malaga"; loadedShip.voyage = null;
  assert.equal(doSail(loaded, loadedShip, "cadiz").reason, "blockade");
  assert.equal(doSail(loaded, { ...loadedShip, at: "cadiz" }, "sevilla").reason, "boycott");
});

test('course refusals name boycott and blockade in Spanish and English voyage cards', () => {
  for (const [reason, spanish, english] of [['boycott', 'boicot', 'boycott'], ['blockade', 'bloqueo', 'blockade']]) {
    const { ship } = mk(); ship.navError = reason;
    assert.ok(voyageCardHtml(ship, { lang: 'es' }).includes(spanish));
    assert.ok(voyageCardHtml(ship, { lang: 'en' }).includes(english));
  }
});
