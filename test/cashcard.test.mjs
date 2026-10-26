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

import { financeSummary } from "../src/view/cashcard.mjs";
test("finance summary reads loans and the last weekly report; empty state is honest", () => {
  const f = financeSummary({ day: 10, loans: [{ left: 100, due: 40 }, { left: 50, due: 25 }, { left: 0, due: 11 }], reports: [{ trades: [{ profit: 70 }, { profit: 14 }] }] }, { settleEvery: 7, dueNow: 12 });
  assert.equal(f.loanDueIn, 15);
  assert.equal(f.settleIn, 4);
  assert.equal(f.profitPerDay, 12);
  assert.equal(financeSummary({ day: 0 }).profitPerDay, null);
  assert.equal(financeSummary({ day: 0 }).settleIn, 7);
  assert.equal(financeSummary({ day: 0 }).loanDueIn, null);
});
test("cash card shows due day, settlement and profit per day", () => {
  const fin = { loanDueIn: 3, settleIn: 1, dueNow: 20, profitPerDay: 12.5 };
  const es = cashCardHtml({ lang: "es", owed: 500, ships: [], fin, fmtM: (x) => `${x} mon` });
  assert.match(es, /vence en 3 días/); assert.match(es, /Próxima liquidación: en 1 día · acumulado 20 mon/); assert.match(es, /Beneficio por día: \+12\.5 mon \(semana pasada\)/);
  const en = cashCardHtml({ lang: "en", owed: 0, ships: [], fin: { ...fin, profitPerDay: null } });
  assert.match(en, /after the first weekly report/); assert.doesNotMatch(en, /next due/);
  assert.doesNotMatch(cashCardHtml({ lang: "es", ships: [] }), /liquidación/);
});
