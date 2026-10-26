import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const src = fs.readFileSync(new URL("../web/main.mjs", import.meta.url), "utf8");
const yard = src.slice(src.indexOf('tab === "yard"'), src.indexOf('tab === "lonja"'));
// The shipyard window is sectioned (own ship first, new ships last) and every action the handlers bind is still rendered.
test("yard sections: ship condition, optional convoy, orders, then new ships", () => {
  const at = (x) => yard.indexOf(x);
  assert.ok(at("Tu barco") > 0 && at("Tu barco") < at("Convoy") && at("Convoy") < at("t.orders") && at("t.orders") < at("Encargar un barco nuevo"));
});
test("yard keeps every action the handlers bind", () => {
  for (const a of ["data-repair", "data-gunrepair", "data-weapon", "data-cvform", "data-cvleave", "data-order"]) {
    assert.ok(yard.includes(a), a + " rendered"); assert.ok(src.includes(`[${a}]`), a + " bound");
  }
});
test("yard explains the way to sell a ship and stays bilingual", () => {
  assert.ok(yard.includes("t.yardInfo")); assert.ok(yard.includes("Build a new ship") && yard.includes("Your ship"));
});
