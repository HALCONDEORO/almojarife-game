import test from "node:test";
import assert from "node:assert/strict";
import { cleanCompany, MAX_COMPANY } from "../src/game/clean-text.mjs";

const lone = (s) => [...s].some((ch) => ch.length === 1 && ch.charCodeAt(0) >= 0xd800 && ch.charCodeAt(0) <= 0xdfff);

test("markup characters, control codes and blanks are stripped as before", () => {
  assert.equal(cleanCompany(null), "");
  assert.equal(cleanCompany(' <b>Casa "X" & Co.> '), "bCasa X  Co.");
  assert.equal(cleanCompany("a\tb\nc"), "abc");
  assert.equal(cleanCompany("Casa Luna"), "Casa Luna");
});

test("the cap counts characters, so an astral letter is never cut in half", () => {
  const withEmoji = "A".repeat(MAX_COMPANY - 1) + "\u{1F3F4}"; // 30 code points, 31 UTF-16 units
  const kept = cleanCompany(withEmoji);
  assert.equal(kept, withEmoji, "the 30th character fits whole");
  assert.ok(!lone(kept), "no unpaired surrogate");
  const overCap = "A".repeat(MAX_COMPANY) + "\u{1F3F4}"; // the emoji is the 31st character: it drops cleanly
  const cut = cleanCompany(overCap);
  assert.equal(cut, "A".repeat(MAX_COMPANY));
  assert.ok(!lone(cut), "the cap never leaves half a character");
});

test("a saved name round-trips through JSON without escape corruption", () => {
  const name = cleanCompany("Casa \u{1F3F4} del Mar " + "x".repeat(40));
  assert.equal(JSON.parse(JSON.stringify(name)), name);
});
