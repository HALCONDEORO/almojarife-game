import test from "node:test";
import assert from "node:assert/strict";
import { defaultProfile, cleanProfile, crestSvg, portraitSvg, startBonus, PALETTE, DIVISIONS, CHARGES, SHIELDS, PORTRAITS } from "../src/game/profile.mjs";

test("a bad profile is cleaned to safe values", () => {
  const p = cleanProfile({ company: "<x>Casa", character: "A".repeat(99), portrait: 99, crest: { shield: "nope", division: "x", charge: "y", c1: "javascript:", c2: "#fff" }, home: "mars", background: "king" }, ["cadiz", "lisboa"]);
  assert.equal(p.company, "xCasa"); assert.equal(p.character.length, 30); assert.equal(p.portrait, 0);
  assert.deepEqual(p.crest, defaultProfile().crest); assert.equal(p.home, "cadiz"); assert.equal(p.background, "merchant");
});
test("a good profile is kept", () => {
  const p = { company: "Casa Luna", character: "Ana", portrait: 5, crest: { shield: "round", division: "cross", charge: "anchor", c1: PALETTE[1], c2: PALETTE[2] }, home: "lisboa", background: "seafarer" };
  assert.deepEqual(cleanProfile(p, ["cadiz", "lisboa"]), p);
});
test("every crest combination makes a well-formed svg without scripts", () => {
  for (const shield of SHIELDS) for (const division of DIVISIONS) for (const charge of CHARGES) {
    const s = crestSvg({ shield, division, charge, c1: PALETTE[0], c2: PALETTE[3] }, 40, "t");
    assert.ok(s.startsWith("<svg") && s.endsWith("</svg>")); assert.ok(!/script|onload|javascript/i.test(s));
    assert.equal((s.match(/<g[ >]/g) ?? []).length, (s.match(/<\/g>/g) ?? []).length);
  }
});
test("every portrait is different and valid", () => {
  const all = Array.from({ length: PORTRAITS }, (_, i) => portraitSvg(i));
  assert.equal(new Set(all).size, PORTRAITS); all.forEach((s) => assert.ok(s.startsWith("<svg") && s.endsWith("</svg>")));
});
test("backgrounds give a small, bounded start bonus", () => {
  for (const b of ["merchant", "seafarer", "scholar"]) { const x = startBonus({ background: b }); assert.ok(x.cash >= 0 && x.cash <= 500 && x.upkeepMul >= 0.8 && x.upkeepMul <= 1); }
});
import fs from "node:fs";
import { buildWorld } from "../src/sim/world.mjs";
import { newGame, advanceDay } from "../src/game/game.mjs";
import { serialize, deserialize } from "../src/game/gamesave.mjs";
const world = buildWorld(JSON.parse(fs.readFileSync(new URL("../data/world.json", import.meta.url))));
test("background changes the start and the profile survives a save", () => {
  const prof = cleanProfile({ company: "Casa", character: "Ana", background: "seafarer", home: "lisboa" }, world.cities.map((c) => c.id));
  const g = newGame(world, prof.home, { ...startBonus(prof), profile: prof });
  assert.equal(g.ships[0].at, "lisboa"); assert.equal(g.upkeepMul, 0.85);
  const plain = newGame(world); advanceDay(g); advanceDay(plain);
  assert.ok(g.cash > plain.cash - 1, "cheaper upkeep");
  const { g: back } = deserialize(JSON.parse(JSON.stringify(serialize(g, "Casa"))), world);
  assert.deepEqual(back.profile, prof);
});
