import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const src = fs.readFileSync(new URL("../web/main.mjs", import.meta.url), "utf8");
test("Continuar re-reads the current save instead of the one captured when the title was drawn", () => {
  const i = src.indexOf('$("t-cont").onclick'); assert.ok(i > 0);
  const h = src.slice(i, src.indexOf('$("t-rest").onclick', i));
  assert.ok(h.includes("const cur = loadSaved();") && !h.includes("?? saved") && h.includes("g = cur.g") && !h.includes("g = saved.g"));
});
