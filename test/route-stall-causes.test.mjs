import test from 'node:test';
import assert from 'node:assert/strict';
import { loadWorld } from '../src/sim/world.mjs';
import { newGame, setRouteAdv, doBuy, doSell, doSail } from '../src/game/game.mjs';
import { processRoutes } from '../src/game/routes.mjs';
import { messageText } from '../src/view/ledgerview.mjs';
import { serialize, deserialize } from '../src/game/gamesave.mjs';
const world = loadWorld(), ops = { doBuy, doSell, doSail };
function fixture(reason) {
 const g = newGame(world,'cadiz',{embargo:false}); g.eventsOn=false;
 const s=g.ships[0]; s.cargo={grain:10};
 setRouteAdv(g,s,[{city:'cadiz',sell:[{good:'grain',minPrice:reason==='min_price'?1e9:null}]},{city:'huelva'}]);
 if(reason==='market has no cash')g.market.cadiz.grain.commerce.cash=0;
 if(reason==='port closed')g.shocks=[{city:'cadiz',type:'port_closed',untilDay:100}];
 return {g,s};
}
const stalls = g => g.inbox.filter(m=>m.kind==='routeStuck');
for(const cause of ['min_price','port closed','market has no cash'])test(`sell-only stall reports ${cause} and grain, once`,()=>{
 const {g,s}=fixture(cause); for(let i=0;i<3;i++){g.day++;processRoutes(g,ops);}
 assert.equal(stalls(g).length,1); const m=stalls(g)[0];assert.equal(m.good,'grain');assert.equal(m.action,'sell');assert.equal(m.cause,cause);
 assert.equal(s.cargo.grain,10); assert.equal(s.voyage,null);
 for(const lang of ['es','en']){const txt=messageText(m,lang,String,x=>x,x=>x);assert.ok(txt.includes('grain'));assert.doesNotMatch(txt,/could not buy|no pudo comprar/);}
});
test('cause transition warns once, persists through save, recovery resets',()=>{
 let {g,s}=fixture('min_price');processRoutes(g,ops);s.route.stops[0].sell[0].minPrice=null;
 g.shocks=[{city:'cadiz',type:'port_closed',untilDay:100}]; processRoutes(g,ops);processRoutes(g,ops);assert.equal(stalls(g).length,2);
 g=deserialize(serialize(g,'Synthetic route fixture'),world).g;s=g.ships[0];processRoutes(g,ops);assert.equal(stalls(g).length,2);
 g.shocks=[];processRoutes(g,ops);assert.equal(s.route.stuck,0);assert.equal(s.route.stuckKey,undefined);assert.ok(s.voyage);
});
for(const [cause,setup]of [['max_price',(g,s)=>{s.route.stops[0].buy[0].maxPrice=0;}],['no_stock',g=>{g.market.cadiz.grain.stock=0;}],['cash_brake',(g,s)=>{s.route.minCash=g.cash;}],['port closed',g=>{g.shocks=[{city:'cadiz',type:'port_closed',untilDay:100}];}]])test(`buy stall reports ${cause}`,()=>{
 const {g,s}=fixture();s.cargo={};setRouteAdv(g,s,[{city:'cadiz',buy:[{good:'grain'}]},{city:'huelva'}]);setup(g,s);processRoutes(g,ops);
 const m=stalls(g)[0];assert.equal(m.action,'buy');assert.equal(m.good,'grain');assert.equal(m.cause,cause);
});
test('sell blocker takes precedence over an unrelated first buy',()=>{
 const {g,s}=fixture('min_price');s.route.stops[0].buy=[{good:'wine',maxPrice:0}];processRoutes(g,ops);assert.equal(stalls(g)[0].good,'grain');assert.equal(stalls(g)[0].action,'sell');
});
test('no rules is neutral; legacy stored notice still renders',()=>{
 const {g,s}=fixture();s.cargo={};setRouteAdv(g,s,[{city:'cadiz'},{city:'huelva'}]);processRoutes(g,ops);assert.equal(stalls(g)[0].cause,'no_trade');
 assert.match(messageText({kind:'routeStuck',ship:1,city:'cadiz',good:'grain'},'en',String),/could not buy grain/);
});
test('ES/EN wording distinguishes sale limit, closed port and port purse',()=>{
 for(const [cause,es,en]of [['min_price','mínimo de venta','sale minimum'],['port closed','puerto está cerrado','port is closed'],['market has no cash','puerto no tiene caja','port has insufficient cash']]){
  const {g}=fixture(cause);processRoutes(g,ops);const m=stalls(g)[0];assert.ok(messageText(m,'es',String).includes(es));assert.ok(messageText(m,'en',String).includes(en));
 }
});
test('changed good warns once and no-space reason is not no-stock',()=>{
 const {g,s}=fixture('min_price');processRoutes(g,ops);s.cargo={wine:10};s.route.stops[0].sell=[{good:'wine',minPrice:1e9}];processRoutes(g,ops);processRoutes(g,ops);assert.equal(stalls(g).length,2);assert.equal(stalls(g)[0].good,'wine');
 setRouteAdv(g,s,[{city:'cadiz',buy:[{good:'grain'}]},{city:'huelva'}]);s.cargo={wine:10000};processRoutes(g,ops);assert.equal(stalls(g)[0].cause,'no_space');assert.equal(stalls(g)[0].good,'grain');
});
