import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { TICKS_PER_DAY, TICKS_PER_HOUR } from "../src/sim/clock.mjs";
import { FEE } from "../src/sim/trade.mjs";
import { SETTLE_EVERY, OVERDRAFT_RATE, OVERDRAFT_LIMIT, MAX_INBOX, MAX_REPORTS } from "../src/game/ledger.mjs";
import { LOAN_RATE, LOAN_MAX, LOAN_STEP, LOAN_TERM_DAYS } from "../src/game/bank.mjs";

// The rules page states the core rules and ties each one to its constant.
// If a constant moves, this test fails before the wiki can drift.
const EN = readFileSync("docs/wiki/rules.md", "utf8");
const ES = readFileSync("docs/wiki/es/rules.md", "utf8");

test("both rules pages name the constants behind every stated rule", () => {
  for (const page of [EN, ES]) {
    for (const k of ["TICKS_PER_DAY", "TICKS_PER_HOUR", "FEE", "SETTLE_EVERY", "OVERDRAFT_RATE", "OVERDRAFT_LIMIT", "MAX_INBOX", "MAX_REPORTS", "LOAN_STEP", "LOAN_MAX", "LOAN_RATE", "LOAN_TERM_DAYS", "marketSlot", "SEA_ENCOUNTER_CHANCE_TICK"]) {
      assert.ok(page.includes("`" + k + "`"), `missing ${k}`);
    }
  }
});

test("the numbers on the rules page match the code", () => {
  assert.ok(EN.includes(`${TICKS_PER_DAY} per day, ${TICKS_PER_HOUR} per hour`));
  assert.ok(EN.includes(`fee of ${FEE * 100}%`));
  assert.ok(EN.includes(`every ${SETTLE_EVERY} days`));
  assert.ok(EN.includes(`${OVERDRAFT_RATE * 100}% interest`) && EN.includes(`${OVERDRAFT_LIMIT} of deficit`.replace("3000", "3,000")));
  assert.ok(EN.includes(`${LOAN_RATE * 100}% a week`) && EN.includes(`${LOAN_TERM_DAYS} days`));
  assert.ok(EN.includes(`${MAX_INBOX} messages and ${MAX_REPORTS} reports`));
  assert.ok(ES.includes(`${TICKS_PER_DAY} por día, ${TICKS_PER_HOUR} por hora`));
  assert.ok(ES.includes(`del ${FEE * 100} %`));
  assert.ok(ES.includes(`cada ${SETTLE_EVERY} días`));
});

test("the rules pages keep the language cross-links", () => {
  assert.ok(EN.includes("](es/rules.md)"));
  assert.ok(ES.includes("](../rules.md)"));
});
