import test from "node:test"; import assert from "node:assert/strict"; import { readFileSync } from "node:fs";
import { ICON_IDS, goodIcon } from "../web/icons.mjs";
const world = JSON.parse(readFileSync(new URL("../data/world.json", import.meta.url)));
test("every trade good has its own icon", () => { for (const g of Object.keys(world.goods)) assert.ok(ICON_IDS.includes(g), g); });
test("icons are well-formed single svg elements", () => { for (const id of ICON_IDS) { const x = goodIcon(id); assert.ok(x.startsWith("<svg") && x.endsWith("</svg>")); assert.equal((x.match(/<svg/g) || []).length, 1); } });
