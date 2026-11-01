import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { loadWorld } from '../src/sim/world.mjs';
import { newGame, orderRepair, processRepairs, cancelRepair, repairOf, repairRefund } from '../src/game/game.mjs';
import { serialize, deserialize } from '../src/game/gamesave.mjs';
import { repairCancelHtml } from '../src/view/repaircancel.mjs';
import { shipWindowHtml } from '../src/view/shipwindow.mjs';
const world = loadWorld();
const fmt = String;
for (const steps of [0, 1, 3]) test(`cancellation preview matches the actual settlement after ${steps} work days and reload`, () => {
  let game = newGame(world);
  game.cash = 20000;
  const ship = game.ships[0]; ship.hull = 0;
  const placed = orderRepair(game, [ship.id], ship.at);
  for (let i = 0; i < steps; i++) processRepairs(game);
  game = deserialize(serialize(game, 'Repair preview'), world).g;
  const order = repairOf(game, ship.id), before = JSON.stringify(game);
  const expected = Math.floor(order.cost * order.left / order.total);
  assert.equal(repairRefund(order), expected);
  for (const lang of ['es', 'en']) {
    const html = repairCancelHtml(order, lang, fmt);
    assert.ok(html.includes(`${lang === 'es' ? 'devolver' : 'refund'} ${expected}`));
    assert.ok(html.includes(String(order.cost - expected)));
    assert.match(html, lang === 'es' ? /El casco ya reparado se conserva/ : /Completed hull repairs stay/);
  }
  assert.equal(JSON.stringify(game), before, 'preview never changes the game');
  const hull = game.ships[0].hull, cash = game.cash;
  assert.equal(cancelRepair(game, placed.id).refund, expected);
  assert.equal(game.cash, cash + expected);
  assert.equal(game.ships[0].hull, hull);
  assert.equal(cancelRepair(game, placed.id).reason, 'no order');
});

test('shared preview is visible in ship data and wired into both yard order views', () => {
  const game = newGame(world); game.cash = 20000;
  const ship = game.ships[0]; ship.hull = 0;
  orderRepair(game, [ship.id], ship.at); processRepairs(game);
  for (const lang of ['es', 'en']) {
    const html = shipWindowHtml(game, ship, lang, 'data', { fmt, cityName: x => x, types: {}, goods: {}, eta: () => '' });
    assert.ok(html.includes(lang === 'es' ? 'Cancelar · devolver 300' : 'Cancel · refund 300'));
  }
  const main = fs.readFileSync(new URL('../web/main.mjs', import.meta.url), 'utf8');
  assert.ok(main.includes('repairCancelHtml(repOrd, lang, fmt)'));
  assert.ok(main.includes('repairCancelHtml(ord, lang, fmt)'));
});

test('refund preview uses the same downward rounding as settlement', () => {
  assert.equal(repairRefund({ cost: 101, total: 3, left: 2 }), 67);
  assert.equal(repairRefund({ cost: 101, total: 0, left: 0 }), 0);
});
