// Instant start: the title paints before the background sim warms up, the two big
// primary entries (Continuar / Nueva partida) lead the book, and Enter fires the primary one.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const main = readFileSync("web/main.mjs", "utf8"), html = readFileSync("web/index.html", "utf8");

test("the title paints first; the background game warms up deferred", () => {
  assert.match(main, /showTitle\(\); \/\/ title first: it must paint instantly/);
  assert.match(main, /setTimeout\(\(\) => start\(null, false\), 0\)/);
  assert.match(main, /if \(!g\) \{ lastFrame = now; requestAnimationFrame\(frame\); return; \}/); // frame loop tolerates a not-yet-created game
});

test("the two primary entries are big (desktop title book)", () => {
  assert.match(html, /#title \.tbroot \.menu-entry\.primary\{min-height: 92px/);
  assert.match(html, /\.menu-entry\.primary \.menu-label\{font-size: 31px/);
});

test("Enter on the title fires the primary entry, never inside inputs or on a disabled Continue", () => {
  assert.match(main, /inTitle && e\.key === "Enter"/);
  assert.match(main, /tg\.closest\("input,select,textarea,button"\)/);
  assert.match(main, /\$\("t-cont"\), b = c && !c\.disabled \? c : \$\("t-start"\)/);
});
