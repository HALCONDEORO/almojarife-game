import test from 'node:test';import assert from 'node:assert/strict';
import {loadWorld} from '../src/sim/world.mjs';
import {newGame,doBuy,doSell,buyWarehouse,storeGoods,takeGoods,sellShip,buyCaravel,netWorth,borrow,repay} from '../src/game/game.mjs';
import {price,makeMarket,tickMarket,seasonMul} from '../src/sim/market.mjs';import {buy,sell,previewBuy,previewSell,makeShip} from '../src/sim/trade.mjs';
import {serialize,deserialize} from '../src/game/gamesave.mjs';
const world=loadWorld();
test('warehouse transfers preserve split cost books and correct sale profit',()=>{
 const g=newGame(world);g.cash=9000;const s=g.ships[0];buyWarehouse(g,s.at);const b=doBuy(g,s,'salt',10);assert.equal(b.cost,190);
 const worth=netWorth(g);storeGoods(g,s,'salt',10);assert.equal(s.basis.salt,undefined);assert.equal(g.warehouses[s.at].basis.salt,190);assert.equal(netWorth(g),worth);
 takeGoods(g,s,'salt',5);assert.equal(s.basis.salt,95);assert.equal(g.warehouses[s.at].basis.salt,95);
 const r=doSell(g,s,'salt',5);assert.equal(r.spent,95);assert.equal(r.profit,r.revenue-95);assert.equal(g.basis.salt.cost,95);
 const reload=deserialize(serialize(g,'audit'),world).g;assert.equal(reload.warehouses[s.at].basis.salt,95);
});
test('many rounded warehouse splits conserve exact integer basis across two ships',()=>{
 const g=newGame(world);g.cash=9000;const s=g.ships[0];buyWarehouse(g,s.at);buyCaravel(g,s.at);const t=g.ships[1];doBuy(g,s,'grain',19);const total=s.basis.grain;
 for(let i=0;i<19;i++){storeGoods(g,s,'grain',1);assert.equal((s.basis.grain??0)+(g.warehouses[s.at].basis.grain??0),total);}
 for(let i=0;i<19;i++)takeGoods(g,t,'grain',1);
 assert.equal(t.basis.grain,total);assert.deepEqual(g.warehouses[s.at].basis,{});assert.deepEqual(s.basis,{});
});
test('remote warehouse and foreign ship sales/transfers fail without mutation',()=>{
 const g=newGame(world);g.cash=9000;let before=JSON.stringify(g);assert.equal(buyWarehouse(g,'barcelona').ok,false);assert.equal(JSON.stringify(g),before);
 buyCaravel(g,g.ships[0].at);buyWarehouse(g,g.ships[0].at);const foreign=makeShip(900,'cog',g.ships[0].at);foreign.cargo={salt:2};
 for(const action of [()=>sellShip(g,foreign),()=>storeGoods(g,foreign,'salt',1),()=>takeGoods(g,foreign,'salt',1)]){before=JSON.stringify(g);assert.equal(action().ok,false);assert.equal(JSON.stringify(g),before);}
});
test('all 33 ports/goods: quote monotonic/bounded, preview equals actual trade, roundtrip loses cash',()=>{
 let deals=0;
 for(const c of world.cities)for(const good of Object.keys(world.goods)){
  const market=makeMarket(world),s=makeShip(1,'cog',c.id),e=market[c.id][good],base=world.goods[good].base;
  const quotes=[0,1,e.target,e.target*4,e.target*100].map(stock=>price(world,{...e,stock},good));
  for(let i=1;i<quotes.length;i++)assert.ok(quotes[i]<=quotes[i-1]);
  assert.ok(quotes.every(p=>p>=Math.round(base*.4)&&p<=Math.round(base*3)));
  const preview=previewBuy(world,market,s,10000,good,23),b=buy(world,market,s,10000,good,23);assert.equal(b.qty,preview.qty);assert.equal(b.cost,preview.cost);
  const ps=previewSell(world,market,s,good,b.qty),r=sell(world,market,s,good,b.qty);assert.equal(r.revenue,ps.revenue);assert.equal(r.profit,ps.profit);assert.ok(r.revenue<b.cost);assert.equal(r.spent,b.cost);assert.deepEqual(s.basis,{});deals++;
 }
 assert.equal(deals,world.cities.length*Object.keys(world.goods).length);
});
test('730 market days: finite integral nonnegative stocks, bounded prices, repeatable save roundtrip',()=>{
 let a=makeMarket(world),b=JSON.parse(JSON.stringify(a));
 for(let day=0;day<730;day++){
  tickMarket(a,day,world);tickMarket(b,day,world);
  for(const city of Object.values(a))for(const [good,e] of Object.entries(city)){assert.ok(Number.isSafeInteger(e.stock)&&e.stock>=0&&e.stock<=e.target*4);const p=price(world,e,good);assert.ok(Number.isFinite(p)&&p>0);assert.ok(seasonMul(good,day)>=.65-1e-12&&seasonMul(good,day)<=1.35+1e-12);}
  if(day===364)b=JSON.parse(JSON.stringify(b));
 }
 assert.deepEqual(a,b);
});
test('loan draw and repayment conserve cash minus debt and do not enlarge borrowing base',()=>{
 for(const amount of [100,200,500,1000]){
 const g=newGame(world),worth=netWorth(g),cash=g.cash,city=g.ships[0].at;const r=borrow(g,city,amount);assert.equal(r.ok,true);assert.equal(netWorth(g),worth);assert.equal(g.cash,cash+amount);
 repay(g,r.loan.id,amount/2);assert.equal(netWorth(g),worth);repay(g,r.loan.id,amount);assert.equal(g.cash,cash);assert.equal(netWorth(g),worth);
 }
});
