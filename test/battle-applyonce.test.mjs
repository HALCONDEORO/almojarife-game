// Battle close-out (Estudios P4, packages 15-16 - own application): a battle report closes exactly
// once. applyBattle moves hull, crew, gun wear and loot onto the ships; a second application of the
// same report would stack the wear and the damage, so it is rejected before touching anything.
// The both-sunk close-out is checked end to end through a real licensed attack.
import { readFileSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, doSail } from "../src/game/game.mjs";
import { buyLetter } from "../src/game/marque.mjs";
import { attackTrader } from "../src/game/privateering.mjs";
import { resolveBattle, applyBattle, GUN_WEAR_PER_ROUND } from "../src/game/battle.mjs";

const world = loadWorld();
const realms = JSON.parse(readFileSync(new URL("../data/realms.json", import.meta.url), "utf8"));

const armedShip = (id, cargo = {}) => ({ id, type: "cog", hull: 100, crew: 20, weapons: { cannon: 2 }, gunCond: 100, captain: { defence: 1 }, gear: 1, cargo });

test("a report applies exactly once: the replay is rejected and nothing stacks", () => {
  const attacker = armedShip(1), defender = armedShip(2, { grain: 10, salt: 6 });
  const report = resolveBattle(attacker, defender, [0.9, 0.8, 0.7, 0.6]);
  const destroyed = applyBattle(attacker, defender, report);
  assert.equal(report.applied, true, "the first application closes the report");
  const snapshot = JSON.stringify({ attacker, defender });
  assert.throws(() => applyBattle(attacker, defender, report), /already applied/);
  assert.equal(JSON.stringify({ attacker, defender }), snapshot, "the rejected replay moves nothing: no extra wear, damage or loot");
  assert.equal(attacker.gunCond, 100 - GUN_WEAR_PER_ROUND * report.rounds, "guns wore exactly once");
  assert.equal(destroyed >= 0, true);
});

test("a fresh report on the same ships still applies: the guard is per report, not per pair", () => {
  const attacker = armedShip(1), defender = armedShip(2);
  applyBattle(attacker, defender, resolveBattle(attacker, defender, [0.1, 0.2, 0.3, 0.4]));
  const second = resolveBattle(attacker, defender, [0.4, 0.3, 0.2, 0.1]);
  applyBattle(attacker, defender, second); // must not throw
  assert.equal(second.applied, true);
});

test("both-sunk close-out: the fleet loses its ship, the game ends, the trader starts again from home", () => {
  const game = newGame(world); game.marque = true; game.cash = 50000; game.tick = 5;
  const ship = game.ships[0], trader = game.ai[0];
  trader.home = "lisboa"; trader.ship.at = "cadiz"; trader.ship.voyage = null; trader.ship.cargo = { wool: 5 };
  ship.at = "cadiz"; ship.voyage = null; ship.cargo = {}; ship.crew = 20; ship.weapons = { cannon: 2 };
  const sailed = doSail(game, ship, "malaga"); assert.ok(sailed.ok);
  trader.ship.voyage = { ...ship.voyage, ticksLeft: ship.voyage.ticksLeft }; trader.ship.at = ship.voyage.from;
  trader.ship.weapons = { cannon: 2 }; trader.ship.crew = 20;
  ship.hull = 1; trader.ship.hull = 1; // one round at even odds sinks both
  buyLetter(game, realms, "cadiz", "portugal");
  const victim = trader.ship;
  const result = attackTrader(game, realms, ship.id, 0);
  assert.equal(result.ok, true);
  assert.equal(result.report.result, "both-sunk", JSON.stringify(result.report));
  assert.equal(game.ships.includes(ship), false, "the sunk attacker leaves the fleet");
  assert.equal(game.over, "lose");
  assert.equal(game.overReason, "fleet-lost");
  assert.notEqual(trader.ship, victim, "the trader starts again on a fresh hull");
  assert.equal(trader.ship.at, "lisboa", "from home");
  assert.equal(trader.ship.voyage ?? null, null, "with no voyage");
  assert.equal(attackTrader(game, realms, ship.id, 0).ok ?? false, false, "no replay after the close-out");
});
