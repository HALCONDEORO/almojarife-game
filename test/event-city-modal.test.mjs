import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

// Regression: a pending sea event (fair wind, salvage, ...) froze the clock in the
// city view with no visible cue - the choice card rendered inside the city window,
// which stays closed, so "El tiempo está parado hasta que decidas" was impossible to
// answer. The card must pop as a modal over the city, like the pirate dialog does.
const main = readFileSync(new URL("../web/main.mjs", import.meta.url), "utf8");

test("a pending event in the city view pops as a modal dialog (same shade family as pirates)", () => {
  assert.match(main, /id="city-event"><section class="sea-dialog" role="dialog" aria-modal="true"/);
  assert.match(main, /<div class="sea-shade" id="city-event">/);
});

test("the modal carries the same event card and wires its choices", () => {
  assert.match(main, /\$\("city-event"\)\.querySelectorAll\("\[data-ev\]"\)\.forEach\(\(e\) => e\.onclick = \(\) => act\(\(\) => resolveEvent\(g, e\.dataset\.ev\)\)\)/);
});

test("on the map the card still renders in the panel, exactly as before", () => {
  assert.match(main, /if \(!inCity\) h \+= evCard;/);
  assert.match(main, /document\.body\.classList\.toggle\("has-event", !!pe && !inCity\)/);
});

test("opening the city re-renders, so an event pending since before the city opened still pops", () => {
  assert.match(main, /syncCityControls\(\);\n {2}render\(\);/);
});

test("the overlay appears only with a pending event in the city and is removed otherwise", () => {
  const block = main.match(/\{ const ov = \$\("city-event"\);[\s\S]*?else if \(ov\) ov\.remove\(\); \}/);
  assert.ok(block, "the overlay management block exists");
  const calls = { inserted: 0, updated: 0, removed: 0, wired: 0 };
  const ovEl = { querySelector: () => ({ set innerHTML(v) { calls.updated++; } }), querySelectorAll: () => [{ set onclick(f) { calls.wired++; } }], remove() { calls.removed++; } };
  const ctx = {
    ov: null, pe: { title: { es: "Viento" } }, inCity: true, evCard: '<div class="event"><button data-ev="steady">x</button></div>',
    $(id) { return id === "city-event" ? ctx.ov : id === "v3d" ? { insertAdjacentHTML(pos, html) { calls.inserted++; assert.match(html, /data-ev="steady"/); ctx.ov = ovEl; } } : null; },
    act() {}, resolveEvent() {}, g: {}, lang: "es",
  };
  vm.createContext(ctx);
  vm.runInContext(block[0].replace("const ov", "ov").replace(/\$\("city-event"\)\.querySelectorAll/, "ov.querySelectorAll"), ctx);
  assert.equal(calls.inserted, 1, "first render inserts the modal");
  vm.runInContext(block[0].replace("const ov", "ov").replace(/\$\("city-event"\)\.querySelectorAll/, "ov.querySelectorAll"), ctx);
  assert.equal(calls.updated, 1, "a re-render updates the existing modal instead of stacking");
  ctx.pe = null;
  vm.runInContext(block[0].replace("const ov", "ov").replace(/\$\("city-event"\)\.querySelectorAll/, "ov.querySelectorAll"), ctx);
  assert.equal(calls.removed, 1, "deciding the event removes the modal");
  ctx.inCity = false; ctx.pe = { title: { es: "Viento" } }; ctx.ov = ovEl;
  vm.runInContext(block[0].replace("const ov", "ov").replace(/\$\("city-event"\)\.querySelectorAll/, "ov.querySelectorAll"), ctx);
  assert.equal(calls.removed, 2, "leaving the city drops the modal (the panel card takes over)");
});
