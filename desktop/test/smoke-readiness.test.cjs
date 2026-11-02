const test = require('node:test');
const assert = require('node:assert/strict');
const { waitForMenuSnapshot } = require('../smoke-readiness.cjs');
const reply = start => ({ result: { value: JSON.stringify({ start, title: 'El Almojarife' }) } });
test('missing CDP value and a loading document cannot pass before the real menu', async () => {
  const responses = [{}, { result: {} }, reply(false), reply(true)];
  let delays = 0;
  const result = await waitForMenuSnapshot(() => Promise.resolve(responses.shift()), { attempts: 4, delay: () => { delays++; return Promise.resolve(); } });
  assert.equal(result.start, true); assert.equal(delays, 3); assert.equal(responses.length, 0);
});
test('missing data and a menu-free document both time out without a false pass', async () => {
  for (const value of [{ result: {} }, reply(false)]) {
    let calls = 0, delays = 0;
    await assert.rejects(waitForMenuSnapshot(() => { calls++; return Promise.resolve(value); }, {
      attempts: 3, delay: () => { delays++; return Promise.resolve(); },
    }), /not observed after 3 attempts/);
    assert.equal(calls, 3); assert.equal(delays, 2);
  }
});
test('evaluation exceptions, malformed snapshots and transport failures remain explicit failures', async () => {
  for (const response of [{ exceptionDetails: { text: 'Script failed' } }, { result: { value: '{broken' } },
    { result: { value: '{}' } }, { result: { value: 'null' } }, { result: { value: 1 } }]) {
    await assert.rejects(waitForMenuSnapshot(() => Promise.resolve(response), { attempts: 1 }), /Packaged menu/);
  }
  await assert.rejects(waitForMenuSnapshot(() => Promise.reject(Error('transport lost'))), /transport lost/);
});
test('an immediately ready real menu has no waiting delay', async () => {
  const result = await waitForMenuSnapshot(() => Promise.resolve(reply(true)), { delay: () => Promise.reject(Error('unexpected delay')) });
  assert.equal(result.title, 'El Almojarife');
});
