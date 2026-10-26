// 0018 (H11): the alerts engine gets its only UI (market tab) and a translated fired message.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildWorld } from "../src/sim/world.mjs";
import { newGame } from "../src/game/game.mjs";
import { setPriceAlert, tickAlerts } from "../src/game/alerts.mjs";
import { price } from "../src/sim/market.mjs";

const world = buildWorld(JSON.parse(fs.readFileSync(new URL("../data/world.json", import.meta.url))));

test("the fired message names the good and the port as the player reads them", () => {
  const g = newGame(world, "cadiz");
  const e = g.market.cadiz.grain;
  e.stock = 1; const hi = price(world, e, "grain");
  assert.ok(setPriceAlert(g, "cadiz", "grain", "above", hi).ok);
  tickAlerts(g);
  const m = (g.inbox ?? []).find((x) => x.kind === "alert");
  assert.ok(m, "message posted");
  assert.ok(/trigo/i.test(m.txt.es), `good translated: ${m.txt.es}`);
  assert.ok(m.txt.es.includes("Cádiz"), `port named: ${m.txt.es}`);
  assert.ok(!/grain|cadiz/.test(m.txt.es), "no raw keys in the ES text");
  assert.ok(/grain/i.test(m.txt.en), "EN good");
});

test("the market window no longer shows the price-alert block (engine and saved alerts untouched)", () => {
  const main = fs.readFileSync(new URL("../web/main.mjs", import.meta.url), "utf8");
  assert.ok(!main.includes('class="al-box"'), "no alerts box in the market tab");
  assert.ok(!main.includes("alertsOf(g, s.at)"), "market tab does not list alerts");
});
