import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { cleanCompany } from "../src/game/gamesave.mjs";

const main = readFileSync("web/main.mjs", "utf8");

// A name is unusable when nothing is left after cleaning: empty, only spaces, or only stripped characters.
test("blank merchant or house names are detected after cleaning", () => {
  assert.equal(cleanCompany(""), "");
  assert.equal(cleanCompany("   "), "");
  assert.equal(cleanCompany(" \t "), "");
  assert.equal(cleanCompany("<>&\""), ""); // stripped characters leave nothing usable
  assert.equal(cleanCompany("  Ana  "), "Ana"); // a real name trims and stays
  assert.equal(cleanCompany(" Casa  Azor "), "Casa  Azor"); // inner spacing untouched
});

test("the founding wizard blocks Start until both names are filled, with a message and focus", () => {
  assert.match(main, /id="p-name-err" role="alert"/); // an inline alert near the start button
  assert.match(main, /if \(!cleanCompany\(pf\.character\)\) \{ \$\("p-name-err"\)\.textContent = t\.characterBad; \$\("p-ch"\)\.focus\(\); return; \}/);
  assert.match(main, /if \(!cleanCompany\(pf\.company\)\) \{ \$\("p-name-err"\)\.textContent = t\.companyBad; \$\("p-co"\)\.focus\(\); return; \}/);
  const sdCheck = main.indexOf('if (sd === null) { $("p-seed-err")');
  const nameCheck = main.indexOf("if (!cleanCompany(pf.character))");
  const launch = main.indexOf("const launch = () =>");
  assert.ok(sdCheck !== -1 && nameCheck > sdCheck && launch > nameCheck); // validation runs before launch
});

test("the name error strings exist in both languages", () => {
  assert.match(main, /companyBad: "Ponle un nombre a tu casa mercantil\."/);
  assert.match(main, /characterBad: "Escribe tu nombre de mercader\."/);
  assert.match(main, /companyBad: "Name your trading house\."/);
  assert.match(main, /characterBad: "Enter your merchant's name\."/);
});
