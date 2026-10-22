import test from 'node:test';
import assert from 'node:assert/strict';
import { loadWorld } from '../src/sim/world.mjs';
import { makeMarket } from '../src/sim/market.mjs';
import { makeShip } from '../src/sim/trade.mjs';
import { aiStep } from '../src/sim/ai.mjs';
const world = loadWorld();

function setup() {
  const market = makeMarket(world), ship = makeShip(1, 'cog', 'cadiz');
  // Cheap local supply and scarce remote reports guarantee profitable candidates.
  for (const e of Object.values(market.cadiz)) e.stock = e.target * 4;
  const known = structuredClone(market);
  for (const [city, cells] of Object.entries(known)) if (city !== 'cadiz')
    for (const e of Object.values(cells)) e.stock = 1;
  return { market, known, ship, trader: { cash: 2000, ship } };
}

test('a private report plans a trade without reading any live remote prices', () => {
  const {market, known, ship, trader} = setup();
  const guarded = new Proxy(market, { get(target, city) {
    if (city !== 'cadiz') throw new Error('live remote read: ' + String(city));
    return target[city];
  }});
  const plan = aiStep(world, guarded, trader, ship, { planningMarket: () => known, canVisit: () => true });
  assert.ok(plan && plan.qty > 0);
  assert.equal(ship.voyage.to, plan.dest);
  assert.ok(trader.cash < 2000, 'execution charges the real purchase');
});

test('a discovered port without price information is not a trading opportunity', () => {
  const {market, ship, trader} = setup();
  assert.equal(aiStep(world, market, trader, ship, {planningMarket: () => ({}), canVisit: () => true}), null);
  assert.equal(ship.voyage, null);
  assert.equal(trader.cash, 2000);
});

test('a remembered price cannot reveal an uncharted destination', () => {
  const {market, known, ship, trader} = setup();
  assert.equal(aiStep(world, market, trader, ship, {planningMarket: () => known, canVisit: () => false}), null);
  assert.equal(ship.voyage, null);
});

test('the chart permits only its own destinations, even with other reports in memory', () => {
  const {market, known, ship, trader} = setup();
  const plan = aiStep(world, market, trader, ship, {planningMarket: () => known, canVisit: (c) => c === 'sevilla'});
  assert.equal(plan.dest, 'sevilla');
});

test('changing hidden real prices cannot change a decision made from the same report', () => {
  const run = (stock) => {
    const {market, known, ship, trader} = setup();
    for (const [city, cells] of Object.entries(market)) if (city !== 'cadiz')
      for (const e of Object.values(cells)) e.stock = stock;
    return aiStep(world, market, trader, ship, {planningMarket: () => known});
  };
  assert.deepEqual(run(1), run(100000));
});

test('partial reports and unavailable private reports do not fall back to omniscience', () => {
  const {market, ship, trader} = setup();
  assert.equal(aiStep(world, market, trader, ship, {planningMarket: () => null}), null);
  assert.equal(aiStep(world, market, trader, ship, {planningMarket: () => ({sevilla: {}})}), null);
});

import { botIntelView, refreshBotKnowledge, botIntelHooks, buyBotReport } from '../src/game/botintel.mjs';
import { RUMOR_PRICE } from '../src/game/intel.mjs';

function privateGame() {
  const {market, ship, trader} = setup();
  const g = {world, market, day: 10, tick: 2400, ships: [makeShip(9, 'cog', 'barcelona')],
    warehouses: {argel: {goods: {}}}, intel: {argel: {day: 10, cells: market.argel}}, discovered: {argel: 0}};
  return {g, bot: {...trader, home: ship.at}};
}

test('bot knowledge never inherits human ships, warehouses, chart or intel', () => {
  const {g, bot} = privateGame(), v = refreshBotKnowledge(g, bot);
  assert.notEqual(v.intel, g.intel);
  assert.notEqual(v.discovered, g.discovered);
  assert.notEqual(v.warehouses, g.warehouses);
  assert.deepEqual(v.ships, [bot.ship]);
  assert.ok(bot.intel.cadiz?.exact);
  assert.equal(bot.intel.argel, undefined);
  assert.equal(bot.intel.barcelona, undefined);
  assert.equal(bot.discovered.argel, undefined);
  assert.equal(botIntelHooks(g, bot).canVisit('argel'), false);
});

test('remote bot memories stay stale until its own presence or paid report refreshes them', () => {
  const {g, bot} = privateGame();
  refreshBotKnowledge(g, bot);
  const saved = structuredClone(bot.intel.cadiz);
  bot.ship.at = 'sevilla';
  g.day++;
  g.market.cadiz.grain.stock = 1;
  refreshBotKnowledge(g, bot);
  assert.deepEqual(bot.intel.cadiz, saved);
  assert.equal(bot.intel.sevilla.day, g.day);
  assert.equal(botIntelHooks(g, bot).planningMarket().cadiz.grain.stock, saved.cells.grain.stock);
});

test('bot reports debit its purse, not the human purse, and persist in its own book', () => {
  const {g, bot} = privateGame();
  g.cash = 9999;
  refreshBotKnowledge(g, bot);
  bot.discovered.sevilla = 0;
  const before = bot.cash;
  const r = buyBotReport(g, bot);
  assert.ok(r.ok);
  assert.equal(bot.cash, before - RUMOR_PRICE);
  assert.equal(g.cash, 9999);
  assert.equal(bot.intel[r.city].exact, false);
  assert.equal(g.intel[r.city], undefined);
});

test('bot state survives a save without re-seeding the human chart into it', () => {
  const {g, bot} = privateGame();
  refreshBotKnowledge(g, bot);
  const restored = JSON.parse(JSON.stringify(bot));
  assert.deepEqual(botIntelView(g, restored).discovered, bot.discovered);
  assert.deepEqual(botIntelHooks(g, restored).planningMarket(), botIntelHooks(g, bot).planningMarket());
});
