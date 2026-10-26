import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const src = fs.readFileSync(new URL("../web/main.mjs", import.meta.url), "utf8");
test("the clock's repaint waits while a press is held inside a game panel", () => {
  assert.ok(src.includes("const renderFromClock = () => { if (uiPressed) renderQueued = true; else render(); }"));
  const i = src.indexOf("function stepTicks"), j = src.indexOf("\n}\n", i);
  assert.ok(src.slice(i, j).trimEnd().endsWith("renderFromClock();"), "stepTicks ends with the deferred repaint");
});
test("a press ends on pointerup or cancel and a queued repaint then runs once", () => {
  for (const ev of ['"pointerdown"', '"pointerup"', '"pointercancel"']) assert.ok(src.includes(`addEventListener(${ev}`), ev);
  assert.ok(src.includes("if (renderQueued) { renderQueued = false; render(); }"));
  assert.ok(src.includes("pressTimer = setTimeout(endPress, 1500)"), "safety release");
});
test("render() itself is not delayed, so handlers that render and then read the DOM still work", () => {
  const i = src.indexOf("function render() {"); assert.ok(!src.slice(i, i + 80).includes("uiPressed"));
});
