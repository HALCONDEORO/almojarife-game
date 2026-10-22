import test from 'node:test';import assert from 'node:assert/strict';
import {loadWorld} from '../src/sim/world.mjs';
import {newGame} from '../src/game/game.mjs';
import {arrivalNews, newsEs,fairPrice} from '../src/game/news.mjs';
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
 assert.ok(/está car(o|a|os|as)\b/.test(m.txt.es)&&m.txt.es.includes(String(about)),'ES text quotes the rounded price');
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
