import test from 'node:test';
import assert from 'node:assert/strict';
import { loadWorld } from '../src/sim/world.mjs';
import { newGame, netWorth } from '../src/game/game.mjs';
import { makeShip } from '../src/sim/trade.mjs';
import { prepareBotCredit, repayBotCredit, botFinanceView } from '../src/game/botcredit.mjs';
import { processLoans, loansOwed, loanRoom, takeLoan } from '../src/game/bank.mjs';
import { accrueDay, settleWeek, post } from '../src/game/ledger.mjs';
import { serialize, deserialize } from '../src/game/gamesave.mjs';
const world = loadWorld();
function setup() {
  const g = newGame(world, 'cadiz', { freePlay: true });
  const bot = { cash: 792, ship: makeShip(91, 'cog', 'cadiz') };
  g.ai.push(bot); return { g, bot };
}
test('credit uses only bot collateral, private loan IDs and messages, not human rank/wealth', () => {
  const {g, bot} = setup(); g.cash = 1e6; g.rankIdx = 6;
  g.loans = [{ id: 70, left: 500, due: 100 }]; g.nextLoan = 70;
  g.warehouses = { cadiz: { goods: { silk: 100 } } };
  const human = JSON.stringify({cash:g.cash, loans:g.loans, inbox:g.inbox, warehouses:g.warehouses, rank:g.rankIdx});
  assert.equal(prepareBotCredit(g,bot,'cadiz',710,400).ok,false);
  const r=prepareBotCredit(g,bot,'cadiz',710,200);
  assert.ok(r.ok); assert.equal(r.borrowed,200); assert.equal(r.loan.id,1);
  assert.equal(bot.cash,992); assert.equal(loansOwed(botFinanceView(g,bot)),200);
  assert.equal(netWorth(botFinanceView(g,bot)),792);
  assert.equal(bot.inbox[0].kind,'loan');
  assert.equal(JSON.stringify({cash:g.cash, loans:g.loans, inbox:g.inbox, warehouses:g.warehouses, rank:g.rankIdx}),human);
});
test('no privileges: insolvent, at sea, invalid budget, game over and existing debt', () => {
  const {g,bot}=setup(); bot.cash=-20;
  assert.equal(prepareBotCredit(g,bot,'cadiz',100,100).reason,'over limit');
  bot.cash=792; bot.ship.voyage={};
  assert.equal(prepareBotCredit(g,bot,'cadiz',710,200).reason,'no ship here');
  bot.ship.voyage=null;
  assert.equal(prepareBotCredit(g,bot,'cadiz',NaN,100).reason,'bad budget');
  assert.equal(prepareBotCredit(g,bot,'cadiz',100,-1).reason,'bad budget');
  g.over='lose'; assert.equal(prepareBotCredit(g,bot,'cadiz',710,200).reason,'game over');
  g.over=null; assert.ok(prepareBotCredit(g,bot,'cadiz',710,200).ok);
  assert.equal(prepareBotCredit(g,bot,'cadiz',1000,200).reason,'existing loan');
});
test('fully funded investment does not borrow or create persistent finance state', () => {
  const {g,bot}=setup(); const before=JSON.stringify(bot);
  assert.deepEqual(prepareBotCredit(g,bot,'cadiz',500,200),{ok:true,borrowed:0});
  assert.equal(JSON.stringify(bot),before);
});
test('repayment protects accrued bill and reserve, allows partial then full payment', () => {
  const {g,bot}=setup(); prepareBotCredit(g,bot,'cadiz',710,200);
  bot.cash=300; bot.accrued={ships:{91:40}};
  assert.equal(repayBotCredit(g,bot,100).paid,158);
  assert.equal(bot.cash,142); assert.equal(loansOwed(botFinanceView(g,bot)),42);
  bot.cash=200; assert.equal(repayBotCredit(g,bot,100).paid,42);
  assert.equal(bot.loans.length,0);
});
test('player ledger charges weekly interest and collects on day 56 using private view', () => {
  const {g,bot}=setup(); prepareBotCredit(g,bot,'cadiz',710,200);
  const humanCash=g.cash;
  for(let day=1;day<=56;day++){
    g.day=day; const view=botFinanceView(g,bot);
    accrueDay(view,bot.ship);
    const principal=processLoans(view,post);
    view.weekLoanPrincipal=(view.weekLoanPrincipal??0)+principal;
    settleWeek(view);
  }
  assert.equal(bot.loans.length,0); assert.equal(bot.reports[0].loanPrincipal,200);
  assert.equal(bot.reports[0].loanInterest,2);
  assert.equal(bot.cash,992-112-16-200); assert.equal(g.cash,humanCash);
});
test('saved bot state preserves loan and counter; fresh views reuse the same account', () => {
  const {g,bot}=setup(); prepareBotCredit(g,bot,'cadiz',710,200);
  const copy=deserialize(serialize(g,'Credit'),world).g;
  const b=copy.ai.find(t=>t.ship.id===91); const view=botFinanceView(copy,b);
  assert.equal(loansOwed(view),200); assert.equal(b.nextLoan,1);
  assert.equal(repayBotCredit(copy,b,0).paid,200);
  const room=loanRoom(view,netWorth(view));
  assert.ok(takeLoan(view,'cadiz',Math.min(100,room),netWorth(view)).ok);
  assert.equal(b.loans[0].id,2); assert.equal(bot.loans[0].id,1);
});
test('another house cannot supply collateral or ship presence; private stored goods do count', () => {
  const {g,bot}=setup(); const other={cash:999999,ship:makeShip(92,'cog','sevilla'),warehouses:{cadiz:{goods:{silk:100}}}};
  g.ai.push(other); bot.cash=100;
  assert.equal(prepareBotCredit(g,bot,'cadiz',200,100).reason,'over limit');
  bot.warehouses={cadiz:{goods:{salt:100}}};
  assert.ok(prepareBotCredit(g,bot,'cadiz',200,100).ok);
  assert.equal(other.cash,999999); assert.equal(other.loans,undefined);
  assert.equal(prepareBotCredit(g,other,'cadiz',999999,100).reason,'no ship here');
});
test('pending accrued bill is protected before borrowing and failed quote leaves state intact', () => {
  const {g,bot}=setup(); bot.accrued={ships:{91:50},tolls:12};
  const before=JSON.stringify(bot);
  assert.equal(prepareBotCredit(g,bot,'cadiz',710,400).reason,'over limit');
  assert.equal(JSON.stringify(bot),before);
  const r=prepareBotCredit(g,bot,'cadiz',710,200);
  assert.ok(r.ok); assert.equal(r.borrowed,200);
  bot.cash=100;
  assert.equal(repayBotCredit(g,bot,100).paid,0);
});
