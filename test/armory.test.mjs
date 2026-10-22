import test from 'node:test';import assert from 'node:assert/strict';
import {loadWorld} from '../src/sim/world.mjs';
import {newGame} from '../src/game/game.mjs';
import {makeShip,shipCapacity,SHIP_TYPES} from '../src/sim/trade.mjs';
import {WEAPON_TYPES,GEAR,weaponWeight,gearWeight,loadWeight,armoryPrice} from '../src/sim/armament.mjs';
import {buyWeapon,buyGear,defenceOf,crewDefence} from '../src/game/crew.mjs';
import {BUILDING_TYPES,PRODUCERS} from '../src/game/buildings.mjs';
import {aiStep} from '../src/sim/ai.mjs';
const world=loadWorld();
const mk=(type='cog')=>makeShip('s1',type,'cadiz');
test('every weapon has a weight and the hold shrinks by it',()=>{
 for(const [k,W] of Object.entries(WEAPON_TYPES))assert.ok(W.weight>0,k);
 const s=mk('nao');assert.equal(shipCapacity(s),SHIP_TYPES.nao.capacity);
 const g={cash:5000};assert.ok(buyWeapon(g,s,'bombard').ok);
 assert.equal(weaponWeight(s),5);assert.equal(shipCapacity(s),SHIP_TYPES.nao.capacity-5);
 assert.equal(g.cash,5000-WEAPON_TYPES.bombard.price);
});
test('cannot arm when the cargo aboard would not fit the new weight',()=>{
 const s=mk('barca');s.cargo={grain:25};
 const r=buyWeapon({cash:5000},s,'ballista');assert.deepEqual([r.ok,r.reason],[false,'hold full']);
 s.cargo={grain:24};assert.ok(buyWeapon({cash:5000},s,'ballista').ok);
});
test('sailors gear: levels cost the difference, add defence and weigh on the hold',()=>{
 const s=mk('cog');const g={cash:1000};
 const d0=crewDefence(s);
 assert.ok(buyGear(g,s).ok);assert.equal(g.cash,1000-GEAR[1]);assert.equal(s.gear,1);
 assert.ok(Math.abs(crewDefence(s)-d0*1.1)<1e-9);
 assert.equal(gearWeight(s),Math.ceil(12*0.1));
 buyGear(g,s);buyGear(g,s);assert.equal(s.gear,3);assert.equal(buyGear(g,s).reason,'max level');
 assert.equal(g.cash,1000-GEAR[3]);assert.equal(gearWeight(s),Math.ceil(12*0.3));
 assert.equal(shipCapacity(s),SHIP_TYPES.cog.capacity-loadWeight(s));
});
test('defence rises with weapons, still never from nothing, and not above old numbers when unarmed',()=>{
 const s=mk('cog');assert.equal(defenceOf(s),0);
 buyWeapon({cash:999},s,'cannon');const d=defenceOf(s);assert.ok(d>0);
 buyGear({cash:999},s);assert.ok(defenceOf(s)>d);
});
test('player armory: 10% per active level off the player purchases at that port, capped at 3 levels; list price elsewhere',()=>{
 const g=newGame(world);const city='cadiz';
 assert.equal(armoryPrice(g,city,100),100);
 g.buildings={[city]:{'cadiz:1':{type:'armory',level:2,state:'active'},'cadiz:2':{type:'armory',level:3,state:'construction'}}};
 assert.equal(armoryPrice(g,city,100),80);assert.equal(armoryPrice(g,'sevilla',100),100);
 const s=mk('cog');s.at=city;g.cash=1000;buyWeapon(g,s,'cannon');assert.equal(g.cash,1000-120);
});
test('armory is a building outside the production cap',()=>{
 assert.ok(BUILDING_TYPES.armory);assert.ok(!PRODUCERS.armory);
});
test('AI traders use the same purchase rules: poor ones stay unarmed, rich ones arm within a hold budget',()=>{
 const market=newGame(world).market;
 const poor={cash:500};const sp=mk('cog');sp.at='cadiz';aiStep(world,market,poor,sp,{pirateRisk:()=>true});
 assert.equal(sp.weapons,undefined);assert.equal(sp.gear??0,0);
 const rich={cash:100000};const sr=mk('cog');sr.at='cadiz';aiStep(world,market,rich,sr,{pirateRisk:()=>true});
 assert.ok(rich.cash<100000||sr.voyage,'rich trader acted');
 assert.ok(loadWeight(sr)<=0.1*SHIP_TYPES.cog.capacity+1e-9);
});
test('AI traders stay unarmed unless the caller reports pirate risk (keeps the NPC economy as measured)',()=>{
 const market=newGame(world).market;const t={cash:100000};const s=mk('cog');s.at='cadiz';
 aiStep(world,market,t,s);assert.equal(s.weapons,undefined);assert.equal(s.gear??0,0);
});
