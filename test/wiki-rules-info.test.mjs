import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CHART_BASE, CHART_PER_PORT, ROUTE_RUMOR_PRICE, COASTS } from "../src/game/charts.mjs";
import { RUMOR_PRICE, RUMOR_ERROR } from "../src/game/intel.mjs";
import { CONTACT_PRICE, CONTACT_MAX, CONTACT_EVERY, CONTACT_REPORTS, CONTACT_ERROR, CONTACT_FALSE_ERROR, CONTACT_FALSE_CHANCE } from "../src/game/contacts.mjs";
import { CONTRACT_MAX_ACTIVE, CONTRACT_CHANCE, CONTRACT_SCARCITY_MIN, CONTRACT_BONUS_MIN, CONTRACT_BONUS_SPAN, CONTRACT_DAYS_MIN, CONTRACT_DAYS_SPAN, CONTRACT_RESPECT_COINS, CONTRACT_REP, CONTRACT_FAIL_REP } from "../src/game/contracts.mjs";

// The port-information and council-commission sections of the rules page name
// their constants; this test fails if the page and the code drift apart.
const EN = readFileSync("docs/wiki/rules.md", "utf8");
const ES = readFileSync("docs/wiki/es/rules.md", "utf8");

test("both pages name every information and commission constant", () => {
  for (const page of [EN, ES]) {
    for (const k of ["CHART_BASE", "CHART_PER_PORT", "COASTS", "ROUTE_RUMOR_PRICE", "RUMOR_PRICE", "RUMOR_ERROR", "CONTACT_PRICE", "CONTACT_EVERY", "CONTACT_REPORTS", "CONTACT_MAX", "CONTACT_ERROR", "CONTACT_FALSE_CHANCE", "CONTACT_FALSE_ERROR", "refreshIntel", "CONTRACT_CHANCE", "CONTRACT_SCARCITY_MIN", "CONTRACT_DAYS_MIN", "CONTRACT_DAYS_SPAN", "CONTRACT_BONUS_MIN", "CONTRACT_BONUS_SPAN", "CONTRACT_MAX_ACTIVE", "CONTRACT_REP", "CONTRACT_RESPECT_COINS", "CONTRACT_FAIL_REP"]) {
      assert.ok(page.includes("`" + k + "`"), `missing ${k}`);
    }
  }
});

test("the stated numbers match the code", () => {
  assert.ok(EN.includes(`${CHART_BASE} coins plus ${CHART_PER_PORT} per port`));
  assert.ok(EN.includes(`(${ROUTE_RUMOR_PRICE}, \`ROUTE_RUMOR_PRICE\``));
  assert.ok(EN.includes(`(${RUMOR_PRICE}, \`RUMOR_PRICE\``) && EN.includes(`±${RUMOR_ERROR * 100}%`));
  assert.ok(EN.includes(`every ${CONTACT_EVERY} days`) && EN.includes(`${CONTACT_REPORTS} reports in all`));
  assert.ok(EN.includes(`at most ${CONTACT_MAX} informants`));
  assert.ok(EN.includes(`±${CONTACT_ERROR * 100}%`) && EN.includes(`±${CONTACT_FALSE_ERROR * 100}%`));
  assert.ok(EN.includes(`${CONTRACT_CHANCE * 100}% odds`));
  assert.ok(EN.includes(`${CONTRACT_DAYS_MIN} to ${CONTRACT_DAYS_MIN + CONTRACT_DAYS_SPAN} days`));
  assert.ok(EN.includes(`${CONTRACT_BONUS_MIN * 100}-${Math.round((CONTRACT_BONUS_MIN + CONTRACT_BONUS_SPAN) * 100)}% over base value`));
  assert.ok(EN.includes(`at most ${CONTRACT_MAX_ACTIVE} active commissions`));
  assert.ok(EN.includes(`reputation +${CONTRACT_REP}`) && EN.includes(`reputation ${CONTRACT_FAIL_REP}`));
  assert.ok(EN.includes(`${CONTRACT_RESPECT_COINS.toLocaleString("en-US")}-coin sale`));
  assert.ok(ES.includes(`cada ${CONTACT_EVERY} días`) && ES.includes(`±${RUMOR_ERROR * 100} %`));
  assert.ok(ES.includes(`máximo ${CONTACT_MAX} informantes`));
  assert.ok(Object.keys(COASTS).length === 8 && EN.includes("eight coasts"));
});

test("charts and informants are no longer listed as to-fill", () => {
  assert.doesNotMatch(EN, /charts and informants\./);
  assert.doesNotMatch(ES, /cartas e informantes\./);
});
