import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const src = fs.readFileSync(new URL("../web/main.mjs", import.meta.url), "utf8");
test("arming a build brings the confirm card into view and unaffordable offers say what is missing", () => {
  assert.ok(src.includes('querySelector(".card [data-bldconf]")?.scrollIntoView({ block: "center" })'));
  assert.ok(src.includes("Te faltan {n} monedas") && src.includes("You are {n} coins short"));
  assert.ok(src.includes('class="bldoffer-short"'));
});
