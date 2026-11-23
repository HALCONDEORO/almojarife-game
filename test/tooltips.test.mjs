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

test("city rail and header view controls get tooltips", () => {
  assert.match(src, /\[data-city-reports\]", t\.tipReports/);
  assert.match(src, /\[data-map\]", t\.tipBack/);
  for (const k of ["fit", "zoom-in", "zoom-out", "motion"]) assert.match(src, new RegExp(`\\["${k}"`), `${k} tooltip entry`);
  assert.match(src, /b\.title = lang === "es" \? es : en/);
});


test("prototype construction preview stays out of normal city controls", () => {
  const html = readFileSync(new URL("../web/index.html", import.meta.url), "utf8");
  assert.doesNotMatch(html, /data-corner="construct"/, "no player construction-preview button");
  assert.doesNotMatch(src, /\["construct", "Vista de construcción"/, "no prototype tooltip in the player header");
  assert.doesNotMatch(src, /cornerCmd\("toggle-construct"\)/, "no player handler for the prototype preview");
});
