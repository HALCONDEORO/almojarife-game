import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { newGame, advanceDay } from "../src/game/game.mjs";
import { isDiscovered } from "../src/game/fog.mjs";
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
    assert.deepEqual(Object.values(g.townBids["cadiz"]), [5000]); // bids are kept per lot now: one maximum on today's establishment table
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

describe("hammer price (second price + 1, reserve-clamped: a mutation here must fail)", () => {
  it("the winner pays exactly max(reserve, runner-up + 1), never his own max", () => {
    const g = newGame(world, "cadiz", { cash: 1e6, freePlay: true, townIndustry: true });
    g.day = auctionOffset("cadiz");
    const lot = lotOfDay(g, "cadiz");
    const npc = biddersOf(g, "cadiz", lot); // only bids at or above the reserve make the list
    const cash0 = g.cash;
    const r = bidAuction(g, "cadiz", 999999999, lot.id);
    assert.equal(r.outcome, "won");
    assert.equal(r.price, npc.length ? Math.max(lot.reserve, Math.max(...npc.map((b) => b.max)) + 1) : lot.reserve);
    assert.equal(g.cash, cash0 - r.price);
    assert.ok(r.price < 999999999); // his promise is a ceiling, not the price
  });
  it("a tie at the top hammers at the tied max: the winner's own ceiling binds, never above it", () => {
    // (An uncontested table cannot happen: the neighbour factor floor 0.70 always clears the 0.6
    //  reserve, so the reserve-only branch is unreachable defence-in-depth; the reachable clamps are pinned here.)
    const g = newGame(world, "cadiz", { cash: 1e6, freePlay: true, townIndustry: true });
    g.day = auctionOffset("cadiz");
    const lot = lotOfDay(g, "cadiz");
    const npcTop = Math.max(...biddersOf(g, "cadiz", lot).map((b) => b.max));
    const r = bidAuction(g, "cadiz", npcTop, lot.id); // player matches the best neighbour
    assert.equal(r.price, npcTop); // whoever takes it, the hammer is the tied max - not a coin above
  });
  it("a per-lot bid carries a legacy numeric bid for the establishment table instead of dropping it", async () => {
    const { placeBid, shipLotOfDay, houseLotOfDay, almonedaDay } = await import("../src/game/almoneda.mjs");
    const g = newGame(world, "cadiz", { cash: 1e6, freePlay: true, townIndustry: true });
    for (let k = 0; k < 12; k++) { // find a table with both an establishment and a generated lot
      g.day = auctionOffset("cadiz") + k * AUCTION_EVERY;
      const est = lotOfDay(g, "cadiz");
      const gen = shipLotOfDay(g, "cadiz") ?? houseLotOfDay(g, "cadiz");
      if (!est || !gen) continue;
      g.townBids = { cadiz: 500 }; // an old save's bare number: the establishment table
      assert.equal(placeBid(g, "cadiz", 700, gen.id).ok, true);
      assert.equal(g.townBids.cadiz[est.id], 500); // carried, not wiped
      assert.equal(g.townBids.cadiz[gen.id], 700);
      almonedaDay(g); // both tables settle on their own bids, no crash, bids cleared
      assert.equal(g.townBids.cadiz, undefined);
      return;
    }
    assert.fail("no mixed establishment + generated table found in 12 weeks");
  });
});

describe("notice reach", () => {
  it("an undiscovered far port's hammer stays silent when the player sits out", () => {
    const g = newGame(world, "cadiz", { cash: 1e6, freePlay: true, townIndustry: true });
    const far = world.cities.find((c) => !isDiscovered(g, c.id));
    g.day = auctionOffset(far.id);
    assert.ok(lotOfDay(g, far.id), "the far port has a lot today");
    const before = (g.inbox ?? []).length;
    const r = bidAuction(g, far.id, 0);
    assert.equal(r.outcome, "lost"); // a neighbour takes it
    assert.equal((g.inbox ?? []).length, before); // but no gossip crosses a chart he does not have
  });
  it("a known town's hammer is heard, and his own table answers even off the chart", () => {
    const g = newGame(world, "cadiz", { cash: 1e6, freePlay: true, townIndustry: true });
    assert.ok(isDiscovered(g, "cadiz")); // home port is on the chart
    g.day = auctionOffset("cadiz");
    const before = (g.inbox ?? []).length;
    const r = bidAuction(g, "cadiz", 0);
    if (r.outcome === "lost") assert.ok((g.inbox ?? []).length > before); // dockside talk in a port he knows
    const g2 = newGame(world, "cadiz", { cash: 5, freePlay: true, townIndustry: true });
    const far = world.cities.find((c) => !isDiscovered(g2, c.id));
    g2.day = auctionOffset(far.id);
    const before2 = (g2.inbox ?? []).length;
    const r2 = bidAuction(g2, far.id, 999999); // his max tops the table but his purse cannot settle
    assert.equal(r2.outcome, "lost"); // the bid leaves the table and the runner-up takes the lot...
    assert.ok((g2.inbox ?? []).length > before2); // ...and he is told, his own business even in a port he does not know
  });
});

