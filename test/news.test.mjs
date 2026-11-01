import test from 'node:test';import assert from 'node:assert/strict';
import {loadWorld} from '../src/sim/world.mjs';
import {newGame} from '../src/game/game.mjs';
import {arrivalNews, newsEs,fairPrice} from '../src/game/news.mjs';
import {messageText,inboxHtml} from '../src/view/ledgerview.mjs';
import {price} from '../src/sim/market.mjs';
import {serialize,deserialize} from '../src/game/gamesave.mjs';
const world=loadWorld();
const mk=()=>newGame(world);
const know=(g,city)=>{(g.intel??={})[city]={day:0,exact:true,cells:JSON.parse(JSON.stringify(g.market[city]))};};
const untilNews=(g,at)=>{for(let d=1;d<=60;d++){g.day=d;const n=arrivalNews(g,at);if(n)return n;}return null;};
test('no news without another known port',()=>{
 const g=mk(); // fresh game: only Cádiz is known, and the ship is live there
 for(let d=1;d<=30;d++){g.day=d;assert.equal(arrivalNews(g,'cadiz'),null);}
 assert.ok(!(g.inbox??[]).some((m)=>m.kind==='news'));
});
test('dear news fires with a rounded figure and never writes into intel',()=>{
 const g=mk();know(g,'sevilla');
 for(const gd of Object.keys(g.market.sevilla)) g.market.sevilla[gd].stock=1; // scarce across the board: far above fair
 const n=untilNews(g,'cadiz');
 assert.ok(n,'news fires within a few tries');
 assert.equal(n.city,'sevilla');assert.equal(n.dear,true);
 const about=Math.round(n.price/5)*5;
 const m=(g.inbox??[]).find((x)=>x.kind==='news');
 assert.ok(m,'posted to the inbox');
 assert.ok(/está(n)? car(o|a|os|as)\b/.test(m.txt.es)&&m.txt.es.includes(String(about)),'ES text quotes the rounded price');
 assert.ok(m.txt.en.includes('is dear'),'EN text too');
 assert.equal(g.intel.sevilla.day,0,'news leaves intel untouched (rumours and presence stay the way to know a market)');
});
test('cheap news fires the other way and quiet markets stay quiet',()=>{
 const g=mk();know(g,'sevilla');
 for(const gd of Object.keys(g.market.sevilla)) g.market.sevilla[gd].stock=g.market.sevilla[gd].target*4; // glutted across the board: far below fair
 let n=null;for(let d=1;d<=60&&!n;d++){g.day=d;n=arrivalNews(g,'cadiz');}
 assert.ok(n);assert.equal(n.dear,false);
 assert.ok((g.inbox??[]).find((x)=>x.kind==='news').txt.es.match(/barat[oa]s?\b/));
 // a market sitting at its fair price generates no news on any try
 const q=mk();know(q,'sevilla');
 for(const gd of Object.keys(q.market.sevilla)){const x=q.market.sevilla[gd];x.stock=x.target;}
 for(let d=1;d<=60;d++){q.day=d;const r=arrivalNews(q,'cadiz');assert.ok(!r||Math.abs((r.price-fairPrice(q.world,q.market[r.city][r.good],r.good))/fairPrice(q.world,q.market[r.city][r.good],r.good))>=0.15);}
 assert.ok(!(q.inbox??[]).some((m)=>m.kind==='news'),'nothing worth telling: silence');
});
test('news survives a save/load',()=>{
 const g=mk();know(g,'sevilla');for(const gd of Object.keys(g.market.sevilla)) g.market.sevilla[gd].stock=1;
 const n=untilNews(g,'cadiz');assert.ok(n);
 const r=deserialize(serialize(g,'T'),world).g;
 assert.deepEqual(r.inbox,g.inbox);
 const fair=fairPrice(world,g.market.sevilla.grain,'grain');
 assert.ok(price(world,g.market.sevilla.grain,'grain')>fair,'test setup: dear really is dear');
 assert.ok((r.inbox??[]).some((m)=>m.kind==='news'),'the news line survives');
});

