// Escorted prizes (Estudios P4, package 17 - own application): a kept prize keeps station with its
// winner through one shared voyage record (escorted / escortedBy). While that binding lives, the
// crewless prize sails in its escort's wake and rolls no encounters of its own - the winner rolls
// for the pair - and the history entry names the fleet ship the prize became, so the transfer
// (selection -> preparation -> application) keeps one identity end to end.
import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, doSail } from "../src/game/game.mjs";
import { automaticEncounter, resolvePirates, claimPrize } from "../src/game/encounterdaily.mjs";
import { rollEvent } from "../src/game/events.mjs";
import { serialize, deserialize } from "../src/game/gamesave.mjs";

const world = loadWorld();

const wonFightWithPrize = () => { // deterministic scan for a won fight with a prize, as prizes.test.mjs harnesses
  for (let attempt = 1; attempt < 200; attempt++) {
    const game = newGame(world, "cadiz", { freePlay: true, pirateFight: false });
    game.eventsOn = true; game.seed = 0;
    const ship = game.ships[0];
    doSail(game, ship, "barcelona");
    game.pending = { event: "sea-pirates", ship: ship.id, day: game.day, hour: 0, id: `t:${attempt}`, escapeChance: 50 };
    const report = resolvePirates(game, "fight");
    if (report.ok !== false && report.result === "repelled") return { game, ship, report };
  }
  throw new Error("no won fight found");
};

test("an escorted prize never rolls its own encounter and never consumes a seeded tick", () => {
  const { game, ship } = wonFightWithPrize();
  const claimed = claimPrize(game, true);
  assert.ok(claimed.ok && claimed.ship?.voyage?.escorted, "the kept prize sails escorted");
  const prize = claimed.ship;
  for (let tick = 1; tick < 50000; tick++) {
    game.tick = tick; game.day = Math.floor(tick / 240);
    assert.equal(automaticEncounter(game, prize), null, "the escorted prize rolls nothing");
    assert.equal(game.encounterTicks?.[String(prize.id)] ?? null, null, "and writes no per-tick roll state");
    if (game.pending) { game.pending = null; break; } // the winner met something: it rolls for the pair
  }
  assert.ok(game.ships.includes(ship) && game.ships.includes(prize), "the pair is intact");
});

test("the winner still rolls while escorting: the pair shares the winner's fate", () => {
  const { game, ship } = wonFightWithPrize();
  assert.ok(claimPrize(game, true).ok);
  let pendingTick = null;
  for (let tick = 1; tick < 400000; tick++) {
    game.tick = tick; game.day = Math.floor(tick / 240);
    automaticEncounter(game, ship);
    if (game.pending) { pendingTick = tick; break; }
  }
  assert.ok(pendingTick !== null, "the escort keeps meeting encounters for the pair");
  assert.equal(game.pending.ship, ship.id);
});

test("the history entry names the ship the prize became, and the link survives a save/load", () => {
  const { game } = wonFightWithPrize();
  const claimed = claimPrize(game, true);
  assert.ok(claimed.ok);
  const entry = game.encounters[0];
  assert.equal(entry.prize.taken, true);
  assert.equal(entry.prize.shipId, claimed.ship.id, "selection, application and history keep one identity");
  assert.ok(game.ships.some((candidate) => candidate.id === entry.prize.shipId), "the recorded ship is in the fleet");
  const restored = deserialize(JSON.parse(JSON.stringify(serialize(game, "Casa Presa"))), world).game ?? deserialize(JSON.parse(JSON.stringify(serialize(game, "Casa Presa"))), world).g;
  const restoredEntry = restored.encounters[0];
  assert.equal(restoredEntry.prize.shipId, claimed.ship.id, "the link persists");
  assert.ok(restored.ships.some((candidate) => candidate.id === restoredEntry.prize.shipId), "and still resolves to a fleet ship");
  assert.equal(restored.ships.find((candidate) => candidate.id === restoredEntry.prize.shipId).voyage.escorted, true, "the binding survives the reload");
});

test("a prize left adrift records no ship identity", () => {
  const { game } = wonFightWithPrize();
  assert.ok(claimPrize(game, false).ok);
  assert.equal(game.encounters[0].prize.taken, false);
  assert.equal(game.encounters[0].prize.shipId, undefined, "no transfer, no identity");
});

test("an escorted prize draws no sea events either: the escort rolls for the pair", () => {
  const { game, ship } = wonFightWithPrize();
  const claimed = claimPrize(game, true);
  assert.ok(claimed.ok);
  const lastDay = game.day + 400;
  for (let day = game.day + 1; day < lastDay; day++) {
    game.day = day;
    const rolled = rollEvent(game);
    if (rolled) { assert.equal(rolled.ship, ship.id, "a sea event always names the escort, never the prize"); game.pending = null; }
    assert.equal(game.pending?.ship === claimed.ship.id, false, "the crewless prize never holds a decision");
  }
});
