import test from "node:test";
import assert from "node:assert/strict";
import { inbox2dHtml } from "../src/view/ui2d.mjs";
const fmt = (n) => String(n), cn = (c) => c, gn = (x) => x;
test("only action messages carry the unread tag; the count matches", () => {
  const g = { inbox: [{ id: 1, day: 3, kind: "info", txt: { es: "aviso", en: "notice" }, read: false }, { id: 2, day: 3, kind: "halt", ship: 1, read: false }] };
  for (const l of ["es", "en"]) {
    const h = inbox2dHtml(g, l, fmt, cn, gn);
    assert.equal((h.match(/is-unread/g) || []).length, 1, l);
  }
});
