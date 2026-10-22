import { readFileSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame } from "../src/game/game.mjs";
import { buyLetter } from "../src/game/marque.mjs";
import { atPeace, treatyPeace, seededWindow, suspended, usableLetter, coveredNow, peaceNews, validatePeaces, pairKey, PEACE_CHANCE, PEACE_MIN_DAYS, PEACE_SPAN_DAYS } from "../src/game/peace.mjs";
const world = loadWorld(), realms = JSON.parse(readFileSync(new URL("../data/realms.json", import.meta.url), "utf8")), peaces = JSON.parse(readFileSync(new URL("../data/peaces.json", import.meta.url), "utf8"));
const mk = (o = {}) => { const g = newGame(world); g.cash = 50000; g.marque = o.marque ?? true; g.peace = o.peace ?? true; g.seed = o.seed ?? 3; return g; };
test("shipped peace data is valid", () => assert.deepEqual(validatePeaces(peaces, realms), []));
test("dated treaty: Alcaçovas 1479 makes Castile and Portugal peaceful, either order", () => {
  assert.ok(treatyPeace(peaces, "castile", "portugal", 1480)); assert.ok(treatyPeace(peaces, "portugal", "castile", 1480));
  assert.equal(treatyPeace(peaces, "castile", "portugal", 1478), null); assert.equal(treatyPeace(peaces, "castile", "granada", 1480), null);
});
test("flag off, same realm, same monarch: no peace", () => {
  assert.equal(atPeace(mk({ peace: false }), realms, peaces, "castile", "portugal").peace, false);
  const g = mk(); assert.equal(atPeace(g, realms, peaces, "castile", "castile").peace, false); assert.equal(atPeace(g, realms, peaces, "castile", "aragon").peace, false);
});
test("seeded peaces: pure, reproducible, correct length, roughly the configured share", () => {
  assert.deepEqual(seededWindow(5, "castile", "granada", 4000), seededWindow(5, "granada", "castile", 4000));
  let hit = 0, n = 0;
  for (let seed = 1; seed <= 200; seed++) for (const day of [3000, 9000, 15000]) { n++; const w = seededWindow(seed, "castile", "tlemcen", day); if (w) { hit++; assert.ok(w.until - w.from >= PEACE_MIN_DAYS && w.until - w.from <= PEACE_MIN_DAYS + PEACE_SPAN_DAYS); assert.ok(day >= w.from && day < w.until); } }
  const share = hit / n; assert.ok(share > 0.1 && share < 0.55, "share at peace " + share + " vs chance " + PEACE_CHANCE);
});
test("a peace suspends the letter, the letter stays held, and it works again after the peace", () => {
  const g = mk(); g.day = 365 * 6; // find a seed and day where castile-tlemcen are at peace
  let found = null; for (let s = 1; s < 300 && !found; s++) { const w = seededWindow(s, "castile", "tlemcen", 0 + 6 * 365 + 5); if (w) found = { s, w }; }
  assert.ok(found); g.seed = found.s; g.day = Math.max(0, found.w.from - 10);
  assert.equal(atPeace(g, realms, peaces, "castile", "tlemcen").peace, false);
  const b = buyLetter(g, realms, "cadiz", "tlemcen"); assert.ok(b.ok);
  assert.ok(coveredNow(g, realms, peaces, "tlemcen"), "valid before the peace");
  g.day = found.w.from + 1; assert.equal(atPeace(g, realms, peaces, "castile", "tlemcen").peace, true);
  assert.ok(suspended(g, realms, peaces, b.letter)); assert.equal(usableLetter(g, realms, peaces, "tlemcen"), null);
  assert.equal(g.letters.length, 1, "the letter is kept");
  g.day = found.w.until + 1; if (g.day < b.letter.until) assert.ok(coveredNow(g, realms, peaces, "tlemcen") === !atPeace(g, realms, peaces, "castile", "tlemcen").peace);
});
test("the inbox hears about a peace once, only for letters the player holds", () => {
  const g = mk(); let found = null; for (let s = 1; s < 300 && !found; s++) { const w = seededWindow(s, "castile", "tlemcen", 400); if (w && w.from > 10) found = { s, w }; }
  assert.ok(found, "some seed has a peace window"); g.seed = found.s; g.day = found.w.from - 5;
  assert.deepEqual(peaceNews(g, realms, peaces), [], "no letter, no news");
  assert.ok(buyLetter(g, realms, "cadiz", "tlemcen").ok); assert.deepEqual(peaceNews(g, realms, peaces), []);
  g.day = found.w.from; assert.equal(peaceNews(g, realms, peaces).length, 1); assert.equal(peaceNews(g, realms, peaces).length, 0, "once");
  const off = mk({ peace: false }); assert.deepEqual(peaceNews(off, realms, peaces), []);
});
test("flag off: nothing is created on the game", () => {
  const g = mk({ marque: false, peace: false }), s = JSON.stringify(g); atPeace(g, realms, peaces, "castile", "tlemcen"); peaceNews(g, realms, peaces); usableLetter(g, realms, peaces, "tlemcen"); assert.equal(JSON.stringify(g), s);
});
