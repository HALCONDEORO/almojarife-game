import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, mkdtempSync, rmSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join, extname } from "node:path";
import { TB, roman, titleBookHtml } from "../web/titlebook.mjs";
import { START_YEAR } from "../src/sim/clock.mjs";

const main = readFileSync(new URL("../web/main.mjs", import.meta.url), "utf8");
const IDS = ["t-start", "t-cont", "t-imp", "t-exp", "t-rest", "t-file", "t-msg", "t-lang"];

test("title book: es and en dictionaries have the same keys and no sample-house data", () => {
  assert.deepEqual(Object.keys(TB.es).sort(), Object.keys(TB.en).sort());
  for (const lang of ["es", "en"]) assert.doesNotMatch(JSON.stringify(TB[lang]), /Vega/i);
});
test("title book: renders every real control id, the game year, and the right primary entry", () => {
  for (const lang of ["es", "en"]) {
    const none = titleBookHtml({ lang, saved: null, backup: null, dayLabel: "", coinsLabel: "" });
    const withSave = titleBookHtml({ lang, saved: { house: "Casa Uno" }, backup: { house: "Casa Previa", day: 7 }, dayLabel: "D 3", coinsLabel: "10" });
    for (const id of IDS) { assert.match(none, new RegExp(`id="${id}"`), id); assert.match(withSave, new RegExp(`id="${id}"`), id); }
    for (const h of [none, withSave]) { assert.ok(h.includes(roman(START_YEAR)), "year"); assert.ok(h.includes(String(START_YEAR)), "year digits"); assert.doesNotMatch(h, /1475/); }
    assert.match(withSave, /Casa Uno/); assert.match(withSave, /Casa Previa/);
    assert.doesNotMatch(none, /Casa Uno/);
    const btn = (h, id) => h.match(new RegExp(`<button[^>]*id="${id}"[^>]*>`))[0];
    assert.match(btn(none, "t-start"), /primary/); assert.doesNotMatch(btn(none, "t-cont"), /primary/); assert.match(btn(none, "t-cont"), /disabled/);
    assert.match(btn(withSave, "t-cont"), /primary/); assert.doesNotMatch(btn(withSave, "t-start"), /primary/); assert.doesNotMatch(btn(withSave, "t-cont"), /disabled/);
    assert.match(btn(none, "t-rest"), /disabled/); assert.doesNotMatch(btn(withSave, "t-rest"), /disabled/);
  }
});
test("title book: showTitle keeps the real handlers wired", () => {
  for (const h of [/\$\("t-start"\)\.onclick = \(\) => showCreate/, /\$\("t-cont"\)\.onclick/, /\$\("t-rest"\)\.onclick/, /\$\("t-lang"\)\.onclick/, /\$\("t-exp"\)\.onclick = \(\) => exportSave\(\)/, /\$\("t-imp"\)\.onclick = \(\) => \$\("t-file"\)\.click\(\)/, /\$\("t-file"\)\.onchange/]) assert.match(main, h);
});

