import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const main = readFileSync("web/main.mjs", "utf8");
const css = readFileSync("web/pwin.css", "utf8");

test("every window close button is the drawn X with an accessible label", () => {
  assert.equal((main.match(/class="pwin-close"/g) || []).length, 4, "ship, city, both ledger variants");
  assert.ok(!/pwin-close[^>]*>\$\{t\.close\}/.test(main), "no text close left");
  assert.match(main, /const cb = .*setAttribute\("aria-label"/, "lang switch updates the label, not the icon");
});

test("the X icon is own-drawn SVG with hover, focus and reduced-motion rules", () => {
  assert.match(main, /<svg class="x-ico" viewBox="0 0 24 24" aria-hidden="true"/);
  assert.match(css, /\.pwin-close\{[^}]*border-radius:50%/);
  assert.match(css, /\.pwin-close \.x-ico\{[^}]*background:none/);
  assert.match(css, /\.pwin-close:hover \.x-ico\{transform:rotate\(90deg\)\}/);
  assert.match(css, /\.pwin-close:focus-visible\{outline:3px solid #ffd876/);
  assert.match(css, /body\.reduce-motion \.pwin-close \.x-ico\{transition:none\}/);
});
