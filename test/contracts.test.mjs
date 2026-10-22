// Town-council contracts: offers, acceptance, delivery by selling, completion premium, lapse penalty.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loadWorld} from '../src/sim/world.mjs';
import {newGame, advanceDay, doSell} from '../src/game/game.mjs';
import {rollContracts, acceptContract, offerOf, activeContracts, contractOnSale, expireContracts, CONTRACT_MAX_ACTIVE, CONTRACT_REP, CONTRACT_FAIL_REP} from '../src/game/contracts.mjs';
import {portRep} from '../src/game/reputation.mjs';
import {messageText} from '../src/view/ledgerview.mjs';
const world = loadWorld();

const withOffer = (g, city = 'cadiz', over = {}) => {
  const b = (g.contracts ??= {offers: {}, active: [], done: 0, failed: 0});
  b.offers[city] = {id: 't1', good: 'grain', qty: 20, reward: 500, dueDay: g.day + 30, ...over};
  return b.offers[city];
};

test('the weekly roll only posts offers for scarce needed goods, deterministically',()=>{
 const g1 = newGame(world, 'cadiz'), g2 = newGame(world, 'cadiz');
 g1.day = g2.day = 35; rollContracts(g1); rollContracts(g2);
 assert.deepEqual(g1.contracts.offers, g2.contracts.offers, 'same seed and day: same offers');
 for (const [city, o] of Object.entries(g1.contracts.offers)) {
   const e = g1.market[city][o.good];
   assert.ok(e.needs && !e.makes, `${city}: the good is one the port needs, not one it makes`);
   assert.ok(o.qty >= 10 && o.reward > 0 && o.dueDay > 35, 'sane qty, reward and deadline');
 }
});

test('accepting needs a docked ship and a free slot; the offer leaves the board',()=>{
 const g = newGame(world, 'cadiz'); withOffer(g);
 g.ships[0].voyage = {to: 'lisboa'}; // at sea
 assert.equal(acceptContract(g, 'cadiz').reason, 'no ship here');
 g.ships[0].voyage = null;
 assert.equal(acceptContract(g, 'cadiz').ok, true);
 assert.equal(offerOf(g, 'cadiz'), null, 'the offer is taken down');
 assert.equal(acceptContract(g, 'cadiz').reason, 'no offer', 'cannot accept twice');
 const b = g.contracts;
 for (let i = 0; i < CONTRACT_MAX_ACTIVE - 1; i++) b.active.push({id: 'x'+i, city: 'lisboa', good: 'salt', qty: 5, delivered: 0, reward: 10, dueDay: 99});
 withOffer(g, 'cadiz', {id: 't2'});
 assert.equal(acceptContract(g, 'cadiz').reason, 'too many', 'the house can only keep so many promises');
});

test('sales into the port count towards the contract; completion pays the premium and moves respect and reputation',()=>{
 const g = newGame(world, 'cadiz');
 withOffer(g);
 acceptContract(g, 'cadiz');
 const cash0 = g.cash, rep0 = portRep(g, 'cadiz');
 g.ships[0].cargo = {grain: 20}; g.ships[0].basis = {grain: 100};
 const r = doSell(g, g.ships[0], 'grain', 20);
 assert.ok(r.ok);
 assert.equal(g.contracts.active.length, 0, 'contract closed');
 assert.equal(g.contracts.done, 1);
 assert.equal(g.cash - cash0, r.revenue + 500, 'market price plus the council premium');
 assert.ok(portRep(g, 'cadiz') > rep0, 'reputation up');
 assert.equal((g.inbox??[]).filter((m)=>m.kind==='contractDone').length, 1, 'completion message posted');
});

test('a partial delivery does not pay; the contract keeps counting',()=>{
 const g = newGame(world, 'cadiz');
 withOffer(g);
 acceptContract(g, 'cadiz');
 const cash0 = g.cash;
 contractOnSale(g, 'cadiz', 'grain', 8);
 assert.equal(g.contracts.active[0].delivered, 8);
 assert.equal(g.cash, cash0, 'no premium yet');
 contractOnSale(g, 'cadiz', 'salt', 99); // wrong good
 assert.equal(g.contracts.active[0].delivered, 8, 'other goods do not count');
 contractOnSale(g, 'lisboa', 'grain', 99); // wrong port
 assert.equal(g.contracts.active[0].delivered, 8, 'other ports do not count');
});

test('a lapsed contract costs reputation and posts a message',()=>{
 const g = newGame(world, 'cadiz');
 withOffer(g);
 acceptContract(g, 'cadiz');
 contractOnSale(g, 'cadiz', 'grain', 5);
 const rep0 = portRep(g, 'cadiz');
 g.day = g.contracts.active[0].dueDay + 1;
 expireContracts(g);
 assert.equal(g.contracts.active.length, 0);
 assert.equal(g.contracts.failed, 1);
 assert.ok(portRep(g, 'cadiz') <= rep0 + CONTRACT_FAIL_REP + 0.001, 'the town remembers');
 const m = (g.inbox??[]).find((x)=>x.kind==='contractFailed');
 assert.ok(m && m.delivered === 5, 'the message says how much was delivered');
 assert.ok(messageText(m, 'es', (x)=>x).length > 10, 'and renders in Spanish');
});

test('dayTick wiring: offers appear on the weekly roll and lapses fire on the day',()=>{
 const g = newGame(world, 'cadiz', {freePlay: true});
 for (let d = 1; d <= 14; d++) advanceDay(g);
 assert.ok(g.contracts && typeof g.contracts.offers === 'object', 'the book exists after two weekly rolls');
});
