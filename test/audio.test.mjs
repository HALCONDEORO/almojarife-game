// Sound: CC0 Kenney effects, muted from Ajustes, silent when Audio is unavailable.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
const main = readFileSync("web/main.mjs", "utf8"), mod = readFileSync("web/audio.mjs", "utf8"), credits = readFileSync("CREDITS.md", "utf8");
test("the five effect files ship with their CC0 license copies", () => {
  for (const f of ["buy", "sell", "click", "confirm", "error"]) assert.ok(existsSync(`web/audio/${f}.ogg`), f);
  for (const l of ["LICENSE-casino-audio.txt", "LICENSE-interface-sounds.txt"]) assert.match(readFileSync(`web/audio/${l}`, "utf8"), /CC0/i);
});
test("sfx is gated by the sound setting and never throws without Audio", () => {
  assert.match(mod, /localStorage\.getItem\("sound"\) !== "0"/);
  assert.match(mod, /\.catch\(\(\) => \{\}\)/); // blocked autoplay stays silent
});
test("Ajustes has the sound toggle and credits name Kenney", () => {
  assert.match(main, /id="st-sound"/);
  assert.match(main, /stSound: "Sonido"/); assert.match(main, /stSound: "Sound"/);
  assert.match(main, /credKenney/); assert.match(credits, /Kenney.*CC0/s);
});
test("buy and sell buttons play their effect, failures play error", () => {
  assert.match(main, /sfx\(r\.ok \? "buy" : "error"\)/);
  assert.match(main, /sfx\(r\.ok \? "sell" : "error"\)/);
});

test("Spanish sound labels are unique and never replaced by English entries", () => {
  const es = main.slice(main.indexOf('  es: {'), main.indexOf('  en: {'));
  assert.equal((es.match(/\bstSound\s*:/g) || []).length, 1);
  assert.equal((es.match(/\bcredKenney\s*:/g) || []).length, 1);
  assert.match(es, /stSound:\s*"Sonido"/);
  assert.match(es, /credKenney:\s*"Sonidos:/);
  assert.doesNotMatch(es, /stSound:\s*"Sound"|credKenney:\s*"Sound:/);
});

test("English sound labels are present exactly once", () => {
 const en = main.slice(main.indexOf('  en: {'), main.indexOf('let lang ='));
 assert.equal((en.match(/\bstSound\s*:/g)||[]).length,1);
 assert.equal((en.match(/\bcredKenney\s*:/g)||[]).length,1);
 assert.match(en,/stSound:\s*"Sound"/);
});
