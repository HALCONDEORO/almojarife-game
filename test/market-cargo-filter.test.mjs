import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const src = fs.readFileSync(new URL("../web/main.mjs", import.meta.url), "utf8");
test("the market 'my cargo only' filter exists only with a warehouse in the port and counts stored goods", () => {
  assert.ok(src.includes("if(market2d && wh) {"));
  assert.ok(src.includes("if(market2d && wh && marketCargoOnly && !(s.cargo[gd]>0) && !(wh?.goods?.[gd]>0)) continue;"));
});
