import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseSeed } from "../src/view/seedinput.mjs";

const main = readFileSync("web/main.mjs", "utf8");

test("parseSeed accepts blank and uint32 digits, rejects anything else", () => {
  assert.equal(parseSeed(""), undefined);
  assert.equal(parseSeed("   "), undefined);
  assert.equal(parseSeed(undefined), undefined);
  assert.equal(parseSeed("0"), 0);
  assert.equal(parseSeed("42"), 42);
  assert.equal(parseSeed(" 1234 "), 1234);
  assert.equal(parseSeed("4294967295"), 4294967295);
  assert.equal(parseSeed("4294967296"), null);
  assert.equal(parseSeed("abc"), null);
  assert.equal(parseSeed("-1"), null);
  assert.equal(parseSeed("1.5"), null);
  assert.equal(parseSeed("12a"), null);
});

test("the founding wizard offers an optional seed and start honors it", () => {
  assert.match(main, /id="p-seed"/);
  assert.match(main, /id="p-seed-err"/);
  assert.match(main, /seed: opts\.seed \?\? crypto\.getRandomValues/);
  assert.match(main, /createDraft = \{profile: pf, freeNav, seedText\}/);
  assert.match(main, /start\(pf, true, \{ freeNav, seed: sd \}\)/);
  assert.match(main, /start\(pf, false, \{ freeNav, seed: sd \}\)/);
});
