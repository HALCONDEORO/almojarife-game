// Menu music: Dowland (CC0), loops softly on the title screen, respects the Ajustes
// sound switch, is credited in the game window and CREDITS.md, and never throws without Audio.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, statSync } from "node:fs";
import { menuMusic } from "../web/music.mjs";

const main = readFileSync("web/main.mjs", "utf8"), mod = readFileSync("web/music.mjs", "utf8"), credits = readFileSync("CREDITS.md", "utf8"), prov = readFileSync("web/audio/MUSIC-dowland.md", "utf8");

test("the music file ships with provenance, licence and credits", () => {
  assert.ok(existsSync("web/audio/menu-dowland.ogg"));
  const sz = statSync("web/audio/menu-dowland.ogg").size;
  assert.ok(sz > 100000 && sz < 2500000, `reasonable size: ${sz}`);
  assert.match(prov, /CC0/); assert.match(prov, /opengameart\.org/); assert.match(prov, /Dowland/); assert.match(prov, /Of Far Different Nature/);
  assert.match(credits, /menu-dowland\.ogg.*Dowland.*CC0/s);
});

test("the ogg is a real Vorbis stream", () => {
  const buf = readFileSync("web/audio/menu-dowland.ogg");
  assert.equal(buf.subarray(0, 4).toString("latin1"), "OggS");
  assert.ok(buf.includes(Buffer.from("vorbis", "latin1")));
});

test("the controller respects soundOn(), only plays on the title and never throws without Audio", () => {
  globalThis.localStorage = { getItem: () => null, setItem: () => {} }; // sound on by default
  const m = menuMusic({ auto: false, document: null });
  m.showTitle(); // no Audio in node: silently no-op
  assert.equal(m.playing, false);
  m.leaveTitle(); m.sync();
  assert.match(mod, /soundOn\(\)/);
  assert.match(mod, /VOLUME = 0\.[12]/); // soft
});

test("wiring: title shows start the music, starting or loading a game stops it, credits show the line", () => {
  assert.match(main, /import \{ menuMusic \} from "\.\/music\.mjs"/);
  assert.match(main, /const music = menuMusic\(\)/);
  assert.match(main, /music\.showTitle\(\)/);
  assert.ok((main.match(/music\.leaveTitle\(\)/g) ?? []).length >= 4, "every path into the game stops the music");
  assert.match(main, /credMusic:/);
  assert.match(main, /\$\{line\("credMusic"\)\}/);
});

test("the in-game rotation stops at the title menu and resumes after", async () => {
  const made = [];
  globalThis.localStorage = { getItem: () => null, setItem: () => {} }; // sound on
  globalThis.Audio = class { constructor(src) { this.src = src; this.paused = true; made.push(this); } play() { this.paused = false; return Promise.resolve(); } pause() { this.paused = true; } };
  try {
    const a = await import("../web/audio.mjs");
    a.setMenuMode(false); a.syncMusic();
    assert.ok(made.length >= 1 && !made.at(-1).paused, "rotation plays in game");
    a.setMenuMode(true); // quit to title (via music.showTitle)
    assert.ok(made.at(-1).paused, "rotation stops at the title menu");
    a.syncMusic();
    assert.ok(made.at(-1).paused, "syncMusic stays silent while the menu is up");
    a.setMenuMode(false); a.syncMusic();
    assert.ok(!made.at(-1).paused, "rotation resumes when the game starts again");
  } finally { delete globalThis.Audio; }
});
