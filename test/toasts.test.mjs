import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const main = readFileSync("web/main.mjs", "utf8");
const html = readFileSync("web/index.html", "utf8");

test("buy and sell confirm with a toast built from the real trade delta", () => {
  assert.match(main, /function toast\(msg\)/);
  assert.match(main, /toast\(t\.toastBought\.replace\("\{q\}", dq\)/);
  assert.match(main, /toast\(t\.toastSold\.replace\("\{q\}", dq\)/);
  for (const k of ["toastBought", "toastSold"]) assert.equal((main.match(new RegExp(`${k}:"`, "g")) || []).length, 2, `${k} in both locales`);
});

test("toast stack is capped, auto-removes and respects reduce motion", () => {
  assert.match(main, /box\.childElementCount > 3/);
  assert.match(main, /setTimeout\(\(\) => el\.remove\(\), 2600\)/);
  assert.match(html, /#toasts\{[^}]*pointer-events:none/);
  assert.match(html, /body\.reduce-motion \.toast\{animation:none/);
});
