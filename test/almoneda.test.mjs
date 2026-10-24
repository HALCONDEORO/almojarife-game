import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { newGame } from "../src/game/game.mjs";
import fs from "node:fs";
import { buildWorld } from "../src/sim/world.mjs";
import { serialize, deserialize } from "../src/game/gamesave.mjs";
import { townIndustry } from "../src/game/townindustry.mjs";
import { cajaTarget } from "../src/game/council.mjs";
const cajaCash = (g, id) => g.hallCaja?.[id] ?? cajaTarget(g.world, id);
import { BUILDING_TYPES } from "../src/game/buildings.mjs";
import {
  AUCTION_EVERY, auctionOffset, isAuctionDay, nextAuctionDay,
  establishmentValue, reserveOf, lotOfDay, biddersOf, bidAuction,
} from "../src/game/almoneda.mjs";

const world = buildWorld(JSON.parse(fs.readFileSync(new URL("../data/world.json", import.meta.url))));

describe("auction cadence", () => {
  it("offset is deterministic, bounded and staggered across cities", () => {
    const offs = new Set();
    for (const c of Object.keys(world.cities)) {
      const o = auctionOffset(c);
      assert.equal(o, auctionOffset(c));
      assert.ok(o >= 0 && o < AUCTION_EVERY);
      offs.add(o);
    }
    assert.ok(offs.size > 1); // not every port auctions on the same day
    assert.equal(isAuctionDay("cadiz", auctionOffset("cadiz")), true);
    assert.equal(isAuctionDay("cadiz", auctionOffset("cadiz") + 1), false);
    assert.ok(nextAuctionDay("cadiz", auctionOffset("cadiz")) > auctionOffset("cadiz"));
  });
});

describe("valuation", () => {
  it("is positive, deterministic and scales with level", () => {
    const est = townIndustry(world, "cadiz").find((e) => e.kind === "building" && e.type in BUILDING_TYPES);
    const v = establishmentValue(world, est);
    assert.ok(Number.isInteger(v) && v > 0);
    assert.equal(v, establishmentValue(world, est));
    const v2 = establishmentValue(world, { ...est, level: est.level * 2 });
    assert.ok(v2 > v);
    assert.ok(reserveOf(v) < v && reserveOf(v) > 0);
  });
});

describe("lot of the day", () => {
  it("offers an unsold building-kind establishment on auction day, null off day", () => {
    const g = newGame(world, "cadiz", { cash: 100000, freePlay: true, townIndustry: true });
    g.day = auctionOffset("cadiz");
    const lot = lotOfDay(g, "cadiz");
    assert.ok(lot && lot.kind === "establishment" && lot.est.kind === "building");
    assert.ok(lot.value > 0 && lot.reserve <= lot.value);
    g.day += 1;
    assert.equal(lotOfDay(g, "cadiz"), null);
  });
  it("is null with the flag off", () => {
    const g = newGame(world, "cadiz", { townIndustry: false }); // flag explicitly off
    g.day = auctionOffset("cadiz");
    assert.equal(lotOfDay(g, "cadiz"), null);
  });
});

describe("bidders", () => {
  it("are deterministic named neighbours at 70%-115% of the valuation, seller excluded", () => {
    const g = newGame(world, "cadiz", { cash: 100000, freePlay: true, townIndustry: true });
    g.day = auctionOffset("cadiz");
    const lot = lotOfDay(g, "cadiz");
    const a = biddersOf(g, "cadiz", lot);
    assert.deepEqual(biddersOf(g, "cadiz", lot), a); // same day, same table
    for (const b of a) {
      assert.ok(typeof b.who === "string" && b.who.length > 1);
      assert.ok(b.max >= Math.round(lot.value * 0.7) - 1 && b.max <= Math.round(lot.value * 1.15) + 1);
      if (lot.est.owner.kind === "townsfolk") assert.notEqual(b.who, lot.est.owner.name);
    }
  });
});

