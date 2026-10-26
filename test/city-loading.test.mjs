import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const main = readFileSync(new URL("../web/main.mjs", import.meta.url), "utf8");
const html = readFileSync(new URL("../web/index.html", import.meta.url), "utf8");
test("city view shows a loading note until the scene reports ready", () => {
  assert.match(main, /className = "city-loading"/);
  assert.match(main, /querySelector\("#v3d \.city-loading"\)\?\.remove\(\)/);
  assert.match(main, /cityLoading: "Cargando ciudad…"/);
  assert.match(main, /cityLoading: "Loading city…"/);
  assert.match(html, /#v3d \.city-loading\{[^}]*pointer-events:none/);
});
