import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// The goods table is generated from the code (tools/gen_wiki.mjs), in English and Spanish,
// and the wiki pages link it: it closed the audit's first documentation gap.
const EN = readFileSync("docs/wiki/generated/goods.md", "utf8");
const ES = readFileSync("docs/wiki/generated/es/goods.md", "utf8");
const WORLD = JSON.parse(readFileSync("data/world.json", "utf8"));
const ES_GOOD = { grain: "Trigo", fish: "Pescado", salt: "Sal", wool: "Lana", iron: "Hierro", ironware: "Herrajes", timber: "Madera", cloth: "Paño", olive_oil: "Aceite", wine: "Vino", silk: "Seda", sugar: "Azúcar", pepper: "Pimienta", saffron: "Azafrán", beer: "Cerveza", bricks: "Ladrillos", esparto: "Esparto", meat: "Carne", pottery: "Cerámica", legumes: "Legumbres", leather: "Cuero", soap: "Jabón" };

test("the goods table lists every world good with its base price, in both languages", () => {
  for (const [g, v] of Object.entries(WORLD.goods)) {
    assert.ok(EN.includes(`| ${g} | ${v.base} |`), `EN row for ${g}`);
    const es = ES_GOOD[g];
    assert.ok(es, `Spanish name for ${g}`);
    assert.ok(ES.includes(`| ${es} | ${v.base} |`), `ES row for ${es}`);
  }
});

test("optional goods are marked and priced in both tables", () => {
  for (const [g, base] of [["pottery", 40], ["legumes", 20]]) {
    assert.ok(EN.includes(`| ${g} † | ${base} |`), g);
    assert.ok(ES.includes(`| ${ES_GOOD[g]} † | ${base} |`), g);
  }
  assert.match(EN, /† Optional good/);
  assert.match(ES, /† Mercancía opcional/);
});

test("the wiki pages link the goods table and the audit gap is marked closed, in both languages", () => {
  for (const [p, link] of [
    ["docs/wiki/economy.md", "generated/goods.md"],
    ["docs/wiki/es/economy.md", "../generated/es/goods.md"],
    ["docs/wiki/classes.md", "generated/goods.md"],
    ["docs/wiki/es/classes.md", "../generated/es/goods.md"],
    ["docs/wiki/README.md", "generated/goods.md"],
    ["docs/wiki/es/README.md", "../generated/es/goods.md"],
  ]) assert.ok(readFileSync(p, "utf8").includes(`](${link})`), `${p} links ${link}`);
  assert.match(readFileSync("docs/wiki/audit.md", "utf8"), /~~No single page lists all goods/);
  assert.match(readFileSync("docs/wiki/es/audit.md", "utf8"), /~~Ninguna página única lista todas las mercancías/);
});
