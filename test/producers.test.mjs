import test from 'node:test';import assert from 'node:assert/strict';
import {loadWorld} from '../src/sim/world.mjs';
import {newGame,buyWarehouse} from '../src/game/game.mjs';
import {BUILDING_TYPES,PRODUCERS,producerCities,cityAllowsProducer,quoteConstruction,buyPlot,workshopTick,WORKSHOP_BATCH_PATTERN} from '../src/game/buildings.mjs';
import {RECIPES,OUTPUTS} from '../src/sim/recipes.mjs';
import {SEASON_PEAK} from '../src/sim/market.mjs';
const world=loadWorld();
const TYPES=['oil_mill','vineyard','saltworks'];
const OUT={oil_mill:'olive_oil',vineyard:'wine',saltworks:'salt'};
test('every PR3 producer has its three rows wired to real goods and recipes',()=>{
 for(const t of TYPES){
  assert.ok(BUILDING_TYPES[t],t+' in BUILDING_TYPES');
  assert.ok(RECIPES[BUILDING_TYPES[t].recipe],t+' construction recipe exists');
  const def=PRODUCERS[t];assert.ok(def&&def.primary===true,t+' primary producer');
  assert.equal(def.output,OUT[t]);assert.ok(world.goods[def.output],def.output+' is a trade good');
  assert.ok(!def.recipe,t+' primary production takes no market inputs (land yields the good)');
  assert.ok(def.yield>0,t+' yields its good');
  assert.equal(def.pattern,WORKSHOP_BATCH_PATTERN,t+' shares the workshop pattern');
  assert.ok(SEASON_PEAK[def.output]>0,def.output+' has a season peak for the seasonal tick');
 }
});
test('a primary producer builds only where the city makes the good',()=>{
 for(const t of TYPES){
  const cities=producerCities(world,t);
  assert.ok(cities.length>0,t+' has at least one eligible city');
  for(const id of cities)assert.ok(world.cities.find(c=>c.id===id).makes.includes(OUT[t]),id+' makes '+OUT[t]);
  assert.ok(!cities.includes('bilbao'),'bilbao makes none of these goods');
 }
 assert.ok(producerCities(world,'saltworks').includes('cadiz')&&!producerCities(world,'oil_mill').includes('cadiz'));
 assert.ok(cityAllowsProducer(world,'sevilla','oil_mill')&&cityAllowsProducer(world,'sevilla','vineyard')&&!cityAllowsProducer(world,'sevilla','saltworks'),'river cities follow their makes, nothing else');
});
test('quoteConstruction enforces eligibility with a clear reason',()=>{
 const g=newGame(world);g.cash=100000;
 const plot={id:'cadiz:1',type:'workshop',w:4,d:4};
 assert.ok(buyPlot(g,'cadiz',plot).ok);
 assert.equal(quoteConstruction(g,'cadiz','cadiz:1','oil_mill').reason,'good not producible in this city');
 assert.equal(quoteConstruction(g,'cadiz','cadiz:1','saltworks').ok,true);
 const q=quoteConstruction(g,'cadiz','cadiz:1','workshop');assert.ok(q.ok,'processors still build anywhere');
});
test('a primary producer yields its good into the city stock (no inputs, no cash moved)',()=>{
 const g=newGame(world);g.cash=100000;
 const plot={id:'cadiz:1',type:'workshop',w:4,d:4};buyPlot(g,'cadiz',plot);
 g.buildings['cadiz']['cadiz:1']={type:'saltworks',level:3,state:'active',plotType:'workshop'};
 const e=g.market.cadiz.salt,stock0=e.stock,cash0=g.cash;
 for(let day=0;day<10;day++){g.tick=day*240+1;workshopTick(g,'cadiz');}
 assert.ok(e.stock>stock0,'the saltworks yields salt every production day');
 assert.equal(g.cash,cash0,'upkeep accrues in the weekly ledger, not cash');
 assert.ok(g.buildings['cadiz']['cadiz:1'].produced>0,'lifetime units counted for the panel');
});
test('processors keep producing: the guard does not stop the workshop',()=>{
 const g=newGame(world);g.cash=100000;
 const plot={id:'cadiz:1',type:'workshop',w:4,d:4};buyPlot(g,'cadiz',plot);
 g.buildings['cadiz']['cadiz:1']={type:'workshop',level:2,state:'active',plotType:'workshop'};
 g.market.cadiz.wool.stock=g.market.cadiz.wool.target*4; // cheap wool so the margin holds
 g.market.cadiz.cloth.stock=1;
 const cloth0=g.market.cadiz.cloth.stock;
 g.tick=1;workshopTick(g,'cadiz');
 assert.ok(g.market.cadiz.cloth.stock>cloth0,'the workshop still weaves');
});
test('spec numbers from the materials table',()=>{
 assert.deepEqual(BUILDING_TYPES.oil_mill,{recipe:'oil_mill',fee:250,buildDays:4,upkeep:2,maxLevel:3});
 assert.deepEqual(BUILDING_TYPES.vineyard,{recipe:'vineyard',fee:250,buildDays:4,upkeep:2,maxLevel:3});
 assert.deepEqual(BUILDING_TYPES.saltworks,{recipe:'saltworks',fee:200,buildDays:3,upkeep:1,maxLevel:3});
 assert.deepEqual(BUILDING_TYPES.smokehouse,{recipe:'smokehouse',fee:200,buildDays:3,upkeep:1,maxLevel:3});
 assert.deepEqual(PRODUCERS.smokehouse,{recipe:'smoke',output:'dried_fish',primary:false,pattern:WORKSHOP_BATCH_PATTERN});
 for(const t of ['oil_mill','vineyard','saltworks'])assert.equal(PRODUCERS[t].yield,2);
});
