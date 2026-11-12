import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { render } from "../tools/render_map.mjs";

// docs/map.svg comes from the world data and the Natural Earth coastline. If this fails,
// run `node tools/render_map.mjs` and commit docs/map.svg. Needs data/ne_50m_land.geojson
// (tools/fetch_data.sh), like test/world.test.mjs.
test("docs/map.svg matches the world data", () => {
  assert.equal(readFileSync(new URL("../docs/map.svg", import.meta.url), "utf8"), render());
});
