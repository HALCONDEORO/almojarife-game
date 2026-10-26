'use strict';
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createStaticServer, resolveGameFile, isAllowedExternal, listen } = require('../server-lib.cjs');

let root, server, base, outside;
before(async () => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'almoj-'));
  fs.writeFileSync(path.join(root, 'index.html'), '<h1>El Almojarife</h1>');
  fs.mkdirSync(path.join(root, 'src'));
  fs.writeFileSync(path.join(root, 'src', 'x.mjs'), 'export const x = 1;');
  outside = path.join(os.tmpdir(), 'almoj-outside-' + process.pid + '.txt');
  fs.writeFileSync(outside, 'secret');
  fs.symlinkSync(outside, path.join(root, 'escape.txt'));
  // sibling directory sharing the path prefix: the classic startsWith bypass
  fs.mkdirSync(root + '2');
  fs.writeFileSync(root + '2' + path.sep + 'sibling.txt', 'sibling');
  server = createStaticServer(root);
  const port = await listen(server, 0);
  base = `http://127.0.0.1:${port}`;
});
after(() => { server.close(); fs.rmSync(root, { recursive: true, force: true }); fs.rmSync(root + '2', { recursive: true, force: true }); fs.rmSync(outside, { force: true }); });

const get = (p) => fetch(base + p);

test('serves index.html at / with html type', async () => {
  const r = await get('/');
  assert.equal(r.status, 200);
  assert.match(r.headers.get('content-type'), /text\/html/);
  assert.match(await r.text(), /El Almojarife/);
});
test('serves a nested module with javascript type', async () => {
  const r = await get('/src/x.mjs');
  assert.equal(r.status, 200);
  assert.match(r.headers.get('content-type'), /javascript/);
});
test('404 for a missing file', async () => {
  assert.equal((await get('/nope.html')).status, 404);
});
test('403/404 for ../ traversal', async () => {
  assert.equal((await get('/../' + path.basename(outside))).status, 404);
});
test('404 for percent-encoded traversal', async () => {
  assert.equal((await get('/%2e%2e/' + path.basename(outside))).status, 404);
  assert.equal((await get('/%2E%2E%2F' + path.basename(outside))).status, 404);
});
test('symlink escaping the root is not served', async () => {
  assert.equal((await get('/escape.txt')).status, 404);
});
test('sibling directory sharing the path prefix is not served (startsWith bypass)', () => {
  const realRoot = fs.realpathSync(root);
  assert.equal(resolveGameFile(realRoot, '/../' + path.basename(root) + '2/sibling.txt'), null);
});
test('resolveGameFile keeps a legit nested file', () => {
  const realRoot = fs.realpathSync(root);
  assert.ok(resolveGameFile(realRoot, '/src/x.mjs').endsWith(path.join('src', 'x.mjs')));
});
test('external allowlist: project https origins only', () => {
  assert.ok(isAllowedExternal('https://github.com/HALCONDEORO/almojarife-game'));
  assert.ok(isAllowedExternal('https://github.com/HALCONDEORO/almojarife-game/issues'));
  assert.ok(isAllowedExternal('https://halcondeoro.github.io/almojarife-game/'));
  assert.ok(!isAllowedExternal('http://github.com/HALCONDEORO/almojarife-game')); // no http
  assert.ok(!isAllowedExternal('https://github.com/HALCONDEORO/almojarife-game.evil.com')); // prefix look-alike
  assert.ok(!isAllowedExternal('https://evil.com/?x=https://github.com/HALCONDEORO/almojarife-game'));
  assert.ok(!isAllowedExternal('not a url'));
  assert.ok(!isAllowedExternal('file:///etc/passwd'));
});
test('listen on a busy port rejects (the shell turns this into a visible error)', async () => {
  const s2 = createStaticServer(root);
  await assert.rejects(listen(s2, new URL(base).port));
  s2.close();
});
