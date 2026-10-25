import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("../web/main.mjs", import.meta.url), "utf8");

test("header buttons get tooltips", () => {
  for (const [id, key] of [["play", "tipHdrPlay"], ["spd", "tipHdrSpeed"], ["rep", "tipReports"], ["msg", "tipMsgs"], ["lang", "tipLang"], ["new", "tipMenu"]]) {
    assert.match(src, new RegExp(`\\$\\("${id}"\\)\\.title = t\\.${key}`), `${id} title wired`);
  }
});

test("market quantity buttons carry an explaining tooltip", () => {
  assert.match(src, /<button data-market-qty="\$\{v\}" title="\$\{esc\(t\.tipQty\)\}"/);
});

test("city rail and corner buttons get tooltips", () => {
  assert.match(src, /\[data-city-reports\]", t\.tipReports/);
  assert.match(src, /\[data-map\]", t\.tipBack/);
  assert.match(src, /cl\.title = t\.tipLang/);
});
