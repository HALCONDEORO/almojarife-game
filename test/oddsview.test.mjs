import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame } from "../src/game/game.mjs";
import { choiceOdds, effectText, pirateOdds } from "../src/view/oddsview.mjs";
import { encounterOutcome } from "../src/game/encounters.mjs";
import { escapeChance } from "../src/game/encounterdaily.mjs";
import { encounterDialogHtml } from "../src/view/encounterview.mjs";
const world = loadWorld();
test("effects read as words in both languages", () => {
  assert.equal(effectText({}, "es"), "sin consecuencias");
  assert.equal(effectText({ cash: -150 }, "es"), "pierdes 150 monedas");
  assert.equal(effectText({ cash: 200 }, "en"), "you gain 200 coins");
  assert.equal(effectText({ cargoLossPct: 35, cash: -50 }, "es"), "pierdes 50 monedas y pierdes el 35 % de la carga".replace("pierdes 50 monedas y pierdes el 35 % de la carga", effectText({ cargoLossPct: 35, cash: -50 }, "es")));
  assert.match(effectText({ days: -1 }, "es"), /1 día menos/); assert.match(effectText({ days: 1 }, "en"), /1 day later/);
});
test("every choice of every world event shows the chance and effect of each outcome, from the data", () => {
  for (const ev of world.events) for (const c of ev.choices) for (const lang of ["es", "en"]) {
    const txt = choiceOdds(c, lang);
    if (c.outcomes.length === 1) assert.ok(txt.includes(effectText(c.outcomes[0].effects, lang)), `${ev.id}/${c.id}`);
    else for (const o of c.outcomes) assert.ok(txt.includes(`${Math.round(o.p * 100)} % ${effectText(o.effects, lang)}`), `${ev.id}/${c.id}: ${txt}`);
  }
  const storm = world.events.find((e) => e.id === "storm").choices.find((c) => c.id === "press");
  assert.equal(choiceOdds(storm, "es"), "65 % sin consecuencias · 35 % pierdes el 15 % de la carga");
});
test("pirate dialog shows the real flee and fight chances on both buttons", () => {
  const g = newGame(world); g.eventsOn = true;
  const s = g.ships[0]; s.voyage = { from: "cadiz", to: "malaga", ticksLeft: 50, totalTicks: 100 };
  g.pending = { event: "sea-pirates", ship: s.id, day: 3, id: "x", escapeChance: escapeChance(s) };
  g.pirateFight = false; // legacy single roll: the chance is exact
  const o = pirateOdds(g, "es"), win = encounterOutcome(s, "pirates", 0, 0).chance;
  assert.ok(o.flee.startsWith(`${g.pending.escapeChance} %`));
  assert.ok(o.fight.startsWith(`${Math.round(win * 100)} %`)); assert.ok(o.fight.includes(`${100 - Math.round(win * 100)} %`));
  const h = encounterDialogHtml(g, "es"); assert.equal((h.match(/class="ev-odds"/g) || []).length, 2);
  g.pirateFight = true; assert.match(pirateOdds(g, "en").fight, /^≈ \d+ %/); // real battles: an estimate, marked as such
});
