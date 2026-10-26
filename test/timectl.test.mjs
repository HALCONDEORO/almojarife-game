import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const html = readFileSync(new URL("../web/index.html", import.meta.url), "utf8");
const main = readFileSync(new URL("../web/main.mjs", import.meta.url), "utf8");
test("play/pause and speed are one grouped control, and the speed shows just NNx", () => {
  assert.match(html, /<span id="timectl" role="group"><button id="play"><\/button><button id="spd"><\/button><\/span>/);
  assert.match(main, /\$\("spd"\)\.textContent = `\$\{speed\}x`;/);
  assert.match(main, /\$\("spd"\)\.title = t\.tipHdrSpeed/);
});
