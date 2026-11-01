import test from 'node:test';
import assert from 'node:assert/strict';
import { loadWorld } from '../src/sim/world.mjs';
import { newGame, setRoute, setRouteAdv, doBuy, doSell, doSail, advanceDay, clearRoute, repeatRoute } from '../src/game/game.mjs';
import { processRoutes } from '../src/game/routes.mjs';
import { captainRoster, hireCaptain } from '../src/game/captains.mjs';
import { messageText } from '../src/view/ledgerview.mjs';
import { serialize, deserialize } from '../src/game/gamesave.mjs';
const world = loadWorld(), ops = { doBuy, doSell, doSail };
const notices = game => game.inbox.filter(msg => msg.kind === 'routeStuck' && msg.action === 'sail');
function fixture(advanced = false, away = false) {
 const game = newGame(world, 'cadiz', { seed: 97 }); game.cash = 20000;
 const ship = game.ships[0];
 assert.ok(hireCaptain(game, ship, captainRoster(game, ship.at)[0].id).ok);
 if (advanced) assert.ok(setRouteAdv(game, ship, [{ city: 'cadiz', buy: [{ good: 'grain' }] }, { city: 'huelva', sell: [{ good: 'grain' }] }]).ok);
 else assert.ok(setRoute(game, ship, 'cadiz', 'huelva', 'grain').ok);
 if (away) ship.at = 'malaga';
 ship.crew = 0;
 return { game, ship };
}
for (const advanced of [false, true]) for (const away of [false, true]) test(`departure rejection is explained on ${advanced ? 'advanced' : 'simple'} route, ${away ? 'away from first stop' : 'at first stop'}`, () => {
 const { game, ship } = fixture(advanced, away);
 for (let day = 0; day < 3; day++) advanceDay(game);
 assert.equal(ship.voyage, null);
 assert.ok(ship.captain, 'a captain cannot replace the missing crew');
 assert.equal(notices(game).length, 1, 'same departure rejection is not repeated');
 const notice = notices(game)[0]; assert.equal(notice.cause, 'crew');
 assert.equal(notice.city, away ? 'malaga' : 'cadiz');
 assert.equal(notice.destination, away ? 'cadiz' : 'huelva');
 for (const lang of ['es', 'en']) {
  const text = messageText(notice, lang, String, city => `Port:${city}`);
  assert.ok(text.includes(`Port:${notice.destination}`));
  assert.match(text, lang === 'es' ? /capitán no la sustituye/ : /captain does not replace/);
  assert.doesNotMatch(text, /no pudo comprar|could not buy/);
 }
 const restored = deserialize(serialize(game, 'Sail feedback'), world).g;
 advanceDay(restored); assert.equal(notices(restored).length, 1, 'dedup survives reload');
 restored.ships[0].crew = 12; advanceDay(restored);
 assert.ok(restored.ships[0].voyage, 'real departure recovers after hiring crew');
 assert.equal(restored.ships[0].route.sailBlockKey, undefined);
});

test('changed cause reports once and successful departure clears the key without changing advanced indices', () => {
 const { game, ship } = fixture(true);
 const reasons = ['held', 'held', 'blockade', 'blockade'];
 for (const reason of reasons) processRoutes(game, { ...ops, doSail: () => ({ ok: false, reason }) });
 assert.equal(notices(game).length, 2);
 const index = ship.route.idx;
 processRoutes(game, { ...ops, doSail: () => ({ ok: true }) });
 assert.equal(ship.route.idx, index, 'already selected next stop is preserved');
 assert.equal(ship.route.sailBlockKey, undefined);
 processRoutes(game, { ...ops, doSail: () => ({ ok: false, reason: 'blockade' }) });
 assert.equal(notices(game).length, 3, 'new blocked stretch warns again');
});

test('cancel and repeat omit transient sailing diagnostics', () => {
 const { game, ship } = fixture(); processRoutes(game, ops);
 assert.ok(ship.route.sailBlockKey); clearRoute(ship);
 assert.ok(!Object.hasOwn(ship.lastRoute, 'sailBlockKey'));
 assert.ok(repeatRoute(game, ship).ok);
 assert.ok(!Object.hasOwn(ship.route, 'sailBlockKey'));
});
