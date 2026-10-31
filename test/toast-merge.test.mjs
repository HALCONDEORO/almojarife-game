import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { mergeTrade } from "../src/view/toastmerge.mjs";
test("mergeTrade sums quantity and cost", () => {
  const m = mergeTrade({ key: "buy:salt", q: 1, c: 18.36 }, { key: "buy:salt", q: 2, c: 36.72 });
  assert.equal(m.q, 3);
  assert.ok(Math.abs(m.c - 55.08) < 1e-9);
});
test("main.mjs merges buy and sell toasts per good", () => {
  const src = readFileSync(new URL("../web/main.mjs", import.meta.url), "utf8");
  assert.match(src, /key: `buy:\$\{gd\}`/);
  assert.match(src, /key: `sell:\$\{gd\}`/);
  assert.match(src, /last\.dataset\.key === agg\.key/);
});
