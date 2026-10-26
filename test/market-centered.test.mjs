import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const css = fs.readFileSync(new URL("../web/ui2d.css", import.meta.url), "utf8");
test("market columns, headers and tool rows are centred", () => {
  const tail = css.slice(css.lastIndexOf("Market window: every column centred"));
  for (const s of [".mkt-good{justify-content:center;text-align:center}", ".mkt-hold,.mkt-avg,.mkt-head .mkt-hold,.mkt-head .mkt-avg{text-align:center}", ".mkt-tools{justify-content:center}", ".mkt-qtybar{justify-content:center}"]) assert.ok(tail.includes(s), s);
});