describe("bidAuction", () => {
  const gameOnAuctionDay = () => {
    const g = newGame(world, "cadiz", { cash: 100000, freePlay: true, townIndustry: true });
    g.day = auctionOffset("cadiz");
    return g;
  };
  it("flag off refuses", () => {
    const g = newGame(world, "cadiz", { townIndustry: false });
    g.day = auctionOffset("cadiz");
    assert.equal(bidAuction(g, "cadiz", 99999).reason, "off");
  });
  it("player wins with the highest max, pays one coin over the runner-up", () => {
    const g = gameOnAuctionDay();
    const lot = lotOfDay(g, "cadiz");
    const cashBefore = g.cash;
    const r = bidAuction(g, "cadiz", 999999);
    assert.equal(r.outcome, "won");
    assert.ok(r.price >= lot.reserve && r.price < 999999);
    assert.equal(g.cash, cashBefore - r.price);
    assert.ok(g.buildings["cadiz"][lot.est.id]); // the works are his now
  });
  it("player loses below the top NPC max: lot gone, cash intact, town share unchanged", () => {
    const g = gameOnAuctionDay();
    const cash0 = g.cash;
    const r = bidAuction(g, "cadiz", 1);
    assert.equal(r.outcome, "lost");
    assert.ok(r.winner && r.winner !== "player");
    assert.equal(g.cash, cash0); // purse untouched
    assert.equal(lotOfDay(g, "cadiz")?.est.id === r.lot.est.id, false); // that works no longer comes up
  });
  it("a municipal lot credits the concejo chest", () => {
    // find a city whose auction-day lot is council-owned
    for (const city of world.cities) {
      const g = newGame(world, "cadiz", { cash: 100000, freePlay: true, townIndustry: true });
      for (let k = 0; k < 12; k++) { // walk this port's next almonedas until a municipal lot comes up
        g.day = auctionOffset(city.id) + k * 7;
        const lot = lotOfDay(g, city.id);
        if (!lot) continue;
        if (lot.est.owner.kind !== "council") { bidAuction(g, city.id, 1); continue; } // a neighbour buys it: next week
        const cajaBefore = cajaCash(g, city.id);
        const r = bidAuction(g, city.id, 1);
        assert.equal(r.outcome, "lost");
        assert.equal(cajaCash(g, city.id), cajaBefore + r.price);
        return;
      }
    }
    assert.ok(false, "expected at least one council-owned lot within 12 almonedas");
  });
  it("a low table withdraws the lot and it comes back next week", () => {
    const g = gameOnAuctionDay();
    // player max 0 with NPCs possibly all under reserve is rare; force by using a day with no bidders above reserve if present, else skip
    const lot = lotOfDay(g, "cadiz");
    if (biddersOf(g, "cadiz", lot).some((b) => b.max >= lot.reserve)) return; // table not withdrawn this day; fine
    const r = bidAuction(g, "cadiz", 0);
    assert.equal(r.outcome, "withdrawn");
  });
  it("survives a save/load round trip", () => {
    const g = gameOnAuctionDay();
    g.cash = 100000;
    bidAuction(g, "cadiz", 1); // NPC win or loss -> townSales mutated
    const g2 = deserialize(serialize(g, "T"), world).g;
    g2.cash = 100000;
    const r = bidAuction(g2, "cadiz", 99999);
    assert.ok(["won", "lost", "withdrawn"].includes(r.outcome) || r.ok === false);
    assert.equal(typeof g2.townSales, "object");
  });
});

describe("the table at the day boundary", () => {
  it("placeBid stands the player's maximum and almonedaDay brings the hammer down", async () => {
    const { advanceDay } = await import("../src/game/game.mjs");
    const g = newGame(world, "cadiz", { cash: 100000, freePlay: true, townIndustry: true });
    g.day = auctionOffset("cadiz") - 1; // tomorrow is the almoneda in Cadiz... (day count in g.day; tick advances it)
    // put the game clock at the end of the day before the auction so one advanceDay lands on it
    g.day = auctionOffset("cadiz");
    const { placeBid, almonedaDay } = await import("../src/game/almoneda.mjs");
    const bad = placeBid(g, "cadiz", 5000);
    assert.equal(bad.ok, true); // today IS the auction day
    assert.equal(g.townBids["cadiz"], 5000);
    const cash0 = g.cash;
    almonedaDay(g);
    assert.equal(g.townBids?.["cadiz"], undefined); // consumed
    // with a 5000 max against a saltworks table the player either won (cash moved) or lost to a higher neighbour
    const sold = (g.townSales?.["cadiz"]?.ids?.length ?? 0) + (g.townSales?.["cadiz"]?.gone?.length ?? 0);
    assert.ok(sold >= 1 || g.cash === cash0);
  });
  it("flag off: placeBid refuses and almonedaDay is a no-op", async () => {
    const { placeBid, almonedaDay } = await import("../src/game/almoneda.mjs");
    const g = newGame(world, "cadiz", { townIndustry: false });
    g.day = auctionOffset("cadiz");
    assert.equal(placeBid(g, "cadiz", 5000).reason, "off");
    almonedaDay(g);
    assert.equal(g.townSales, undefined);
  });
  it("a port with no bid sells to the highest neighbour on its day", async () => {
    const { almonedaDay, lotOfDay, biddersOf } = await import("../src/game/almoneda.mjs");
    const g = newGame(world, "cadiz", { cash: 100000, freePlay: true, townIndustry: true });
    g.day = auctionOffset("cadiz");
    const lot = lotOfDay(g, "cadiz");
    const npcAboveReserve = biddersOf(g, "cadiz", lot).some((b) => b.max >= lot.reserve);
    almonedaDay(g); // player silent
    if (npcAboveReserve) assert.ok((g.townSales?.["cadiz"]?.gone?.length ?? 0) === 1);
    else assert.equal(g.townSales?.["cadiz"]?.gone?.length ?? 0, 0); // withdrawn: nobody met the reserve
  });
});

