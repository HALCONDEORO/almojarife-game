import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildWorld } from "../src/sim/world.mjs";
import { newGame } from "../src/game/game.mjs";
import { hireContact, contactsOf, CONTACT_PRICE, CONTACT_MAX } from "../src/game/contacts.mjs";
const world = buildWorld(JSON.parse(fs.readFileSync(new URL("../data/world.json", import.meta.url))));

test("hiring works at the docked home port and a second hire names its reason", () => {
  const g = newGame(world); const cash0 = g.cash;
  const ok = hireContact(g, "cadiz");
  assert.equal(ok.ok, true); assert.equal(g.cash, cash0 - CONTACT_PRICE);
  assert.equal(contactsOf(g).length, 1);
  const again = hireContact(g, "cadiz");
  assert.equal(again.ok, false); assert.equal(again.reason, "already hired");
});

test("every rejection carries a named reason (the old bug was a silent no-op)", () => {
  const g = newGame(world);
  assert.equal(hireContact(g, "sevilla").reason, "unknown port"); // known city, but never visited
  g.intel.sevilla = { day: g.day, exact: false, cells: {} };
  assert.equal(hireContact(g, "sevilla").reason, "no ship here"); // known but no ship docked
  g.cash = 0;
  assert.equal(hireContact(g, "cadiz").reason, "no cash");
});

test("the tavern hire button toasts the reason instead of failing silently", () => {
  const src = fs.readFileSync(new URL("../web/main.mjs", import.meta.url), "utf8");
  assert.match(src, /if \(!r\.ok\) toast\(t\.ctaWhy\?\.\[r\.reason\] \?\? r\.reason\)/);
  for (const lang of ["es", "en"]) {
    for (const reason of ["unknown port", "no ship here", "already hired", "too many contacts", "no cash"]) {
      assert.match(src, new RegExp(`"${reason}"`), `${lang} ctaWhy covers ${reason}`);
    }
  }
  assert.match(src, /ctaWhy: \{ "game over": "la partida terminó"/);
  assert.match(src, /ctaWhy: \{ "game over": "the game is over"/);
});
