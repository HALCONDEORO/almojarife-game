import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const src = fs.readFileSync(new URL("../web/main.mjs", import.meta.url), "utf8");
const h = (() => { const i = src.indexOf('mapEl.addEventListener("contextmenu"'); return src.slice(i, src.indexOf("}, true);", i)); })();
test("free navigation: a right click opens a confirm menu and does not send the ship by itself", () => {
  assert.ok(h.includes("sailNow") && h.includes('data-m="go"') && h.includes('data-m="no"'));
  const direct = h.slice(0, h.indexOf("const sailNow")); // everything before the confirm helper must not call doGoTo
  assert.ok(!direct.includes("doGoTo("), "doGoTo only runs from the confirmed button");
  assert.ok(h.includes('if (b.dataset.m === "go") sailNow();'));
});
test("the confirm menu is bilingual and ignores the click that ends the right-click gesture", () => {
  for (const w of ["Zarpar aquí", "Sail here", "Cancelar", "Cancel"]) assert.ok(h.includes(w), w);
  assert.ok(h.includes("createMenuGuard()") && h.includes("guard.accepts(e.detail)"));
});