test('Spanish price news agree in gender and number',()=>{
 assert.match(newsEs('el trigo',true,'Sevilla',45),/el trigo está caro allí: lo pagan/);
 assert.match(newsEs('la madera',true,'Sevilla',45),/la madera está cara allí: la pagan/);
 assert.match(newsEs('las legumbres',true,'Sevilla',45),/las legumbres están caras allí: las pagan/);
 assert.match(newsEs('las legumbres',false,'Sevilla',20),/las legumbres están baratas allí: apenas las pagan/);
 assert.match(newsEs('el vino',false,'Sevilla',20),/el vino está barato allí: apenas lo pagan/);
});

test('dockside reports retain their source, receipt port and date without becoming current intel',()=>{
 const game=mk();know(game,'sevilla');
 for(const gd of Object.keys(game.market.sevilla))game.market.sevilla[gd].stock=1;
 const before=JSON.stringify({intel:game.intel,cash:game.cash,ships:game.ships,contracts:game.contracts});
 const news=untilNews(game,'cadiz');assert.ok(news);
 const report=game.inbox.find(m=>m.kind==='news'),receivedDay=game.day;
 assert.equal(report.source,'passing-sailors');assert.equal(report.status,'reported');
 assert.equal(report.receivedAt,'cadiz');assert.equal(report.city,'sevilla');assert.equal(report.good,news.good);
 assert.equal(report.reportedPrice,Math.round(news.price/5)*5);
 assert.ok(!Object.hasOwn(report,'price'),'no exact hidden price stored');
 assert.ok(!Object.hasOwn(report,'observedDay'),'receipt does not invent an observation time');
 assert.match(report.txt.es,/precio aproximado, no confirmado; puede haber cambiado/);
 assert.match(report.txt.en,/approximate, unconfirmed price; it may have changed/);
 for(const lang of ['es','en']){assert.ok(messageText(report,lang,String).includes(report.txt[lang]));assert.ok(inboxHtml(game,lang,String,x=>x,x=>x).includes(report.txt[lang]));}
 assert.equal(JSON.stringify({intel:game.intel,cash:game.cash,ships:game.ships,contracts:game.contracts}),before);
 const copy=JSON.parse(JSON.stringify(report));game.day+=10;
 for(const entry of Object.values(game.market.sevilla))entry.stock=entry.target*4;
 const loaded=deserialize(serialize(game,'News'),world).g;
 assert.deepEqual(loaded.inbox.find(m=>m.id===report.id),copy);
 assert.equal(copy.day,receivedDay,'age retains the original receipt date');
 assert.equal(loaded.intel.sevilla.day,0,'report never refreshes confirmed intel');
});

test('legacy text-only news loads without inventing provenance or upgrading its status',()=>{
 const game=mk();game.inbox=[{id:1,kind:'news',day:3,read:false,txt:{es:'Noticia antigua',en:'Old news'}}];
 const loaded=deserialize(serialize(game,'Old news'),world).g;
 assert.deepEqual(loaded.inbox,game.inbox);
 assert.ok(!Object.hasOwn(loaded.inbox[0],'source'));
 assert.ok(!Object.hasOwn(loaded.inbox[0],'status'));
});

test('a non-multiple-of-five market price never leaks through reportedPrice',()=>{
 const game=mk();know(game,'sevilla');
 for(const entry of Object.values(game.market.sevilla))entry.stock=1;
 // Explicit fixture below the scarcity ceiling: target 1200, stock 194 => exact 119.
 game.market.sevilla.pottery.stock=194;game.day=1;
 assert.equal(price(game.world,game.market.sevilla.pottery,'pottery'),119);
 const news=arrivalNews(game,'cadiz');assert.ok(news);assert.equal(news.good,'pottery');assert.equal(news.price,119);
 const report=game.inbox.find(m=>m.kind==='news');
 assert.notEqual(report.reportedPrice,news.price);
 assert.equal(report.reportedPrice,120);
 assert.ok(!Object.hasOwn(report,'price'));
 for(const lang of ['es','en']){assert.ok(report.txt[lang].includes('120'));assert.ok(!report.txt[lang].includes('119'));}
});
