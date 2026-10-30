// Top bar stability (30/10): the clock ticking must never move the rest of the
// bar. tabular-nums alone does NOT guarantee it (kerning / non-tabular digits,
// Auditoria 30/10: #day 228.72px but 228.17px at 11:11, #cash 565 -> 564.45px),
// so the clock digits live in their own fixed-width monospace span (#day .clk).
// Two layers: (1) the shipped CSS/markup pins the clock width; (2) when a Chrome
// binary is available, a real layout measurement sweeps 11:08..11:21 (the exact
// window that exposed the wobble) and demands identical widths and positions.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdtempSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

const html = readFileSync(new URL("../web/index.html", import.meta.url), "utf8");
const main = readFileSync(new URL("../web/main.mjs", import.meta.url), "utf8");

test("the clock digits live in a fixed-width monospace span (static contract)", () => {
  assert.match(html, /#day \.clk\{[^}]*width:5ch/, "the clock span has a fixed width");
  assert.match(html, /#day \.clk\{[^}]*font-family:ui-monospace/, "the clock span uses a monospace stack");
  assert.match(html, /#day \.clk\{[^}]*"kern" 0/, "kerning off: digit pairs never change width");
  assert.match(main, /className: "clk"/, "the renderer writes the clock into its own span");
  assert.doesNotMatch(main, /\$\("day"\)\.textContent = `[^`]*\$\{hh\}:\$\{mm\}/, "the raw time is never written into #day directly");
});

test("layout sweep 11:08..11:21: #day width and #cash position never move (Chrome)", (t) => {
  const bin = [process.env.CHROME_PATH, "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].filter(Boolean).find(existsSync);
  if (!bin) return t.skip("no Chrome binary: static contract above still applies");
  const style = html.match(/<style>([\s\S]*?)<\/style>/)[1];
  const header = html.match(/<header>[\s\S]*?<\/header>/)[0];
  const page = `<html><head><meta charset="utf-8"><style>${style}</style></head><body>${header}<pre id="out"></pre><script>
    const day = document.getElementById("day"), cash = document.getElementById("cash");
    day.innerHTML = ""; day.append(document.createTextNode("30 octubre 1492, "), Object.assign(document.createElement("span"), { className: "clk" }), document.createTextNode(" \\u00b7 d\\u00eda 5/120 \\u00b7 oto\\u00f1o"));
    cash.textContent = "Monedas: 565";
    const clk = day.querySelector(".clk"), widths = [], lefts = [];
    for (let m = 8 * 60 + 8; m <= 21 * 60 + 21; m++) { // the whole flagged window and beyond
      clk.textContent = String(Math.floor(m / 60) % 24).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
      widths.push(day.offsetWidth); lefts.push(cash.offsetLeft);
    }
    document.getElementById("out").textContent = JSON.stringify({ widths, lefts });
  </script></body></html>`;
  const dir = mkdtempSync(join(tmpdir(), "topbar-"));
  const file = join(dir, "page.html");
  writeFileSync(file, page);
  const dom = execFileSync(bin, ["--headless=new", "--disable-gpu", "--no-sandbox", "--dump-dom", "file://" + file], { encoding: "utf8", maxBuffer: 1e7 });
  const out = JSON.parse(dom.match(/<pre id="out">([^<]*)<\/pre>/)[1]);
  assert.ok(out.widths.length > 500, "the sweep actually ran");
  assert.equal(new Set(out.widths).size, 1, `#day width must be constant across the sweep, got ${[...new Set(out.widths)].join("/")}`);
  assert.equal(new Set(out.lefts).size, 1, `#cash position must be constant across the sweep, got ${[...new Set(out.lefts)].join("/")}`);
});
