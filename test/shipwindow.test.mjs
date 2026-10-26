import test from 'node:test';import assert from 'node:assert/strict';
import {loadWorld} from '../src/sim/world.mjs';
import {newGame,buyWarehouse} from '../src/game/game.mjs';
import {shipWindowHtml,SW} from '../src/view/shipwindow.mjs';
const world=loadWorld();
const hp={fmt:(n)=>String(Math.round(n)),cityName:(id)=>id,types:{cog:'Coca',barca:'Barca'},goods:{grain:'Trigo',wine:'Vino'},eta:()=>'día 2, 3:00'};
const hpEn={...hp,types:{cog:'Cog',barca:'Barque'},goods:{grain:'Grain',wine:'Wine'}};
const mk=()=>{const g=newGame(world,'cadiz',{cash:100000});const s=g.ships[0];s.cargo={grain:20,wine:5};s.basis={grain:200,wine:600};return{g,s};};
test('cargo tab renders rows with average cost and local price, ES and EN',()=>{
 const{g,s}=mk();
 const es=shipWindowHtml(g,s,'es','cargo',hp);
 assert.ok(es.includes('Mercancía')&&es.includes('Trigo')&&es.includes('Vino'),'ES goods listed');
 assert.ok(es.includes('<td>20</td>'),'units');
 assert.ok(es.includes('<td>10</td>'),'avg cost 200/20');
 assert.ok(es.includes('Bodega'),'capacity footer');
 const en=shipWindowHtml(g,s,'en','cargo',hpEn);
 assert.ok(en.includes('Cargo')&&en.includes('Grain'),'EN goods listed');
});
test('cargo tab: warehouse adds store/take buttons, sea makes it read-only',()=>{
 const{g,s}=mk();
 assert.ok(!shipWindowHtml(g,s,'es','cargo',hp).includes('data-st'),'no warehouse: no store buttons');
 assert.ok(buyWarehouse(g,'cadiz').ok);
 assert.ok(shipWindowHtml(g,s,'es','cargo',hp).includes('data-st="grain"'),'store button with warehouse');
 s.voyage={from:'cadiz',to:'malaga',ticksLeft:50};
 const sea=shipWindowHtml(g,s,'es','cargo',hp);
 assert.ok(!sea.includes('data-st')&&sea.includes('En el mar'),'read-only at sea');
});
test('crew tab: hire disabled without cash, dismiss disabled at sea, captain hint',()=>{
 const{g,s}=mk();
 const poor=newGame(world,'cadiz');poor.cash=0;const ps=poor.ships[0];
 const html=shipWindowHtml(poor,ps,'es','crew',hp);
 const hireBtns=[...html.matchAll(/data-hire="1"([^>]*)>/g)];
 assert.ok(hireBtns.length&&hireBtns[0][1].includes('disabled'),'hire disabled with 0 cash');
 assert.ok(html.includes('Contrata capitanes en la taberna'),'tavern hint without captain');
 s.voyage={from:'cadiz',to:'malaga',ticksLeft:50};
 const sea=shipWindowHtml(g,s,'en','crew',hpEn);
 assert.ok([...sea.matchAll(/data-dismiss="1"([^>]*)>/g)][0][1].includes('disabled'),'dismiss disabled at sea');
});
test('crew tab: a crewless prize ship shows the short-crew warning',()=>{
 const g=newGame(world,'cadiz',{cash:100000});const s=g.ships[0];s.crew=0;s.prize=true;
 const html=shipWindowHtml(g,s,'es','crew',hp);
 assert.ok(html.includes('Faltan marineros'),'short-crew warning');
});
test('data tab: hull, upkeep and value render; no sell button (sales only at the town auction)',()=>{
 const{g,s}=mk();
 const one=shipWindowHtml(g,s,'es','data',hp); // one ship + full hold: both guards apply
 assert.ok(one.includes('Casco'),'hull line');
 assert.ok(one.includes('Mantenimiento'),'upkeep');
 assert.ok(!one.includes('data-sellship'),'no sell button in the ship window: selling moved to the town auction');
});
test('data tab: voyage, route and prize badge render',()=>{
 const g=newGame(world,'cadiz',{cash:100000});const s=g.ships[0];
 s.voyage={from:'cadiz',to:'malaga',ticksLeft:50};
 assert.ok(shipWindowHtml(g,s,'es','data',hp).includes('cadiz → malaga'),'voyage line');
 delete s.voyage;s.route={a:'cadiz',b:'malaga',out:'salt',back:'wine',legs:3};
 assert.ok(shipWindowHtml(g,s,'es','data',hp).includes('Ruta activa'),'route line');
 s.prize=true;
 assert.ok(shipWindowHtml(g,s,'es','data',hp).includes('Presa capturada'),'prize badge');
});
test('both languages ship every tab label',()=>{
 for(const lang of['es','en'])for(const k of['tabCargo','tabCrew','tabData'])assert.ok(SW[lang][k],lang+'.'+k);
});
test('summary card: pinned on every tab with real hull, crew, guns and hold, ES and EN',()=>{
 const{g,s}=mk();
 for(const tab of['cargo','crew','data']){
  const es=shipWindowHtml(g,s,'es',tab,hp),en=shipWindowHtml(g,s,'en',tab,hpEn);
  assert.ok(es.includes('swcard')&&es.includes('Coca 1'),'ES card name on '+tab);
  assert.ok(es.includes('En cadiz'),'ES state line');
  assert.ok(es.includes('aria-label="Casco 100%"'),'ES hull aria');
  assert.ok(es.includes('Bodega 25/60'),'ES hold aria with real cargo');
  assert.ok(en.includes('Cog 1')&&en.includes('At cadiz'),'EN card on '+tab);
  assert.ok(en.includes('aria-label="Hull 100%"'),'EN hull aria');
  assert.ok(en.includes('Hold 25/60'),'EN hold aria');
 }
});
test('summary card: short crew flagged, at-sea state shows the route and eta',()=>{
 const g=newGame(world,'cadiz',{cash:100000});const s=g.ships[0];s.crew=0;
 const short=shipWindowHtml(g,s,'es','cargo',hp);
 assert.ok(short.includes('swc-bad'),'short crew cell flagged');
 s.crew=12;s.voyage={from:'cadiz',to:'malaga',ticksLeft:50};
 const sea=shipWindowHtml(g,s,'en','data',hpEn);
 assert.ok(sea.includes('At sea: cadiz → malaga'),'sea state line');
});
test('data tab: an advanced route lists its stops, never "undefined"',()=>{
 const{g,s}=mk();
 s.route={v:2,legs:3,stops:[{city:'cadiz',buy:[],sell:[]},{city:'malaga',buy:[],sell:[]}]};
 for(const [lang,h] of [['es',hp],['en',hpEn]]){const t=shipWindowHtml(g,s,lang,'data',h);
  assert.ok(!t.includes('undefined'),lang+' no undefined');assert.ok(t.includes('cadiz → malaga'),lang+' stops');}
});
