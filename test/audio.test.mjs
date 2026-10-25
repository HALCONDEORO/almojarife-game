// Sound: CC0 Kenney effects, muted from Ajustes, silent when Audio is unavailable.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
const main = readFileSync("web/main.mjs", "utf8"), mod = readFileSync("web/audio.mjs", "utf8"), credits = readFileSync("CREDITS.md", "utf8");
test("the five effect files ship with their CC0 license copies", () => {
  for (const f of ["buy", "sell", "click", "confirm", "error", "sail", "arrive", "open", "close", "storm", "pirates", "mission", "council", "festival", "build", "alert"]) assert.ok(existsSync(`web/audio/${f}.ogg`), f);
  for (const l of ["LICENSE-casino-audio.txt", "LICENSE-interface-sounds.txt"]) assert.match(readFileSync(`web/audio/${l}`, "utf8"), /CC0/i);
});
test("sfx is gated by the sound setting and never throws without Audio", () => {
  assert.match(mod, /localStorage\.getItem\("sound"\) !== "0"/);
  assert.match(mod, /\.catch\(\(\) => \{\}\)/); // blocked autoplay stays silent
});
test("Ajustes has the sound toggle and credits name Kenney", () => {
  assert.match(main, /id="st-sound"/);
  assert.match(main, /stSound: "Sonido"/); assert.match(main, /stSound: "Sound"/);
  assert.match(main, /credKenney/); assert.match(credits, /Kenney.*CC0/s); assert.match(credits, /rubberduck.*CC0/s); assert.match(credits, /kindland.*CC0/s); assert.match(credits, /RandomMind.*CC0/s);
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
test("buy and sell buttons play their effect, failures play error", () => {
  assert.match(main, /sfx\(r\.ok \? "buy" : "error"\)/);
  assert.match(main, /sfx\(r\.ok \? "sell" : "error"\)/);
});
