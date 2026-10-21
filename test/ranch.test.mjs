import test from 'node:test';import assert from 'node:assert/strict';
import {loadWorld} from '../src/sim/world.mjs';
import {newGame} from '../src/game/game.mjs';
import {BUILDING_TYPES,PRODUCERS,producerCities,buyPlot,quoteConstruction,workshopTick,WORKSHOP_BATCH_PATTERN} from '../src/game/buildings.mjs';
import {RECIPES} from '../src/sim/recipes.mjs';
import {PER_1000} from '../src/sim/classes.mjs';
const world=loadWorld();
test('ranch is a primary producer of meat with leather as by-product',()=>{
 const d=PRODUCERS.ranch;
 assert.equal(d.primary,true);assert.equal(d.output,'meat');assert.deepEqual({...d.byproducts},{leather:1});
 assert.equal(d.pattern,WORKSHOP_BATCH_PATTERN);assert.ok(RECIPES[BUILDING_TYPES.ranch.recipe]);
 for(const g of ['meat','leather']){assert.ok(world.goods[g].base>0);assert.ok(PER_1000[g].rich>0);assert.ok(world.cities.some(c=>c.needs.includes(g)),g+' has a consumer');}
});
test('ranch builds only where the city makes meat (sourced port: sevilla)',()=>{
 assert.deepEqual(producerCities(world,'ranch'),['sevilla']);
 assert.ok(world.cities.find(c=>c.id==='sevilla').makes.includes('leather'));
});
test('ranch adds meat and its leather by-product to the city stock',()=>{
 const g=newGame(world,'sevilla',{cash:100000,freePlay:true});g.cash=100000;
 assert.ok(buyPlot(g,'sevilla',{id:'sevilla:1',type:'workshop',w:4,d:4}).ok);
 const q=quoteConstruction(g,'sevilla','sevilla:1','ranch');assert.ok(q.ok,q.reason);
 g.buildings.sevilla['sevilla:1']={type:'ranch',level:3,state:'active',plotType:'workshop'};
  g.market.sevilla.meat.stock=0;g.market.sevilla.leather.stock=0;
 for(let d=0;d<=10;d++){g.tick=d*240+1;workshopTick(g,'sevilla');}
 assert.ok(g.market.sevilla.meat.stock>0,'meat produced');assert.ok(g.market.sevilla.leather.stock>0,'leather produced');
 assert.ok(g.buildings.sevilla['sevilla:1'].produced>0);
});
