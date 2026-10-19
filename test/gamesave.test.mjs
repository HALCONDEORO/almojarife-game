import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildWorld } from "../src/sim/world.mjs";
import { newGame, advanceDay, doBuy } from "../src/game/game.mjs";
import { serialize, deserialize, migrate, cleanCompany, SAVE_VERSION } from "../src/game/gamesave.mjs";

const world = buildWorld(JSON.parse(fs.readFileSync(new URL("../data/world.json", import.meta.url))));
const play = (g, n) => { for (let i = 0; i < n; i++) advanceDay(g); };

test("save and load gives the same game, and it keeps evolving the same way", () => {
  const a = newGame(world); doBuy(a, a.ships[0], "grain", 10); play(a, 12);
  const raw = JSON.stringify(serialize(a, "Casa Prueba"));
  const { g: b, company } = deserialize(JSON.parse(raw), world);
  assert.equal(company, "Casa Prueba");
  assert.deepEqual(b, a);
  play(a, 9); play(b, 9);
  assert.deepEqual(b, a);
});
test("the save has a version and does not include the world", () => {
  const s = serialize(newGame(world), "X");
  assert.equal(s.version, SAVE_VERSION); assert.equal(s.state.world, undefined);
});
test("bad or newer saves are refused", () => {
  assert.throws(() => migrate(null)); assert.throws(() => migrate({ version: SAVE_VERSION + 1 }));
  assert.throws(() => deserialize({ version: SAVE_VERSION, state: { cash: 1 } }, world));
});
test("company name is cleaned and limited", () => {
  assert.equal(cleanCompany("  <b>Casa</b> \n"), "bCasa/b");
  assert.equal(cleanCompany("x".repeat(80)).length, 30);
  assert.equal(cleanCompany(undefined), "");
});
