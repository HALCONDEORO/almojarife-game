import test from 'node:test';
import assert from 'node:assert/strict';
import {
  WEAPON_TYPES, MAX_CANNONS, CREW, crewLimits, crewOf, weaponsOf, weaponCount,
  maxCannons, weaponWeight, GEAR, GEAR_MAX, gearOf, gearWeight, loadWeight,
  gunCond, armoryLevels, armoryPrice, ARMORY_DISCOUNT_PER_LEVEL, mountWeapon,
} from '../src/sim/armament.mjs';

test('crewLimits falls back to cog for unknown ship types', () => {
  assert.equal(crewLimits({ type: 'barca' }), CREW.barca);
  assert.equal(crewLimits({ type: 'ufo' }), CREW.cog);
  assert.equal(crewLimits({}), CREW.cog);
});

test('crewOf clamps to 0..max and defaults non-integers to opt', () => {
  assert.equal(crewOf({ type: 'barca', crew: 99 }), CREW.barca.max);
  assert.equal(crewOf({ type: 'barca', crew: -4 }), 0);
  assert.equal(crewOf({ type: 'cog', crew: 2.5 }), CREW.cog.opt);
  assert.equal(crewOf({ type: 'cog' }), CREW.cog.opt);
});

test('weaponsOf drops invalid entries and folds legacy cannons into cannon', () => {
  const ship = { weapons: { cannon: 2, trebuchet: 1, ballista: -1, catapult: 1.5 }, cannons: 3 };
  assert.deepEqual(weaponsOf(ship), { cannon: 5 });
  assert.equal(weaponCount(ship), 5);
  assert.deepEqual(weaponsOf({}), {});
  assert.equal(weaponCount({ cannons: 0 }), 0);
});

test('maxCannons and weaponWeight follow the tables', () => {
  assert.equal(maxCannons({ type: 'nao' }), MAX_CANNONS.nao);
  assert.equal(maxCannons({ type: 'ufo' }), 0);
  const ship = { weapons: { ballista: 1, bombard: 2 } };
  assert.equal(weaponWeight(ship), WEAPON_TYPES.ballista.weight + 2 * WEAPON_TYPES.bombard.weight);
});

test('gearOf clamps to 0..GEAR_MAX and defaults invalid values to 0', () => {
  assert.equal(gearOf({ gear: 2 }), 2);
  assert.equal(gearOf({ gear: 99 }), GEAR_MAX);
  assert.equal(gearOf({ gear: -1 }), 0);
  assert.equal(gearOf({ gear: 'x' }), 0);
  assert.equal(gearOf({}), 0);
});

test('gearWeight is per sailor aboard, rounded up, and GEAR prices stay ascending', () => {
  assert.equal(gearWeight({ type: 'barca', crew: 8, gear: 1 }), Math.ceil(8 * 0.1 * 1 - 1e-9));
  assert.equal(gearWeight({ type: 'barca', crew: 8, gear: 0 }), 0);
  for (let l = 1; l < GEAR.length; l++) assert.ok(GEAR[l] > GEAR[l - 1]);
});

test('loadWeight adds weapon and gear weight', () => {
  const ship = { type: 'barca', crew: 5, weapons: { ballista: 1 }, gear: 2 };
  assert.equal(loadWeight(ship), weaponWeight(ship) + gearWeight(ship));
});

test('gunCond clamps to 0..100 and defaults to 100', () => {
  assert.equal(gunCond({}), 100);
  assert.equal(gunCond({ gunCond: 250 }), 100);
  assert.equal(gunCond({ gunCond: -5 }), 0);
  assert.equal(gunCond({ gunCond: 42 }), 42);
});

test('armoryLevels sums only active armory levels, capped at 3, and armoryPrice applies the discount', () => {
  const g = { buildings: { lisboa: [{ state: 'active', type: 'armory', level: 2 }, { state: 'active', type: 'armory', level: 2 }, { state: 'ruined', type: 'armory', level: 3 }, { state: 'active', type: 'kiln', level: 3 }] } };
  assert.equal(armoryLevels(g, 'lisboa'), 3); // 2+2 capped at 3, ruined and non-armory ignored
  assert.equal(armoryLevels(g, 'porto'), 0);
  assert.equal(armoryLevels(undefined, 'porto'), 0);
  assert.equal(armoryPrice(g, 'lisboa', 100), Math.round(100 * (1 - ARMORY_DISCOUNT_PER_LEVEL * 3)));
  assert.equal(armoryPrice(g, 'porto', 100), 100);
});

test('mountWeapon keeps the legacy cannons field while only cannons are mounted', () => {
  const ship = { cannons: 1 };
  mountWeapon(ship, 'cannon');
  assert.equal(ship.cannons, 2);
  assert.equal(ship.weapons, undefined);
  assert.equal(weaponCount(ship), 2);
});

test('mountWeapon switches to the weapons object for other types and zeroes legacy', () => {
  const ship = { cannons: 2 };
  mountWeapon(ship, 'ballista');
  assert.equal(ship.cannons, 0);
  assert.deepEqual(ship.weapons, { cannon: 2, ballista: 1 });
  assert.equal(weaponCount(ship), 3);
});

test('mountWeapon blends gunCond as a count-weighted average with a like-new piece', () => {
  const ship = { weapons: { cannon: 3 }, gunCond: 50 };
  mountWeapon(ship, 'cannon');
  assert.equal(ship.gunCond, (50 * 3 + 100) / 4);
});
