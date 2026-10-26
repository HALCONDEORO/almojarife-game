import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { COASTS } from "../src/game/charts.mjs";
import { realmOf } from "../src/game/marque.mjs";
import { START_YEAR } from "../src/sim/clock.mjs";

const WORLD = JSON.parse(readFileSync(new URL("../data/world.json", import.meta.url), "utf8"));
const REALMS = JSON.parse(readFileSync(new URL("../data/realms.json", import.meta.url), "utf8"));
const gen = (f) => readFileSync(new URL(`../docs/wiki/generated/${f}`, import.meta.url), "utf8");

test("ports wiki tables are regenerated from the code and data", () => {
  execFileSync(process.execPath, ["tools/gen_wiki.mjs", "--check"], { stdio: "pipe" });
});

test("ports tables cover every port of the world in both languages", () => {
  const en = gen("ports.md"), es = gen("es/ports.md");
  assert.equal((en.match(/^\| /gm) || []).length - 2, WORLD.cities.length);
  assert.equal((es.match(/^\| /gm) || []).length - 2, WORLD.cities.length);
  for (const c of WORLD.cities) {
    for (const txt of [en, es]) {
      const row = txt.split("\n").find((l) => l.startsWith(`| ${c.name}`));
      assert.ok(row, `${c.id} missing from the ports table`);
      assert.ok(row.includes(` ${c.pop} `), `${c.id} start population`);
      const cells = row.split("|").map((x) => x.trim());
      assert.equal(cells[5].split(", ").length, c.makes.length, `${c.id} produces ${c.makes.length} goods`);
      assert.equal(cells[6].split(", ").length, c.needs.length, `${c.id} needs ${c.needs.length} goods`);
    }
    const rowEn = en.split("\n").find((l) => l.startsWith(`| ${c.name}`));
    for (const g of c.makes) assert.ok(rowEn.includes(g), `${c.id} produces ${g}`);
    for (const g of c.needs) assert.ok(rowEn.includes(g), `${c.id} needs ${g}`);
  }
});

test("ports tables keep coasts, realms and river ports from the data", () => {
  const en = gen("ports.md"), es = gen("es/ports.md");
  const rowOf = (txt, name) => txt.split("\n").find((l) => l.startsWith(`| ${name}`));
  for (const [k, coast] of Object.entries(COASTS)) {
    for (const cid of coast.ports) {
      const c = WORLD.cities.find((x) => x.id === cid);
      const r = realmOf(REALMS, cid, START_YEAR);
      const rowEn = rowOf(en, c.name), rowEs = rowOf(es, c.name);
      assert.ok(rowEn && rowEs, `${cid} row in both languages`);
      if (r) {
        assert.ok(rowEn.includes(REALMS.realms[r].name.en), `${cid} realm en`);
        assert.ok(rowEs.includes(REALMS.realms[r].name.es), `${cid} realm es`);
      } else {
        assert.ok(rowEn.includes("| — |"), `${cid} has no verified realm at the start`);
      }
      assert.equal(rowEn.includes("⚓"), !!c.river, `${cid} river flag`);
    }
  }
  assert.ok(rowOf(en, "Málaga").includes("Emirate of Granada"), "Málaga is Nasrid at the 1480 start");
  assert.ok(rowOf(es, "Málaga").includes("Emirato de Granada"));
});

test("ports pages and indexes link the generated table", () => {
  for (const f of ["docs/wiki/README.md", "docs/wiki/es/README.md", "docs/wiki/ports.md", "docs/wiki/es/ports.md"]) {
    const txt = readFileSync(new URL(`../${f}`, import.meta.url), "utf8");
    assert.ok(txt.includes("generated/ports.md") || txt.includes("generated/es/ports.md"), `${f} links the generated ports table`);
  }
  const page = readFileSync(new URL("../docs/wiki/ports.md", import.meta.url), "utf8");
  assert.ok(page.includes(`${WORLD.cities.length} ports`), "port count from the data");
});
