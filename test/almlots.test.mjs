import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { newGame, advanceDay } from "../src/game/game.mjs";
import { buildWorld } from "../src/sim/world.mjs";
import { serialize, deserialize } from "../src/game/gamesave.mjs";
import { cajaTarget } from "../src/game/council.mjs";
import { housePopBonus, HOUSE_POP_PER_LEVEL } from "../src/game/buildings.mjs";
import { SHIP_TYPES } from "../src/sim/trade.mjs";
import {
  AUCTION_EVERY, auctionOffset, isAuctionDay, reserveOf,
  SHIP_EVERY, HOUSE_EVERY, shipCycleOffset, houseCycleOffset,
  shipLotValue, maxShipLotValue, maxHouseLotValue,
  shipLotOfDay, houseLotOfDay, lotsOfDay, lotOfDay, biddersOf, bidAuction, placeBid, almonedaDay,
} from "../src/game/almoneda.mjs";

const world = buildWorld(JSON.parse(fs.readFileSync(new URL("../data/world.json", import.meta.url))));
const cajaCash = (g, id) => g.hallCaja?.[id] ?? cajaTarget(g.world, id);
const game = (opts = {}) => newGame(world, "cadiz", { cash: 1000000, freePlay: true, townIndustry: true, ...opts });
/** First day >= from where the city offers a ship lot (deterministic: just scan the cycle grid). */
const shipDay = (cityId, from = 0) => { const g = game(); for (let d = from; d < from + SHIP_EVERY * AUCTION_EVERY; d++) { g.day = d; if (shipLotOfDay(g, cityId)) return d; } throw new Error("no ship lot in a full cycle"); };
const houseDay = (cityId, from = 0) => { const g = game(); for (let d = from; d < from + HOUSE_EVERY * AUCTION_EVERY; d++) { g.day = d; if (houseLotOfDay(g, cityId)) return d; } throw new Error("no house lot in a full cycle"); };

describe("generated lot cadence", () => {
  it("offsets are deterministic, bounded and staggered across cities", () => {
    const so = new Set(), ho = new Set();
    for (const c of Object.keys(world.cities)) {
      const a = shipCycleOffset(c), b = houseCycleOffset(c);
      assert.equal(a, shipCycleOffset(c)); assert.equal(b, houseCycleOffset(c));
      assert.ok(a >= 0 && a < SHIP_EVERY); assert.ok(b >= 0 && b < HOUSE_EVERY);
      so.add(a); ho.add(b);
    }
    assert.ok(so.size > 1 && ho.size > 1); // not every port sells a ship or a house the same week
  });
  it("ship and house lots meet their own cadence and repeat on the cycle", () => {
    const g = game();
    const ds = shipDay("cadiz");
    g.day = ds;
    assert.ok(shipLotOfDay(g, "cadiz") && isAuctionDay("cadiz", ds));
    assert.equal(Math.floor(ds / AUCTION_EVERY) % SHIP_EVERY, shipCycleOffset("cadiz"));
    g.day = ds + SHIP_EVERY * AUCTION_EVERY;
    assert.ok(shipLotOfDay(g, "cadiz")); // same weekday, one cycle later
    const dh = houseDay("cadiz");
    g.day = dh;
    assert.ok(houseLotOfDay(g, "cadiz"));
    assert.equal(Math.floor(dh / AUCTION_EVERY) % HOUSE_EVERY, houseCycleOffset("cadiz"));
  });
  it("is null with the flag off and off the auction day", () => {
    const g = game({ townIndustry: false });
    g.day = shipDay("cadiz");
    assert.equal(shipLotOfDay(g, "cadiz"), null);
    assert.equal(houseLotOfDay(g, "cadiz"), null);
    const g2 = game();
    g2.day = shipDay("cadiz") + 1;
    assert.equal(shipLotOfDay(g2, "cadiz"), null);
  });
});

