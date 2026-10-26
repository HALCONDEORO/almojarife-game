import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { render } from "../tools/gen_wiki.mjs";
import { SEASON_PEAK, SEASON_AMPLITUDE, seasonOf, DEMAND_SCALE, NEEDS_MUL, MAKES_MUL } from "../src/sim/market.mjs";

// The seasons table is generated from src/sim/market.mjs and the economy pages
// link it and name the constants. If the code moves, this fails before the wiki drifts.
const SN = readFileSync("docs/wiki/generated/seasons.md", "utf8");
const SQ = readFileSync("docs/wiki/generated/es/seasons.md", "utf8");
const ECON_EN = readFileSync("docs/wiki/economy.md", "utf8");
const ECON_ES = readFileSync("docs/wiki/es/economy.md", "utf8");

const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const EN_MONTH = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const dateOf = (day) => { let m = 0, d = day; while (d >= MONTH_DAYS[m]) { d -= MONTH_DAYS[m]; m++; } return `${d + 1} ${EN_MONTH[m]}`; };

test("the committed seasons tables match the generator output", () => {
  const out = render();
  assert.equal(SN, out["seasons.md"]);
  assert.equal(SQ, out["es/seasons.md"]);
});

test("every seasonal good appears with its peak day and computed peak date", () => {
  for (const [g, p] of Object.entries(SEASON_PEAK)) {
    assert.ok(SN.includes(`| ${g} | ${p} | ${dateOf(p)} |`), `missing ${g}`);
    assert.ok(SQ.includes(`| ${p} |`), `missing ES peak day for ${g}`);
  }
});

test("the amplitude and demand multipliers stated match the code", () => {
  assert.ok(SN.includes((1 + SEASON_AMPLITUDE).toFixed(2) + "x at its peak day"));
  assert.ok(SN.includes((1 - SEASON_AMPLITUDE).toFixed(2) + "x half a year away"));
  assert.ok(SN.includes("`DEMAND_SCALE` (" + DEMAND_SCALE + ")"));
  assert.ok(SN.includes("`NEEDS_MUL` (" + NEEDS_MUL + ")"));
  assert.ok(SN.includes("`MAKES_MUL` (" + MAKES_MUL + ")"));
  assert.ok(SQ.includes("`DEMAND_SCALE` (" + DEMAND_SCALE + ")"));
  assert.ok(SN.includes("day 0 (1 January) is " + seasonOf(0)));
});

test("both economy pages link the seasons table and name its constants", () => {
  for (const page of [ECON_EN, ECON_ES]) {
    for (const k of ["SEASON_PEAK", "SEASON_AMPLITUDE", "seasonMul", "seasonOf", "DEMAND_SCALE", "NEEDS_MUL", "MAKES_MUL"]) {
      assert.ok(page.includes("`" + k + "`"), `missing ${k}`);
    }
  }
  assert.ok(ECON_EN.includes("[generated/seasons.md](generated/seasons.md)"));
  assert.ok(ECON_ES.includes("[generated/es/seasons.md](../generated/es/seasons.md)"));
});
