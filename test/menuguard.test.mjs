import test from "node:test";
import assert from "node:assert/strict";
import { createMenuGuard } from "../src/view/menuguard.mjs";

// Regression for the accidental-sail bug: the pointer gesture that OPENS the
// context menu ends over the first item, and its trailing click must not
// activate it. A new pointer press arms the menu; keyboard clicks (detail 0)
// are always accepted.

test("clicks before any new pointer press are rejected", () => {
  const g = createMenuGuard();
  assert.equal(g.accepts(1), false);
});

test("a new pointer press arms the menu for later clicks", () => {
  const g = createMenuGuard();
  g.arm();
  assert.equal(g.accepts(1), true);
});

test("keyboard activation (detail 0) works without arming", () => {
  const g = createMenuGuard();
  assert.equal(g.accepts(0), true);
});