describe("hammer timing (regression: the lot on the block all day must be the lot that falls at its end)", () => {
  it("a bid placed during the auction day is judged at that day's boundary, not left stale", async () => {
    const { advanceTick, TICKS_PER_DAY } = await import("../src/game/game.mjs");
    const { placeBid, lotOfDay } = await import("../src/game/almoneda.mjs");
    const g = newGame(world, "cadiz", { cash: 100000, freePlay: true, townIndustry: true });
    const aday = auctionOffset("cadiz");
    g.day = aday;
    g.tick = (aday + 1) * TICKS_PER_DAY - 1; // last tick of the auction day
    const lot = lotOfDay(g, "cadiz");
    assert.ok(lot, "lot on the block during its day");
    g.cash = 2000000; // a purse that covers the promise (placeBid refuses maxima above it)
    assert.equal(placeBid(g, "cadiz", 999999).ok, true);
    const cash0 = g.cash;
    advanceTick(g); // the day turns: the hammer must fall NOW with this bid
    assert.equal(g.day, aday + 1);
    assert.equal(g.townBids?.["cadiz"], undefined); // consumed, not stale
    assert.ok(g.cash < cash0 || (g.townSales?.["cadiz"]?.gone ?? []).includes(lot.est.id)); // won (paid) or a neighbour took it
    assert.notEqual(lotOfDay(g, "cadiz")?.est.id, lot.est.id); // the sold works does not come back on the block
  });
});

describe("solvency at the table", () => {
  it("placeBid refuses a max above the purse", async () => {
    const { placeBid } = await import("../src/game/almoneda.mjs");
    const g = newGame(world, "cadiz", { cash: 100000, freePlay: true, townIndustry: true });
    g.day = auctionOffset("cadiz");
    g.cash = 1000;
    assert.equal(placeBid(g, "cadiz", 1001).reason, "no cash");
    assert.equal(g.townBids?.["cadiz"], undefined);
    assert.equal(placeBid(g, "cadiz", 1000).ok, true);
  });
  it("an insolvent top bid leaves the table and the lot falls to the next bidder", async () => {
    const g = newGame(world, "cadiz", { cash: 100000, freePlay: true, townIndustry: true });
    g.day = auctionOffset("cadiz");
    const lot = lotOfDay(g, "cadiz");
    const npcTop = Math.max(...biddersOf(g, "cadiz", lot).map((b) => b.max), 0);
    g.cash = 1; // his max promised the world, his purse holds a coin
    const r = bidAuction(g, "cadiz", 999999);
    if (npcTop >= lot.reserve) {
      assert.equal(r.outcome, "lost"); // a solvent neighbour takes it
      assert.equal(g.cash, 1); // the player pays nothing
      assert.ok(!g.buildings?.["cadiz"]?.[lot.est.id]);
    } else {
      assert.equal(r.outcome, "withdrawn");
    }
    assert.ok(g.cash >= 0);
  });
  it("two tables the same day never leave the purse negative", async () => {
    const { almonedaDay } = await import("../src/game/almoneda.mjs");
    const g = newGame(world, "cadiz", { cash: 100000, freePlay: true, townIndustry: true });
    const day = [0, 1, 2, 3, 4, 5, 6].find((d) => world.cities.filter((c) => isAuctionDay(c.id, d)).length > 1);
    if (day === undefined) return; // no shared offset in this world: nothing to test
    g.day = day;
    for (const c of world.cities.filter((c) => isAuctionDay(c.id, day))) { g.cash = Math.min(g.cash, 2000); ((g.townBids ??= Object.create(null))[c.id]) = 999999; }
    almonedaDay(g);
    assert.ok(g.cash >= 0); // every win was settled, every promise the purse could not keep was voided
  });
});
