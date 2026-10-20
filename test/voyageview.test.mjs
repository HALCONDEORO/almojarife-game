import test from "node:test";
import assert from "node:assert/strict";
import { voyagesHtml } from "../src/view/voyageview.mjs";
import { openVoyage, recordSale } from "../src/game/voyages.mjs";
const fmt = (x) => String(Math.round(x)), name = (id) => ({ cadiz: "Cádiz", lisboa: "Lisboa", x: "<script>alert(1)</script>" }[id] ?? id);
test("empty log says so in both languages", () => {
  assert.match(voyagesHtml({}, "es", fmt, name), /Aún no has zarpado/); assert.match(voyagesHtml({}, "en", fmt, name), /not sailed yet/);
});
test("rows show route, profit, best voyage and total; names are escaped", () => {
  const g = { day: 5 }, s = { id: 1 }; openVoyage(g, s, "cadiz", "lisboa"); recordSale(g, s, 10, 500, 120); g.day = 9; openVoyage(g, s, "lisboa", "x");
  const h = voyagesHtml(g, "es", fmt, name);
  assert.ok(h.includes("Cádiz → Lisboa") && h.includes("120") && h.includes("Mejor viaje")); assert.ok(!h.includes("<script>")); assert.ok(h.includes("&lt;script&gt;"));
});
test("only the last rows are listed", () => {
  const g = { day: 1 }; for (let i = 0; i < 30; i++) openVoyage(g, { id: 1 }, "cadiz", "lisboa");
  assert.equal((voyagesHtml(g, "en", fmt, name, 15).match(/<tr>/g) ?? []).length, 16);
});
import { voyagesTitle } from "../src/view/voyageview.mjs";
test("section title in both languages", () => { assert.equal(voyagesTitle("es"), "Diario de viajes"); assert.equal(voyagesTitle("en"), "Voyage log"); });
