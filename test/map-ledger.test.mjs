import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildWorld } from "../src/sim/world.mjs";

const html = readFileSync(new URL("../web/index.html", import.meta.url), "utf8");

test("map ledger frame uses the same viewBox height as the map (VH in main.mjs)", () => {
  // Same formula as web/main.mjs: the chart shadow and fillets only line up with the chart if the heights match.
  const world = buildWorld(JSON.parse(readFileSync(new URL("../data/world.json", import.meta.url), "utf8")));
  const nodes = Object.values(world.nodes), lons = nodes.map((n) => n.lon), lats = nodes.map((n) => n.lat);
  const [x0, x1, y0, y1] = [Math.min(...lons) - 1, Math.max(...lons) + 1, Math.min(...lats) - 1, Math.max(...lats) + 1];
  const VH = Math.round((y1 - y0) * (800 / (x1 - x0)) * 1.25);
  const rule = html.match(/#maparea>#map\{background:url\("data:image\/svg\+xml;utf8,[^"]*viewBox='0 0 800 (\d+)'/);
  assert.ok(rule, "chart frame background on #map");
  assert.equal(Number(rule[1]), VH);
});

test("map ledger keeps the header ids and order, and the hint row DOM", () => {
  const header = html.match(/<header>[\s\S]*?<\/header>/)[0];
  const ids = [...header.matchAll(/id="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(ids, ["co", "day", "todbar", "cash", "goal", "ships", "ctl", "play", "pausenote", "spd", "rep", "msg", "hdr-right", "fs", "lang", "new"]);
  assert.match(header, /id="todbar" role="img"/);
  assert.ok(html.includes('<div id="hint-row"><div class="hint" id="hint" role="status" aria-live="polite"></div><button type="button" id="hint-mission-toggle" hidden></button></div>'));
});

test("map ledger restyles keep a visible keyboard focus", () => {
  for (const sel of ["body>header button", "#mapcard>#hint-row>#hint-mission-toggle", "#ctx button", "#mapleft>#historical-map-tools summary"]) {
    assert.ok(html.includes(`${sel}:focus-visible{outline:2px solid`), sel);
  }
  // The seal must not force a display value, or the [hidden] toggle would show.
  assert.doesNotMatch(html.match(/#mapcard>#hint-row>#hint-mission-toggle\{[^}]*\}/g).join(""), /display:/);
});
