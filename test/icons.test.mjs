import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { goodIcon, ICON_IDS } from "../web/icons.mjs";

const world = JSON.parse(readFileSync(new URL("../data/world.json", import.meta.url)));

test("every trade good has its own icon", () => { for (const g of Object.keys(world.goods)) assert.ok(ICON_IDS.includes(g), g); });
test("icons are well-formed single svg elements", () => { for (const id of ICON_IDS) { const x = goodIcon(id); assert.ok(x.startsWith("<svg") && x.endsWith("</svg>")); assert.equal((x.match(/<svg/g) || []).length, 1); } });

test("goodIcon escapes the id inside the aria-label attribute", () => {
  const evil = 'x" onload="alert(1)';
  const out = goodIcon(evil);
  assert.ok(!out.includes('onload="alert(1)'), "no injected attribute");
  assert.match(out, /aria-label="x&quot; onload=&quot;alert\(1\)"/);
  assert.match(out, /<circle/, "unknown id falls back to the grey circle");
});

test("every known good renders its own designed icon, not the fallback", () => {
  const body = (out) => out.replace(/aria-label="[^"]*"/, "");
  const fallback = body(goodIcon("no-such-good-xyz"));
  assert.ok(fallback.includes("<circle"), "the fallback itself is the grey circle");
  for (const id of ICON_IDS) assert.notEqual(body(goodIcon(id)), fallback, `${id} has a designed icon`);
});

test("every known good points at its own painted WebP and the file exists", () => {
  for (const id of ICON_IDS) {
    const x = goodIcon(id);
    assert.ok(x.includes(`<image href="icons-img/${id}.webp"`), id);
    assert.ok(existsSync(new URL(`../web/icons-img/${id}.webp`, import.meta.url)), id);
    assert.doesNotMatch(x, /https:|data:/, "artwork stays a local relative file");
  }
});
test("known goods render their painting, unknown goods stay self-contained", () => {
  for (const id of ICON_IDS) assert.ok(goodIcon(id).includes("<image"), id);
  assert.ok(!goodIcon("no-such-good-xyz").includes("<image"), "fallback has no painting reference");
});
