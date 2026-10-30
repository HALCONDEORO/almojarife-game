import test from "node:test";
import assert from "node:assert/strict";
import { pirateShip, fightPirates } from "../src/game/piratefight.mjs";
import { MAX_CANNONS, WEAPON_TYPES } from "../src/game/crew.mjs";

const SEED = 42, FLEET = 300;
const ship = () => ({ id: "me", owner: "player", type: "cog", hull: 100, weapons: { cannon: 6 }, gunCond: 100, captain: { defence: 1 }, crew: 12, cargo: { wool: 10 } });

test("the seeded fleet is reproducible and plays by the player's rules", () => {
  const types = { barca: 0, cog: 0, caravel: 0 };
  let weak = 0;
  for (let e = 0; e < FLEET; e++) {
    const p = pirateShip(SEED, `e${e}`);
    types[p.type]++;
    if (p.weak) weak++;
    const entries = Object.entries(p.weapons);
    if (p.weak) {
      assert.equal(entries.length, 0, `weak pirate e${e} carries guns`);
      assert.equal(p.captain.defence, 0, `weak pirate e${e} has a defence skill`);
    } else {
      assert.equal(entries.length, 1, `armed pirate e${e} mounts exactly one weapon type`);
      const [wt, guns] = entries[0];
      assert.ok(Object.hasOwn(WEAPON_TYPES, wt), `pirate e${e} mounts an unknown weapon ${wt}`);
      assert.ok(guns >= 1, `armed pirate e${e} has no guns`);
      assert.ok(guns <= MAX_CANNONS[p.type], `pirate e${e} mounts ${guns} guns above the ${p.type} cap ${MAX_CANNONS[p.type]}`);
      assert.ok(p.captain.defence >= 1 && p.captain.defence <= 3, `pirate e${e} defence out of range`);
    }
    assert.equal(p.owner, "pirates");
    assert.equal(p.hull, 100);
  }
  assert.deepEqual(types, { barca: 187, cog: 90, caravel: 23 }, "the 60/30/10 type mix drifted");
  assert.equal(weak, 43, "the 17% share of poorly armed raiders drifted");
});

test("the same seed and encounter rebuild the identical pirate after a save/reload", () => {
  assert.deepEqual(pirateShip(7, "x9"), pirateShip(7, "x9"));
  assert.deepEqual(fightPirates(ship(), SEED, "f0"), fightPirates(ship(), SEED, "f0"));
});

test("a repelled attack costs no cargo and no day, and pays a prize in the old value band", () => {
  const r = fightPirates(ship(), SEED, "f0");
  assert.deepEqual(r.outcome, { kind: "pirates", result: "repelled", hullLoss: 5, cargoLossPct: 0, delay: 0 });
  assert.deepEqual(r.prize, { type: "cog", hull: 68 }, "the prize leaves the 30-69% hull band of the old prize roll");
});

test("a lost fight costs 20% of the cargo and one day, and pays no prize", () => {
  const r = fightPirates(ship(), SEED, "f1");
  assert.deepEqual(r.outcome, { kind: "pirates", result: "raided", hullLoss: 3, cargoLossPct: 20, delay: 1 });
  assert.equal(r.prize, null);
});

test("across 300 encounters: prizes only on a win, in band, of the pirate's own type", () => {
  for (let e = 0; e < FLEET; e++) {
    const r = fightPirates(ship(), SEED, `e${e}`);
    assert.ok(r.outcome.result === "repelled" || r.outcome.result === "raided");
    assert.ok(r.outcome.hullLoss >= 0 && r.outcome.hullLoss <= 100);
    if (r.outcome.result === "repelled") {
      assert.ok(r.prize, `repelled e${e} paid no prize`);
      assert.equal(r.prize.type, pirateShip(SEED, `e${e}`).type, `prize of e${e} is not the pirate's ship`);
      assert.ok(r.prize.hull >= 30 && r.prize.hull <= 69, `prize of e${e} out of the 30-69% band`);
      assert.equal(r.outcome.cargoLossPct, 0);
      assert.equal(r.outcome.delay, 0);
    } else {
      assert.equal(r.prize, null, `raided e${e} paid a prize`);
      assert.equal(r.outcome.cargoLossPct, 20);
      assert.equal(r.outcome.delay, 1);
    }
  }
});

test("a convoy escort counts like captain defence, whole levels of 6 points, never below the captain's own skill", () => {
  assert.equal(fightPirates(ship(), SEED, "s9", 0).outcome.result, "raided");
  assert.equal(fightPirates(ship(), SEED, "s9", 18).outcome.result, "repelled", "an 18-point escort must flip this fight");
  assert.deepEqual(fightPirates(ship(), SEED, "s9", 6), fightPirates(ship(), SEED, "s9", 0), "6 escort points below the captain's own defence 1 change nothing");
});

test("the resolver reads a copy: the player's real ship is never mutated", () => {
  const s = ship();
  const before = JSON.parse(JSON.stringify(s));
  fightPirates(s, SEED, "f1", 12);
  assert.deepEqual(s, before);
});
