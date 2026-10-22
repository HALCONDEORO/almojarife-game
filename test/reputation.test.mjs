import test from 'node:test';import assert from 'node:assert/strict';
import {loadWorld} from '../src/sim/world.mjs';
import {newGame,doBuy,doSell,repairShip,repairCost,repairPrice} from '../src/game/game.mjs';
import {noteTrade,decayRep,portRep,repTierOf,feeMul,repairMul,addRep,repOnSale,repOnBuy,scarcityOf,REP_MIN,REP_MAX,REP_TRADE_CAP} from '../src/game/reputation.mjs';
import {FEE} from '../src/sim/trade.mjs';
import {houseHtml} from '../src/view/rankview.mjs';
import {serialize,deserialize} from '../src/game/gamesave.mjs';
const world=loadWorld();
const mk=()=>{const g=newGame(world);const s=g.ships[0];return{g,s};};
const scarce=(g,city,good='grain')=>{const e=g.market[city][good];e.stock=1;return scarcityOf(e);}; // stock 1: critically short
test('selling what the port lacks earns reputation; a balanced sale earns none',()=>{
 const{g,s}=mk();const r=scarce(g,'cadiz');
 s.cargo.grain=10;s.basis={grain:100};
 const before=g.cash;doSell(g,s,'grain',5);
 assert.ok(portRep(g,'cadiz')>0);assert.equal(repTierOf(g,'cadiz').id,'neutral');
 const gained=portRep(g,'cadiz');
 const{g:g2,s:s2}=mk();const e=g2.market.cadiz.grain;e.stock=e.target*2; // plenty
 s2.cargo.grain=5;s2.basis={grain:50};doSell(g2,s2,'grain',5);
 assert.equal(portRep(g2,'cadiz'),0,'abundant sale moves nothing');
 assert.ok(g.cash>before&&gained>0);
});
test('critical scarcity earns double per 100 coins, capped per sale',()=>{
 const{g}=mk();
 const d1=repOnSale(g,'cadiz',1.5,100);assert.equal(d1,1);
 const d2=repOnSale(g,'cadiz',3,100);assert.equal(d2,2,'critical shortage doubles');
 const d3=repOnSale(g,'cadiz',9,100000);assert.equal(d3,REP_TRADE_CAP,'cap per sale');
 assert.equal(repOnSale(g,'cadiz',0.8,500),0,'no shortage, no gain');
});
test('buying up scarce stock costs reputation; abundant buying is free',()=>{
 const{g,s}=mk();scarce(g,'cadiz');
 const r=doBuy(g,s,'grain',1);assert.ok(r.ok);
 assert.ok(portRep(g,'cadiz')<0);assert.equal(repTierOf(g,'cadiz').id,'illseen');
 const{g:g2,s:s2}=mk();const e=g2.market.cadiz.grain;e.stock=e.target*4;
 const r2=doBuy(g2,s2,'grain',5);assert.ok(r2.ok);assert.equal(portRep(g2,'cadiz'),0);
 assert.equal(repOnBuy(g2,'cadiz',0.5,1000),0);
});
test('tiers move the market fee and the shipyard bill',()=>{
 const{g}=mk();
 assert.equal(feeMul(g,'cadiz'),1);assert.equal(repairMul(g,'cadiz'),1);
 addRep(g,'cadiz',-1);assert.equal(feeMul(g,'cadiz'),1.5);
 addRep(g,'cadiz',21);assert.equal(feeMul(g,'cadiz'),0.75);
 addRep(g,'cadiz',30);assert.equal(feeMul(g,'cadiz'),0.5);assert.equal(repairMul(g,'cadiz'),0.9);
 addRep(g,'cadiz',30);assert.equal(feeMul(g,'cadiz'),0.25);assert.equal(repairMul(g,'cadiz'),0.8);
});
test('the discount reaches real trades and real repairs',()=>{
 const cheap=mk(),dear=mk();
 addRep(cheap.g,'cadiz',100);addRep(dear.g,'cadiz',-20);
 for(const x of[cheap,dear]){x.g.market.cadiz.pepper.stock=x.g.market.cadiz.pepper.target*4;x.s.cargo={};} // pepper: dear enough that per-unit rounding keeps the fee visible
 const rc=doBuy(cheap.g,cheap.s,'pepper',10),rd=doBuy(dear.g,dear.s,'pepper',10);
 assert.ok(rc.ok&&rd.ok);assert.ok(rc.cost<rd.cost,`renowned pays less than ill-seen: ${rc.cost} < ${rd.cost}`);
 const{g,s}=mk();addRep(g,'cadiz',80);s.hull=50;
 const full=repairCost(s),disc=repairPrice(g,s);
 assert.ok(disc<full);const cash=g.cash;const r=repairShip(g,s);
 assert.ok(r.ok);assert.equal(r.cost,disc);assert.equal(s.hull,100);assert.equal(g.cash,cash-disc);
});
test('reputation is clamped and survives a save/load',()=>{
 const{g}=mk();
 addRep(g,'cadiz',99999);assert.equal(portRep(g,'cadiz'),REP_MAX);
 addRep(g,'cadiz',-999999);assert.equal(portRep(g,'cadiz'),REP_MIN);
 addRep(g,'cadiz',80);
 const r=deserialize(serialize(g,'T'),world).g;
 assert.equal(portRep(r,'cadiz'),portRep(g,'cadiz'));
});
test('the House panel lists reputation with its fee and shipyard effect (es/en)',()=>{
 const{g}=mk();addRep(g,'cadiz',55);
 const es=houseHtml(g,'es',10000,(n)=>String(n),(c)=>c),en=houseHtml(g,'en',10000,(n)=>String(n),(c)=>c);
 assert.match(es,/Reputación por puerto/);assert.match(es,/Estimado/);assert.match(es,/tasa 50%/);
 assert.match(en,/Reputation by port/);assert.match(en,/Esteemed/);
 const{g:g2}=mk();assert.match(houseHtml(g2,'es',0,(n)=>String(n),(c)=>c),/Aún ningún puerto te conoce/);
});

