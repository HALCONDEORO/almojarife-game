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
test("a ship that is not docked here gets a one-line explanation, in both languages", () => {
  assert.ok(yard.includes("Dock this ship here to repair or arm it.") && yard.includes("Atraca este barco aquí para repararlo o armarlo."));
  assert.ok(yard.includes("s.at !== city3dId"));
});
test("away from this port: repair, gun repair and weapons are disabled in the shipyard", () => {
  assert.ok(yard.includes("const away = inCity && city3dId && s.at !== city3dId"));
  for (const a of ['data-repair="1" ${away', 'data-gunrepair="1" ${away']) assert.ok(yard.includes(a), a);
  // Weapon controls now combine the location guard with slot, cash and cargo blockers.
  // Keep the location-to-disabled chain covered instead of matching its old inline spelling.
  assert.ok(yard.includes('why = away ? "not in this port" :'), "away feeds the weapon blocker");
  assert.ok(yard.includes('data-weapon="${k}" ${why ? "disabled" : ""}'), "weapon blocker disables its control");
});
test("at sea: the note is rendered outside the docked-only block", () => {
  const i = src.indexOf('tab === "yard" && s.voyage'); assert.ok(i > src.indexOf('tab === "lonja"'), "after the docked chain");
  assert.ok(src.slice(i, i + 400).includes("yd-away"));
});
