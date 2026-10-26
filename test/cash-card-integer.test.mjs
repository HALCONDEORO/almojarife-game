import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const src = fs.readFileSync(new URL("../web/main.mjs", import.meta.url), "utf8");
test("the finance card formats debt, settlement and profit as whole numbers", () => {
  assert.ok(/cashCardHtml\(\{ lang, owed: loansOwed\(g\), ships: g\.ships, selected: ship\(\), cityName, fmtM: fmt, /.test(src));
});
