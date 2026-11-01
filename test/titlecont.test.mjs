import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const src = fs.readFileSync(new URL("../web/main.mjs", import.meta.url), "utf8");
test("Continuar re-reads the current save instead of the one captured when the title was drawn", () => {
  const handlerStart = src.indexOf('$("t-cont").onclick'); assert.ok(handlerStart > 0);
  const handler = src.slice(handlerStart, src.indexOf('$("t-rest").onclick', handlerStart));
  assert.ok(handler.includes("const cur = loadSaved();") && !handler.includes("?? saved") && handler.includes("g = cur.g") && !handler.includes("g = saved.g"));
});
