import test from 'node:test';import assert from 'node:assert/strict';
import {loadWorld} from '../src/sim/world.mjs';
import {BUILDING_TYPES,PRODUCERS,producerCities,WORKSHOP_BATCH_PATTERN} from '../src/game/buildings.mjs';
import {RECIPES} from '../src/sim/recipes.mjs';
import {PER_1000} from '../src/sim/classes.mjs';
const world=loadWorld();
test('esparto field is a primary producer wired to the esparto good',()=>{
 assert.ok(world.goods.esparto.base>0);
 assert.ok(RECIPES[BUILDING_TYPES.esparto_field.recipe]);
 const d=PRODUCERS.esparto_field;
 assert.equal(d.output,'esparto');assert.equal(d.primary,true);assert.ok(d.yield>0);assert.equal(d.pattern,WORKSHOP_BATCH_PATTERN);
 assert.ok(!d.recipe);
});
test('only the sourced ports (cartagena, almeria) make esparto',()=>{
 assert.deepEqual(producerCities(world,'esparto_field').sort(),['almeria','cartagena']);
});
test('esparto has citizen demand and a consuming port',()=>{
 assert.ok(PER_1000.esparto.poor>0&&PER_1000.esparto.middle>0&&PER_1000.esparto.rich>0);
 assert.ok(world.cities.some(c=>c.needs.includes('esparto')));
});
test('ships use esparto as rigging and stay within +-15% of the old cost at base prices',()=>{
 const OLD={barca:{timber:10,iron:3,cloth:4},cog:{timber:24,iron:8,cloth:12},caravel:{timber:20,iron:10,cloth:18},nao:{timber:42,iron:16,cloth:24}};
 const cost=r=>Object.entries(r).reduce((a,[g,q])=>a+q*world.goods[g].base,0);
 for(const s of Object.keys(OLD)){
  assert.ok(RECIPES[s].esparto>0,s+' uses esparto');
  assert.equal(RECIPES[s].iron,OLD[s].iron,s+' keeps its iron');
  assert.ok(RECIPES[s].cloth<OLD[s].cloth,s+' uses less cloth');
  const r=cost(RECIPES[s])/cost(OLD[s]);assert.ok(r>=0.85&&r<=1.15,s+' cost ratio '+r);
 }
});
