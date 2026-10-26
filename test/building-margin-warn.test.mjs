// Workshop negative-margin streak: the daily tick counts losing days, the feed warns once
// per streak at day 3 (no auto-halt), the weekly report repeats the plots, and the
// Buildings tab marks the card red. One profitable day clears the streak and re-arms the warning.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildWorld } from "../src/sim/world.mjs";
import { newGame, advanceDay } from "../src/game/game.mjs";
import { buildingAt, MARGIN_WARN_DAYS, workshopTick } from "../src/game/buildings.mjs";
import { buildingsRows, bldSummaryCard, BWL } from "../src/view/buildingsview.mjs";
import { reportsHtml, messageText } from "../src/view/ledgerview.mjs";
import { quoteRecipe } from "../src/sim/recipes.mjs";

const world = buildWorld(JSON.parse(fs.readFileSync(new URL("../data/world.json", import.meta.url))));
const fmt = (n) => String(Math.round(n));
const game = () => {
  const g = newGame(world, "cadiz", { cash: 30000 });
  g.buildings = { cadiz: { "cadiz:7": { type: "workshop", level: 1, state: "active", plotType: "warehouse" } } };
  return g;
};
// A losing loom: wool is scarce and dear, cloth gluts the market. A winning loom: the reverse.
const forceMargin = (g, negative) => {
  const m = g.market.cadiz;
  if (negative) { m.wool.stock = 8; m.cloth.stock = 1e6; } else { m.wool.stock = 1e6; m.cloth.stock = 4; }
  const q = quoteRecipe(g.world, g.market, "cadiz", "weave", 1);
  assert.ok(q.ok, "the batch must be quotable so the margin is a real signal");
  return q;
};
const marginMsgs = (g) => (g.inbox ?? []).filter((m) => m.kind === "bldMargin");

test("a workshop counts negative-margin days and the feed warns once, on day 3", () => {
  const g = game();
  for (let d = 1; d <= MARGIN_WARN_DAYS + 1; d++) { forceMargin(g, true); advanceDay(g); }
  const b = buildingAt(g, "cadiz", "cadiz:7");
  assert.equal(b.negDays, MARGIN_WARN_DAYS + 1, "one count per losing day");
  assert.equal(marginMsgs(g).length, 1, "one warning per streak, not one per day");
  const m = marginMsgs(g)[0];
  assert.equal(m.city, "cadiz"); assert.equal(m.plot, "cadiz:7"); assert.equal(m.type, "workshop");
  assert.ok(m.margin <= 0, "the posted margin is the losing quote");
  assert.ok(b.negWarned, "the streak is marked as warned");
});

test("one profitable day clears the streak and re-arms the warning", () => {
  const g = game();
  for (let d = 1; d <= MARGIN_WARN_DAYS; d++) { forceMargin(g, true); advanceDay(g); }
  assert.equal(marginMsgs(g).length, 1);
  forceMargin(g, false); advanceDay(g);
  const b = buildingAt(g, "cadiz", "cadiz:7");
  assert.equal(b.negDays, 0, "a profitable day resets the count");
  assert.ok(!b.negWarned, "the warning is re-armed");
  for (let d = 1; d <= MARGIN_WARN_DAYS; d++) { forceMargin(g, true); advanceDay(g); }
  assert.equal(marginMsgs(g).length, 2, "a new streak warns again");
});

test("the message reads es/en and the weekly report lists the losing plots", () => {
  const g = game();
  for (let d = 1; d <= 7; d++) { forceMargin(g, true); advanceDay(g); } // day 7 settles the week
  const m = marginMsgs(g)[0];
  assert.ok(m, "warning posted within the week");
  const es = messageText(m, "es", fmt, (c) => (c === "cadiz" ? "Cádiz" : c));
  assert.ok(es.includes("Cádiz") && es.includes("margen negativo") && es.includes(String(Math.round(m.margin))), es);
  const en = messageText(m, "en", fmt);
  assert.ok(en.includes("negative margin") && en.includes(String(Math.round(m.margin))), en);
  assert.ok(g.reports.length >= 1, "a weekly report exists after day 7");
  assert.ok(g.reports[0].negMargin.includes("cadiz:7"), "the report lists the plot");
  const html = reportsHtml(g, "es", fmt);
  assert.ok(html.includes("Margen negativo 3+ días") && html.includes("cadiz:7"), "the report renders the warning line");
});

test("the Buildings tab card marks the streak in red from day 3", () => {
  const g = game();
  const t = { bldTypes: { workshop: "Taller" }, bldState: { plot: "solar", construction: "en obras", active: "activo", halted: "parado", fire: "incendio" }, bldReady: "listo el día {d} ({p}%)" };
  let [row] = buildingsRows(g, "cadiz");
  assert.equal(row.negDays, 0, "a fresh workshop has no streak");
  let html = bldSummaryCard(t, row, "es", fmt);
  assert.ok(!html.includes("⚠"), "no streak mark before day 3");
  for (let d = 1; d <= MARGIN_WARN_DAYS; d++) { forceMargin(g, true); advanceDay(g); }
  [row] = buildingsRows(g, "cadiz");
  assert.equal(row.negDays, MARGIN_WARN_DAYS);
  html = bldSummaryCard(t, row, "es", fmt);
  assert.ok(html.includes("⚠"), "the streak mark shows");
  assert.ok(html.includes('class="bwc-lab">' + BWL.es.marginWarn + "<"), "visible caption, not just an icon");
  assert.ok(html.includes("bwc-bad"), "the mark is red");
});

test("an unquotable day (no input stock) keeps the streak and the warned flag", () => {
  const g = game(), b = () => buildingAt(g, "cadiz", "cadiz:7");
  const tick = () => workshopTick(g, "cadiz"); // the workshop's own daily step, so the market does not restock in between
  const lose = () => { forceMargin(g, true); tick(); };
  const dry = () => { g.market.cadiz.wool.stock = 0; assert.equal(quoteRecipe(g.world, g.market, "cadiz", "weave", 1).ok, false, "setup: unquotable"); tick(); };
  for (let d = 1; d <= MARGIN_WARN_DAYS - 1; d++) lose();
  assert.equal(b().negDays, MARGIN_WARN_DAYS - 1);
  dry();
  assert.equal(b().negDays, MARGIN_WARN_DAYS - 1, "an unquotable day neither counts nor resets");
  lose();
  assert.equal(b().negDays, MARGIN_WARN_DAYS, "the streak resumes where it was");
  assert.equal(marginMsgs(g).length, 1, "and warns once");
  dry();
  assert.ok(b().negWarned, "warned flag retained through an unquotable day");
  lose();
  assert.equal(marginMsgs(g).length, 1, "loss, unquotable, loss: still one warning for the streak");
});
