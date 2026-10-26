import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { settingsHtml } from "../src/view/settingsview.mjs";

const main = readFileSync("web/main.mjs", "utf8");
const menu = main.slice(main.indexOf("function showMenu()"), main.indexOf("function showSlots()"));
const tt = new Proxy({}, { get: (_, k) => `<${String(k)}>` });
const st = { lang: "es", speed: 1, automaticTime: true, sound: true, large: false, reduceMotion: false, inGame: true };

test("each control has one home: the pause menu keeps flow actions, Ajustes keeps preferences", () => {
  for (const id of ["m-res", "m-save", "m-slots", "m-set", "m-cred", "m-quit"]) assert.match(menu, new RegExp(`id="${id}"`), id);
  for (const id of ["m-lang", "m-spd", "m-auto-time", "m-exp"]) assert.doesNotMatch(menu, new RegExp(id), `${id} moved to Ajustes`);
  const h = settingsHtml(tt, st);
  for (const id of ["st-lang", "st-spd", "st-auto", "st-sound", "st-text", "st-motion", "st-exp"]) assert.match(h, new RegExp(`id="${id}"`), id);
});

test("Save now and Credits appear once across the pause menu and Ajustes", () => {
  const h = settingsHtml(tt, st);
  assert.doesNotMatch(h, /id="st-save"/); assert.doesNotMatch(h, /id="st-cred"/);
  assert.doesNotMatch(main, /\$\("st-save"\)|\$\("st-cred"\)/);
  assert.equal((menu.match(/id="m-save"/g) || []).length, 1);
});

test("the shortcuts line is shown once, in Ajustes Help, not in the pause menu", () => {
  assert.doesNotMatch(menu, /t\.keys/);
  assert.match(settingsHtml(tt, st), /<keys>/);
});
