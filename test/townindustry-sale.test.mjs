// Town industry piece 2: selling an establishment moves its production share and its hands
// to the buyer - never duplicating production - and keeps flag-off games byte-identical.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildWorld } from "../src/sim/world.mjs";
import { newGame } from "../src/game/game.mjs";
import { tickMarketCity, seasonMul } from "../src/sim/market.mjs";
import { freeLabor, buildingAt } from "../src/game/buildings.mjs";
import { cajaOf } from "../src/game/council.mjs";
import { townIndustry, buyEstablishment, salesOf, establishmentOf } from "../src/game/townindustry.mjs";
import { serialize, deserialize } from "../src/game/gamesave.mjs";

const world = buildWorld(JSON.parse(fs.readFileSync(new URL("../data/world.json", import.meta.url))));
const FLAG = { cash: 100000, freePlay: true, townIndustry: true };
const firstBuilding = (cityId, kind = "building") => townIndustry(world, cityId).find((e) => e.kind === kind);

test("flag off: sales are refused and nothing moves", () => {
  const g = newGame(world, "cadiz", { cash: 100000, freePlay: true, townIndustry: false });
  const est = firstBuilding("cadiz");
  const cash = g.cash, share = g.market.cadiz[est.good].townShare;
  assert.equal(buyEstablishment(g, "cadiz", est.id, 100).reason, "off");
  assert.equal(g.cash, cash);
  assert.equal(g.market.cadiz[est.good].townShare, share);
  assert.equal(buildingAt(g, "cadiz", est.id), null);
});

test("buying moves the production share, the works and the hands - once", () => {
  const g = newGame(world, "cadiz", FLAG); // home port: office is free
  const est = firstBuilding("cadiz");
  const before = { cash: g.cash, free: freeLabor(g, "cadiz"), share: g.market.cadiz[est.good].townShare ?? 1 };
  const r = buyEstablishment(g, "cadiz", est.id, 500);
  assert.equal(r.ok, true);
  assert.equal(g.cash, before.cash - 500);
  // production share moved, exactly once
  assert.equal(g.market.cadiz[est.good].townShare, Math.round((before.share - est.share) * 1e6) / 1e6);
  // the works are now the buyer's building, active at their level, marked fromTown
  const b = buildingAt(g, "cadiz", est.id);
  assert.deepEqual({ type: b.type, level: b.level, state: b.state, fromTown: b.fromTown }, { type: est.type, level: est.level, state: "active", fromTown: est.id });
  // the hands left the town's own economy and show up as hirable-free accounting
  assert.equal(freeLabor(g, "cadiz"), before.free + est.jobs);
  assert.deepEqual(salesOf(g, "cadiz").ids, [est.id]);
  assert.equal(salesOf(g, "cadiz").jobs, est.jobs);
  // a second sale of the same works is refused
  assert.equal(buyEstablishment(g, "cadiz", est.id, 500).reason, "already sold");
});

test("the market regenerates only the share still in town hands", () => {
  const g = newGame(world, "cadiz", FLAG);
  const est = firstBuilding("cadiz");
  const day = 100, e = g.market.cadiz[est.good];
  // one day of production at a chosen townShare, demand held equal across runs:
  // stock high enough that scarcity pins at 1.5 in both, so consumption cancels in the difference
  const measure = (share) => {
    e.townShare = share; e.stock = e.target * 2;
    tickMarketCity(g.market.cadiz, day, world, { needsLedger: false });
    return e.stock;
  };
  const full = measure(1);
  const sold = measure(1 - est.share);
  const expected = (share) => Math.round(e.rate * 2 * share * seasonMul(est.good, day));
  assert.equal(full - sold, expected(1) - expected(1 - est.share));
  assert.ok(sold < full, "the sold share no longer regenerates");
  delete e.townShare; // back to a fresh row
});

test("municipal sales pay the town chest; a neighbour's sale does not", () => {
  const g = newGame(world, "cadiz", FLAG);
  const municipal = townIndustry(world, "cadiz").find((e) => e.kind === "building" && e.owner.kind === "council");
  const neighbour = townIndustry(world, "cadiz").find((e) => e.kind === "building" && e.owner.kind === "townsfolk");
  const caja0 = cajaOf(g, "cadiz"), alm0 = g.hallAlmoneda?.cadiz ?? 0;
  assert.equal(buyEstablishment(g, "cadiz", municipal.id, 700).ok, true);
  assert.equal(cajaOf(g, "cadiz"), caja0 + 700);
  assert.equal(g.hallAlmoneda.cadiz, alm0 + 700); // municipal income counted apart on the direct channel too
  assert.equal(buyEstablishment(g, "cadiz", neighbour.id, 700).ok, true);
  assert.equal(cajaOf(g, "cadiz"), caja0 + 700); // the neighbour takes his coins home
  assert.equal(g.hallAlmoneda.cadiz, alm0 + 700); // and the ledger does not invent municipal income
});

test("refusals: representation-only types, strangers, no office, no cash, bad prices", () => {
  const rep = firstBuilding("cadiz", "rep"); // the tannery is representation-only
  const g = newGame(world, "cadiz", FLAG);
  assert.equal(buyEstablishment(g, "cadiz", rep.id, 100).reason, "not for sale");
  assert.equal(buyEstablishment(g, "cadiz", "cadiz:salt:99", 100).reason, "unknown establishment");
  assert.equal(buyEstablishment(g, "nowhere", rep.id, 100).reason, "unknown city");
  assert.equal(buyEstablishment(g, "lisboa", firstBuilding("lisboa").id, 100).reason, "office required");
  const poor = newGame(world, "cadiz", { ...FLAG, cash: 10 });
  assert.equal(buyEstablishment(poor, "cadiz", firstBuilding("cadiz").id, 1000000).reason, "no cash");
  assert.equal(buyEstablishment(g, "cadiz", firstBuilding("cadiz").id, 0).reason, "bad price");
  assert.equal(buyEstablishment(g, "cadiz", firstBuilding("cadiz").id, 1.5).reason, "bad price");
});

test("selling several works of one good never takes the share below zero and saves round-trip", () => {
  const g = newGame(world, "bilbao", FLAG);
  const good = world.cities.find((c) => c.id === "bilbao").makes[0];
  const entries = townIndustry(world, "bilbao").filter((e) => e.good === good && e.kind === "building");
  for (const [i, est] of entries.entries()) {
    g.offices.includes("bilbao") || g.offices.push("bilbao"); // home is cadiz: grant the office
    assert.equal(buyEstablishment(g, "bilbao", est.id, 100).ok, true, `sale ${i}`);
  }
  const share = g.market.bilbao[good].townShare;
  assert.ok(share >= -1e-9 && share < 1, `share ${share} in [0,1)`);
  const g2 = deserialize(serialize(g, "T"), world).g;
  assert.equal(g2.market.bilbao[good].townShare, share);
  assert.deepEqual(salesOf(g2, "bilbao"), salesOf(g, "bilbao"));
  assert.ok(buildingAt(g2, "bilbao", entries[0].id));
  assert.equal(establishmentOf(world, entries[0].id).id, entries[0].id);
});
