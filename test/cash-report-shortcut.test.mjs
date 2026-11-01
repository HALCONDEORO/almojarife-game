import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../web/main.mjs', import.meta.url), 'utf8');
const html = readFileSync(new URL('../web/index.html', import.meta.url), 'utf8');

test('cash in the global header is a native keyboard and touch accessible button', () => {
 assert.match(html, /<button type="button" id="cash"><\/button>/);
});

test('actual cash handler opens existing reports, without a second ledger or a transaction', () => {
 const binding = source.split('\n').find(line => line.startsWith('$("cash").onclick'));
 const button = {}, opened = [];
 vm.runInNewContext(binding, { $: () => button, openLedger: kind => opened.push(kind) });
 button.onclick(); assert.deepEqual(opened, ['rep']);
});

test('cash hint explains the report destination in Spanish and English', () => {
 const line = source.split('\n').find(entry => entry.includes('$("cash").title'));
 for (const [lang, expected] of [['es', 'Ver informes y desglose de gastos'], ['en', 'View reports and expense breakdown']]) {
  const button = { style: {} };
  vm.runInNewContext(line, { $: () => button, lang, g: { cash: 1000 }, t: { cash: 'Cash' }, fmt: String });
  assert.equal(button.title, expected); assert.equal(button.textContent, 'Cash: 1000');
 }
});
