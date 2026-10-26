import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { SHIP_TYPES } from "../src/sim/trade.mjs";
import { buildWorld, route } from "../src/sim/world.mjs";

const WORLD = JSON.parse(readFileSync(new URL("../data/world.json", import.meta.url), "utf8"));
const GRAPH = buildWorld(WORLD);
const gen = (f) => readFileSync(new URL(`../docs/wiki/generated/${f}`, import.meta.url), "utf8");

test("routes wiki tables are regenerated from the code and data", () => {
  execFileSync(process.execPath, ["tools/gen_wiki.mjs", "--check"], { stdio: "pipe" });
});

test("the from-Cádiz table covers every port with its route and days", () => {
  for (const f of ["routes.md", "es/routes.md"]) {
    const txt = gen(f);
    const rows = txt.split("\n").filter((l) => l.startsWith("| ") && !l.includes("---") && !l.startsWith("| Port") && !l.startsWith("| Puerto") && !l.startsWith("| From") && !l.startsWith("| Desde"));
    const portRows = rows.slice(0, WORLD.cities.length - 1);
    assert.equal(portRows.length, WORLD.cities.length - 1, `${f}: one row per non-start port`);
    for (const c of WORLD.cities) {
      if (c.id === "cadiz") continue;
      const line = portRows.find((l) => l.startsWith(`| ${c.name} |`));
      assert.ok(line, `${f}: ${c.id} row`);
      const r = route(GRAPH, "cadiz", c.id);
      const cells = line.split("|").map((x) => x.trim());
      assert.equal(Number(cells[2]), Math.round(r.km), `${f}: ${c.id} km`);
      Object.values(SHIP_TYPES).forEach((v, i) => assert.equal(Number(cells[3 + i]), Number((r.km / v.kmPerDay).toFixed(1)), `${f}: ${c.id} days ship ${i}`));
    }
  }
});

test("the lanes table lists every sea lane with its length", () => {
  for (const f of ["routes.md", "es/routes.md"]) {
    const txt = gen(f);
    const laneRows = txt.split("\n").filter((l) => /^\| .* \| .* \| \d+ \|$/.test(l));
    assert.equal(laneRows.length, WORLD.lanes.length, `${f}: one row per lane`);
    for (const [a, b] of WORLD.lanes) {
      const km = Math.round(GRAPH.adj[a].find((e) => e.to === b).km);
      const name = (id) => WORLD.cities.find((c) => c.id === id)?.name ?? id;
      assert.ok(laneRows.some((l) => l.includes(`| ${name(a)} | ${name(b)} | ${km} |`) || l.includes(`| ${name(b)} | ${name(a)} | ${km} |`)), `${f}: lane ${a}-${b}`);
    }
  }
});

test("routes pages and indexes link the generated table", () => {
  for (const f of ["docs/wiki/README.md", "docs/wiki/es/README.md", "docs/wiki/routes.md", "docs/wiki/es/routes.md"]) {
    const txt = readFileSync(new URL(`../${f}`, import.meta.url), "utf8");
    assert.ok(txt.includes("generated/routes.md") || txt.includes("generated/es/routes.md"), `${f} links the generated routes table`);
  }
});
