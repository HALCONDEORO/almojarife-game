import { readFileSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, doSail, advanceDay, DAILY_HOOKS } from "../src/game/game.mjs";
import { buyLetter } from "../src/game/marque.mjs";
import { targetsFor, attackTrader } from "../src/game/privateering.mjs";
import { installMarqueDaily } from "../src/game/marqueday.mjs";
import { seededWindow } from "../src/game/peace.mjs";
const world = loadWorld(), realms = JSON.parse(readFileSync(new URL("../data/realms.json", import.meta.url), "utf8")), peaces = JSON.parse(readFileSync(new URL("../data/peaces.json", import.meta.url), "utf8"));
/** Castile (Cadiz) letter against Portugal: a dated treaty (Alcaçovas) puts them at peace from 1479 on. */
function setup(peace) {
  const g = newGame(world); g.marque = true; g.peace = peace; g.cash = 50000; g.tick = 5;
  const s = g.ships[0], t = g.ai[0]; t.home = "lisboa"; t.ship.at = "cadiz"; t.ship.voyage = null; t.ship.cargo = { wool: 10 };
  s.at = "cadiz"; s.voyage = null; s.cargo = {}; s.crew = 20;
  assert.ok(buyLetter(g, realms, "cadiz", "portugal").ok); assert.ok(doSail(g, s, "malaga").ok);
  t.ship.voyage = { ...s.voyage }; t.ship.at = s.voyage.from;
  return { g, s };
}
test("peace off: letters work exactly as before, with or without the peaces argument", () => {
  const { g, s } = setup(false);
  assert.equal(targetsFor(g, realms, s).length, 1); assert.equal(targetsFor(g, realms, s, peaces).length, 1);
});
test("peace on: a suspended letter gives no target and no attack; the letter is kept", () => {
  const { g, s } = setup(true);
  assert.equal(targetsFor(g, realms, s, peaces).length, 0);
  const r = attackTrader(g, realms, s.id, 0, peaces); assert.equal(r.ok, false); assert.equal(r.reason, "no target");
  assert.equal(g.letters.length, 1);
  assert.equal(g.ai[0].ship.cargo.wool, 10, "nothing was taken");
});
test("peace on but the pair is not at peace (letter against Granada): still a target", () => {
  const g = newGame(world); g.marque = true; g.peace = true; g.cash = 50000; g.tick = 5; g.startYear = 1480;
  const s = g.ships[0], t = g.ai[0]; t.home = "malaga"; t.ship.at = "cadiz"; t.ship.voyage = null; s.at = "cadiz"; s.voyage = null; s.cargo = {}; s.crew = 20;
  let seed = 1; while (seededWindow(seed, "castile", "granada", 5) || seededWindow(seed, "castile", "granada", 400)) seed++; g.seed = seed;
  assert.ok(buyLetter(g, realms, "cadiz", "granada").ok); assert.ok(doSail(g, s, "malaga").ok); t.ship.voyage = { ...s.voyage }; t.ship.at = s.voyage.from;
  assert.equal(targetsFor(g, realms, s, peaces).length, 1);
});
test("daily hook: none registered means nothing changes; registered, the inbox gets one peace note", () => {
  assert.equal(DAILY_HOOKS.length, 0);
  const g = newGame(world); g.marque = true; g.peace = true; g.cash = 50000; g.startYear = 1480; g.eventsOn = false;
  let found = null; for (let s = 1; s < 400 && !found; s++) { const w = seededWindow(s, "castile", "tlemcen", 700); if (w && w.from > 30) found = { s, w }; }
  assert.ok(found); g.seed = found.s; g.day = found.w.from - 3;
  assert.ok(buyLetter(g, realms, "cadiz", "tlemcen").ok);
  const notes = () => (g.inbox ?? []).filter((m) => m.kind === "info" && m.letter).length;
  advanceDay(g); assert.equal(notes(), 0, "no hook, no note");
  const off = installMarqueDaily(DAILY_HOOKS, realms, peaces);
  for (let i = 0; i < 6; i++) advanceDay(g);
  assert.equal(notes(), 1, "exactly one note");
  off(); assert.equal(DAILY_HOOKS.length, 0);
});
