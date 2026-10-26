import test from "node:test";
import assert from "node:assert/strict";
import { logHtml } from "../src/view/logview.mjs";
import * as lv from "../src/view/logview.mjs";
test("logHtml collapses consecutive identical lines with a count", () => {
  const e = { type: "x", text: "Aviso" };
  const out = logHtml([e, e, e], {}, "es", () => "");
  assert.ok(typeof lv.logHtml === "function");
  assert.equal((out.match(/<div>/g) || []).length, 1);
  assert.match(out, /×3<\/div>/);
});
