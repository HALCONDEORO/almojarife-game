import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const src = fs.readFileSync(new URL("../web/main.mjs", import.meta.url), "utf8");
test("the top bar shows total coins without decimals", () => {
  assert.ok(src.includes('$("cash").textContent = `${t.cash}: ${fmt(g.cash)}`'));
  assert.ok(!src.includes('$("cash").textContent = `${t.cash}: ${fmtM(g.cash)}`'));
});
