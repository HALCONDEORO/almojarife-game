import test from 'node:test';import assert from 'node:assert/strict';
import {loadWorld} from '../src/sim/world.mjs';
import {newGame} from '../src/game/game.mjs';
import {setRouteAdv} from '../src/game/routes.mjs';
import {shipWindowHtml} from '../src/view/shipwindow.mjs';
const world=loadWorld();
const hp={fmt:(n)=>String(Math.round(n)),cityName:(id)=>id,types:{cog:'Coca',barca:'Barca'},goods:{grain:'Trigo',wine:'Vino',fish:'Pescado',olive_oil:'Aceite'},eta:()=>'día 2, 3:00'};
const mk=()=>{const g=newGame(world,'cadiz',{cash:100000});const s=g.ships[0];const res=setRouteAdv(g,s,[
 {city:'cadiz',buy:[{good:'fish',maxPrice:12}],sell:[ {good:'olive_oil',minPrice:9}]},
 {city:'sevilla',buy:[{good:'wine'}],sell:[{good:'fish'}]},
 {city:'lisboa',buy:[],sell:[{good:'wine',minPrice:20}]},
],{minCash:500});assert.ok(res.ok,res.reason);return{g,s};};
test('data tab renders an advanced v2 circuit instead of undefined fields',()=>{
 const{g,s}=mk();
 const es=shipWindowHtml(g,s,'es','data',hp);
 assert.ok(!es.includes('undefined'),'no undefined placeholders');
 assert.ok(es.includes('Ruta activa (circuito): cadiz → sevilla → lisboa'),'ES stop chain');
 assert.ok(es.includes('Parada actual: cadiz'),'ES current stop');
 assert.ok(es.includes('Vueltas completadas: 0'),'ES runs counter');
 assert.ok(es.includes('compra')&&es.includes('Pescado')&&es.includes('≤12'),'buy rule with max price');
 assert.ok(es.includes('vende')&&es.includes('Aceite')&&es.includes('≥9'),'sell rule with min price');
 assert.ok(es.includes('freno de caja 500'),'cash brake shown');
 const en=shipWindowHtml(g,s,'en','data',hp);
 assert.ok(!en.includes('undefined'),'EN no undefined placeholders');
 assert.ok(en.includes('Active route (circuit): cadiz → sevilla → lisboa'),'EN stop chain');
 assert.ok(en.includes('buys')&&en.includes('sells')&&en.includes('cash brake 500'),'EN rules');
});
test('data tab v2: no cash brake line when minCash is 0, current stop follows idx',()=>{
 const g=newGame(world,'cadiz',{cash:100000});const s=g.ships[0];
 const res=setRouteAdv(g,s,[{city:'cadiz',buy:[],sell:[]},{city:'huelva',buy:[],sell:[]}]);assert.ok(res.ok,res.reason);
 s.route.idx=1;s.route.legs=3;
 const es=shipWindowHtml(g,s,'es','data',hp);
 assert.ok(!es.includes('undefined')&&!es.includes('freno de caja'),'no brake when minCash 0');
 assert.ok(es.includes('Parada actual: huelva'),'current stop tracks idx');
 assert.ok(es.includes('Vueltas completadas: 3'),'runs counter from route');
 assert.ok(es.includes('<b>cadiz</b>: —'),'stop without orders shows a dash');
});
test('data tab still renders legacy v1 routes unchanged',()=>{
 const g=newGame(world,'cadiz',{cash:100000});const s=g.ships[0];
 s.route={a:'cadiz',b:'sevilla',out:'fish',back:'oil',legs:7,stuck:0,since:1};
 const es=shipWindowHtml(g,s,'es','data',hp);
 assert.ok(!es.includes('undefined'),'v1 no undefined');
 assert.ok(es.includes('Ruta activa: cadiz ⇄ sevilla'),'v1 line intact');
 assert.ok(es.includes('Viajes completados: 7'),'v1 trips intact');
});