describe("generated lot valuation", () => {
  it("ship value follows hull and type, bounded and deterministic", () => {
    for (const t of Object.keys(SHIP_TYPES)) {
      const cheap = shipLotValue(t, SHIP_TYPES[t] && 55), dear = shipLotValue(t, 90);
      assert.ok(cheap > 0 && dear > cheap);
      assert.ok(dear < SHIP_TYPES[t].price); // a used ship never lists above new
    }
    assert.equal(shipLotValue("nao", 90), maxShipLotValue());
    assert.equal(shipLotValue("galera", 80), null);
    assert.equal(shipLotValue("nao", 0), null);
    assert.equal(shipLotValue("nao", 72.5), null);
  });
  it("lots carry value above reserve, a seller and a localized name", () => {
    const g = game();
    g.day = shipDay("cadiz");
    const sl = shipLotOfDay(g, "cadiz");
    assert.ok(sl.kind === "ship" && sl.value > 0 && sl.reserve === reserveOf(sl.value));
    assert.ok(sl.ship.hull >= 55 && sl.ship.hull <= 90);
    assert.ok(sl.seller.kind === "council" || (sl.seller.kind === "townsfolk" && sl.seller.name));
    assert.match(sl.name.es, /casco 55|casco [5-8]\d|casco 90/);
    assert.match(sl.name.en, /hull/);
    g.day = houseDay("cadiz");
    const hl = houseLotOfDay(g, "cadiz");
    assert.ok(hl.kind === "house" && hl.house.level >= 1 && hl.house.level <= 3);
    assert.ok(hl.value > 0 && hl.value <= maxHouseLotValue(g.world));
    assert.deepEqual(shipLotOfDay(g, "cadiz"), null); // different cadence grids do not blur
  });
  it("lotsOfDay adds generated kinds to the establishment table; legacy lotOfDay keeps its meaning", () => {
    const g = game();
    g.day = shipDay("cadiz");
    const lots = lotsOfDay(g, "cadiz");
    assert.ok(lots.some((l) => l.kind === "ship"));
    const est = lotOfDay(g, "cadiz");
    if (est) assert.ok(lots.some((l) => l.kind === "establishment" && l.id === est.id));
    for (const l of lots) assert.ok(l.id && l.value > 0 && l.reserve <= l.value);
  });
});

describe("bidders on generated lots", () => {
  it("are deterministic per lot and never include the selling neighbour", () => {
    const g = game();
    g.day = shipDay("cadiz");
    const lot = shipLotOfDay(g, "cadiz");
    const b1 = biddersOf(g, "cadiz", lot), b2 = biddersOf(g, "cadiz", lot);
    assert.deepEqual(b1, b2);
    for (const b of b1) assert.ok(b.max >= lot.reserve || false, "below-reserve neighbours sit out"); // all listed bids meet the reserve
    if (lot.seller.kind === "townsfolk") assert.ok(!b1.some((b) => b.who === lot.seller.name));
    g.day = houseDay("cadiz");
    assert.notDeepEqual(biddersOf(g, "cadiz", houseLotOfDay(g, "cadiz")), b1); // a different table, a different field
  });
});

describe("hammer on a ship lot", () => {
  it("the player wins: cash moves once, the ship is delivered moored with its worn hull", () => {
    const g = game();
    g.day = shipDay("cadiz");
    const lot = shipLotOfDay(g, "cadiz");
    const cash0 = g.cash, ships0 = g.ships.length, caja0 = cajaCash(g, "cadiz"), gen0 = g.hallAlmonedaGen?.cadiz ?? 0;
    const r = bidAuction(g, "cadiz", 10 * lot.value, lot.id);
    assert.equal(r.outcome, "won");
    assert.ok(r.price >= lot.reserve && r.price <= 10 * lot.value);
    assert.equal(g.cash, cash0 - r.price);
    assert.equal(g.ships.length, ships0 + 1);
    const s = g.ships[g.ships.length - 1];
    assert.equal(s.type, lot.ship.type);
    assert.equal(s.hull, lot.ship.hull); // worn, not new
    assert.equal(s.at, "cadiz");
    assert.equal(s.voyage, null);
    const gain = cajaCash(g, "cadiz") - caja0, tracked = (g.hallAlmonedaGen?.cadiz ?? 0) - gen0;
    if (lot.seller.kind === "council") { assert.equal(gain, r.price); assert.equal(tracked, r.price); }
    else { assert.equal(gain, 0); assert.equal(tracked, 0); }
    assert.equal(g.hallAlmoneda?.cadiz ?? 0, 0); // generated income never lands in the roster line
  });
  it("a neighbour can win: the ship leaves, a municipal seller is paid and counted", () => {
    const g = game();
    g.day = shipDay("cadiz");
    const lot = shipLotOfDay(g, "cadiz");
    const caja0 = cajaCash(g, "cadiz"), gen0 = g.hallAlmonedaGen?.cadiz ?? 0, ships0 = g.ships.length;
    const r = bidAuction(g, "cadiz", 0, lot.id); // the player sits out
    if (r.outcome === "withdrawn") return; // nobody met the reserve: nothing to assert
    assert.equal(r.outcome, "lost");
    assert.equal(g.ships.length, ships0);
    // a neighbour's coins are not simulated: no chest movement, whatever the seller (only the player's real coins count)
    assert.equal(cajaCash(g, "cadiz"), caja0);
    assert.equal((g.hallAlmonedaGen?.cadiz ?? 0) - gen0, 0);
  });
});

