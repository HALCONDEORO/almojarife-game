import test from "node:test";
import assert from "node:assert/strict";
import { transferCrew } from "../src/game/crew.mjs";
import { CREW, crewOf } from "../src/sim/armament.mjs";

const gameStub = () => ({ over: false, cash: 500 });
const shipStub = (type, crew, at) => ({ type, crew, at });

test("sailors move between two ships docked in the same port, free of charge", () => {
  const game = gameStub(), origin = shipStub("cog", 18, "cadiz"), target = shipStub("barca", 2, "cadiz");
  const result = transferCrew(game, origin, target, 5);
  assert.equal(result.ok, true);
  assert.equal(result.requested, 5);
  assert.equal(result.moved, 5);
  assert.equal(result.from, 13);
  assert.equal(result.to, 7);
  assert.equal(game.cash, 500); // already hired: no fee and no refund
});

test("a request larger than the destination room moves only what fits", () => {
  const game = gameStub(), origin = shipStub("cog", 18, "cadiz"), target = shipStub("barca", CREW.barca.max - 2, "cadiz");
  const result = transferCrew(game, origin, target, 5);
  assert.equal(result.ok, true);
  assert.equal(result.moved, 2);
  assert.equal(crewOf(target), CREW.barca.max);
  assert.equal(result.from, 16); // the remainder stays on the origin
});

test("empty origin and full destination are refused with their own reason", () => {
  const game = gameStub();
  const empty = shipStub("cog", 0, "cadiz"), full = shipStub("barca", CREW.barca.max, "cadiz"), spare = shipStub("nao", 10, "cadiz");
  assert.equal(transferCrew(game, empty, spare, 1).reason, "no sailors");
  assert.equal(transferCrew(game, spare, full, 1).reason, "no room");
});

test("both ships must be docked in the same port and not at sea", () => {
  const game = gameStub(), here = shipStub("cog", 18, "cadiz"), elsewhere = shipStub("barca", 5, "lisboa"), sailing = shipStub("barca", 5, "cadiz");
  sailing.voyage = { from: "cadiz", to: "lisboa" };
  assert.equal(transferCrew(game, here, elsewhere, 1).reason, "not together");
  assert.equal(transferCrew(game, here, sailing, 1).reason, "at sea");
  assert.equal(transferCrew(game, sailing, here, 1).reason, "at sea");
  assert.equal(transferCrew(game, here, here, 1).reason, "bad ship");
});

test("zero, negative and fractional amounts are rejected deliberately", () => {
  const game = gameStub(), origin = shipStub("cog", 18, "cadiz"), target = shipStub("barca", 2, "cadiz");
  assert.equal(transferCrew(game, origin, target, 0).reason, "bad amount");
  assert.equal(transferCrew(game, origin, target, -3).reason, "bad amount");
  assert.equal(transferCrew(game, origin, target, Number.NaN).reason, "bad amount");
  const moved = transferCrew(game, origin, target, 2.9); // fractions floor to whole sailors
  assert.equal(moved.ok, true);
  assert.equal(moved.moved, 2);
});

test("a finished game moves nobody", () => {
  const game = gameStub(), origin = shipStub("cog", 18, "cadiz"), target = shipStub("barca", 2, "cadiz");
  game.over = true;
  assert.equal(transferCrew(game, origin, target, 1).reason, "game over");
});

test("stripping a ship below its minimum is allowed: sailing checks the crew, not the transfer", () => {
  const game = gameStub(), origin = shipStub("cog", CREW.cog.min, "cadiz"), target = shipStub("nao", 10, "cadiz");
  const result = transferCrew(game, origin, target, CREW.cog.min);
  assert.equal(result.ok, true);
  assert.equal(result.from, 0);
});
