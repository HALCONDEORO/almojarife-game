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
import { applyEncounter } from "../src/game/encounters.mjs";
import { sailTick } from "../src/sim/trade.mjs";
import { TICKS_PER_DAY } from "../src/sim/clock.mjs";
import { rollEvent, resolveEvent } from "../src/game/events.mjs";
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

test("a delay rolled by the winner holds the pair together: same extra ticks, same arrival tick", () => {
  const { game, ship } = wonFightWithPrize();
  const claimed = claimPrize(game, true);
  assert.ok(claimed.ok && claimed.ship?.voyage?.escorted);
  const prize = claimed.ship;
  const winnerBefore = ship.voyage.ticksLeft;
  const prizeBefore = prize.voyage.ticksLeft;
  assert.equal(winnerBefore, prizeBefore, "the shared voyage starts in sync");
  const storm = { kind: "storm", hullLoss: 5, cargoLossPct: 0, delay: 2, result: "severe" };
  assert.ok(applyEncounter(game, ship, storm).ok);
  assert.equal(ship.voyage.ticksLeft, winnerBefore + 2 * TICKS_PER_DAY, "the winner absorbs the delay");
  assert.equal(prize.voyage.ticksLeft, prizeBefore + 2 * TICKS_PER_DAY, "and the escorted prize keeps station");
  assert.equal(prize.voyage.stormDelayDays, 2, "the delay shows on the prize's voyage too");
  let winnerArrival = null, prizeArrival = null;
  for (let step = 0; step < 60000 && (winnerArrival === null || prizeArrival === null); step++) {
    if (winnerArrival === null && sailTick(ship)) winnerArrival = step;
    if (prizeArrival === null && sailTick(prize)) prizeArrival = step;
  }
  assert.equal(winnerArrival, prizeArrival, "the pair arrives on the same tick");
  assert.ok(winnerArrival !== null, "both legs of the pair do arrive");
  assert.equal(ship.at, prize.at, "same port");
});

test("the shared delay survives save and load mid-voyage, and a docked prize takes nothing", () => {
  const { game, ship } = wonFightWithPrize();
  const claimed = claimPrize(game, true);
  assert.ok(claimed.ok);
  const prize = claimed.ship;
  const delay = { kind: "pirates", hullLoss: 3, cargoLossPct: 0, delay: 1, result: "escaped" };
  assert.ok(applyEncounter(game, ship, delay).ok);
  const loaded = deserialize(serialize(game, "Pareja"), world).g;
  const loadedWinner = loaded.ships.find((mate) => mate.id === ship.id);
  const loadedPrize = loaded.ships.find((mate) => mate.id === prize.id);
  assert.equal(loadedPrize.voyage.ticksLeft, loadedWinner.voyage.ticksLeft, "the pair reloads in sync");
  loadedPrize.voyage = null; // a prize that already arrived (legacy desynced save)
  assert.ok(applyEncounter(loaded, loadedWinner, delay).ok);
  assert.equal(loadedPrize.voyage, null, "the docked prize takes nothing");
});

test("a second prize claim breaks the old pair cleanly: the released prize limps on alone", () => {
  const { game, ship } = wonFightWithPrize();
  const firstClaim = claimPrize(game, true);
  assert.ok(firstClaim.ok && firstClaim.ship?.voyage?.escorted);
  const firstPrize = firstClaim.ship;
  let secondReport = null;
  for (let attempt = 1; attempt < 200 && !secondReport; attempt++) {
    game.pending = { event: "sea-pirates", ship: ship.id, day: game.day, hour: 0, id: `chain:${attempt}`, escapeChance: 50 };
    const report = resolvePirates(game, "fight");
    if (report.ok !== false && report.result === "repelled" && report.prize) secondReport = report;
  }
  assert.ok(secondReport?.prize, "the escorting winner can win a second prize");
  const secondClaim = claimPrize(game, true);
  assert.ok(secondClaim.ok && secondClaim.ship?.voyage?.escorted, "the new prize binds to the winner");
  assert.equal(ship.voyage.escortedBy, secondClaim.ship.id, "the winner escorts the new prize");
  assert.ok(!("escortedBy" in secondClaim.ship.voyage), "the new prize's own voyage carries no stale binding");
  assert.ok(!("escorted" in (firstPrize.voyage ?? {})), "the released prize sails unescorted again");
  assert.equal(firstPrize.voyage.to, ship.voyage.to, "and keeps its original route");
  assert.equal(secondClaim.ship.voyage.ticksLeft, ship.voyage.ticksLeft, "the new pair starts in sync");
});

test("a sea event that shifts the winner's voyage shifts the escorted prize by the same delta", () => {
  const { game, ship } = wonFightWithPrize();
  const claimed = claimPrize(game, true);
  assert.ok(claimed.ok);
  const prize = claimed.ship;
  const wind = {
    id: "test-wind", weight: 1, minDay: 0,
    title: { es: "viento", en: "wind" }, text: { es: "viento", en: "wind" },
    choices: [{ id: "ride", label: { es: "seguir", en: "ride" }, outcomes: [{ p: 1, effects: { days: -1 } }] }],
  };
  game.world = { ...world, events: [...(world.events ?? []), wind] };
  const winnerBefore = ship.voyage.ticksLeft, prizeBefore = prize.voyage.ticksLeft;
  game.pending = { event: "test-wind", ship: ship.id, day: game.day };
  const resolved = resolveEvent(game, "ride");
  assert.ok(resolved.ok && resolved.effects.days === -1, "the wind shortens the winner");
  assert.equal(ship.voyage.ticksLeft, winnerBefore - TICKS_PER_DAY);
  assert.equal(prize.voyage.ticksLeft, prizeBefore - TICKS_PER_DAY, "and the prize keeps station");
  const delays = {
    id: "test-doldrums", weight: 1, minDay: 0,
    title: { es: "calma", en: "calm" }, text: { es: "calma", en: "calm" },
    choices: [{ id: "wait", label: { es: "esperar", en: "wait" }, outcomes: [{ p: 1, effects: { days: 1 } }] }],
  };
  game.world = { ...world, events: [...(world.events ?? []), delays] };
  game.pending = { event: "test-doldrums", ship: ship.id, day: game.day };
  assert.ok(resolveEvent(game, "wait").ok);
  assert.equal(ship.voyage.ticksLeft, winnerBefore, "a headwind then cancels the favour");
  assert.equal(prize.voyage.ticksLeft, prizeBefore, "on both legs of the pair");
});
