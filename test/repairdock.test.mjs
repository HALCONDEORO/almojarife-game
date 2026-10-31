import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, orderRepair, repairOf } from "../src/game/game.mjs";
import { repairGuns } from "../src/game/crew.mjs";
const mkGame = () => { const game = newGame(loadWorld()), ship = game.ships[0]; ship.hull = 50; game.cash = 100000; return { game, ship }; };
test("a repair order from another port fails and changes nothing", () => {
  const { game, ship } = mkGame(), cash = game.cash, res = orderRepair(game, [ship.id], ship.at === "lisboa" ? "cadiz" : "lisboa");
  assert.equal(res.ok, false); assert.equal(res.reason, "not in this port"); assert.equal(ship.hull, 50); assert.equal(game.cash, cash);
  assert.equal(repairOf(game, ship.id), null);
});
test("a repair order in the port where the ship is docked works", () => {
  const { game, ship } = mkGame(); assert.equal(orderRepair(game, [ship.id], ship.at).ok, true); assert.ok(repairOf(game, ship.id));
});
test("gun repair follows the same port rule", () => {
  const { game, ship } = mkGame(); ship.gunCond = 40; ship.weapons = { cannon: 1 };
  assert.equal(repairGuns(game, ship, "elsewhere").reason, "not in this port");
});
