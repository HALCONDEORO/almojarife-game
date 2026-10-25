import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const js = readFileSync('web/main.mjs', 'utf8');
const css = readFileSync('web/index.html', 'utf8');
const nav = js.match(/<nav class="city-controls"[^`]*?<\/nav>/)?.[0] ?? '';

test('city right panel: actions only, building tabs stay out', () => {
  // Panel keeps the real actions (Marco 25/10): build, ships, reports, messages, menu, back to map.
  for (const m of ['data-city-tab="buildings"', 'data-city-ships', 'data-city-reports', 'data-city-msgs', 'data-city-menu', 'data-map'])
    assert.ok(nav.includes(m), m);
  // Marco 25/10 14:33 "Elimina las 2 cosas rodeadas de esos sitios": no time/settings clones left in the panel.
  for (const m of ['data-city-play', 'data-city-speed', 'data-city-fs', 'data-city-lang', 'cc-mini', 'Tiempo'])
    assert.ok(!nav.includes(m), 'no panel clone: ' + m);
  // Still no per-building buttons: buildings open from the city itself (manual sec. 7.5).
  for (const k of ['city', 'yard', 'tavern', 'bank', 'hall', 'store', 'house', 'market'])
    assert.ok(!nav.includes(`data-city-tab="${k}"`), 'no building button ' + k);
  // One section header and icons on every action button.
  assert.ok((nav.match(/cc-section/g) ?? []).length >= 1, 'section labels');
  assert.ok((nav.match(/CC_ICONS\./g) ?? []).length >= 6, 'icons');
});

test('corner bar carries time, view and settings, top-right, with no duplicates', () => {
  assert.ok(js.includes('class="city-corner"'), 'corner bar');
  for (const c of ['play', 'speed', 'fit', 'zoom-in', 'zoom-out', 'motion', 'construct', 'fs', 'lang'])
    assert.ok(js.includes(`data-corner="${c}"`), c);
  // View controls only exist with the 2D city; the iframe's own toolbar hides via chrome=0.
  assert.ok(js.includes('{ chrome: "0" }'), 'chrome param');
  assert.ok(js.includes('kind:"city2d-cmd"'), 'cmd bridge');
  assert.ok(js.includes('e.data?.kind==="city2d-view"'), 'view-state back');
  // One pause control only: the corner bar.
  assert.ok(js.includes('cp.textContent = playing ? "⏸" : "▶"'), 'corner pause live');
  assert.match(css, /\.city-corner\{[^}]*top:38px;right:194px/, 'corner position');
  const scene = readFileSync('web/city2d/scene.mjs', 'utf8');
  assert.ok(scene.includes("q.get('chrome')==='0'"), 'scene reads chrome');
  assert.ok(scene.includes("e.data?.kind!=='city2d-cmd'"), 'scene cmd guard');
  const frame = readFileSync('web/city2d/index.html', 'utf8');
  assert.ok(frame.includes('nav.corner>div:not(#bm){display:none}'), 'iframe toolbar hidden, build sub-panel kept');
});

test('panel labels stay live from the same values as the header', () => {
  assert.ok(js.includes('function syncCityControls()'), 'sync fn');
  assert.ok(js.includes('syncCityControls();\n'), 'called from render');
  assert.ok(js.includes('cs.textContent = `${speed}x`'), 'speed label live');
  assert.ok(js.includes('set("msgs", badge(LT[lang].messages, unread(g)))'), 'message badge live');
  for (const h of [
    '[data-city-msgs]").onclick=()=>showLedger("msg")',
    '[data-corner="play"]\').onclick=()=>toggleClock()',
    '[data-corner="fs"]\').onclick=()=>$("fs")?.click()',
    '[data-corner="lang"]\').onclick=()=>$("lang")?.click()',
  ]) assert.ok(js.includes(h), h);
});

test('city header data centred and enriched; top bar buttons hidden only in city view', () => {
  assert.match(css, /\.city-header\{[^}]*justify-content:center/, 'centred');
  assert.match(css, /body\.in-city-3d #ctl button,body\.in-city-3d #hdr-right\{display:none\}/, 'header buttons hidden in city');
  assert.ok(css.includes('id="hdr-right"'), 'header right span id');
  assert.ok(js.includes('Murallas'), 'walls badge');
  assert.ok(js.includes('extra.push(t.tabOffice)'), 'office badge');
  assert.ok(js.includes('extra.push(t.tabStore)'), 'warehouse badge');
});

test('panel keeps parchment theme and P3 proportions', () => {
  assert.match(css, /\.city-controls\{[^}]*width:184px/, 'width');
  assert.match(css, /\.city-controls\{[^}]*#f4ead0/, 'parchment');
  assert.match(css, /\.city-controls \.cc-ico\{width:18px;height:18px/, 'icon size');
  assert.match(css, /\.city-header\{[^}]*right:184px/, 'header clears panel');
});

test('language toggle re-translates the whole city chrome live (Boat #427 catch)', () => {
  assert.ok(js.includes('function cityPanelTitle(tb)'), 'title fn');
  assert.ok(js.includes('d.querySelector(".city-window-title").textContent=cityPanelTitle(tb)'), 'open uses fn');
  assert.ok(js.includes('ttl.textContent = cityPanelTitle(w.dataset.cityPanel)'), 'sync refreshes title');
  assert.ok(js.includes('cb.textContent = `${t.close} (Esc)`'), 'close label live');
  assert.ok(js.includes('"Mover ventana con las flechas" : "Move window with arrow keys"'), 'handle aria live');
});

test('inhabitants detail: true state composition, no decorative figures (Marco 25/10 14:38)', () => {
  // Class cards and counts use the same effective population the market demand uses.
  assert.ok(js.includes('const popEff = (nd2.pop ?? 8000) + eff.popBonus + drift + wallPop'), 'popEff composition');
  assert.ok(js.includes('cityRows(popEff,'), 'class rows from effective pop');
  assert.ok(js.includes('citylifeExtra(g, s.at)'), 'city-life drift included');
  assert.ok(js.includes('WALL_POP * wallsKeptLevel(g, s.at)'), 'walls pop included');
  // Breakdown line always shows the composition; jobs line only with real jobs.
  assert.ok(js.includes('cityPopEff.replace("{p}", fmt(popEff))'), 'eff pop line');
  assert.ok(js.includes('if (eff.jobs > 0)'), 'jobs only when real');
  assert.ok(js.includes('bldJobsLine.replace("{j}", fmt(eff.jobs))'), 'jobs line');
  for (const k of ['cityPopEff', 'cityPopBase', 'cityPopHouses', 'cityPopWalls', 'cityPopDrift']) {
    assert.ok(js.includes(`${k}: "`), k + ' es');
  }
  assert.ok(js.includes('cityPopEff: "Effective population: {p} citizens"'), 'en string');
});

