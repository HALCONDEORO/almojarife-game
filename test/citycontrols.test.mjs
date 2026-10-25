import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync('web/index.html', 'utf8');
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
  assert.match(css, /\.city-corner\{[^}]*top:38px;right:242px/, 'corner position');
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
  assert.ok(js.includes('set("msgs", LT[lang].messages)'), 'message label live');
  assert.ok(js.includes('[data-cc-badge="msgs"]') && js.includes('unread(g)'), 'unread badge pill live');
  assert.ok(js.includes('[data-cc-badge="ships"]') && js.includes('x.at === city3dId && !x.voyage'), 'docked ships badge live');
  assert.ok(js.includes('set("section2", lang === "es" ? "Actividad" : "Activity")'), 'activity section live');
  for (const h of [
    '[data-city-msgs]").onclick=()=>showLedger("msg")',
    '[data-corner="play"]\').onclick=()=>toggleClock()',
    '[data-corner="fs"]\').onclick=()=>$("fs")?.click()',
    '[data-corner="lang"]\').onclick=()=>$("lang")?.click()',
  ]) assert.ok(js.includes(h), h);
});

test('open window keeps clear of the corner bar as well as the mission chip', () => {
  const i = js.indexOf('The open window keeps clear of the mission chip and the corner bar');
  assert.ok(i > 0, 'unified keep-clear comment');
  const body = js.slice(i, i + 900);
  assert.ok(body.includes('for (const el of [chip, cbar])'), 'chip and bar both considered');
  assert.ok(body.includes('need = Math.max(need, cr.bottom - vt + 6)'), 'deepest blocker wins');
  assert.ok(body.includes('win.style.top = Math.min(need,'), 'pushed below the deepest blocker');
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
  assert.match(css, /\.city-controls\{[^}]*width:232px/, 'width');
  assert.match(css, /\.city-controls\{[^}]*#f4ead0/, 'parchment');
  assert.match(css, /\.city-controls \.cc-ico\{width:22px;height:22px/, 'icon size');
  assert.match(css, /\.city-header\{[^}]*right:232px/, 'header clears panel');
});

test('language toggle re-translates the whole city chrome live (Boat #427 catch)', () => {
  assert.ok(js.includes('function cityPanelTitle(tb)'), 'title fn');
  assert.ok(js.includes('d.querySelector(".city-window-title").textContent=cityPanelTitle(tb)'), 'open uses fn');
  assert.ok(js.includes('ttl.textContent = cityPanelTitle(w.dataset.cityPanel)'), 'sync refreshes title');
  assert.ok(js.includes('cb.setAttribute("aria-label", `${t.close} (Esc)`)'), 'close accessible label live');
  assert.ok(js.includes('cb.title = `${t.close} (Esc)`'), 'close tooltip live');
  assert.ok(!js.includes('cb.textContent = `${t.close} (Esc)`'), 'language switch preserves the drawn X');
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
  assert.match(css, /\.city-window\{position:absolute;right:238px;top:84px/, 'window home below bar');
  assert.ok(js.includes('for(const el of [d.querySelector(".city-corner"),$("city-mission-wrap"),$("mission-max")])'), 'drag clamp reads bar, chip and minimised flag');
  assert.ok(js.includes('p.top=Math.min(bb+6,'), 'drag clamps below them');
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

test('mission line docks below the corner bar when they would overlap (600px catch)', () => {
  assert.ok(js.includes('mr.right > br.left - 8'), 'overlap test');
  assert.ok(js.includes('top = (br.bottom - vt + 6) + "px"'), 'dock below bar');
});

test('mission stays visible while the tutorial runs: stacked, mission first (Marco 25/10)', () => {
  assert.ok(js.includes('function hudObjectiveLines()'), 'shared composition');
  assert.ok(js.includes('[activeMissionLine(), tutorialLine(g, lang)].filter(Boolean)'), 'mission first, tutorial after');
  assert.ok(js.includes('hudObjectiveLines().join("\\n")'), 'city chip stacks lines');
  assert.ok(js.includes('hudObjectiveLines().join(" \\u00b7 ")'), 'map hint stacks inline');
  assert.ok(!js.includes('tutorialLine(g, lang) ?? activeMissionLine()'), 'tutorial never replaces the mission in the chip');
  assert.ok(!js.includes('tutorialLine(g, lang) ?? missionLine'), 'tutorial never replaces the mission in the hint');
});

test('map hint also minimises and restores the mission, and stacks it under sail (Marco 25/10)', () => {
  assert.ok(js.includes('id="hint-mission-toggle"') || html.includes('id="hint-mission-toggle"'), 'map toggle exists');
  assert.ok(js.includes('$("hint-mission-toggle").onclick = () => { localStorage.setItem("missionMin"'), 'map toggle wired');
  assert.ok(js.includes('(s.voyage.anchored ? t.hintAnchored : t.hintSea) + (objLine && !objMin ?'), 'mission stacks onto the voyage hint');
  assert.ok(js.includes('objMin && objLine ? "" : objLine ||'), 'minimised docked map collapses to the flag button');
  assert.ok(js.includes('ht.hidden = !!g.over || !objLine'), 'toggle only with a live objective');
  assert.ok(html.includes('<div id="hint-row"><div class="hint" id="hint" role="status" aria-live="polite"></div><button type="button" id="hint-mission-toggle" hidden></button></div>'), 'toggle is a sibling so setLiveText cannot wipe it');
});

test('mission stays visible with a window open and minimises to a restorable chip (Marco 25/10)', () => {
  assert.ok(!js.includes('cm.hidden = !line || open'), 'never hidden by the open window');
  assert.ok(js.includes('wrap.hidden = !line || minimized'), 'expanded chip hidden only when empty or minimised');
  assert.ok(js.includes('mx.hidden = !line || !minimized'), 'minimised chip mirrors it');
  assert.ok(js.includes('const win = d.querySelector(".city-window"), chip = !wrap.hidden ? wrap : (!mx.hidden ? mx : null)'), 'window keeps clear of the minimised flag too');
  assert.ok(js.includes('localStorage.getItem("missionMin") === "1"'), 'persisted minimised state');
  assert.ok(js.includes('$("mission-min").onclick=()=>{localStorage.setItem("missionMin","1")'), 'minimise button');
  assert.ok(js.includes('$("mission-max").onclick=()=>{localStorage.setItem("missionMin","0")'), 'restore button');
  assert.ok(js.includes('"Minimizar misión"') && js.includes('"Show mission"'), 'es+en labels');
  assert.ok(js.includes('<span class="city-mission" id="city-mission" role="status"'), 'live text span kept');
  assert.ok(!js.includes('handle-mission'), 'redundant window-handle echo removed (no duplicate controls)');
});

test('city windows show the ship card only where the ship operates (Marco 25/10)', () => {
  assert.ok(js.includes('const shipCtx = !inCity || tab === "market" || tab === "store" || tab === "route" || tab === "yard"'), 'ship card gated per tab');
  assert.ok(js.includes('if (shipCtx) {'), 'summary wrapped');
  assert.ok(js.includes('if (!inCity || tab === "market") h += `<div title="${t.holdValue}">${t.holdValue}: '), 'hold value stays with the market');
  assert.ok(js.includes('if (!inCity || tab === "market" || tab === "route") {'), 'best-ports box stays with market and route');
});
