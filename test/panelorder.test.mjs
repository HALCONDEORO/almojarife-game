import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const css = fs.readFileSync(new URL("../web/index.html", import.meta.url), "utf8");
// Plain string search (no dynamic regex): the rule is "<selector>{order:N" with optional ;flex etc. after it.
const order = (sel) => {
  const at = css.indexOf(`${sel}{order:`);
  return at < 0 ? NaN : parseInt(css.slice(at + sel.length + "{order:".length), 10);
};
test("right card order: event, mission, tabs, ship, finances, notices, fleet", () => {
  const ev = order("body.has-event #panel-home>#panel"), hint = order("#panel-home>#hint-wrap"), tabs = order("#panel-home>#rtabs"),
    ship = order("#panel-home>#rt-fleet>#mapside>#mapleft>#voyage-card"), cash = order("#panel-home>#rt-fleet>#mapside>#mapleft>#cash-card"),
    notice = order("#panel-home>#rt-fleet>#mapside>#mapleft>#notice-card"), fleet = order("#panel-home>#rt-fleet>#mapside>#fleet");
  assert.ok(ev < hint && hint < tabs && tabs <= ship && ship <= cash && cash < notice && notice < fleet, [ev, hint, tabs, ship, cash, notice, fleet].join());
});
test("pending event card is alert red", () => assert.match(css, /has-event #panel-home>#panel \.event\{[^}]*#a5281b/));
