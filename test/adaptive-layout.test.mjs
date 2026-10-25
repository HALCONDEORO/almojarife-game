import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync("web/index.html", "utf8");

test("large monitors get a bigger header and dialogs, in steps", () => {
  assert.match(html, /@media\(min-width:1800px\)\{header\{font-size:clamp\(15px,\.8vw,26px\)/);
  assert.match(html, /@media\(min-width:2400px\)\{#title \.box\.pausemenu,#title \.box\.capdlg\{zoom:1\.6\}/);
});

test("short windows tighten the header and let dialogs scroll", () => {
  assert.match(html, /@media\(max-height:700px\)\{header\{padding:4px 12px\}/);
  assert.match(html, /max-height:calc\(100dvh - 16px\);overflow:auto/);
});

test("the map and floating windows are never zoomed (they use pixel maths)", () => {
  const block = html.slice(html.indexOf("/* Adaptive desktop layout"), html.indexOf("body.text-large"));
  for (const sel of ["#maparea", "#mapcard", "#v3d", "main", "body{", "#panel"]) assert.ok(!block.includes(sel + "{zoom"), sel);
});
