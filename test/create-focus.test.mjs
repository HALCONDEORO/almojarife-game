import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const src = readFileSync(new URL('../web/main.mjs', import.meta.url), 'utf8');
const create = src.slice(src.indexOf('function showCreate('), src.indexOf('function showTitle('));
test('portrait, colour and select choices restore focus after rebuilding their form', () => {
  assert.ok(create.includes('draw(); el.querySelector(`[data-p="${pf.portrait}"]`)?.focus()'));
  assert.ok(create.includes('draw(); el.querySelector(`.sw[data-k="${key}"][data-v="${value}"]`)?.focus()'));
  assert.ok(create.includes('read(); set(e.target.value); draw(); $(id)?.focus()'));
});
