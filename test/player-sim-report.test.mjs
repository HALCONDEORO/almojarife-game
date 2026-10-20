import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const r = JSON.parse(readFileSync(new URL('../docs/design/player-baseline-2026-10-20.json', import.meta.url)));
test('player baseline contains complete per-port outcomes and reconciles totals', () => {
  assert.equal(r.results.length, 132);
  for (const strategy of Object.keys(r.summaries)) {
    const rows = r.results.filter((x) => x.strategy === strategy), s = r.summaries[strategy];
    assert.equal(rows.length, 66); assert.equal(new Set(rows.map((x) => x.start)).size, 33);
    assert.equal(s.wins + s.bankrupt + s.deadlineLosses, rows.length);
    assert.equal(s.wins, rows.filter((x) => x.outcome === 'win').length);
    assert.ok(rows.every((x) => x.day <= 365 && Number.isFinite(x.cash) && Number.isFinite(x.netWorth)));
  }
});
