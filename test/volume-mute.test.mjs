import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const store = new Map();
globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
const { volOf, setVolume, toggleSound, soundOn, VOL_KINDS } = await import("../web/audio.mjs");
import { settingsHtml } from "../src/view/settingsview.mjs";

test("volume defaults to full and is clamped to 0..100", () => {
  store.clear();
  for (const k of VOL_KINDS) assert.equal(volOf(k), 1);
  setVolume("music", 35); assert.equal(volOf("music"), 0.35);
  setVolume("music", 400); assert.equal(volOf("music"), 1);
  setVolume("music", -5); assert.equal(volOf("music"), 0);
  setVolume("sfx", "abc"); assert.equal(volOf("sfx"), 0);
  store.set("vol-amb", "junk"); assert.equal(volOf("amb"), 1);
});

test("an unknown channel is ignored and channels are independent", () => {
  store.clear();
  setVolume("bogus", 10); assert.equal(store.size, 0);
  setVolume("sfx", 20); assert.equal(volOf("music"), 1); assert.equal(volOf("amb"), 1);
});

test("M toggles the same setting the Sound checkbox uses", () => {
  store.clear();
  assert.equal(soundOn(), true);
  assert.equal(toggleSound(), false); assert.equal(store.get("sound"), "0"); assert.equal(soundOn(), false);
  assert.equal(toggleSound(), true); assert.equal(store.get("sound"), "1");
});

test("Ajustes shows one slider per channel with the stored value", () => {
  const t = new Proxy({}, { get: (_, k) => `<${String(k)}>` });
  const h = settingsHtml(t, { lang: "es", speed: 1, automaticTime: true, sound: true, vol: { sfx: 40, music: 70, amb: 100 }, inGame: true });
  for (const [id, v] of [["st-vol-sfx", 40], ["st-vol-music", 70], ["st-vol-amb", 100]]) assert.match(h, new RegExp(`id="${id}" type="range" min="0" max="100" step="5" value="${v}"`));
  assert.match(h, /<stSoundKey>/);
});

test("main wires sliders, the M key (not while typing) and both shortcut lines", () => {
  const main = readFileSync("web/main.mjs", "utf8");
  assert.match(main, /e\.key\.toLowerCase\(\) !== "m"/);
  assert.match(main, /closest\?\.\("select,input,textarea,\[contenteditable\]"\)/);
  assert.match(main, /setVolume\(k, r\.value\)/);
  assert.match(main, /Esc: cerrar menú · Espacio: pausa · M: sonido/);
  assert.match(main, /Esc: close menu · Space: pause · M: sound/);
  const audio = readFileSync("web/audio.mjs", "utf8");
  for (const k of ['volOf("sfx")', 'volOf("music")', 'volOf("amb")']) assert.ok(audio.includes(k), k);
});
