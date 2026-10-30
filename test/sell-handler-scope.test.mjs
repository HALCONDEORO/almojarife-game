// Sell handler scope guard (30/10 sell bug): the [data-s] click handler runs
// outside the render block that declares `const wh = warehouseOf(g, s.at)`, so
// every sell click threw ReferenceError ("wh is not defined") and no goods ever
// moved. The handler must resolve the warehouse itself. This test fails on the
// broken handler (no own `wh` binding) and passes once it declares one.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("../web/main.mjs", import.meta.url), "utf8");

test("the [data-s] sell handler resolves the warehouse in its own scope", () => {
  const m = src.match(/P\.querySelectorAll\("\[data-s\]"\)\.forEach\(\(e\) => e\.onclick = \(\) => \{([\s\S]*?)\}\);/);
  assert.ok(m, "the sell click handler exists");
  assert.match(m[1], /const wh = warehouseOf\(g, s\.at\)/, "the handler must resolve `wh` itself: the render-scope binding is out of scope here (30/10 sell bug)");
  const firstWhUse = m[1].search(/\bwh\b/);
  const whDecl = m[1].search(/const wh =/);
  assert.ok(whDecl >= 0 && whDecl < firstWhUse + 6, "the declaration precedes any use");
});

test("no other click handler references the render-scope `wh` without declaring it", () => {
  const handlers = src.match(/querySelectorAll\("\[data-[a-z-]+\]"\)\.forEach\(\(e\) => e\.onclick = \(\) => \{[^`]*?\}\);/g) ?? [];
  for (const h of handlers) {
    if (/\bwh\b/.test(h) && !/const wh =/.test(h)) assert.fail(`handler without its own wh binding: ${h.slice(0, 120)}`);
  }
});