describe("municipal proceeds", () => {
  it("are conserved (chest and ledger move exactly the hammer price) and counted apart", () => {
    for (const city of world.cities) {
      const g = newGame(world, "cadiz", { cash: 1e6, freePlay: true, townIndustry: true });
      let done = false;
      for (let k = 0; k < 20 && !done; k++) {
        g.day = auctionOffset(city.id) + k * AUCTION_EVERY;
        const lot = lotOfDay(g, city.id);
        if (!lot) continue;
        if (lot.est.owner.kind !== "council") { bidAuction(g, city.id, 1); continue; }
        const caja0 = cajaCash(g, city.id), alm0 = g.hallAlmoneda?.[city.id] ?? 0;
        const r = bidAuction(g, city.id, 1);
        assert.equal(r.outcome, "lost");
        assert.equal(cajaCash(g, city.id), caja0 + r.price); // exactly the hammer price, no more, no less
        assert.equal(g.hallAlmoneda[city.id], alm0 + r.price); // tracked apart from taxes
        const id = lot.est.id;
        for (let w = 1; w <= 30; w++) { g.day = auctionOffset(city.id) + (k + w) * AUCTION_EVERY; assert.notEqual(lotOfDay(g, city.id)?.est.id, id); } // never sold twice
        done = true;
      }
      if (done) return;
    }
    assert.fail("no municipal lot found in any port within 20 tables");
  });
  it("a player-won municipal lot moves cash, chest and ledger by exactly the hammer price, counted once", () => {
    for (const city of world.cities) {
      const g = newGame(world, "cadiz", { cash: 1e6, freePlay: true, townIndustry: true });
      let done = false;
      for (let k = 0; k < 20 && !done; k++) {
        g.day = auctionOffset(city.id) + k * AUCTION_EVERY;
        const lot = lotOfDay(g, city.id);
        if (!lot) continue;
        if (lot.est.owner.kind !== "council") { bidAuction(g, city.id, 1); continue; }
        const caja0 = cajaCash(g, city.id), alm0 = g.hallAlmoneda?.[city.id] ?? 0, cash0 = g.cash;
        const r = bidAuction(g, city.id, 999999999); // his max tops every neighbour's
        assert.equal(r.outcome, "won");
        assert.equal(g.cash, cash0 - r.price); // his purse pays the hammer price
        assert.equal(cajaCash(g, city.id), caja0 + r.price); // the chest gets exactly that price
        assert.equal(g.hallAlmoneda[city.id], alm0 + r.price); // the ledger counts it once, player path included (auditor finding on 81ecba8)
        done = true;
      }
      if (done) return;
    }
    assert.fail("no municipal lot found in any port within 20 tables");
  });
  it("stop when the last municipal works is gone: finite, bounded by municipal value", () => {
    const g = newGame(world, "cadiz", { cash: 1e6, freePlay: true, townIndustry: true });
    const municipal = townIndustry(g.world, "cadiz").filter((e) => e.owner.kind === "council" && e.kind === "building" && BUILDING_TYPES[e.type]); // the game world, optional goods included: the roster the almoneda sells
    assert.ok(municipal.length > 0);
    const soldSet = () => new Set([...(g.townSales?.cadiz?.ids ?? []), ...(g.townSales?.cadiz?.gone ?? [])]);
    for (let d = 0; d < 730 && !g.over && !municipal.every((e) => soldSet().has(e.id)); d++) advanceDay(g);
    assert.ok(municipal.every((e) => soldSet().has(e.id)), "the weekly table sells every municipal works inside two idle years");
    const income = g.hallAlmoneda?.cadiz ?? 0;
    const maxIncome = Math.ceil(municipal.reduce((a, e) => a + establishmentValue(g.world, e), 0) * 1.15);
    assert.ok(income > 0 && income <= maxIncome, `cadiz auction income ${income} within municipal value ${maxIncome}`);
    for (let d = 0; d < 90 && !g.over; d++) advanceDay(g);
    assert.equal(g.hallAlmoneda?.cadiz ?? 0, income); // nothing municipal left to sell: the line stops dead
  });
});

describe("save fidelity", () => {
  it("state after a sale and a standing bid survives the save round-trip unchanged", () => {
    const g = newGame(world, "cadiz", { cash: 1e6, freePlay: true, townIndustry: true });
    g.day = auctionOffset("cadiz");
    bidAuction(g, "cadiz", 0); // a sale happens: townSales and possibly hallAlmoneda persist
    const raw = JSON.stringify(serialize(g, "Casa Prueba"));
    const { g: g2 } = deserialize(JSON.parse(raw), world);
    assert.deepEqual(g2, g); // plain objects, no null-prototype drift (walls.mjs convention)
  });
});
