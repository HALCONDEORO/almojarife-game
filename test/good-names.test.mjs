import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { GOOD_ES, GOOD_EN, newsEs } from "../src/game/news.mjs";
import { shockText } from "../src/game/shocks.mjs";
import { newGame, buyWarehouse } from "../src/game/game.mjs";
import { setStewardRule, stewardTick } from "../src/game/steward.mjs";

const world = loadWorld();

test("every tradeable good has a Spanish and English name in the news tables", () => {
  for (const g of Object.keys(world.goods)) {
    assert.ok(GOOD_ES[g], `GOOD_ES missing ${g}`);
    assert.ok(GOOD_EN[g], `GOOD_EN missing ${g}`);
  }
});

test("every tradeable good renders its Spanish name in shocks, with de-contraction", () => {
  for (const g of Object.keys(world.goods)) {
    const txt = shockText({ type: "new_demand", good: g, region: "mediterraneo" }, "es");
    assert.ok(!txt.includes(`de ${g} `) && !txt.includes(`demanda de ${g} en`), `shock shows raw id for ${g}: ${txt}`);
  }
  assert.ok(shockText({ type: "new_demand", good: "bricks", region: "mediterraneo" }, "es").includes("de los ladrillos"));
  assert.ok(shockText({ type: "poor_harvest", good: "ironware", region: "atlantico" }, "es").includes("de los herrajes"));
});

test("every tradeable good renders its English name in shocks", () => {
  for (const g of Object.keys(world.goods)) {
    const txt = shockText({ type: "new_demand", good: g, region: "mediterraneo" }, "en");
    assert.ok(txt.includes(GOOD_EN[g]) && !txt.includes("_"), `shock shows raw id for ${g}: ${txt}`);
  }
});

test("newsEs agreement: masculine plural goods conjugate as plural", () => {
  const t = newsEs(GOOD_ES.bricks, true, "Cádiz", 50);
  assert.ok(t.includes("los ladrillos están caros"), t);
  assert.ok(t.includes("los pagan"), t);
  assert.ok(newsEs(GOOD_ES.legumes, true, "Cádiz", 50).includes("las legumbres están caras")); // feminine plural unchanged
  assert.ok(newsEs(GOOD_ES.saffron, true, "Cádiz", 50).includes("el azafrán está caro")); // masculine singular unchanged
});

test("steward messages name bricks and ironware in Spanish and English", () => {
  const g = newGame(world, "cadiz", { freePlay: true, seed: 7 });
  g.cash = 100000;
  assert.ok(buyWarehouse(g, "cadiz").ok);
  const e = g.market.cadiz.bricks;
  e.stock = e.target * 4; // clamp-low price
  assert.ok(setStewardRule(g, "cadiz", "bricks", { buyBelow: 99999, buyTo: 5 }).ok);
  stewardTick(g, "cadiz", 100);
  const msg = g.inbox.find((m) => m.kind === "steward");
  assert.ok(msg, "steward posted a message");
  assert.ok(msg.txt.es.includes("de ladrillos"), msg.txt.es);
  assert.ok(msg.txt.en.includes("bricks"), msg.txt.en);
});
