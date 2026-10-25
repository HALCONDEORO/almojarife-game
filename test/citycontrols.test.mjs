import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const js = readFileSync('web/main.mjs', 'utf8');
const css = readFileSync('web/index.html', 'utf8');
const nav = js.match(/<nav class="city-controls"[^`]*?<\/nav>/)?.[0] ?? '';

test('city right panel: header actions moved in, building tabs stay out', () => {
  // Actions moved from the top bar into the panel (Marco 25/10): reports, messages, menu, clock and speed.
  for (const m of ['data-city-tab="buildings"', 'data-city-ships', 'data-city-reports', 'data-city-msgs', 'data-city-play', 'data-city-speed', 'data-city-fs', 'data-city-lang', 'data-city-menu', 'data-map'])
    assert.ok(nav.includes(m), m);
  // Still no per-building buttons: buildings open from the city itself (manual sec. 7.5).
  for (const k of ['city', 'yard', 'tavern', 'bank', 'hall', 'store', 'house', 'market'])
    assert.ok(!nav.includes(`data-city-tab="${k}"`), 'no building button ' + k);
  // Sections and icons: every action button carries an icon svg and a labelled span.
  assert.ok((nav.match(/cc-section/g) ?? []).length >= 2, 'section labels');
  assert.ok((nav.match(/CC_ICONS\./g) ?? []).length >= 6, 'icons');
});

test('panel labels stay live from the same values as the header', () => {
  assert.ok(js.includes('function syncCityControls()'), 'sync fn');
  assert.ok(js.includes('syncCityControls();\n'), 'called from render');
  assert.ok(js.includes('set("play", playing ? t.pause : t.play)'), 'pause label live');
  assert.ok(js.includes('set("speed", `${t.speed} ${speed}x`)'), 'speed label live');
  assert.ok(js.includes('set("msgs", badge(LT[lang].messages, unread(g)))'), 'message badge live');
  for (const h of [
    '[data-city-msgs]").onclick=()=>showLedger("msg")',
    '[data-city-play]").onclick=()=>toggleClock()',
    '[data-city-fs]").onclick=()=>$("fs")?.click()',
    '[data-city-lang]").onclick=()=>$("lang")?.click()',
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
