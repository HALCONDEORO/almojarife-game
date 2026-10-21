// Pregones del concejo (phase A2): proclamations on arrival when a port runs critically short.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildWorld } from "../src/sim/world.mjs";
import { newGame } from "../src/game/game.mjs";
import { arrivalPregon, PREGON_COOLDOWN } from "../src/game/pregon.mjs";
import { townCouncil } from "../src/game/townhall.mjs";

const world = buildWorld(JSON.parse(fs.readFileSync(new URL("../data/world.json", import.meta.url))));
const fresh = () => newGame(world, "cadiz", { cash: 30000 });

test("no pregón when stocks are healthy", () => {
  const g = fresh();
  for (const e of Object.values(g.market.cadiz)) e.stock = e.target; // full stores
  assert.equal(arrivalPregon(g, "cadiz"), null);
  assert.equal((g.inbox ?? []).filter((m) => m.kind === "pregon").length, 0);
});

test("critical scarcity draws a pregón naming the alcalde and the good", () => {
  const g = fresh();
  g.market.cadiz.grain.stock = 1; // target/stock way above the critical ratio
  const r = arrivalPregon(g, "cadiz");
  assert.equal(r.good, "grain");
  assert.equal(r.mayor, townCouncil(world, "cadiz").mayor);
  const msg = g.inbox.find((m) => m.kind === "pregon");
  assert.ok(msg.txt.es.includes("Pregón en Cádiz"));
  assert.ok(msg.txt.es.includes(r.mayor));
  assert.ok(msg.txt.es.includes("trigo"));
  assert.ok(msg.txt.en.includes(r.mayor) && msg.txt.en.includes("grain"));
});

test("the concejo does not cry every day: one pregón per city per cooldown", () => {
  const g = fresh();
  g.market.cadiz.grain.stock = 1;
  assert.ok(arrivalPregon(g, "cadiz"));
  assert.equal(arrivalPregon(g, "cadiz"), null); // same cooldown window
  g.day += PREGON_COOLDOWN;
  assert.ok(arrivalPregon(g, "cadiz")); // cries again after the cooldown
  assert.equal(g.inbox.filter((m) => m.kind === "pregon").length, 2);
});

test("a pregón in one port does not silence another", () => {
  const g = fresh();
  g.market.cadiz.grain.stock = 1;
  g.market.sevilla.wine.stock = 1;
  assert.equal(arrivalPregon(g, "cadiz").good, "grain");
  assert.equal(arrivalPregon(g, "sevilla").good, "wine");
});
