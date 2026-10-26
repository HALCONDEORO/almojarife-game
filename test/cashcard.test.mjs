import test from "node:test";
import assert from "node:assert/strict";
import { cashCardHtml, routeLabel } from "../src/view/cashcard.mjs";
const cn = (c) => c.toUpperCase();
test("debt, route count and selected ship route are shown", () => {
  const ships = [{ route: { a: "cadiz", b: "sevilla" } }, {}];
  const h = cashCardHtml({ lang: "es", owed: 500, ships, selected: ships[0], cityName: cn, fmtM: (x) => `${x} mon` });
  assert.match(h, /Deuda: 500 mon/);
  assert.match(h, /Rutas automáticas: 1\/2/);
  assert.match(h, /Este barco: CADIZ ⇄ SEVILLA/);
});
test("no debt and no route say so, in both languages, and escape names", () => {
  assert.match(cashCardHtml({ lang: "es", ships: [{}], selected: {} }), /Deuda: ninguna/);
  assert.match(cashCardHtml({ lang: "en", ships: [{}], selected: {} }), /Debt: none/);
  assert.equal(routeLabel({ stops: [{ city: "a" }, { city: "b" }, { city: "c" }] }, cn), "A → B → C");
  assert.match(cashCardHtml({ lang: "en", ships: [{ route: { a: "<x>", b: "b" } }], selected: { route: { a: "<x>", b: "b" } }, cityName: (c) => c }), /&lt;x&gt;/);
});