test('corner bar never covers the city window title row (Main pixel review 25/10)', () => {
  assert.match(css, /\.city-window\{position:absolute;right:180px;top:84px/, 'window home below bar');
  assert.ok(js.includes('const bar=d.querySelector(".city-corner");'), 'drag clamp reads bar');
  assert.ok(js.includes('p.top=Math.min(bb+6,'), 'drag clamps below bar');
});

test('class percentages use one decimal and stay truthful (67+27+7=101 catch)', () => {
  const cv = readFileSync('src/view/cityview.mjs', 'utf8');
  assert.ok(cv.includes('pct: Math.round(counts[cls] / pop * 1000) / 10'), '1-decimal pct');
  assert.ok(js.includes('String(r.pct).replace(".", ",")'), 'es decimal comma');
});

test('city intro grounds basket vs live prices, no contradiction with the cards', () => {
  assert.ok(js.includes('cada clase tiene su cesta'), 'es basket wording');
  assert.ok(js.includes('each class has its own basket'), 'en basket wording');
  assert.ok(js.includes('«sin dinero para…»'), 'es points at live priced-out list');
});

test('language toggle also re-labels corner toolbar and panel section', () => {
  assert.ok(js.includes('set("section", lang === "es" ? "Ciudad" : "City")'), 'section live');
  assert.ok(js.includes('data-cc="section"'), 'section bound');
  assert.ok(js.includes('bar2.setAttribute("aria-label", lang === "es" ? "Controles de tiempo'), 'corner aria live');
});
