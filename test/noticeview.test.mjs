import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildWorld } from "../src/sim/world.mjs";
import { newGame } from "../src/game/game.mjs";
import { setPriceAlert } from "../src/game/alerts.mjs";
import { refreshIntel } from "../src/game/intel.mjs";
import { arrivalPregon } from "../src/game/pregon.mjs";
import { noticeData, noticeHtml } from "../src/view/noticeview.mjs";

const world = buildWorld(JSON.parse(fs.readFileSync(new URL("../data/world.json", import.meta.url))));
const game = () => { const g = newGame(world, "cadiz", { freePlay: true }); refreshIntel(g); return g; };

test("nothing to wait on: no card", () => {
  assert.equal(noticeHtml(noticeData(game())), "");
});
test("a price alert shows its mark, the live price now and how long it has stood", () => {
  const g = game(); g.day = 10;
  assert.ok(setPriceAlert(g, "cadiz", "grain", "below", 5).ok);
  g.priceAlerts[0].sinceDay = 4;
  const h = noticeHtml(noticeData(g), { lang: "es", goodName: (k) => k });
  assert.match(h, /Alerta: grain en cadiz a ≤ 5 · ahora \d+ · puesta hace 6 d/);
  assert.match(noticeHtml(noticeData(g), { lang: "en" }), /set 6 d ago/);
});
test("a pregón is listed with its age and whether the store is still short; not live means no data", () => {
  const g = game(); g.day = 30;
  g.market.cadiz.grain.stock = 1; g.market.cadiz.grain.target = 500;
  const p = arrivalPregon(g, "cadiz"); assert.ok(p);
  const msg = g.inbox.find((m) => m.kind === "pregon");
  assert.equal(msg.city, "cadiz"); assert.equal(msg.good, p.good);
  g.day = 35;
  const d = noticeData(g);
  assert.equal(d.pregones[0].age, 5); assert.equal(d.pregones[0].standing, true);
  assert.match(noticeHtml(d, { lang: "es" }), /sigue escaso/);
  g.ships.forEach((s) => { s.at = "malaga"; s.voyage = null; }); // docked elsewhere: cadiz is no longer live
  assert.equal(noticeData(g).pregones[0].standing, null);
  g.day = 60; assert.equal(noticeData(g).pregones.length, 0, "past the cooldown it drops off");
});
