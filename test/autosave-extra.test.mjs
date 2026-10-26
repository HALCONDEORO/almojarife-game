import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const src = fs.readFileSync(new URL("../web/main.mjs", import.meta.url), "utf8");
test("autosave also runs on a timer and when the tab is hidden or closed, never on the title", () => {
  assert.ok(src.includes("AUTOSAVE_EVERY_MS = 3 * 60 * 1000"));
  assert.ok(src.includes("setInterval(() => { if (g && !inTitle) autosave(); }, AUTOSAVE_EVERY_MS)"));
  assert.ok(src.includes('document.visibilityState === "hidden" && g && !inTitle) autosave()'));
  assert.ok(src.includes('addEventListener("pagehide", () => { if (g && !inTitle) autosave(); })'));
});
test("the save writer itself is unchanged (same key and format)", () => {
  assert.ok(src.includes("function autosave() { try { if (inTitle) return; localStorage.setItem(SAVE_KEY, JSON.stringify(packGame(g, company))); } catch {} }"));
});
