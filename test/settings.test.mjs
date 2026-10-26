import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const main = readFileSync("web/main.mjs", "utf8") + readFileSync("src/view/settingsview.mjs", "utf8");
const html = readFileSync("web/index.html", "utf8");

test("settings window is reachable from the pause menu and wires every control", () => {
  assert.match(main, /id="m-set"/);
  assert.match(main, /function showSettings\(\)/);
  for (const id of ["st-lang", "st-spd", "st-auto", "st-text", "st-motion", "st-back"]) assert.match(main, new RegExp(`id="${id}"`), id);
  for (const k of ["stTitle", "stText", "stNormal", "stLarge", "stMotion", "stNote"]) assert.match(main, new RegExp(`${k}: "`), k);
});

test("display settings persist and apply at boot", () => {
  assert.match(main, /localStorage\.setItem\("text-size",/);
  assert.match(main, /localStorage\.setItem\("reduce-motion",/);
  assert.match(main, /classList\.toggle\("text-large", localStorage\.getItem\("text-size"\)/);
  assert.match(main, /classList\.toggle\("reduce-motion", localStorage\.getItem\("reduce-motion"\)/);
  assert.match(html, /body\.text-large\{zoom:1\.12\}/);
  assert.match(html, /body\.reduce-motion[^}]*transition:none/);
});

test("speed persists to localStorage and is read back at boot", () => {
  assert.match(main, /localStorage\.setItem\("speed", String\(speed\)\)/);
  assert.match(main, /\+localStorage\.getItem\("speed"\) \|\| 1/);
});

import { settingsHtml, HELP_URL } from "../src/view/settingsview.mjs";
import { SETTINGS_ICONS } from "../src/view/settingsicons.mjs";
import { existsSync } from "node:fs";

const tt = new Proxy({}, { get: (_, k) => `<${String(k)}>` });
const state = { lang: "es", speed: 2, automaticTime: true, sound: true, large: false, reduceMotion: false, inGame: true };

test("settings window has the five sections, each with a pictogram", () => {
  const h = settingsHtml(tt, state);
  assert.equal((h.match(/class="st-sec"/g) || []).length, 5);
  assert.equal((h.match(/class="st-ico"/g) || []).length, 5);
  for (const k of ["stSecLang", "stSecGame", "stSecAccess", "stSecData", "stSecHelp"]) assert.match(h, new RegExp(`<${k}>`));
});

test("data buttons only show inside a running game", () => {
  assert.match(settingsHtml(tt, state), /id="st-exp"/);
  assert.doesNotMatch(settingsHtml(tt, { ...state, inGame: false }), /id="st-exp"/);
});

test("help link points at the in-repo wiki folder and that folder exists", () => {
  assert.equal(HELP_URL, "https://github.com/HALCONDEORO/almojarife-game/tree/main/docs/wiki");
  assert.ok(existsSync("docs/wiki/README.md"));
  assert.match(settingsHtml(tt, state), new RegExp(`href="${HELP_URL}"`));
});

test("every pictogram is credited in CREDITS.md and in both Credits windows", () => {
  const credits = readFileSync("CREDITS.md", "utf8");
  for (const i of Object.values(SETTINGS_ICONS)) {
    assert.ok(i.d.length > 100);
    assert.ok(credits.includes(i.name), i.name);
    assert.ok(credits.includes(i.author), i.author);
  }
  assert.match(credits, /CC BY 3\.0/);
  assert.equal((main.match(/credIcons: "/g) || []).length, 2);
});
