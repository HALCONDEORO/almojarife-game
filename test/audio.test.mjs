// Sound: CC0 Kenney effects, muted from Ajustes, silent when Audio is unavailable.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
const main = readFileSync("web/main.mjs", "utf8") + readFileSync("src/view/settingsview.mjs", "utf8"), mod = readFileSync("web/audio.mjs", "utf8"), credits = readFileSync("CREDITS.md", "utf8");
test("the five effect files ship with their CC0 license copies", () => {
  for (const f of ["buy", "sell", "click", "confirm", "error", "sail", "arrive", "open", "close", "storm", "pirates", "mission", "council", "festival", "build", "alert"]) assert.ok(existsSync(`web/audio/${f}.ogg`), f);
  for (const l of ["LICENSE-casino-audio.txt", "LICENSE-interface-sounds.txt", "LICENSE-100-cc0-sfx.txt", "LICENSE-opengameart-sources.txt"]) assert.match(readFileSync(`web/audio/${l}`, "utf8"), /CC0/i);
});
test("sfx is gated by the sound setting and never throws without Audio", () => {
  assert.match(mod, /localStorage\.getItem\("sound"\) !== "0"/);
  assert.match(mod, /\.catch\(\(\) => \{\}\)/); // blocked autoplay stays silent
});
test("Ajustes has the sound toggle and credits name Kenney", () => {
  assert.match(main, /id="st-sound"/);
  assert.match(main, /stSound: "Sonido"/); assert.match(main, /stSound: "Sound"/);
  assert.match(main, /credKenney/); assert.match(credits, /Kenney.*CC0/s); assert.match(credits, /rubberduck.*CC0/s); assert.match(credits, /kindland.*CC0/s); assert.match(credits, /RandomMind.*CC0/s); assert.match(credits, /InspectorJ.*CC BY 3.0/s); assert.match(credits, /jan125.*CC BY 4.0/s);
});
test("sailing, arrivals and window open/close play their effects", () => {
  assert.match(main, /if \(s0\.voyage\) sfx\("sail"\)/);
  assert.match(main, /sfx\("arrive"\); \/\/ pause when your ship arrives/);
  assert.match(main, /if\(w\.hidden\)sfx\("open"\)/);
  assert.match(main, /if\(!w\.hidden\)sfx\("close"\)/);
  assert.match(main, /if \(!swWasOpen\) sfx\("open"\)/); // ship window: only on appearance, not per re-render
});
test("fresh events play their stinger once, at most one per render", () => {
  assert.match(main, /const MSG_SFX = \{ mission: "mission", council: "council", alert: "alert", warn: "alert", restart: "build", halt: "build" \};/);
  assert.match(main, /function msgSfx\(msg\)/); // "info" messages told apart by their text
  assert.match(main, /if \(s\) \{ sfx\(s\); break; \}/); // one stinger per pass
  assert.match(main, /if \(lastMsgId < 0\) lastMsgId = box\[0\]\?\.id \?\? 0;/); // no burst on page load
  assert.match(main, /g\?\.pending\?\.event === "sea-pirates"/); // pirate drums when the encounter opens
});
test("ambience follows the context and music rotates, both behind the same setting", () => {
  for (const f of ["amb-sea", "amb-port", "music-water", "music-village", "music-tavern"]) assert.ok(existsSync(`web/audio/${f}.ogg`), f);
  assert.match(mod, /export function syncAmbience\(name\)/);
  assert.match(mod, /export function syncMusic\(\)/);
  assert.match(mod, /if \(!soundOn\(\)\) name = null;/); // ambience stops when muted
  assert.match(mod, /AMBIENCE\[name\].*loop = true/s);
  assert.match(mod, /duckLoops\(\);/); // stingers duck the loops
  assert.match(main, /syncAmbience\(/); // wired from render
});
test("gull cries only under the port ambience, behind the same setting", () => {
  for (const f of ["gull1", "gull2"]) assert.ok(existsSync(`web/audio/${f}.ogg`), f);
  assert.match(mod, /if \(amb\.name === "port" && soundOn\(\)\)/); // cries only in port with sound on
  assert.match(mod, /if \(name === "port"\) gullsStart\(\); else gullsStop\(\);/);
  assert.match(credits, /rango-mango.*CC0/s);
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

test("rejected orders play the error effect and tab strips click", () => {
  assert.match(main, /const r = fn\(\);\n  if \(r && r\.ok === false\) sfx\("error"\)/); // every {ok:false} action answers, centrally
  assert.match(main, /if \(tab !== e\.dataset\.tab\) sfx\("click"\)/); // city panel tabs, silent on the active one
  assert.match(main, /if \(shipWin\.tab !== e\.dataset\.swtab\) sfx\("click"\)/); // ship window tabs, same guard
});
