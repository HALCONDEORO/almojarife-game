import test from "node:test";
import assert from "node:assert/strict";
import { warehouseHeader2d, bankHeader2d, store2dWrap, store2dWindowClass } from "../src/view/ui2d_store.mjs";
test("warehouse heading shows the figures in Spanish and English and escapes the city", () => {
  const es = warehouseHeader2d("es", { city: "<Cádiz>", hasWarehouse: true, stored: 12, onShip: 30, kinds: 2 }), en = warehouseHeader2d("en", { city: "Cadiz", hasWarehouse: true, stored: 12, onShip: 30, kinds: 2 });
  assert.match(es, /Almacén/); assert.match(es, /&lt;Cádiz&gt;/); assert.doesNotMatch(es, /<Cádiz>/); assert.match(en, /Warehouse/); for (const n of ["12", "30", "2"]) assert.ok(es.includes(`<b>${n}</b>`));
});
test("no warehouse: a plain note, no figures", () => { const h = warehouseHeader2d("es", { city: "Cádiz", hasWarehouse: false }); assert.match(h, /Aún no tienes almacén/); assert.doesNotMatch(h, /ui2d-store-tile/); });
test("bank heading carries room, debt, rate and loan count", () => {
  const h = bankHeader2d("es", { city: "Sevilla", room: 4000, owed: 500, ratePct: 1.5, loans: 2 }); assert.match(h, /Banco/); for (const x of ["4000", "500", "1.5 %", "<b>2</b>"]) assert.ok(h.includes(x), x);
});
test("wrap keeps the original controls untouched, and the window class follows the tab", () => {
  const inner = '<button data-loan="100">x</button><button data-st="grain">y</button><input id="adm-buy">', w = store2dWrap("bank", "<div></div>", inner);
  assert.ok(w.includes(inner)); assert.equal(store2dWindowClass("store"), "ui2d-store-window"); assert.equal(store2dWindowClass("bank"), "ui2d-bank-window"); assert.equal(store2dWindowClass("market"), "");
});