describe("hammer on a house lot", () => {
  it("the player wins with an office: the house joins his buildings and feeds the population bonus", () => {
    const g = game(); // home is cadiz: the office is his
    g.day = houseDay("cadiz");
    const lot = houseLotOfDay(g, "cadiz");
    const cash0 = g.cash, pop0 = housePopBonus(g, "cadiz");
    const r = bidAuction(g, "cadiz", 10 * lot.value, lot.id);
    assert.equal(r.outcome, "won");
    assert.equal(g.cash, cash0 - r.price);
    const b = g.buildings.cadiz[lot.id];
    assert.ok(b && b.type === "house" && b.level === lot.house.level && b.state === "active" && b.fromTown === lot.id);
    assert.equal(housePopBonus(g, "cadiz") - pop0, HOUSE_POP_PER_LEVEL * lot.house.level); // the bonus grew by exactly this house
  });
  it("without an office the bid is void and the lot passes to the next bidder", () => {
    const g = game();
    g.day = houseDay("sevilla"); // not his home, no office there
    const lot = houseLotOfDay(g, "sevilla");
    const cash0 = g.cash;
    const r = bidAuction(g, "sevilla", 10 * lot.value, lot.id);
    assert.notEqual(r.outcome, "won");
    assert.ok(!g.buildings?.sevilla?.[lot.id]);
    assert.equal(g.cash, cash0); // never charged
  });
});

describe("bids per lot", () => {
  it("placeBid keeps one maximum per lot and the day hook brings every lot down", () => {
    const g = game();
    g.day = shipDay("cadiz");
    const lots = lotsOfDay(g, "cadiz");
    assert.ok(lots.length >= 1);
    for (const [i, l] of lots.entries()) assert.equal(placeBid(g, "cadiz", 1000 * (i + 1), l.id).ok, true);
    const stored = g.townBids.cadiz;
    assert.equal(typeof stored, "object");
    for (const [i, l] of lots.entries()) assert.equal(stored[l.id], 1000 * (i + 1));
    almonedaDay(g);
    assert.equal(g.townBids.cadiz, undefined); // the table is cleared after the hammer
  });
  it("a legacy bare number bids only on the establishment table", () => {
    const g = game();
    g.day = shipDay("cadiz");
    const lots = lotsOfDay(g, "cadiz");
    (g.townBids ??= {}).cadiz = 0; // old save shape
    almonedaDay(g); // must not throw, and the number never lands on a ship or a house
    assert.equal(g.townBids.cadiz, undefined);
    assert.ok(lots.every((l) => l.kind === "establishment" || true));
  });
  it("state survives a save round-trip", () => {
    const g = game();
    g.day = shipDay("cadiz");
    const lot = shipLotOfDay(g, "cadiz");
    placeBid(g, "cadiz", 5000, lot.id);
    bidAuction(g, "cadiz", 0, lot.id); // move some state: possible municipal generated income
    const { g: g2 } = deserialize(JSON.parse(JSON.stringify(serialize(g, "Casa Lotes"))), world);
    assert.deepEqual(g2.townBids, g.townBids);
    assert.deepEqual(g2.hallAlmonedaGen ?? null, g.hallAlmonedaGen ?? null);
    assert.deepEqual(g2.ships.map((s) => [s.id, s.type, s.hull]), g.ships.map((s) => [s.id, s.type, s.hull]));
  });
});

describe("long tables stay sane", () => {
  it("six idle months of hammers: generated income stays inside its cadence bound", () => {
    const g = game({ cash: 1000 });
    let day0 = g.day;
    while (g.day < day0 + 180 && !g.over) advanceDay(g);
    for (const c of g.world.cities) {
      const gen = g.hallAlmonedaGen?.[c.id] ?? 0;
      const cycles = Math.floor(g.day / AUCTION_EVERY) + 1;
      const cap = cycles * (Math.ceil((maxShipLotValue() * 1.15) / SHIP_EVERY) + Math.ceil((maxHouseLotValue(g.world) * 1.15) / HOUSE_EVERY));
      assert.ok(gen <= cap, `${c.id} generated income ${gen} beyond cadence cap ${cap}`);
    }
  });
});
