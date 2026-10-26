import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { BUILDING_TYPES, JOBS_PER_LEVEL, CIVIC_BUILDINGS, OFFICE_PRICE, OFFICE_MIN_RESPECT, CIVIC_MIN_RESPECT, CIVIC_BIG_RESPECT } from "../src/game/buildings.mjs";
import { RECIPES, IMPORT_MUL } from "../src/sim/recipes.mjs";

const gen = (f) => readFileSync(new URL(`../docs/wiki/generated/${f}`, import.meta.url), "utf8");
const page = (f) => readFileSync(new URL(`../docs/wiki/${f}`, import.meta.url), "utf8");

test("buildings wiki tables are regenerated from the code and data", () => {
  execFileSync(process.execPath, ["tools/gen_wiki.mjs", "--check"], { stdio: "pipe" });
});

test("buildings tables list every type in code order with its values", () => {
  const types = Object.entries(BUILDING_TYPES);
  for (const f of ["buildings.md", "es/buildings.md"]) {
    const rows = gen(f).split("\n").filter((l) => l.startsWith("| ") && !l.includes("---")).slice(1);
    assert.equal(rows.length, types.length, `${f}: one row per building type`);
    types.forEach(([k, v], i) => {
      const cells = rows[i].split("|").map((x) => x.trim());
      assert.equal(Number(cells[2]), v.fee, `${f} ${k} fee`);
      assert.equal(Number(cells[3]), v.buildDays, `${f} ${k} build days`);
      assert.equal(Number(cells[4]), v.upkeep, `${f} ${k} upkeep`);
      assert.equal(Number(cells[5]), JOBS_PER_LEVEL[k] ?? 0, `${f} ${k} workers`);
      assert.equal(cells[1].includes("†"), CIVIC_BUILDINGS.includes(k), `${f} ${k} civic mark`);
      assert.equal(cells[1].includes("‡"), !!v.minPop, `${f} ${k} minPop mark`);
      const mats = cells[6].split(", ");
      assert.equal(mats.length, Object.keys(RECIPES[v.recipe]).length, `${f} ${k} materials count`);
      for (const [g, n] of Object.entries(RECIPES[v.recipe])) {
        assert.ok(mats.some((m) => m.endsWith(` ${n}`)), `${f} ${k} material ${g} ${n}`);
        if (f === "buildings.md") assert.ok(mats.some((m) => m.startsWith(g)), `${f} ${k} material ${g}`);
      }
    });
  }
});

test("buildings pages tie the gates and costs to their constants", () => {
  for (const f of ["buildings.md", "es/buildings.md"]) {
    const txt = page(f);
    for (const needle of [`OFFICE_PRICE`, `${OFFICE_PRICE}`, `OFFICE_MIN_RESPECT`, `${OFFICE_MIN_RESPECT}`, "IMPORT_MUL", `${IMPORT_MUL}`, "WAGE_PER_WORKER", "CIVIC_MIN_RESPECT", `${CIVIC_MIN_RESPECT}`, "CIVIC_BIG_RESPECT", `${CIVIC_BIG_RESPECT}`, "generated/buildings.md"]) {
      assert.ok(txt.includes(needle), `${f} mentions ${needle}`);
    }
    assert.ok(txt.includes(`${BUILDING_TYPES.corral.minPop.toLocaleString("en-US")}`) || txt.includes("15.000"), `${f} corral minPop`);
  }
  assert.equal(Object.keys(BUILDING_TYPES).length, 32, "type count the pages promise");
  for (const f of ["README.md", "es/README.md"]) {
    const txt = page(f);
    assert.ok(txt.includes("generated/buildings.md") || txt.includes("generated/es/buildings.md"), `${f} links the table`);
  }
});
