import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildWorld } from "../src/sim/world.mjs";
import { newGame } from "../src/game/game.mjs";
import { nearestPorts, knownPrice, portData, portHtml, tradesHtml } from "../src/view/portview.mjs";
import { refreshIntel } from "../src/game/intel.mjs";

const world = buildWorld(JSON.parse(fs.readFileSync(new URL("../data/world.json", import.meta.url))));
const fresh = () => { const g = newGame(world, "cadiz", { freePlay: true }); refreshIntel(g); return g; };

test("nearest ports are sorted by route length and exclude the port itself", () => {
  const n = nearestPorts(world, "cadiz", 3);
  assert.equal(n.length, 3);
  assert.ok(!n.some((x) => x.id === "cadiz"));
  assert.ok(n[0].km <= n[1].km && n[1].km <= n[2].km);
});
test("unknown ports show no price; known ones show price and age, never hidden data", () => {
  const g = fresh(), nb = nearestPorts(world, "cadiz", 3);
  assert.equal(knownPrice(g, nb[0].id, "grain"), null);
  const d = portData(g, "cadiz", { neighbours: nb });
  assert.ok(d.rows.every((r) => r.others.every((o) => o.price == null)));
  assert.deepEqual(d.best, []);
  assert.match(portHtml(d, { lang: "es" }), /—/);
  assert.match(tradesHtml(d, { lang: "es" }), /ningún negocio rentable/);
});
test("a known neighbour price creates an indicative trade with the fee taken off both sides", () => {
  const g = fresh(), nb = nearestPorts(world, "cadiz", 3), other = nb[0].id;
  g.intel[other] = { day: g.day, exact: true, cells: JSON.parse(JSON.stringify(g.market[other])) };
  g.intel[other].cells.grain.stock = 1; // scarce there: dear
  const d = portData(g, "cadiz", { neighbours: nb });
  const b = d.best.find((x) => x.good === "grain" && x.sellCity === other);
  assert.ok(b && b.margin > 0);
  assert.ok(b.margin < b.sell - b.buy, "fees reduce the margin");
  assert.match(tradesHtml(d, { lang: "en" }), /per unit after fees/);
  const old = portHtml({ ...d }, { lang: "es" });
  assert.ok(old.includes("<b>"));
});
test("age is shown for a stale snapshot and the at-sea message is plain text", () => {
  const g = fresh(), nb = nearestPorts(world, "cadiz", 3);
  g.intel[nb[0].id] = { day: -3, exact: false, cells: JSON.parse(JSON.stringify(g.market[nb[0].id])) };
  assert.match(portHtml(portData(g, "cadiz", { neighbours: nb }), { lang: "es" }), /hace 3 d/);
  assert.match(portHtml(null, { lang: "es" }), /en el mar/);
  assert.match(tradesHtml(null, { lang: "en" }), /at sea/);
});
