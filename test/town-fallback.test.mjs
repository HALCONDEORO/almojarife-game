import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("../web/main.mjs", import.meta.url), "utf8");

test("town tab falls back to an honest no-services card, not the no-plots text", () => {
  assert.ok(src.includes(": `<p><i>${t.townNone}</i></p>`"), "render fallback uses townNone");
  assert.ok(!src.includes(": `<p><i>${t.bldNone}</i></p>`"), "no bldNone fallback left");
});
test("townNone exists in both locales", () => {
  assert.ok(src.includes('townNone: "Este edificio aún no ofrece servicios."'), "es");
  assert.ok(src.includes('townNone: "This building offers no services yet."'), "en");
});
