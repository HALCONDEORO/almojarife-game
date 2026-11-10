import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildWorld } from "../src/sim/world.mjs";
import { newGame } from "../src/game/game.mjs";
import { price } from "../src/sim/market.mjs";
import { FEE } from "../src/sim/trade.mjs";
import { holdDeals, portData, portHtml, nearestPorts } from "../src/view/portview.mjs";
import { refreshIntel } from "../src/game/intel.mjs";

const world = buildWorld(JSON.parse(fs.readFileSync(new URL("../data/world.json", import.meta.url))));
const fresh = () => { const g = newGame(world, "cadiz", { freePlay: true }); refreshIntel(g); return g; };
const withCargo = (g, cargo = { grain: 10 }, basis = { grain: 40 }) => { const s = g.ships[0]; s.cargo = { ...cargo }; s.basis = { ...basis }; return s; };
const tell = (g, city, good, stock) => { g.intel[city] = { day: g.day, exact: true, cells: JSON.parse(JSON.stringify(g.market[city])) }; if (stock != null && g.intel[city].cells[good]) g.intel[city].cells[good].stock = stock; };

test("no ship, a ship at sea, an unknown type or an empty hold give no deals", () => {
  const g = fresh(), s = withCargo(g);
  assert.deepEqual(holdDeals(g, null), []);
  s.voyage = { to: "lisboa" }; assert.deepEqual(holdDeals(g, s), []);
  s.voyage = null; s.type = "zeppelin"; assert.deepEqual(holdDeals(g, s), []);
  s.type = "cog"; s.cargo = {}; assert.deepEqual(holdDeals(g, s), []);
});

test("with no intel the only candidate is the current port, at its live price with no travel cost", () => {
  const g = fresh(), s = withCargo(g);
  const d = holdDeals(g, s);
  assert.equal(d.length, 1);
  assert.equal(d[0].city, "cadiz");
  assert.equal(d[0].travelDays, 0);
  const sell = price(world, g.market.cadiz.grain, "grain");
  assert.equal(d[0].net, Math.round(sell * (1 - FEE) * 10 - 40)); // revenue after the fee minus what the cargo cost
});

test("a dear known neighbour wins, and the upkeep of the days at sea comes off the gain", () => {
  const g = fresh(), s = withCargo(g), other = nearestPorts(world, "cadiz", 1)[0].id;
  tell(g, other, "grain", 1); // scarce there: dear
  const d = holdDeals(g, s);
  assert.equal(d.length, 1);
  assert.equal(d[0].city, other);
  assert.ok(d[0].travelDays > 0);
  const gross = Math.round(d[0].sell * (1 - FEE) * 10 - 40);
  assert.ok(d[0].net < gross, "upkeep of the voyage days is netted off");
  g.upkeepMul = 100000; // ruinous wages: staying beats sailing even to a dear port
  assert.equal(holdDeals(g, s)[0].city, "cadiz");
});

test("ports the player knows nothing about are never used, however good their hidden price", () => {
  const g = fresh(), s = withCargo(g), others = nearestPorts(world, "cadiz", 3);
  for (const n of others) g.market[n.id].grain.stock = 0; // dear everywhere, but unknown
  const d = holdDeals(g, s);
  assert.deepEqual(d.map((x) => x.city), ["cadiz"]);
});

test("deals sort by net profit and cap at five", () => {
  const g = fresh(), other = nearestPorts(world, "cadiz", 1)[0].id;
  const goods = Object.keys(world.goods).filter((k) => g.market.cadiz[k] && g.market[other][k]).slice(0, 6);
  assert.ok(goods.length >= 6);
  const cargo = {}, basis = {};
  goods.forEach((good, i) => { cargo[good] = 10; basis[good] = 0; tell(g, other, good, 1 + i * 50); });
  const d = holdDeals(g, withCargo(g, cargo, basis));
  assert.equal(d.length, 5);
  assert.ok(d.every((x, i) => !i || d[i - 1].net >= x.net));
});

test("portData carries the hold deals for the docked ship and portHtml renders them, escaped", () => {
  const g = fresh(), s = withCargo(g), other = nearestPorts(world, "cadiz", 1)[0].id;
  tell(g, other, "grain", 1);
  assert.equal(portData(g, other, { ship: s }).hold.length, 0); // ship docked elsewhere: no section
  const d = portData(g, "cadiz", { ship: s });
  assert.equal(d.hold.length, 1);
  const html = portHtml(d, { lang: "en", cityName: (x) => `<${x}>`, goodName: (x) => `<${x}>` });
  assert.match(html, /From your hold/);
  assert.match(html, /&lt;grain&gt;/); // names from callbacks are escaped
  assert.ok(!html.includes("<grain>"));
  assert.match(portHtml(d, { lang: "es" }), /Desde tu bodega/);
});