const chrome = ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser"].find(c => spawnSync("which", [c]).status === 0);
test("title book in a real browser: existing save is protected, rotation keeps it, writes fail closed, book controls work", { skip: !chrome && "no Chrome available", timeout: 120000 }, async () => {
  const root = new URL("..", import.meta.url).pathname, types = { ".html": "text/html", ".mjs": "text/javascript", ".js": "text/javascript", ".css": "text/css", ".webp": "image/webp", ".png": "image/png", ".json": "application/json", ".svg": "image/svg+xml" };
  const srv = createServer((q, r) => { const p = join(root, decodeURIComponent(q.url.split("?")[0])); if (!p.startsWith(root) || !existsSync(p) || p.endsWith("/")) { r.statusCode = 404; return r.end(); } r.setHeader("content-type", types[extname(p)] || "application/octet-stream"); r.end(readFileSync(p)); });
  await new Promise(r => srv.listen(0, "127.0.0.1", r)); const port = srv.address().port;
  const dir = mkdtempSync(join(tmpdir(), "tb-"));
  // Chrome DevTools over a pipe (fd 3 in, fd 4 out, NUL-delimited JSON): works on Node 20, no WebSocket needed.
  const ch = spawn(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--remote-debugging-pipe", "--window-size=1400,900", `--user-data-dir=${dir}`, "about:blank"], { stdio: ["ignore", "ignore", "ignore", "pipe", "pipe"] });
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  try {
    const pend = new Map(); let id = 0, buf = "", session;
    ch.stdio[4].on("data", d => { buf += d; let i; while ((i = buf.indexOf("\0")) >= 0) { const m = JSON.parse(buf.slice(0, i)); buf = buf.slice(i + 1); const r = pend.get(m.id); if (r) { pend.delete(m.id); r(m); } } });
    const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ch.stdio[3].write(JSON.stringify({ id: i, method, params, ...(session ? { sessionId: session } : {}) }) + "\0"); });
    const { result: { targetId } } = await send("Target.createTarget", { url: "about:blank" });
    session = (await send("Target.attachToTarget", { targetId, flatten: true })).result.sessionId;
    const ev = async ex => { const r = (await send("Runtime.evaluate", { expression: ex, returnByValue: true, awaitPromise: true })).result; if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + " " + (r.exceptionDetails.exception?.description || "")); return r.result?.value; };
    // run a function in the page with a data argument, without building code from the data
    const call = async (fn, arg) => { const w = (await send("Runtime.evaluate", { expression: "window" })).result.result.objectId; const r = (await send("Runtime.callFunctionOn", { objectId: w, functionDeclaration: fn, arguments: [{ value: arg }], returnByValue: true, awaitPromise: true })).result; if (r.exceptionDetails) throw new Error(r.exceptionDetails.text); return r.result?.value; };
    await send("Page.enable");
    const nav = async () => {
      await send("Page.navigate", { url: `http://127.0.0.1:${port}/web/index.html` });
      const deadline = Date.now() + 20000;
      while (Date.now() < deadline) {
        if (await ev("document.readyState === 'complete' && !!document.querySelector('#t-start')")) return;
        await sleep(100);
      }
      assert.fail("title book did not expose #t-start within 20 seconds after navigation");
    };
    const K = "almojarife.save.v1", B = "almojarife.save.backup", get = k => ev(`localStorage.getItem(${JSON.stringify(k)})`), click = i => ev(`document.getElementById('${i}').click()`);
    await nav(); await ev("localStorage.clear()"); await nav();
    // no save: the book starts a game without any dialog
    assert.equal(await ev("document.querySelector('#t-start').classList.contains('primary')"), true);
    await click("t-start"); await sleep(300);
    await ev("document.getElementById('p-co').value='Casa Uno';document.getElementById('p-go').click()"); await sleep(2000);
    assert.equal(await ev("document.getElementById('title').hidden"), true);
    let save1 = await get(K); assert.ok(save1);
    await nav();
    // pagehide may refresh savedAt, but it must not change campaign data.
    const afterHide = await get(K), payload = raw => { const { savedAt, ...rest } = JSON.parse(raw); return rest; };
    assert.deepEqual(payload(afterHide), payload(save1)); save1 = afterHide;
    assert.equal(await ev("document.getElementById('t-cont').classList.contains('primary') && !document.getElementById('t-cont').disabled"), true);
    // a save exists: Start asks first, nothing is written yet
    await click("t-start"); await sleep(300);
    await ev("document.getElementById('p-co').value='Casa Dos';document.getElementById('p-go').click()"); await sleep(500);
    assert.equal(await ev("!!document.getElementById('r-go')"), true);
    assert.equal(await get(K), save1); assert.equal(await get(B), null);
    // cancel keeps the save; export keeps dialog and save
    await click("r-cancel"); await sleep(300);
    assert.equal(await ev("!!document.getElementById('p-go')"), true); assert.equal(await get(K), save1);
    await ev("document.getElementById('p-co').value='Casa Dos';document.getElementById('p-go').click()"); await sleep(300);
    await click("r-exp"); await sleep(300);
    assert.equal(await ev("!!document.getElementById('r-go')"), true); assert.equal(await get(K), save1);
    // fail closed: when the backup write throws, the existing save is untouched and the new game does not start
    await ev(`window.__setItem = Storage.prototype.setItem; Storage.prototype.setItem = function (k, v) { if (k.startsWith('almojarife.save.') && k !== '${K}') throw new Error('quota'); return window.__setItem.call(this, k, v); }`);
    await click("r-go"); await sleep(600);
    assert.equal(await get(K), save1); assert.equal(await get(B), null);
    assert.equal(await ev("document.getElementById('title').hidden"), false);
    assert.ok((await ev("document.getElementById('r-msg').textContent")).length > 0);
    await ev("Storage.prototype.setItem = window.__setItem");
    // confirm: new game is live and the previous save is byte-equal in the backup slot
    await click("r-go"); await sleep(2500);
    let live = await get(K); assert.notEqual(live, save1); assert.equal(await get(B), save1); assert.equal(JSON.parse(live).company, "Casa Dos");
    assert.equal(await get("almojarife.save.tmp"), null);
    // title book: restore brings the backup back and parks the current one; language toggle and export keep saves
    await nav();
    const liveAfterHide = await get(K); assert.deepEqual(payload(liveAfterHide), payload(live)); live = liveAfterHide;
    assert.equal(await ev("!document.getElementById('t-rest').disabled && /Casa Dos/.test(document.querySelector('.save-card').textContent)"), true);
    await ev("localStorage.setItem('lang','es')"); await nav();
    await click("t-lang"); await sleep(300);
    assert.equal(await get("lang"), "en"); assert.equal(await get(K), live); assert.equal(await get(B), save1);
    await click("t-exp"); await sleep(300); assert.equal(await get(K), live);
    await ev("window.confirm = () => true"); await click("t-rest"); await sleep(600);
    assert.equal(await get(K), save1); assert.equal(await get(B), live);
    // import through the book's file input: current save is parked, imported one becomes live
    await call("function (text) { const dt = new DataTransfer(); dt.items.add(new File([text], 'x.json')); const i = document.getElementById('t-file'); i.files = dt.files; i.dispatchEvent(new Event('change')); }", live); await sleep(2500);
    assert.equal(await get(B), save1); assert.equal(JSON.parse(await get(K)).company, "Casa Dos");
    assert.equal(await ev("document.getElementById('title').hidden"), true);
  } finally { ch.kill(); srv.close(); try { rmSync(dir, { recursive: true, force: true }); } catch {} }
});
