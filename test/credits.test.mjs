import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { titleBookHtml, TB } from "../web/titlebook.mjs";

const main = readFileSync("web/main.mjs", "utf8");

test("credits entry exists in the pause menu and the title book", () => {
  assert.match(main, /id="m-cred"/);
  assert.match(main, /\$\("t-cred"\)\.onclick/);
  assert.ok(TB.es.credits && TB.en.credits);
  for (const lang of ["es", "en"]) assert.match(titleBookHtml({ lang, saved: null, backup: null, dayLabel: "", coinsLabel: "" }), /id="t-cred"/);
});

test("credits window names every external source with its licence", () => {
  for (const k of ["cred", "credGame", "credOwn", "credNE", "credPop", "credOsm", "credGen", "credThree"]) {
    assert.match(main, new RegExp(`${k}: "`), k);
  }
  for (const name of ["Natural Earth", "Bairoch", "OpenStreetMap", "gen-city", "three.js", "CC BY 4.0", "MIT", "ODbL"]) {
    assert.ok(main.includes(name), name);
  }
  assert.match(main, /function showCredits\(\)/);
  assert.match(main, /\$\("cred-back"\)\.onclick/);
});