test("crossing a tier posts a localized notice, up and down",()=>{
 const g=newGame(world,'cadiz');
 g.portRep={cadiz:19};
 repOnSale(g,'cadiz',2,1000); // +5 capped: 19 -> 24, neutral -> appreciated
 let n=g.log.find((l)=>l.key==='reputation');
 assert.ok(n,'notice logged'); assert.match(n.txt.es,/Cádiz/); assert.match(n.txt.es,/apreciado/); assert.match(n.txt.en,/appreciated/);
 g.portRep={cadiz:1};
 repOnBuy(g,'cadiz',2,1000); // -5: 1 -> -4, neutral -> ill-seen
 n=g.log.find((l)=>l.key==='reputation');
 assert.match(n.txt.es,/mal visto/); assert.match(n.txt.en,/ill-seen/);
});

test("the sell/rebuy loop nets zero reputation and the daily cap stops split-sale farming",()=>{
 const g=newGame(world,'cadiz',{cash:10000});
 const s=g.ships[0];
 const e=g.market.cadiz.silk; e.stock=e.target-1; // one short: scarcity just over 1
 s.cargo.silk=1; s.basis={silk:200};
 const rep0=portRep(g,'cadiz');
 assert.ok(doSell(g,s,'silk',1).ok,'sold into the shortage');
 const gained=portRep(g,'cadiz')-rep0;
 assert.ok(gained>0,'sale earned rep');
 assert.ok(doBuy(g,s,'silk',1).ok,'bought the unit back');
 const net=portRep(g,'cadiz')-rep0;
 assert.ok(net<=1e-9,'the loop cannot farm rep (net '+net+')');
 assert.ok(net>-0.2,'and it stays near zero, not a hidden drain (net '+net+')'); // the buy costs slightly more rep than the sale earned: the fee lifts the cost basis
 // split-sale farming hits the per-port day cap instead of scaling with sale count
 e.stock=1; s.cargo.silk=400; s.basis={silk:80000}; // deep shortage, plenty to sell
 const before=portRep(g,'cadiz');
 for(let i=0;i<50;i++)doSell(g,s,'silk',1);
 assert.ok(portRep(g,'cadiz')-before<=10+1e-9,'50 small sales cap at the daily 10, got '+(portRep(g,'cadiz')-before));
});
test('reputation decays 10 points a month only in ports with no trade that month',()=>{
 const{g}=mk();addRep(g,'cadiz',60);addRep(g,'sevilla',60);
 g.day=29;noteTrade(g,'cadiz');g.repTrade.sevilla=0;
 g.day=30;decayRep(g);
 assert.equal(portRep(g,'cadiz'),60,'active port keeps its name');
 assert.equal(portRep(g,'sevilla'),50,'idle port loses 10');
 g.day=31;decayRep(g);assert.equal(portRep(g,'sevilla'),50,'only on month boundaries');
 g.day=60;decayRep(g);assert.equal(portRep(g,'cadiz'),50,'cadiz idle for the next month');
 addRep(g,'bilbao',-15);g.repTrade.bilbao=0;g.day=90;decayRep(g);assert.equal(portRep(g,'bilbao'),-5,'bad name heals toward 0');
 g.day=120;decayRep(g);assert.equal(portRep(g,'bilbao'),0,'and stops at 0');
});
test('an old save with no trade days does not decay at once: the clock starts at the first monthly pass',()=>{
 const{g}=mk();addRep(g,'cadiz',60);delete g.repTrade;
 g.day=30;decayRep(g);assert.equal(portRep(g,'cadiz'),60);assert.equal(g.repTrade.cadiz,30);
 g.day=60;decayRep(g);assert.equal(portRep(g,'cadiz'),50,'then it decays if still idle');
});
test('the concejo sisa multiplies the fee at every tier, renowned included',()=>{
 const{g}=mk();addRep(g,'cadiz',90);const base=feeMul(g,'cadiz');g.hallTax={cadiz:{sisa:2,portazgo:0}};
 assert.ok(feeMul(g,'cadiz')>base,'renowned still pays the sisa');
});
