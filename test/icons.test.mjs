import test from "node:test";
import assert from "node:assert/strict";
import { goodIcon, ICON_IDS } from "../web/icons.mjs";

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
