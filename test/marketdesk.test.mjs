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
test('city panels remove duplicate building tabs at source; right panel keeps only P3-style uses',()=>{
 const s=readFileSync('web/main.mjs','utf8');
 assert.match(s,/if \(!inCity\) h \+= `<div class="tabs">/);
 // The right panel mirrors the P3 button bar (manual sec. 7.5): real uses only, no per-building buttons.
 const nav=s.match(/<nav class="city-controls"[^`]*?<\/nav>/)?.[0]??'';
 assert.ok(nav.includes('data-city-tab="buildings"'),'build use');
 for(const m of ['data-city-ships','data-city-reports','data-city-menu','data-map'])assert.ok(nav.includes(m),m);
 for(const k of ['city','yard','tavern','bank','hall','store','house','market'])assert.ok(!nav.includes('data-city-tab="'+k+'"'),'no building button '+k);
 assert.ok(!nav.includes('data-open-panel'),'no dead market button');
 assert.ok(!s.includes('[data-open-panel]'),'no dead market handler');
 // Buildings stay reachable on the map: civic plaza labels (hall always, lonja with the flag) ride the city2d state…
 assert.ok(s.includes('civic: [{ id: "hall", label: t.tabHall }'),'civic hall');
 assert.ok(s.includes('lonjaEnabled(location.search) ? [{ id: "lonja", label: t.tabLonja }]'),'civic lonja flag');
 assert.ok(s.includes('if(e.data.id==="hall"||e.data.id==="lonja"){openCityPanel(e.data.id);return;}'),'civic clicks open their panel');
 // …the office label opens the house panel…
 const port=readFileSync('src/view3d/port3d.mjs','utf8');
 assert.ok(port.includes('id === "office" ? "house"'),'office opens house');
 // …and the city header line is a button that opens the city panel (manual sec. 7.4.2 title bar).
 assert.ok(s.includes('id="city-header-info" role="button" tabindex="0"'),'header button');
 assert.ok(s.includes('ci.onclick=()=>openCityPanel("city")'),'header click opens city');
 const scene=readFileSync('web/city2d/scene.mjs','utf8');
 assert.ok(scene.includes('for(const c of civic)'),'scene draws civic labels');
 assert.ok(scene.includes('civic=Array.isArray(e.data.civic)?e.data.civic:[]'),'scene reads civic from state');
});
