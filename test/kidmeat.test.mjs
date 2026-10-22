import test from 'node:test';import assert from 'node:assert/strict';
import {loadWorld} from '../src/sim/world.mjs';
import {newGame,advanceDay} from '../src/game/game.mjs';
import {serialize,deserialize} from '../src/game/gamesave.mjs';
import {withKidMeat,KID_MEAT} from '../src/sim/optional_goods.mjs';
import {PRODUCERS,buyPlot,workshopTick} from '../src/game/buildings.mjs';
import {PER_1000,OPTIONAL_PER_1000,classCounts,demandBy} from '../src/sim/classes.mjs';
const world=loadWorld();
const snap=(g)=>{const {kidMeat,...rest}=g;return JSON.stringify({...rest,world:undefined});};
test('flag OFF is the default: no kid meat anywhere in the world or the markets',()=>{
 assert.equal('kid_meat' in world.goods,false);assert.equal('kid_meat' in PER_1000,false);
 const g=newGame(world,'cadiz',{freePlay:true});assert.equal(g.kidMeat,false);
 assert.deepEqual(Object.keys(g.market.sevilla).sort(),Object.keys(world.goods).sort());
 assert.equal(g.world,world);
});
test('flag OFF parity: absent, false and 1 (not exactly true) play the same 120 days, byte for byte',()=>{
 const run=(opts)=>{const g=newGame(world,'cadiz',{freePlay:true,seed:5,...opts});for(let d=0;d<120;d++)advanceDay(g);return snap(g);};
 const a=run({}),b=run({kidMeat:false}),c=run({kidMeat:1});
 assert.equal(a,b);assert.equal(a,c);
});
test('withKidMeat leaves the loaded world untouched and adds only the sourced data',()=>{
 const before=JSON.stringify(world);const w=withKidMeat(world);
 assert.equal(JSON.stringify(world),before);
 assert.equal(w.goods.kid_meat.base,40);assert.ok(w.goods.kid_meat.base>world.goods.meat.base);
 assert.deepEqual(w.cities.filter(c=>c.makes.includes('kid_meat')).map(c=>c.id),['sevilla']);
 for(const id of KID_MEAT.consumers){const c=w.cities.find(x=>x.id===id);assert.ok(c.needs.includes('kid_meat'));assert.ok(classCounts(c.pop).rich>=1000,id);}
});
test('flag ON: luxury demand, ranch by-product, market rows, save round trip',()=>{
 const k=OPTIONAL_PER_1000.kid_meat;assert.equal(k.poor,0);assert.ok(k.rich>k.middle*5);
 assert.ok(demandBy(40000,'kid_meat',1).rich>0);assert.equal(demandBy(40000,'kid_meat',1).poor,0);
 const g=newGame(world,'sevilla',{cash:100000,freePlay:true,kidMeat:true});g.cash=100000;
 assert.equal(g.kidMeat,true);for(const c of g.world.cities)assert.ok(g.market[c.id].kid_meat,c.id);
 assert.equal(PRODUCERS.ranch.byproducts.kid_meat,1);
 assert.ok(buyPlot(g,'sevilla',{id:'sevilla:1',type:'workshop',w:4,d:4}).ok);
 g.buildings.sevilla['sevilla:1']={type:'ranch',level:3,state:'active',plotType:'workshop'};
 g.market.sevilla.kid_meat.stock=0;
 for(let d=0;d<=10;d++){g.tick=d*240+1;workshopTick(g,'sevilla');}
 assert.ok(g.market.sevilla.kid_meat.stock>0);
 for(let d=0;d<30;d++)advanceDay(g);
 const back=deserialize(JSON.parse(JSON.stringify(serialize(g,{}))),world).g;
 assert.equal(back.kidMeat,true);assert.ok(back.world.goods.kid_meat);assert.ok(back.market.sevilla.kid_meat);
});
test('flag OFF: the ranch by-product finds no market row and does nothing',()=>{
 const g=newGame(world,'sevilla',{cash:100000,freePlay:true});g.cash=100000;
 assert.ok(buyPlot(g,'sevilla',{id:'sevilla:1',type:'workshop',w:4,d:4}).ok);
 g.buildings.sevilla['sevilla:1']={type:'ranch',level:3,state:'active',plotType:'workshop'};
 for(let d=0;d<=10;d++){g.tick=d*240+1;workshopTick(g,'sevilla');}
 assert.equal(g.market.sevilla.kid_meat,undefined);
});
