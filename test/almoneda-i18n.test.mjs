import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildWorld } from "../src/sim/world.mjs";
import { newGame } from "../src/game/game.mjs";
import { BUILDING_TYPES, BUILDING_NAMES, buildingName } from "../src/game/buildings.mjs";
import { SHIP_TYPES, SHIP_TYPE_NAMES, shipTypeName } from "../src/sim/trade.mjs";
import { REP_TYPES, estDisplayName } from "../src/game/townindustry.mjs";
import { auctionOffset, lotOfDay, bidAuction } from "../src/game/almoneda.mjs";

const world = buildWorld(JSON.parse(fs.readFileSync(new URL("../data/world.json", import.meta.url))));

describe("display-name tables", () => {
  it("every building type has an es and en name; es carries its article", () => {
    for (const type of Object.keys(BUILDING_TYPES)) {
      const n = BUILDING_NAMES[type];
      assert.ok(n, `missing BUILDING_NAMES.${type}`);
      assert.match(n.es, /^(el|la|los|las) \S/, `es name of ${type} should carry its article`);
      assert.ok(n.en.length > 2 && !/^(el|la) /.test(n.en), `en name of ${type} stays bare`);
    }
  });
  it("every ship type has an es and en name", () => {
    for (const type of Object.keys(SHIP_TYPES)) {
      assert.ok(SHIP_TYPE_NAMES[type]?.es && SHIP_TYPE_NAMES[type]?.en, `missing SHIP_TYPE_NAMES.${type}`);
    }
    assert.equal(shipTypeName("cog", "es"), "coca");
    assert.equal(shipTypeName("cog", "en"), "cog");
  });
  it("helpers fall back to the raw key, never throw", () => {
    assert.equal(buildingName("nope", "es"), "nope");
    assert.equal(shipTypeName("nope", "en"), "nope");
    assert.equal(estDisplayName("nope", "es"), "nope");
  });
  it("representation-only types are named too (es with article, en bare)", () => {
    for (const type of Object.keys(REP_TYPES)) {
      assert.match(estDisplayName(type, "es"), /^la \S/);
      assert.equal(estDisplayName(type, "en"), REP_TYPES[type].en);
    }
    assert.equal(estDisplayName("farm", "es"), "la granja");
    assert.equal(estDisplayName("farm", "en"), "farm");
  });
});

describe("auction messages name the port and the lot in words", () => {
  const lostEstablishmentAuction = () => {
    // walk ports and days until a neighbour wins an establishment lot the player joined
    for (const city of world.cities) {
      for (let k = 0; k < 6; k++) {
        const g = newGame(world, "cadiz", { cash: 100000, freePlay: true, townIndustry: true });
        g.day = auctionOffset(city.id) + k * 7;
        const lot = lotOfDay(g, city.id);
        if (!lot) continue;
        const r = bidAuction(g, city.id, 1);
        if (r.outcome === "lost") return { g, r, city };
      }
    }
    return null;
  };
  it("the neighbour-wins message shows the city name and a localized type, never raw keys", () => {
    const found = lostEstablishmentAuction();
    assert.ok(found, "expected at least one lost establishment auction within the window");
    const { g, r, city } = found;
    const msg = (g.inbox ?? []).find((m) => m.txt)?.txt;
    assert.ok(msg, "the hammer posts a message");
    for (const lang of ["es", "en"]) {
      assert.ok(msg[lang].includes(city.name), `${lang} message should name ${city.name}: ${msg[lang]}`);
      assert.ok(!msg[lang].includes(` ${city.id} `) && !msg[lang].includes(` ${city.id}:`), `${lang} message must not show the raw id: ${msg[lang]}`);
      assert.ok(msg[lang].includes(estDisplayName(r.lot.est.type, lang)), `${lang} message should use the display name: ${msg[lang]}`);
    }
    // the Spanish name always differs from the raw key, so the key must be gone there
    assert.ok(!msg.es.includes(r.lot.est.type), `es message must not show the raw type key: ${msg.es}`);
  });
});
