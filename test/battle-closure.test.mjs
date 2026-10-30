// Battle closure (Estudios 8, Marco 30/10, preventive): the encounter report is the one live
// reference to an open battle, and closing it is a one-time, every-path, save-safe operation.
// While a report (or its pending decision) is open the general mode does not resume: no other
// ship rolls encounters and time does not move. After closure the other ships roll again from
// unconsumed ticks, nothing reopens after a save/load, and the winner's property is untouched.
// The resolver's conservation and the single-ship close/dismiss contracts live in
// battle.test.mjs, piratechoice.test.mjs and prizes.test.mjs; this suite adds the fleet-level
// closure contract, nothing duplicated.
import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, doSail, advanceTick } from "../src/game/game.mjs";
import { makeShip } from "../src/sim/trade.mjs";
import { automaticEncounter, resolvePirates, dismissEncounterReport, claimPrize } from "../src/game/encounterdaily.mjs";
import { encounterDialogHtml } from "../src/view/encounterview.mjs";
import { serialize, deserialize } from "../src/game/gamesave.mjs";

const world = loadWorld();
const twoAtSea = (seed = 13) => {
  const gm = newGame(world, "cadiz", { freePlay: true, seed });
  gm.eventsOn = true;
  const first = gm.ships[0];
  const second = makeShip(2, "cog", "cadiz", gm.ships);
  gm.ships.push(second);
  doSail(gm, first, "barcelona");
  doSail(gm, second, "sevilla");
  return { gm, first, second };
};
const scanFor = (gm, ship, fromTick) => { // run the real per-tick rolls until this ship meets pirates
  for (let tk = fromTick; tk < 400000; tk++) {
    gm.tick = tk; gm.day = Math.floor(tk / 240);
    automaticEncounter(gm, ship);
    if (gm.pending?.event === "sea-pirates" && gm.pending.ship === ship.id) return tk;
    if (gm.pending || gm.encounterReport) throw new Error("someone else's event interrupted the scan");
  }
  throw new Error("missing pirates");
};
const wonFight = () => { // classic path (flag off): deterministic scan for a won fight with a prize, as prizes.test.mjs harnesses
  for (let i = 1; i < 200; i++) {
    const gm = newGame(world, "cadiz", { freePlay: true, pirateFight: false });
    gm.eventsOn = true; gm.seed = 0;
    const sh = gm.ships[0];
    doSail(gm, sh, "barcelona");
    gm.pending = { event: "sea-pirates", ship: sh.id, day: gm.day, hour: 0, id: `t:${i}`, escapeChance: 50 };
    const rep = resolvePirates(gm, "fight");
    if (rep.ok !== false && rep.result === "repelled") { gm.eventsOn = false; return { gm, sh, rep }; }
  }
  throw new Error("no won fight found");
};

test("one open battle holds the general mode: the other ship rolls nothing and no tick moves, closure resumes cleanly", () => {
  const { gm, first, second } = twoAtSea();
  const lastTick = scanFor(gm, first, 1);
  assert.equal(automaticEncounter(gm, second), null, "a pending pirate decision holds every other ship's rolls");
  resolvePirates(gm, "fight");
  assert.ok(gm.encounterReport, "the battle's final report is open");
  assert.equal(automaticEncounter(gm, second), null, "an open report holds every other ship's rolls too");
  const frozen = gm.tick;
  advanceTick(gm);
  assert.equal(gm.tick, frozen, "time itself waits while the report is open");
  assert.equal(gm.encounterTicks?.[String(second.id)] ?? null, null, "a held ship never consumes its seeded ticks");
  dismissEncounterReport(gm);
  const next = scanFor(gm, second, lastTick + 1); // after closure the second ship meets its own encounter
  assert.ok(next > lastTick, "the general mode resumes only after closure");
  gm.pending = null; gm.encounterReport = null; // leave the game tidy
});

test("closure is once across every path: claim, dismiss, claim again - only the first lands", () => {
  const { gm, rep } = wonFight();
  const fleet = gm.ships.length;
  const kept = claimPrize(gm, true);
  assert.ok(kept.ok, "the first closure lands");
  assert.equal(gm.ships.length, fleet + 1);
  assert.equal(gm.encounterReport, null);
  assert.equal(dismissEncounterReport(gm), false, "a closed report cannot be dismissed again");
  assert.equal(claimPrize(gm, true).ok, false, "nor claimed again to keep");
  assert.equal(claimPrize(gm, false).ok, false, "nor claimed again to leave");
  assert.equal(gm.ships.length, fleet + 1, "the fleet moved exactly once");
  assert.equal(gm.encounters[0].id, rep.id, "the closed battle stays as history, not as a live reference");
});

test("the winner's property is untouched at closure and the choice is recorded", () => {
  const { gm, sh } = wonFight();
  sh.cargo = { salt: 10 }; sh.basis = { salt: 100 };
  gm.basis = { salt: { qty: 10, cost: 100 } };
  const kept = claimPrize(gm, true);
  assert.ok(kept.ok);
  assert.deepEqual(sh.cargo, { salt: 10 }, "keeping a prize never touches the winner's hold");
  assert.deepEqual(sh.basis, { salt: 100 }, "nor its cost basis");
  assert.deepEqual(gm.basis.salt, { qty: 10, cost: 100 }, "nor the global book");
  assert.equal(gm.encounters[0].prize.taken, true, "the keep is recorded on the history entry");
  const { gm: gm2 } = wonFight();
  const fleet = gm2.ships.length;
  assert.ok(claimPrize(gm2, false).ok);
  assert.equal(gm2.ships.length, fleet, "leaving adds nothing");
  assert.equal(gm2.encounters[0].prize.taken, false, "the leave is recorded too");
});

test("a save/load after closure reopens nothing: the report stays closed and the dialog stays empty", () => {
  const { gm } = wonFight();
  assert.ok(claimPrize(gm, true).ok);
  const restored = deserialize(JSON.parse(JSON.stringify(serialize(gm, "Casa Cierre"))), world).g;
  assert.equal(restored.encounterReport, null, "the report does not come back");
  assert.equal(restored.pending, null, "nor the decision");
  assert.equal(encounterDialogHtml(restored), "", "and the dialog stays closed");
  assert.equal(dismissEncounterReport(restored), false, "there is nothing left to close");
  assert.equal(restored.encounters.length, 1, "only the history entry survives");
});
