import test from 'node:test';
import assert from 'node:assert/strict';
import { loadWorld } from '../src/sim/world.mjs';
import { newGame } from '../src/game/game.mjs';
import { cajaOf, cajaTarget, creditCaja, taxSteps } from '../src/game/council.mjs';
import { hallView } from '../src/view/townhallview.mjs';
import { serialize, deserialize } from '../src/game/gamesave.mjs';

// hallView may lazily normalize reputation; this contract concerns accounting and clock, not full-state purity.
const world = loadWorld();
const fresh = () => newGame(world, 'cadiz', { cash: 1234.56 });

test('reading absent public chests displays fallback reserves without materializing funds or tax records', () => {
  const game = fresh();
  delete game.hallCaja;
  delete game.hallTax;
  const before = JSON.stringify({ cash: game.cash, hallCaja: game.hallCaja, hallTax: game.hallTax, day: game.day, tick: game.tick });
  for (const city of ['cadiz', 'sevilla']) {
    assert.equal(cajaOf(game, city), cajaTarget(world, city));
    assert.equal(hallView(game, city).caja, cajaTarget(world, city));
    assert.deepEqual(taxSteps(game, city), { sisa: 0, portazgo: 0 });
  }
  assert.equal(JSON.stringify({ cash: game.cash, hallCaja: game.hallCaja, hallTax: game.hallTax, day: game.day, tick: game.tick }), before, 'opening either city view must not create a balance, levy or private payment');
});

test('crediting and debiting one city chest never transfers private cash or another city balance', () => {
  const game = fresh();
  game.hallCaja = { cadiz: 123.45, sevilla: 678.9 };
  const privateCash = game.cash;
  const marketBefore = JSON.stringify(game.market);
  creditCaja(game, 'cadiz', 10.25);
  assert.equal(cajaOf(game, 'cadiz'), 133.7);
  creditCaja(game, 'cadiz', -20.5);
  assert.equal(cajaOf(game, 'cadiz'), 113.2);
  assert.equal(cajaOf(game, 'sevilla'), 678.9, 'public balances are local, not a shared chest');
  assert.equal(game.cash, privateCash, 'public accounting is not a player donation or withdrawal');
  assert.equal(JSON.stringify(game.market), marketBefore, 'ledger changes do not purchase stock');
});

test('save/load and repeated city views preserve distinct signed cent balances without re-crediting', () => {
  const game = fresh();
  game.hallCaja = { cadiz: -12.34, sevilla: 567.89 };
  game.hallTax = { cadiz: { sisa: 2, portazgo: -1 }, sevilla: { sisa: -3, portazgo: 4 } };
  const loaded = deserialize(serialize(game, 'Casa de prueba', 0), world).g;
  assert.deepEqual(loaded.hallCaja, game.hallCaja, 'loading preserves negative and positive public cents');
  assert.deepEqual(loaded.hallTax, game.hallTax, 'city levies keep their own records');
  assert.equal(loaded.cash, game.cash, 'loading a public balance changes no private cash');
  const before = JSON.stringify({ cash: loaded.cash, hallCaja: loaded.hallCaja, hallTax: loaded.hallTax, day: loaded.day, tick: loaded.tick });
  for (const city of ['cadiz', 'sevilla', 'cadiz', 'sevilla']) {
    assert.equal(hallView(loaded, city).caja, game.hallCaja[city]);
  }
  assert.equal(JSON.stringify({ cash: loaded.cash, hallCaja: loaded.hallCaja, hallTax: loaded.hallTax, day: loaded.day, tick: loaded.tick }), before, 'reopening views after reload neither settles nor re-credits a period');
});
