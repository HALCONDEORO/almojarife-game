import test from 'node:test';import assert from 'node:assert/strict';
import {loadWorld} from '../src/sim/world.mjs';
import {newGame,setRouteAdv,doBuy,doSell,doSail} from '../src/game/game.mjs';
import {processRoutes} from '../src/game/routes.mjs';
import {price} from '../src/sim/market.mjs';
import {previewBuy,FEE} from '../src/sim/trade.mjs';
import {feeMul} from '../src/game/reputation.mjs';
const world=loadWorld(),ops={doBuy,doSell,doSail};
function fixture(){const g=newGame(world,'cadiz',{freePlay:true,embargo:false,events:false});g.cash=100000;return {g,s:g.ships[0],row:g.market.cadiz.grain};}
test('minimum sell quote applies to every unit after its price impact, leaving the remainder aboard',()=>{
 const {g,s,row}=fixture();row.stock=10;row.target=100;s.cargo={grain:100};s.basis={grain:1000};
 const minimum=66,sim={...row};let expected=0;
 while(expected<100){sim.stock++;if(price(world,sim,'grain')<minimum)break;expected++;}
 assert.ok(expected>0&&expected<100);
 assert.equal(setRouteAdv(g,s,[{city:'cadiz',sell:[{good:'grain',minPrice:minimum}]},{city:'huelva',sell:[{good:'grain'}]}]).ok,true);
 const beforeStock=row.stock;processRoutes(g,ops);
 assert.equal(row.stock-beforeStock,expected);assert.equal(s.cargo.grain,100-expected);
 assert.ok(price(world,row,'grain')>=minimum);
 assert.ok(price(world,{...row,stock:row.stock+1},'grain')<minimum);
 assert.equal(s.route.log[0].entries[0].qty,expected);
});
test('initial displayed quote at the minimum cannot justify a first unit that falls below it',()=>{
 const {g,s,row}=fixture();row.stock=20;row.target=100;s.cargo={grain:10};
 const min=price(world,row,'grain');assert.ok(price(world,{...row,stock:21},'grain')<min);
 setRouteAdv(g,s,[{city:'cadiz',sell:[{good:'grain',minPrice:min}]},{city:'huelva'}]);processRoutes(g,ops);
 assert.equal(row.stock,20);assert.equal(s.cargo.grain,10);assert.equal(s.route.log[0].entries[0].skip,'min_price');
});
for(const rep of [0,25,60,90])test(`buy planner uses actual cent rounding and live fee at reputation ${rep}`,()=>{
 const {g,s,row}=fixture();g.portRep={cadiz:rep};row.stock=100;row.target=100;
 const fee=FEE*feeMul(g,'cadiz'),reserve=100,one=previewBuy(world,g.market,s,1e6,'grain',1,fee);
 g.cash=reserve+one.cost;const expected=previewBuy(world,g.market,s,one.cost,'grain',60,fee);
 assert.equal(expected.qty,1);
 setRouteAdv(g,s,[{city:'cadiz',buy:[{good:'grain'}]},{city:'huelva',sell:[{good:'grain'}]}],{minCash:reserve});
 processRoutes(g,ops);assert.equal(s.cargo.grain,expected.qty);assert.ok(Math.abs(g.cash-reserve)<1e-6);assert.equal(s.route.log[0].entries[0].qty,1);
});
test('null sell limit retains ordinary full-sale behavior',()=>{
 const {g,s,row}=fixture();s.cargo={grain:10};const before=row.stock;
 setRouteAdv(g,s,[{city:'cadiz',sell:[{good:'grain'}]},{city:'huelva'}]);processRoutes(g,ops);
 assert.equal(row.stock-before,10);assert.equal(s.cargo.grain,undefined);
});
