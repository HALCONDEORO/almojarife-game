// Original preventive contracts: cargo-only plunder is not a ship capture, and
// the attack's persisted tick guard covers cargo, court effects and messages together.
// Existing battle/prize suites cover resolver conservation and captured-hull readiness.
import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadWorld } from '../src/sim/world.mjs';
import { newGame, doSail } from '../src/game/game.mjs';
import { buyLetter } from '../src/game/marque.mjs';
import { attackTrader } from '../src/game/privateering.mjs';
import { setJusticeData, PIRACY_REP_HIT } from '../src/game/justicewire.mjs';
import { portRep } from '../src/game/reputation.mjs';
import { shipCapacity, cargoUsed } from '../src/sim/trade.mjs';
import { serialize, deserialize } from '../src/game/gamesave.mjs';

const world = loadWorld();
const realms = JSON.parse(readFileSync(new URL('../data/realms.json', import.meta.url), 'utf8'));
const courts = JSON.parse(readFileSync(new URL('../data/courts.json', import.meta.url), 'utf8'));
afterEach(() => setJusticeData(null));

function plunder(licensed) {
  setJusticeData(realms, courts);
  const game = newGame(world);
  game.marque = true;
  game.justice = true;
  game.cash = 50000;
  game.seed = 1;
  game.tick = 5;
  const attacker = game.ships[0], trader = game.ai[0];
  attacker.at = 'cadiz';
  attacker.voyage = null;
  attacker.cargo = { salt: 50 };
  attacker.crew = 20;
  attacker.weapons = { bombarda: 3 };
  attacker.gunCond = 100;
  attacker.captain = { defence: 3 };
  assert.ok(doSail(game, attacker, 'malaga').ok, 'the attacker has a real voyage');
  trader.home = 'lisboa';
  trader.ship.at = 'cadiz';
  trader.ship.voyage = { ...attacker.voyage };
  trader.ship.cargo = { wool: 30, fish: 30 };
  trader.ship.crew = 3;
  trader.ship.weapons = {};
  trader.ship.cannons = 0;
  trader.ship.owner = 'trader-fixture';
  if (licensed) assert.ok(buyLetter(game, realms, 'cadiz', 'portugal').ok, 'letter issued');
  return { game, attacker, trader };
}

const attack = (game, shipId) => attackTrader(game, realms, shipId, 0, {}, { unlicensed: true });

test('cargo-only plunder keeps the living trader and its owner; loot fits actual remaining capacity', () => {
  const { game, attacker, trader } = plunder(true);
  const victim = trader.ship, victimId = victim.id, fleetIds = game.ships.map(ship => ship.id);
  const held = cargoUsed(attacker), room = shipCapacity(attacker) - held;
  const victimCargo = cargoUsed(victim);
  const result = attack(game, attacker.id);
  assert.ok(result.ok, 'attack accepted');
  assert.equal(result.report.result, 'plundered', 'fixture must exercise plunder, not a loss or sinking');
  assert.equal(result.report.captured, false, 'cargo plunder is not capture');
  const taken = Object.values(result.report.loot).reduce((sum, count) => sum + count, 0);
  const taxed = Object.values(result.quinto).reduce((sum, count) => sum + count, 0);
  assert.ok(taken > 0 && taken <= room, 'nonempty loot fits the hold before tax');
  assert.equal(cargoUsed(attacker), held + taken - taxed, 'only retained loot enters the hold');
  assert.equal(cargoUsed(victim), victimCargo - taken, 'the victim loses exactly that loot');
  assert.equal(trader.ship, victim, 'the surviving trader is not replaced');
  assert.equal(victim.id, victimId, 'the ship identity stays with the trader');
  assert.equal(victim.owner, 'trader-fixture', 'plunder does not transfer ownership');
  assert.deepEqual(game.ships.map(ship => ship.id), fleetIds, 'no captured hull joins the player fleet');
});

for (const licensed of [true, false]) {
  test(`${licensed ? 'licensed' : 'unlicensed'} plunder: same-tick replay changes nothing, including after reload`, () => {
    const { game, attacker } = plunder(licensed);
    const reputationBefore = portRep(game, 'lisboa');
    const first = attack(game, attacker.id);
    assert.ok(first.ok, 'first attack lands');
    assert.equal(first.report.result, 'plundered', 'fixture must win with cargo');
    assert.ok(Object.keys(first.kept).length > 0, 'the replay guard protects actual loot');
    assert.equal((game.charges ?? []).length, licensed ? 0 : 1, 'only unlicensed loot creates one charge');
    assert.equal(portRep(game, 'lisboa'), reputationBefore - (licensed ? 0 : PIRACY_REP_HIT), 'one reputation effect');
    const settled = JSON.stringify(game);
    assert.equal(attack(game, attacker.id).reason, 'already fought', 'same tick cannot be fought twice');
    assert.equal(JSON.stringify(game), settled, 'replay changes no cargo, crew, lot, charge, reputation, inbox or clock');
    const loaded = deserialize(serialize(game, 'Plunder contract'), world).g;
    assert.equal(loaded.attackTicks[`${attacker.id}:0`], game.tick, 'the guard survives the real save/load');
    const saved = JSON.stringify(loaded);
    assert.equal(attack(loaded, attacker.id).reason, 'already fought', 'reload cannot reroll the same attack');
    assert.equal(JSON.stringify(loaded), saved, 'reloaded rejection changes no game state');
  });
}
