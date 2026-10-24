import test from 'node:test';
import assert from 'node:assert/strict';
import { marketQuantity, destinationQuote } from '../src/view/marketdesk.mjs';
import { loadWorld } from '../src/sim/world.mjs';
import { newGame, buyRumor, advanceDay } from '../src/game/game.mjs';
test('exact market quantities are bounded integers',()=>{
 for(const [v,w] of [[40,40],[0,1],[-2,1],[10000,999],[2.9,2],['bad',10]])assert.equal(marketQuantity(v),w);
});
test('comparison never reads hidden live destination prices',()=>{
 const g=newGame(loadWorld(),'cadiz',{}),city=g.world.cities.find(c=>c.id!=='cadiz').id;
 assert.equal(destinationQuote(g,city,'grain'),null);
 assert.equal(buyRumor(g,city).ok,true);
 const q=destinationQuote(g,city,'grain');assert.equal(q.exact,false);assert.equal(q.age,0);
 g.market[city].grain.stock=1;
 assert.equal(destinationQuote(g,city,'grain').price,q.price);
 advanceDay(g);assert.equal(destinationQuote(g,city,'grain').age,1);
 assert.equal(destinationQuote(g,city,'unknown'),null);
});
import { readFileSync } from 'node:fs';
test('city panels remove duplicate building tabs at source; bottom navigation remains',()=>{
 const s=readFileSync('web/main.mjs','utf8');
 assert.match(s,/if \(!inCity\) h \+= `<div class="tabs">/);
 for(const k of ['city','yard','tavern','bank','buildings','hall','store','house'])assert.ok(s.includes('data-city-tab="'+k+'"'));
 assert.ok(s.includes('[data-city-ships]').toString());
});
