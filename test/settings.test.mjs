import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const main = readFileSync("web/main.mjs", "utf8");
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
